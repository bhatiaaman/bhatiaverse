import { NextResponse } from 'next/server';

// Cache for instruments data (refreshed daily)
let instrumentsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Get Kite credentials
async function getKiteCredentials() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const configRes = await fetch(`${baseUrl}/api/kite-config`);
  const configData = await configRes.json();
  return {
    apiKey: configData.config?.apiKey || process.env.KITE_API_KEY,
    accessToken: configData.config?.accessToken || process.env.KITE_ACCESS_TOKEN,
    tokenValid: configData.tokenValid,
  };
}

// Fetch and cache NFO instruments from Kite
async function getInstruments(apiKey, accessToken) {
  const now = Date.now();
  
  // Return cached data if valid
  if (instrumentsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return instrumentsCache;
  }
  
  // Fetch NFO instruments from Kite
  const url = 'https://api.kite.trade/instruments/NFO';
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
  
  // Parse CSV to get lot sizes
  const instruments = {};
  const lotSizeIdx = headers.indexOf('lot_size');
  const symbolIdx = headers.indexOf('tradingsymbol');
  const nameIdx = headers.indexOf('name');
  const typeIdx = headers.indexOf('instrument_type');
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const symbol = cols[symbolIdx];
    const name = cols[nameIdx];
    const type = cols[typeIdx];
    const lotSize = parseInt(cols[lotSizeIdx]) || 0;
    
    // Store lot size for futures (FUT) - these have accurate lot sizes
    if (type === 'FUT' && lotSize > 0) {
      // Extract base symbol from futures symbol (e.g., NIFTY26FEBFUT -> NIFTY)
      const baseSymbol = name.replace(/"/g, '').trim();
      if (!instruments[baseSymbol] || instruments[baseSymbol] < lotSize) {
        instruments[baseSymbol] = lotSize;
      }
    }
  }
  
  // Cache the results
  instrumentsCache = instruments;
  cacheTimestamp = now;
  
  console.log(`Loaded ${Object.keys(instruments).length} lot sizes from NFO instruments`);
  
  return instruments;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    
    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }
    
    const { apiKey, accessToken, tokenValid } = await getKiteCredentials();
    
    if (!accessToken || !tokenValid) {
      // Return fallback lot sizes if Kite not connected
      const fallbackLotSizes = {
        'NIFTY': 75, 'BANKNIFTY': 30, 'FINNIFTY': 40, 'MIDCPNIFTY': 75,
        'SENSEX': 10, 'BANKEX': 15,
        'RELIANCE': 250, 'TCS': 175, 'HDFCBANK': 550, 'INFY': 400,
        'ICICIBANK': 700, 'SBIN': 1500, 'BHARTIARTL': 475, 'TATAMOTORS': 1400,
        'ITC': 1600, 'AXISBANK': 900, 'KOTAKBANK': 400, 'LT': 150,
        'MARUTI': 50, 'WIPRO': 1500, 'BAJFINANCE': 125, 'HINDUNILVR': 300,
      };
      
      return NextResponse.json({
        symbol,
        lotSize: fallbackLotSizes[symbol] || 1,
        source: 'fallback',
      });
    }
    
    const instruments = await getInstruments(apiKey, accessToken);
    const lotSize = instruments[symbol] || 1;
    
    return NextResponse.json({
      symbol,
      lotSize,
      source: 'kite',
    });
    
  } catch (error) {
    console.error('Lot size error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
