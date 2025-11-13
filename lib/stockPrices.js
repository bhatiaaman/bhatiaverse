// Utility to fetch live stock prices from Yahoo Finance via our API
// Uses yahoo-finance2 backend (no API key required, truly free)
// Falls back to mock data if service unavailable

const MOCK_PRICES = {
  'AAPL': { price: 194.23, change: 1.8, changePercent: 0.93 },
  'TSLA': { price: 255.10, change: -1.54, changePercent: -0.6 },
  'MSFT': { price: 360.75, change: 3.24, changePercent: 0.9 },
  'PEGA': { price: 45.12, change: 0.18, changePercent: 0.4 },
  'NOW': { price: 635.20, change: 1.27, changePercent: 0.2 },
};

// Simple in-memory cache with 5-minute TTL
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

export async function fetchStockPrice(symbol) {
  // Extract just the symbol part (e.g., "AAPL" from "NASDAQ:AAPL")
  const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;

  // Check cache first
  const cached = getCachedPrice(cleanSymbol);
  if (cached) {
    return cached;
  }

  // Try our backend API (uses yahoo-finance2 with Yahoo Finance data)
  try {
    const response = await fetch(`/api/stock-price?symbol=${cleanSymbol}`, {
      next: { revalidate: 300 }, // Cache for 5 min
    });

    if (response.ok) {
      const data = await response.json();
      const result = {
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
      };
      setCachedPrice(cleanSymbol, result);
      return result;
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error) {
    console.warn(`Failed to fetch live price for ${cleanSymbol}:`, error.message);
  }

  // Fallback to mock data
  const mockData = MOCK_PRICES[cleanSymbol] || {
    price: 100.0,
    change: 0,
    changePercent: 0,
  };
  setCachedPrice(cleanSymbol, mockData);
  return mockData;
}

export function getMockPrice(symbol) {
  const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  return MOCK_PRICES[cleanSymbol] || { price: 100.0, change: 0, changePercent: 0 };
}
