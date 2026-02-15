import { NextResponse } from 'next/server';
import { KiteConnect } from 'kiteconnect';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Nifty 50 constituents with NSE symbols
// These are the current Nifty 50 stocks (as of Feb 2026)
const NIFTY_50_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
  'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
  'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
  'SUNPHARMA', 'TITAN', 'BAJFINANCE', 'WIPRO', 'ULTRACEMCO',
  'NESTLEIND', 'NTPC', 'POWERGRID', 'M&M', 'TATAMOTORS',
  'TATASTEEL', 'ADANIENT', 'ADANIPORTS', 'TECHM', 'INDUSINDBK',
  'JSWSTEEL', 'HINDALCO', 'ONGC', 'BPCL', 'GRASIM',
  'DIVISLAB', 'DRREDDY', 'BRITANNIA', 'CIPLA', 'EICHERMOT',
  'COALINDIA', 'APOLLOHOSP', 'SBILIFE', 'TATACONSUM', 'BAJAJFINSV',
  'HEROMOTOCO', 'LTIM', 'SHRIRAMFIN', 'TRENT', 'BAJAJ-AUTO'
];

const CACHE_KEY = 'market-breadth';
const CACHE_TTL = 60; // 1 minute cache

export async function GET() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  try {
    // Check cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      console.log('Returning cached market breadth');
      return NextResponse.json({ ...cached, fromCache: true });
    }
    
    if (!apiKey || !accessToken) {
      console.error('Kite credentials missing');
      return NextResponse.json({
        advances: 0,
        declines: 0,
        unchanged: 0,
        ratio: '---',
        error: 'Kite API not configured'
      });
    }

    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Build instrument keys for getOHLC
    const instrumentKeys = NIFTY_50_STOCKS.map(symbol => `NSE:${symbol}`);
    
    console.log(`Fetching OHLC for ${instrumentKeys.length} Nifty 50 stocks`);
    
    // Fetch OHLC data for all stocks
    const ohlcData = await kite.getOHLC(instrumentKeys);
    
    let advances = 0;
    let declines = 0;
    let unchanged = 0;
    
    // Calculate advances/declines
    for (const symbol of NIFTY_50_STOCKS) {
      const key = `NSE:${symbol}`;
      const data = ohlcData[key];
      
      if (!data) {
        console.log(`No data for ${key}`);
        continue;
      }
      
      const lastPrice = data.last_price;
      const prevClose = data.ohlc?.close || lastPrice;
      
      if (lastPrice > prevClose) {
        advances++;
      } else if (lastPrice < prevClose) {
        declines++;
      } else {
        unchanged++;
      }
    }
    
    const total = advances + declines + unchanged;
    const advDeclineRatio = declines > 0 ? (advances / declines).toFixed(2) : advances.toString();
    
    console.log(`Market Breadth: ${advances}↑ ${declines}↓ ${unchanged}= (Ratio: ${advDeclineRatio})`);
    
    const response = {
      advances,
      declines,
      unchanged,
      total,
      ratio: advDeclineRatio,
      display: `${advances}↑ ${declines}↓`,
      timestamp: new Date().toISOString(),
    };
    
    // Cache the response
    await redis.set(CACHE_KEY, response, { ex: CACHE_TTL });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching market breadth:', error.message);
    return NextResponse.json({
      advances: 0,
      declines: 0,
      unchanged: 0,
      ratio: '---',
      error: error.message
    });
  }
}
