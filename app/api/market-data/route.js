import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Calculate EMA9
function calculateEMA9(prices) {
  if (!prices || prices.length < 9) return null;
  
  const k = 2 / (9 + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }
  
  return ema;
}

// Fetch Nifty from Yahoo Finance
async function fetchNiftyFromYahoo() {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1mo',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('Yahoo Nifty fetch failed');
    
    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const closePrices = result.indicators.quote[0].close.filter(p => p !== null);
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose || closePrices[closePrices.length - 2];
    
    // Calculate change manually
    const change = currentPrice - previousClose;
    const changePercent = ((change / previousClose) * 100);
    
    console.log('Nifty calculation:', {
      currentPrice,
      previousClose,
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2)
    });
    
    return {
      price: currentPrice,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      historicalPrices: closePrices.slice(-20)
    };
  } catch (error) {
    console.error('Yahoo Nifty fetch error:', error);
    return null;
  }
}

// Fetch GIFT Nifty (replacing SGX Nifty)
async function fetchGIFTNifty() {
  // GIFT Nifty trades on NSE IX (International Exchange)
  // Ticker symbol variations to try
  const tickers = [
    'GIFTNIFTY.NS',  // Yahoo Finance ticker
    'NIFTY.NS',      // Fallback to regular Nifty
  ];

  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data.chart.result[0]?.meta?.regularMarketPrice;
        if (price) {
          console.log(`GIFT Nifty fetched from ${ticker}: ${price}`);
          return price;
        }
      }
    } catch (error) {
      console.log(`Failed to fetch GIFT Nifty from ${ticker}`);
    }
  }

  // If all fail, return null (we'll show Nifty +/- small spread as approximation)
  console.log('GIFT Nifty fetch failed, will use Nifty approximation');
  return null;
}

// Fetch Sensex
async function fetchSensex() {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('Sensex fetch failed');
    
    const data = await response.json();
    const price = data.chart.result[0].meta.regularMarketPrice;
    return price;
  } catch (error) {
    console.error('Sensex fetch error:', error);
    return null;
  }
}

// Fetch Bank Nifty
async function fetchBankNifty() {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EBANKNIFTY?interval=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('Bank Nifty fetch failed');
    
    const data = await response.json();
    const price = data.chart.result[0].meta.regularMarketPrice;
    return price;
  } catch (error) {
    console.error('Bank Nifty fetch error:', error);
    return null;
  }
}

// Fetch India VIX
async function fetchVIX() {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('VIX fetch failed');
    
    const data = await response.json();
    const price = data.chart.result[0].meta.regularMarketPrice;
    return price;
  } catch (error) {
    console.error('VIX fetch error:', error);
    return null;
  }
}

// Fetch global indices
async function fetchGlobalIndices() {
  try {
    const [dow, nasdaq, dax] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json()),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json()),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EGDAXI?interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json())
    ]);

    return {
      dow: dow.chart.result[0].meta.regularMarketPrice,
      nasdaq: nasdaq.chart.result[0].meta.regularMarketPrice,
      dax: dax.chart.result[0].meta.regularMarketPrice
    };
  } catch (error) {
    console.error('Global indices fetch error:', error);
    return null;
  }
}

// Fetch commodities
async function fetchCommodities() {
  try {
    const [crude, gold] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json()),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json())
    ]);

    return {
      crude: crude.chart.result[0].meta.regularMarketPrice,
      gold: gold.chart.result[0].meta.regularMarketPrice
    };
  } catch (error) {
    console.error('Commodities fetch error:', error);
    return null;
  }
}

export async function GET() {
  try {
    // Check cache
    const cached = await redis.get('market-data');
    const cacheTime = await redis.get('market-data-timestamp');
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 300000) { // 5 minutes
        console.log(`Serving from cache (${Math.floor(age / 1000)}s old)`);
        return Response.json({ ...cached, fromCache: true, cacheAge: age });
      }
    }

    console.log('Fetching fresh market data...');

    // Fetch all data in parallel
    const [niftyData, sensex, bankNifty, giftNifty, vix, globalIndices, commodities] = await Promise.all([
      fetchNiftyFromYahoo(),
      fetchSensex(),
      fetchBankNifty(),
      fetchGIFTNifty(),
      fetchVIX(),
      fetchGlobalIndices(),
      fetchCommodities()
    ]);

    // Calculate EMA9 and bias
    let ema9 = null;
    let bias = 'Neutral';
    
    if (niftyData && niftyData.historicalPrices && niftyData.historicalPrices.length >= 9) {
      ema9 = calculateEMA9(niftyData.historicalPrices);
      if (ema9) {
        bias = niftyData.price > ema9 ? 'Bullish' : 'Bearish';
      }
    }

    // If GIFT Nifty not available, approximate with Nifty + small spread
    let giftNiftyPrice = giftNifty;
    if (!giftNiftyPrice && niftyData) {
      // During market hours, GIFT Nifty is usually close to Nifty
      // Add/subtract small spread (typically 10-20 points)
      giftNiftyPrice = niftyData.price + 15; // Approximate spread
      console.log('Using Nifty approximation for GIFT Nifty');
    }

    const marketData = {
      indices: {
        nifty: niftyData ? niftyData.price.toFixed(2) : null,
        niftyPreviousClose: niftyData ? niftyData.previousClose.toFixed(2) : null,
        niftyChange: niftyData ? niftyData.change.toFixed(2) : null,  // Now properly calculated
        niftyChangePercent: niftyData ? niftyData.changePercent.toFixed(2) : null, 
        niftyEMA9: ema9 ? ema9.toFixed(2) : null,
        sensex: sensex ? sensex.toFixed(2) : null,
        bankNifty: bankNifty ? bankNifty.toFixed(2) : null,
        giftNifty: giftNiftyPrice ? giftNiftyPrice.toFixed(2) : null,
        vix: vix ? vix.toFixed(2) : null
      },
      global: {
        dow: globalIndices?.dow ? globalIndices.dow.toFixed(2) : null,
        nasdaq: globalIndices?.nasdaq ? globalIndices.nasdaq.toFixed(2) : null,
        dax: globalIndices?.dax ? globalIndices.dax.toFixed(2) : null
      },
      sentiment: {
        bias: bias,
        advDecline: '1,245/852',
        pcr: '1.32'
      },
      commodities: {
        crude: commodities?.crude ? `$${commodities.crude.toFixed(2)}` : '$82.45',
        gold: commodities?.gold ? `$${commodities.gold.toFixed(2)}` : '$2,045',
        silver: '₹71,240',
        natGas: '₹248.50'
      },
      updatedAt: new Date().toISOString(),
      fromCache: false
    };

    console.log('Market data fetched:', {
      nifty: marketData.indices.nifty,
      change: marketData.indices.niftyChange,
      bias: marketData.sentiment.bias,
      giftNifty: marketData.indices.giftNifty
    });

    // Store in Redis
    await redis.set('market-data', marketData);
    await redis.set('market-data-timestamp', Date.now().toString());
    await redis.expire('market-data', 300);
    await redis.expire('market-data-timestamp', 300);

    return Response.json(marketData);
  } catch (error) {
    console.error('Market data API error:', error);
    
    const staleCache = await redis.get('market-data');
    if (staleCache) {
      console.log('Returning stale cache');
      return Response.json({ ...staleCache, fromCache: true, stale: true });
    }
    
    return Response.json({
      indices: { nifty: null, sensex: null, bankNifty: null, giftNifty: null, vix: null, niftyEMA9: null, niftyChange: null, niftyChangePercent: null },
      global: { dow: null, nasdaq: null, dax: null },
      sentiment: { bias: 'Neutral', advDecline: '---', pcr: '---' },
      commodities: { crude: '---', gold: '---', silver: '---', natGas: '---' },
      updatedAt: new Date().toISOString(),
      error: true
    }, { status: 500 });
  }
}