import { NextResponse } from 'next/server';
import { KiteConnect } from 'kiteconnect';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Supported symbols with their instrument tokens
const SYMBOLS = {
  NIFTY: { token: 256265, name: 'NIFTY 50', exchange: 'NSE' },
  BANKNIFTY: { token: 260105, name: 'BANK NIFTY', exchange: 'NSE' },
};

// Interval mapping (UI interval -> Kite API interval)
const INTERVALS = {
  '5minute': '5minute',
  '15minute': '15minute',
  'day': 'day',
  'week': 'week',
};

const CACHE_TTL = 60; // 1 minute cache

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NIFTY';
  const interval = searchParams.get('interval') || '15minute';
  const days = parseInt(searchParams.get('days') || '5');
  
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  // Validate symbol
  const symbolConfig = SYMBOLS[symbol.toUpperCase()];
  if (!symbolConfig) {
    return NextResponse.json({
      candles: [],
      error: `Unknown symbol: ${symbol}. Supported: ${Object.keys(SYMBOLS).join(', ')}`
    });
  }
  
  // Validate interval
  const kiteInterval = INTERVALS[interval];
  if (!kiteInterval) {
    return NextResponse.json({
      candles: [],
      error: `Unknown interval: ${interval}. Supported: ${Object.keys(INTERVALS).join(', ')}`
    });
  }
  
  try {
    // Check cache first
    const cacheKey = `chart-${symbol}-${interval}-${days}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`Returning cached ${symbol} chart data`);
      return NextResponse.json({
        ...cached,
        fromCache: true,
      });
    }
    
    if (!apiKey || !accessToken) {
      console.error('Kite credentials missing');
      return NextResponse.json({
        candles: [],
        error: 'Kite API not configured'
      });
    }

    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Calculate date range based on interval
    const toDate = new Date();
    const fromDate = new Date();
    
    // Adjust days based on interval type
    if (interval === 'week') {
      fromDate.setDate(fromDate.getDate() - Math.max(days * 7, 365)); // At least 1 year for weekly
    } else if (interval === 'day') {
      fromDate.setDate(fromDate.getDate() - Math.max(days, 60)); // At least 60 days for daily
    } else {
      fromDate.setDate(fromDate.getDate() - days);
    }
    
    // Format dates for Kite API (YYYY-MM-DD HH:mm:ss)
    const formatDate = (d) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    console.log(`Fetching ${symbolConfig.name} ${kiteInterval} data from ${formatDate(fromDate)} to ${formatDate(toDate)}`);
    
    const historicalData = await kite.getHistoricalData(
      symbolConfig.token,
      kiteInterval,
      formatDate(fromDate),
      formatDate(toDate)
    );

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({
        candles: [],
        error: 'No historical data available'
      });
    }

    // Convert to lightweight-charts format
    // Kite returns dates in IST, lightweight-charts expects UTC timestamps
    // We keep the IST time but convert to UTC timestamp for display
    const candles = historicalData.map(candle => {
      // Parse the date from Kite (already in IST)
      const date = new Date(candle.date);
      // Use the timestamp directly - the frontend will format it as IST
      return {
        time: Math.floor(date.getTime() / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
    });

    console.log(`Fetched ${candles.length} candles for ${symbolConfig.name}`);
    if (candles.length > 0) {
      const firstCandle = new Date(candles[0].time * 1000);
      const lastCandle = new Date(candles[candles.length - 1].time * 1000);
      console.log(`Time range: ${firstCandle.toISOString()} to ${lastCandle.toISOString()}`);
    }

    const response = {
      candles,
      symbol: symbolConfig.name,
      interval: kiteInterval,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      timestamp: new Date().toISOString(),
    };

    // Cache the response
    await redis.set(cacheKey, response, { ex: CACHE_TTL });

    return NextResponse.json(response);

  } catch (error) {
    console.error(`Error fetching ${symbol} chart data:`, error.message);
    return NextResponse.json({
      candles: [],
      error: error.message
    });
  }
}
