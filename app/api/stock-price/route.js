import { NextResponse } from 'next/server';
import { getKiteCredentials } from '@/app/lib/kite-credentials';

// Cache prices for 30 seconds to reduce API calls
const priceCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Index instrument names in Kite
const INDEX_INSTRUMENTS = {
  'NIFTY': 'NSE:NIFTY 50',
  'BANKNIFTY': 'NSE:NIFTY BANK',
  'FINNIFTY': 'NSE:NIFTY FIN SERVICE',
  'MIDCPNIFTY': 'NSE:NIFTY MID SELECT',
  'SENSEX': 'BSE:SENSEX',
  'BANKEX': 'BSE:BANKEX',
};

function getCachedPrice(symbol) {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPrice(symbol, data) {
  priceCache.set(symbol, { data, timestamp: Date.now() });
}



export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const exchange = searchParams.get('exchange') || 'NSE';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 });
    }

    // Clean symbol (remove exchange prefix if present)
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    const cacheKey = `${exchange}:${cleanSymbol}`;

    // Check cache first
    const cached = getCachedPrice(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get Kite credentials
    const { apiKey, accessToken } = await getKiteCredentials();
    
    if (!accessToken) {
      return NextResponse.json({ 
        price: null, 
        error: 'Kite not connected',
        change: 0,
        changePercent: 0 
      });
    }

    // Check if it's an index - use special instrument name
    const instrument = INDEX_INSTRUMENTS[cleanSymbol.toUpperCase()] || `${exchange}:${cleanSymbol}`;
    
    // Fetch LTP from Kite
    const kiteRes = await fetch(
      `https://api.kite.trade/quote/ltp?i=${encodeURIComponent(instrument)}`,
      {
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3'
        }
      }
    );

    if (!kiteRes.ok) {
      console.error('Kite API error:', await kiteRes.text());
      return NextResponse.json({ 
        price: null, 
        error: 'Failed to fetch from Kite',
        change: 0,
        changePercent: 0 
      });
    }

    const kiteData = await kiteRes.json();
    
    if (kiteData.status === 'success' && kiteData.data?.[instrument]) {
      const ltp = kiteData.data[instrument].last_price;
      const result = {
        price: ltp,
        change: 0,
        changePercent: 0
      };
      
      setCachedPrice(cacheKey, result);
      return NextResponse.json(result);
    }

    return NextResponse.json({ 
      price: null, 
      error: 'Symbol not found',
      change: 0,
      changePercent: 0 
    });
    
  } catch (error) {
    console.error('Error processing stock price request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
