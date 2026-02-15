import { NextResponse } from 'next/server';
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

// Fetch FII/DII data from NSE
async function fetchFIIDIIData() {
  try {
    const response = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/reports-indices-equities',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      // Try alternate endpoint
      const altResponse = await fetch('https://www.nseindia.com/api/fiiAndDiiData', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.nseindia.com/',
        },
      });
      
      if (!altResponse.ok) throw new Error('FII/DII fetch failed');
      return await altResponse.json();
    }

    return await response.json();
  } catch (error) {
    console.error('FII/DII fetch error:', error);
    return null;
  }
}

// Parse FII/DII data and calculate sentiment
function analyzeFIIDII(data) {
  if (!data) return null;

  try {
    // NSE returns array with FII and DII data
    let fiiData = null;
    let diiData = null;

    if (Array.isArray(data)) {
      fiiData = data.find(d => d.category === 'FII/FPI' || d.category === 'FII');
      diiData = data.find(d => d.category === 'DII');
    } else if (data.fpiData && data.diiData) {
      fiiData = data.fpiData;
      diiData = data.diiData;
    }

    if (!fiiData && !diiData) return null;

    const fiiNet = fiiData ? parseFloat(fiiData.netValue || fiiData.net || 0) : 0;
    const diiNet = diiData ? parseFloat(diiData.netValue || diiData.net || 0) : 0;
    const totalNet = fiiNet + diiNet;

    // Sentiment based on flows
    let sentiment = 'neutral';
    let score = 50;

    if (fiiNet > 500 && diiNet > 500) {
      sentiment = 'very_bullish';
      score = 85;
    } else if (fiiNet > 500 || (fiiNet > 0 && diiNet > 500)) {
      sentiment = 'bullish';
      score = 70;
    } else if (fiiNet < -500 && diiNet < -500) {
      sentiment = 'very_bearish';
      score = 15;
    } else if (fiiNet < -500 || (fiiNet < 0 && diiNet < -500)) {
      sentiment = 'bearish';
      score = 30;
    } else if (totalNet > 200) {
      sentiment = 'slightly_bullish';
      score = 60;
    } else if (totalNet < -200) {
      sentiment = 'slightly_bearish';
      score = 40;
    }

    return {
      fii: {
        buy: fiiData?.buyValue || fiiData?.buy || 0,
        sell: fiiData?.sellValue || fiiData?.sell || 0,
        net: fiiNet,
      },
      dii: {
        buy: diiData?.buyValue || diiData?.buy || 0,
        sell: diiData?.sellValue || diiData?.sell || 0,
        net: diiNet,
      },
      totalNet,
      sentiment,
      score,
      date: fiiData?.date || new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('FII/DII parse error:', error);
    return null;
  }
}

// Fetch TradingView technical sentiment
async function fetchTradingViewSentiment(symbol = 'NSE:NIFTY') {
  try {
    // TradingView widget data endpoint
    const response = await fetch(
      `https://scanner.tradingview.com/india/scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: { tickers: [symbol], query: { types: [] } },
          columns: [
            'Recommend.All',
            'Recommend.MA',
            'Recommend.Other',
            'RSI',
            'RSI[1]',
            'Stoch.K',
            'Stoch.D',
            'CCI20',
            'ADX',
            'AO',
            'Mom',
            'MACD.macd',
            'MACD.signal',
            'Rec.Stoch.RSI',
            'Rec.WR',
            'Rec.BBPower',
            'Rec.UO',
            'close',
            'EMA20',
            'SMA20',
            'EMA50',
            'SMA50',
            'EMA200',
            'SMA200',
          ],
        }),
      }
    );

    if (!response.ok) throw new Error('TradingView fetch failed');

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const values = data.data[0].d;
      const overall = values[0]; // Recommend.All (-1 to 1)
      const ma = values[1]; // Recommend.MA
      const oscillators = values[2]; // Recommend.Other

      // Convert to sentiment
      const getSentimentLabel = (value) => {
        if (value >= 0.5) return 'strong_buy';
        if (value >= 0.1) return 'buy';
        if (value <= -0.5) return 'strong_sell';
        if (value <= -0.1) return 'sell';
        return 'neutral';
      };

      // Convert -1 to 1 range to 0 to 100
      const score = Math.round((overall + 1) * 50);

      return {
        overall: getSentimentLabel(overall),
        overallScore: score,
        ma: getSentimentLabel(ma),
        maScore: Math.round((ma + 1) * 50),
        oscillators: getSentimentLabel(oscillators),
        oscillatorsScore: Math.round((oscillators + 1) * 50),
        rsi: values[3],
        close: values[17],
        ema20: values[18],
        sma200: values[23],
      };
    }

    return null;
  } catch (error) {
    console.error('TradingView fetch error:', error);
    return null;
  }
}

// Fetch sentiment for multiple symbols
async function fetchMultiSymbolSentiment(symbols) {
  try {
    const response = await fetch(
      `https://scanner.tradingview.com/india/scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: { tickers: symbols, query: { types: [] } },
          columns: [
            'Recommend.All',
            'Recommend.MA',
            'Recommend.Other',
            'RSI',
            'close',
            'change',
            'change_abs',
          ],
        }),
      }
    );

    if (!response.ok) throw new Error('Multi-symbol fetch failed');

    const data = await response.json();
    const results = {};

    if (data.data) {
      data.data.forEach((item) => {
        const symbol = item.s;
        const values = item.d;
        const overall = values[0];

        const getSentimentLabel = (value) => {
          if (value >= 0.5) return 'strong_buy';
          if (value >= 0.1) return 'buy';
          if (value <= -0.5) return 'strong_sell';
          if (value <= -0.1) return 'sell';
          return 'neutral';
        };

        results[symbol] = {
          sentiment: getSentimentLabel(overall),
          score: Math.round((overall + 1) * 50),
          rsi: values[3],
          price: values[4],
          change: values[5],
          changeAbs: values[6],
        };
      });
    }

    return results;
  } catch (error) {
    console.error('Multi-symbol sentiment error:', error);
    return {};
  }
}

// Fetch Telegram public channel messages (free tier)
async function fetchTelegramSentiment() {
  try {
    // We'll use RSS feeds from Telegram public channels
    // These are popular trading channels
    const channels = [
      'stockmarketindia',
      'nikistock',
    ];

    // For now, return mock data - Telegram requires bot setup
    // User can add their bot token later
    return {
      available: false,
      message: 'Telegram requires bot setup',
      channels: channels,
    };
  } catch (error) {
    console.error('Telegram fetch error:', error);
    return null;
  }
}

// Calculate overall market mood
function calculateOverallMood(fiiDii, tradingView, optionsPCR) {
  let totalScore = 50;
  let factors = [];

  // FII/DII weight: 40%
  if (fiiDii) {
    totalScore = fiiDii.score * 0.4;
    factors.push({
      name: 'FII/DII Flow',
      score: fiiDii.score,
      weight: 40,
      detail: fiiDii.sentiment.replace('_', ' '),
    });
  } else {
    totalScore = 50 * 0.4;
  }

  // TradingView weight: 35%
  if (tradingView) {
    totalScore += tradingView.overallScore * 0.35;
    factors.push({
      name: 'Technical',
      score: tradingView.overallScore,
      weight: 35,
      detail: tradingView.overall.replace('_', ' '),
    });
  } else {
    totalScore += 50 * 0.35;
  }

  // Options PCR weight: 25%
  if (optionsPCR !== undefined && optionsPCR !== null) {
    // PCR > 1 = bearish (too many puts), PCR < 0.7 = bearish (too few puts = complacency)
    // Sweet spot: 0.8-1.0 = bullish
    let pcrScore = 50;
    if (optionsPCR >= 0.8 && optionsPCR <= 1.0) {
      pcrScore = 70;
    } else if (optionsPCR > 1.0 && optionsPCR <= 1.3) {
      pcrScore = 55; // Slightly cautious but contrarian bullish
    } else if (optionsPCR > 1.3) {
      pcrScore = 40; // Too many puts = fear
    } else if (optionsPCR < 0.7) {
      pcrScore = 35; // Complacency
    }

    totalScore += pcrScore * 0.25;
    factors.push({
      name: 'Options PCR',
      score: pcrScore,
      weight: 25,
      detail: optionsPCR.toFixed(2),
    });
  } else {
    totalScore += 50 * 0.25;
  }

  // Determine mood label
  let mood = 'neutral';
  if (totalScore >= 70) mood = 'very_bullish';
  else if (totalScore >= 60) mood = 'bullish';
  else if (totalScore >= 55) mood = 'slightly_bullish';
  else if (totalScore <= 30) mood = 'very_bearish';
  else if (totalScore <= 40) mood = 'bearish';
  else if (totalScore <= 45) mood = 'slightly_bearish';

  return {
    score: Math.round(totalScore),
    mood,
    factors,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const includePCR = searchParams.get('pcr'); // Optional PCR value from frontend

    const cacheKey = 'sentiment:market';
    
    // During off-market hours (10 PM - 7 AM), always return cached data
    const cached = await redis.get(cacheKey);
    if (cached && (!searchParams.get('refresh') || !isMarketHours())) {
      if (!isMarketHours()) {
        // Add flag to indicate we're in off-market hours
        cached.offMarketHours = true;
      }
      // Add stock sentiment if symbols provided
      if (symbols.length > 0) {
        const stockCacheKey = `sentiment:stocks:${symbols.join(',')}`;
        let stockSentiment = await redis.get(stockCacheKey);
        
        if (!stockSentiment) {
          const tvSymbols = symbols.map(s => {
            if (s.includes(':')) return s;
            return `NSE:${s}`;
          });
          stockSentiment = await fetchMultiSymbolSentiment(tvSymbols);
          await redis.set(stockCacheKey, stockSentiment, { ex: 300 });
        }
        
        return NextResponse.json({
          ...cached,
          stocks: stockSentiment,
          cached: true,
        });
      }
      return NextResponse.json({ ...cached, cached: true });
    }

    // Fetch all sentiment data in parallel
    const [fiiDiiRaw, niftySentiment, bankNiftySentiment] = await Promise.all([
      fetchFIIDIIData(),
      fetchTradingViewSentiment('NSE:NIFTY'),
      fetchTradingViewSentiment('NSE:BANKNIFTY'),
    ]);

    const fiiDii = analyzeFIIDII(fiiDiiRaw);
    
    // Get PCR from query or default
    const pcrValue = includePCR ? parseFloat(includePCR) : null;

    // Calculate overall mood
    const overallMood = calculateOverallMood(fiiDii, niftySentiment, pcrValue);

    const result = {
      timestamp: new Date().toISOString(),
      fiiDii,
      indices: {
        nifty: niftySentiment,
        bankNifty: bankNiftySentiment,
      },
      overall: overallMood,
      telegram: { available: false },
    };

    // Cache result
    await redis.set(cacheKey, result, { ex: 300 }); // 5 min cache

    // Add stock sentiment if symbols provided
    if (symbols.length > 0) {
      const tvSymbols = symbols.map(s => {
        if (s.includes(':')) return s;
        return `NSE:${s}`;
      });
      const stockSentiment = await fetchMultiSymbolSentiment(tvSymbols);
      await redis.set(`sentiment:stocks:${symbols.join(',')}`, stockSentiment, { ex: 300 });
      result.stocks = stockSentiment;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data', details: error.message },
      { status: 500 }
    );
  }
}
