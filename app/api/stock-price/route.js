// Mock stock prices data
const MOCK_PRICES = {
  'AAPL': { price: 194.23, change: 1.8, changePercent: 0.93 },
  'TSLA': { price: 255.10, change: -1.54, changePercent: -0.6 },
  'MSFT': { price: 360.75, change: 3.24, changePercent: 0.9 },
  'PEGA': { price: 45.12, change: 0.18, changePercent: 0.4 },
  'NOW': { price: 635.20, change: 1.27, changePercent: 0.2 },
};

// Cache prices for 5 minutes to reduce redundant returns
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

    // Return mock data
    const mockData = MOCK_PRICES[cleanSymbol] || {
      price: 100.0,
      change: 0,
      changePercent: 0,
    };

    setCachedPrice(cleanSymbol, mockData);
    return Response.json(mockData);
  } catch (error) {
    console.error('Error processing stock price request:', error);
    return Response.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
