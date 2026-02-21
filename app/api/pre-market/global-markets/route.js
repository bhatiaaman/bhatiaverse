// app/api/pre-market/global-markets/route.js
import { NextResponse } from 'next/server';

const CACHE_KEY = 'global_markets_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cache = { data: null, timestamp: 0 };

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ success: true, cached: true, ...cache.data });
    }

    // Fetch global markets data
    const markets = await fetchGlobalMarkets();
    const currencies = await fetchCurrencies();
    const commodities = await fetchCommodities();

    const result = {
      markets,
      currencies,
      commodities,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    cache = { data: result, timestamp: now };

    return NextResponse.json({ success: true, cached: false, ...result });
  } catch (error) {
    console.error('Global markets error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      cached: !!cache.data,
      ...cache.data // Return cached data if available
    }, { status: 500 });
  }
}

async function fetchGlobalMarkets() {
  // Using Yahoo Finance API (free, no API key needed)
  const symbols = [
    { symbol: '^DJI', name: 'DOW', region: 'US' },
    { symbol: '^IXIC', name: 'NASDAQ', region: 'US' },
    { symbol: '^GSPC', name: 'S&P 500', region: 'US' },
    { symbol: '^N225', name: 'Nikkei', region: 'Asia' },
    { symbol: '^HSI', name: 'Hang Seng', region: 'Asia' },
    { symbol: '000001.SS', name: 'Shanghai', region: 'Asia' },
    { symbol: '^FTSE', name: 'FTSE 100', region: 'Europe' },
    { symbol: '^GDAXI', name: 'DAX', region: 'Europe' },
    { symbol: '^FCHI', name: 'CAC 40', region: 'Europe' },
  ];

  const results = await Promise.allSettled(
    symbols.map(s => fetchYahooQuote(s.symbol, s.name, s.region))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

async function fetchYahooQuote(symbol, name, region) {
  try {
    // Yahoo Finance API endpoint (public, no auth)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const data = await response.json();
    
    if (!data?.chart?.result?.[0]) {
      throw new Error(`No data for ${symbol}`);
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    
    const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Determine market status
    const now = Date.now() / 1000;
    const marketOpen = meta.currentTradingPeriod?.regular?.start || 0;
    const marketClose = meta.currentTradingPeriod?.regular?.end || 0;
    const isOpen = now >= marketOpen && now <= marketClose;

    return {
      symbol,
      name,
      region,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      isOpen,
      status: isOpen ? 'OPEN' : 'CLOSED',
      currency: meta.currency || 'USD',
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return {
      symbol,
      name,
      region,
      price: null,
      change: null,
      changePercent: null,
      error: error.message,
      status: 'ERROR',
    };
  }
}

async function fetchCurrencies() {
  // Currency pairs
  const pairs = [
    { symbol: 'USDINR=X', name: 'USD/INR', base: 'USD', quote: 'INR' },
    { symbol: 'EURUSD=X', name: 'EUR/USD', base: 'EUR', quote: 'USD' },
    { symbol: 'DX-Y.NYB', name: 'DXY', base: 'USD', quote: 'Index' },
  ];

  const results = await Promise.allSettled(
    pairs.map(p => fetchYahooQuote(p.symbol, p.name, 'FX'))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map((r, idx) => ({ ...r.value, base: pairs[idx].base, quote: pairs[idx].quote }));
}

async function fetchCommodities() {
  const commodities = [
    { symbol: 'CL=F', name: 'Crude Oil', unit: 'USD/barrel' },
    { symbol: 'GC=F', name: 'Gold', unit: 'USD/oz' },
    { symbol: 'SI=F', name: 'Silver', unit: 'USD/oz' },
  ];

  const results = await Promise.allSettled(
    commodities.map(c => fetchYahooQuote(c.symbol, c.name, 'Commodity'))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map((r, idx) => ({ ...r.value, unit: commodities[idx].unit }));
}