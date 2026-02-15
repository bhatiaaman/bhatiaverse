import { NextResponse } from 'next/server';
import { KiteConnect } from 'kiteconnect';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Check if current time is within market hours (7 AM - 10 PM IST)
function isMarketHours() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  // Market hours: 7 AM (7) to 10 PM (22)
  return hours >= 7 && hours < 22;
}

// Sector indices with correct instrument tokens and TradingView symbols
const SECTOR_INDICES = [
  { token: 260105, symbol: 'NIFTY BANK', name: 'Bank Nifty', exchange: 'NSE', tvSymbol: 'BANKNIFTY' },
  { token: 259849, symbol: 'NIFTY IT', name: 'IT', exchange: 'NSE', tvSymbol: 'CNXIT' },
  { token: 257801, symbol: 'NIFTY FIN SERVICE', name: 'Financial', exchange: 'NSE', tvSymbol: 'CNXFINANCE' },
  { token: 263433, symbol: 'NIFTY AUTO', name: 'Auto', exchange: 'NSE', tvSymbol: 'CNXAUTO' },
  { token: 262409, symbol: 'NIFTY PHARMA', name: 'Pharma', exchange: 'NSE', tvSymbol: 'CNXPHARMA' },
  { token: 263689, symbol: 'NIFTY METAL', name: 'Metal', exchange: 'NSE', tvSymbol: 'CNXMETAL' },
  { token: 261897, symbol: 'NIFTY FMCG', name: 'FMCG', exchange: 'NSE', tvSymbol: 'CNXFMCG' },
  { token: 261129, symbol: 'NIFTY REALTY', name: 'Realty', exchange: 'NSE', tvSymbol: 'CNXREALTY' },
  { token: 261641, symbol: 'NIFTY ENERGY', name: 'Energy', exchange: 'NSE', tvSymbol: 'CNXENERGY' },
  { token: 263945, symbol: 'NIFTY MEDIA', name: 'Media', exchange: 'NSE', tvSymbol: 'CNXMEDIA' },
  { token: 262921, symbol: 'NIFTY PSU BANK', name: 'PSU Bank', exchange: 'NSE', tvSymbol: 'CNXPSUBANK' },
  { token: 261385, symbol: 'NIFTY INFRA', name: 'Infra', exchange: 'NSE', tvSymbol: 'CNXINFRA' },
];

export async function GET() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  try {
    // Check cache for off-market hours
    const cached = await redis.get('sector-performance');
    
    // During off-market hours (10 PM - 7 AM), always return cached data
    if (cached && !isMarketHours()) {
      console.log('Off-market hours: serving cached sector data');
      return NextResponse.json({ ...cached, fromCache: true, offMarketHours: true });
    }
    
    // Return cached if fresh (1 minute)
    const cacheTime = await redis.get('sector-performance-timestamp');
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 60000) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }
    
    if (!apiKey || !accessToken) {
      console.error('Kite credentials missing');
      return NextResponse.json({
        sectors: [],
        error: 'Kite API not configured'
      });
    }

    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Build instrument keys for getOHLC (format: EXCHANGE:TRADINGSYMBOL)
    const instrumentKeys = SECTOR_INDICES.map(s => `${s.exchange}:${s.symbol}`);
    
    console.log('Fetching sector OHLC for:', instrumentKeys);
    
    // Use getOHLC which works better for indices
    const ohlcData = await kite.getOHLC(instrumentKeys);
    console.log('OHLC response sample:', JSON.stringify(Object.values(ohlcData)[0]));
    
    // Process and calculate percentage change from previous close
    const sectorData = SECTOR_INDICES.map(sector => {
      const key = `${sector.exchange}:${sector.symbol}`;
      const data = ohlcData[key];
      
      if (!data) {
        console.log('No OHLC data for:', key);
        return null;
      }

      // Calculate change from previous close to current price
      const prevClose = data.ohlc?.close || 0;
      const lastPrice = data.last_price || 0;
      
      // Change % = (Current Price - Previous Close) / Previous Close * 100
      const changePercent = prevClose > 0 
        ? ((lastPrice - prevClose) / prevClose) * 100
        : 0;
      
      console.log(`${sector.name}: last=${lastPrice}, prevClose=${prevClose}, change=${changePercent.toFixed(2)}%`);
      
      return {
        name: sector.name,
        symbol: sector.symbol,
        tvSymbol: sector.tvSymbol,
        value: parseFloat(changePercent.toFixed(2)),
        lastPrice: lastPrice,
        prevClose: prevClose,
        change: lastPrice - prevClose,
      };
    }).filter(Boolean);

    // Sort by performance (highest change first, lowest last)
    sectorData.sort((a, b) => b.value - a.value);

    const result = {
      sectors: sectorData,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    await redis.set('sector-performance', result, { ex: 300 }); // 5 min cache
    await redis.set('sector-performance-timestamp', Date.now().toString(), { ex: 300 });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching sector performance:', error.message);
    
    // Try to return cached data on error
    const cached = await redis.get('sector-performance');
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true, error: error.message });
    }
    
    return NextResponse.json({
      sectors: [],
      error: error.message
    });
  }
}
