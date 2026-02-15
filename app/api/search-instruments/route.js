import { NextResponse } from 'next/server';
import { getKiteCredentials } from '@/app/lib/kite-credentials';

// Cache for NSE instruments (refreshed daily)
let instrumentsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours


// Fetch and cache NSE instruments from Kite
async function getInstruments(apiKey, accessToken) {
  const now = Date.now();
  
  // Return cached data if valid
  if (instrumentsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return instrumentsCache;
  }
  
  // Fetch NSE instruments from Kite
  const url = 'https://api.kite.trade/instruments/NSE';
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch instruments: ${res.status}`);
  }
  
  const csvText = await res.text();
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Parse CSV
  const symbolIdx = headers.indexOf('tradingsymbol');
  const nameIdx = headers.indexOf('name');
  const typeIdx = headers.indexOf('instrument_type');
  const exchangeIdx = headers.indexOf('exchange');
  
  const instruments = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const symbol = cols[symbolIdx];
    const name = cols[nameIdx]?.replace(/"/g, '').trim() || '';
    const type = cols[typeIdx];
    const exchange = cols[exchangeIdx];
    
    // Only include EQ (equity) instruments
    if (type === 'EQ' && symbol) {
      instruments.push({
        symbol,
        name,
        exchange,
        type,
      });
    }
  }
  
  // Cache the results
  instrumentsCache = instruments;
  cacheTimestamp = now;
  
  console.log(`Loaded ${instruments.length} NSE equity instruments`);
  
  return instruments;
}

// Fallback popular stocks if API fails
const FALLBACK_STOCKS = [
  { symbol: 'NIFTY', name: 'Nifty 50', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'FINNIFTY', name: 'Fin Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'MIDCPNIFTY', name: 'Midcap Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', type: 'EQ' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', type: 'EQ' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', type: 'EQ' },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', type: 'EQ' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', type: 'EQ' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', exchange: 'NSE', type: 'EQ' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', type: 'EQ' },
  { symbol: 'AXISBANK', name: 'Axis Bank', exchange: 'NSE', type: 'EQ' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE', type: 'EQ' },
  { symbol: 'LT', name: 'Larsen & Toubro', exchange: 'NSE', type: 'EQ' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', exchange: 'NSE', type: 'EQ' },
  { symbol: 'WIPRO', name: 'Wipro', exchange: 'NSE', type: 'EQ' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', exchange: 'NSE', type: 'EQ' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', type: 'EQ' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', exchange: 'NSE', type: 'EQ' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ONGC', name: 'ONGC', exchange: 'NSE', type: 'EQ' },
  { symbol: 'NTPC', name: 'NTPC', exchange: 'NSE', type: 'EQ' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', exchange: 'NSE', type: 'EQ' },
  { symbol: 'COALINDIA', name: 'Coal India', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', exchange: 'NSE', type: 'EQ' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', exchange: 'NSE', type: 'EQ' },
  { symbol: 'DRREDDY', name: 'Dr. Reddys Labs', exchange: 'NSE', type: 'EQ' },
];

// Add indices to search
const INDICES = [
  { symbol: 'NIFTY', name: 'Nifty 50', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'FINNIFTY', name: 'Fin Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'MIDCPNIFTY', name: 'Midcap Nifty', exchange: 'NSE', type: 'INDEX' },
  { symbol: 'SENSEX', name: 'Sensex', exchange: 'BSE', type: 'INDEX' },
  { symbol: 'BANKEX', name: 'Bankex', exchange: 'BSE', type: 'INDEX' },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toUpperCase() || '';
    const limit = parseInt(searchParams.get('limit') || '15');
    
    if (!query || query.length < 1) {
      return NextResponse.json({ instruments: [] });
    }
    
    const { apiKey, accessToken, tokenValid } = await getKiteCredentials();
    
    let instruments = [];
    
    if (accessToken && tokenValid) {
      try {
        instruments = await getInstruments(apiKey, accessToken);
      } catch (err) {
        console.error('Failed to fetch instruments:', err);
        instruments = FALLBACK_STOCKS;
      }
    } else {
      instruments = FALLBACK_STOCKS;
    }
    
    // Add indices to the search
    const allInstruments = [...INDICES, ...instruments];
    
    // Filter by query
    const matches = allInstruments
      .filter(inst => 
        inst.symbol.includes(query) || 
        inst.name.toUpperCase().includes(query)
      )
      .slice(0, limit);
    
    return NextResponse.json({
      instruments: matches,
      total: matches.length,
    });
    
  } catch (error) {
    console.error('Search instruments error:', error);
    return NextResponse.json({ error: error.message, instruments: [] }, { status: 500 });
  }
}
