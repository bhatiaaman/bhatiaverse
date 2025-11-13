// Cache prices for 5 minutes to reduce API calls
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

// Fetch from Yahoo Finance using query1 endpoint
async function fetchYahooQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const priceData = data?.quoteSummary?.result?.[0]?.price;

    if (!priceData || priceData.regularMarketPrice === undefined) {
      throw new Error('No price data in response');
    }

    const currentPrice = priceData.regularMarketPrice.raw;
    const previousClose = priceData.regularMarketPreviousClose?.raw || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  } catch (error) {
    console.error(`Yahoo Finance API error for ${symbol}:`, error.message);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return Response.json({ error: 'Symbol parameter required' }, { status: 400 });
    }

    // Clean symbol (remove exchange prefix if present)
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;

    // Check cache first
    const cached = getCachedPrice(cleanSymbol);
    if (cached) {
      return Response.json(cached);
    }

    // Fetch from Yahoo Finance
    const priceData = await fetchYahooQuote(cleanSymbol);

    if (!priceData) {
      return Response.json(
        { error: 'Stock data not found or API unavailable' },
        { status: 404 }
      );
    }

    setCachedPrice(cleanSymbol, priceData);
    return Response.json(priceData);
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return Response.json(
      { error: 'Failed to fetch stock data', details: error.message },
      { status: 500 }
    );
  }
}
