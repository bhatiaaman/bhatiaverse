import { Redis } from '@upstash/redis';
import { KiteConnect } from 'kiteconnect';

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

// Indian market indices instrument tokens from Kite
const MARKET_INDICES = {
  NIFTY: { symbol: 'NIFTY 50', exchange: 'NSE', token: 256265 },
  BANKNIFTY: { symbol: 'NIFTY BANK', exchange: 'NSE', token: 260105 },
  SENSEX: { symbol: 'SENSEX', exchange: 'BSE', token: 265 },
  VIX: { symbol: 'INDIA VIX', exchange: 'NSE', token: 264969 },
  FINNIFTY: { symbol: 'NIFTY FIN SERVICE', exchange: 'NSE', token: 257801 },
  MIDCAP: { symbol: 'NIFTY MIDCAP 100', exchange: 'NSE', token: 256777 },
};

// Fetch Indian indices from Kite API
async function fetchIndianIndicesFromKite() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  if (!apiKey || !accessToken) {
    console.log('Kite credentials not configured, falling back to Yahoo');
    return null;
  }
  
  try {
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);
    
    // Build instrument keys
    const instrumentKeys = Object.values(MARKET_INDICES).map(
      idx => `${idx.exchange}:${idx.symbol}`
    );
    
    console.log('Fetching indices from Kite:', instrumentKeys);
    const ohlcData = await kite.getOHLC(instrumentKeys);
    
    // Process each index
    const processIndex = (key) => {
      const idx = MARKET_INDICES[key];
      const data = ohlcData[`${idx.exchange}:${idx.symbol}`];
      
      if (!data) return null;
      
      const lastPrice = data.last_price;
      const prevClose = data.ohlc?.close || lastPrice;
      const change = lastPrice - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      
      return {
        price: lastPrice,
        prevClose: prevClose,
        change: change,
        changePercent: changePercent,
        open: data.ohlc?.open,
        high: data.ohlc?.high,
        low: data.ohlc?.low,
      };
    };
    
    return {
      nifty: processIndex('NIFTY'),
      bankNifty: processIndex('BANKNIFTY'),
      sensex: processIndex('SENSEX'),
      vix: processIndex('VIX'),
      finNifty: processIndex('FINNIFTY'),
      midcap: processIndex('MIDCAP'),
    };
  } catch (error) {
    console.error('Kite indices fetch error:', error.message);
    return null;
  }
}

// Fetch Nifty historical data for EMA calculation
async function fetchNiftyHistoricalFromKite() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  if (!apiKey || !accessToken) {
    return null;
  }
  
  try {
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);
    
    // Get last 15 days of daily data for EMA9 calculation
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 20); // 20 days back to ensure we get 9+ trading days
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    const historicalData = await kite.getHistoricalData(
      MARKET_INDICES.NIFTY.token, // Nifty 50 instrument token
      'day',
      formatDate(fromDate),
      formatDate(toDate)
    );
    
    if (historicalData && historicalData.length >= 9) {
      const closePrices = historicalData.map(candle => candle.close);
      console.log(`Fetched ${closePrices.length} days of Nifty data for EMA`);
      return closePrices;
    }
    
    return null;
  } catch (error) {
    console.error('Kite historical data error:', error.message);
    return null;
  }
}

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

// MCX Commodity base names for dynamic contract resolution
const MCX_COMMODITY_NAMES = {
  CRUDEOIL: { base: 'CRUDEOIL', name: 'Crude Oil' },
  GOLD: { base: 'GOLD', name: 'Gold' },
  SILVER: { base: 'SILVER', name: 'Silver' },
  NATURALGAS: { base: 'NATURALGAS', name: 'Natural Gas' },
};

// Cache for MCX instruments (refresh once per day)
let mcxInstrumentsCache = null;
let mcxInstrumentsCacheTime = 0;
const MCX_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fetch and cache MCX instruments list
async function fetchMCXInstruments() {
  const now = Date.now();
  
  // Return cached if valid
  if (mcxInstrumentsCache && (now - mcxInstrumentsCacheTime) < MCX_CACHE_TTL) {
    return mcxInstrumentsCache;
  }
  
  try {
    const response = await fetch('https://api.kite.trade/instruments', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const csvText = await response.text();
    
    // Parse CSV - filter for MCX futures only
    const lines = csvText.split('\n');
    const mcxFutures = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes(',MCX')) continue;
      if (!line.includes('FUT')) continue;
      
      const parts = line.split(',');
      if (parts.length < 6) continue;
      
      const [token, , symbol, , , expiry] = parts;
      if (expiry) {
        mcxFutures.push({
          token: parseInt(token),
          symbol,
          expiry: new Date(expiry),
        });
      }
    }
    
    mcxInstrumentsCache = mcxFutures;
    mcxInstrumentsCacheTime = now;
    console.log(`Cached ${mcxFutures.length} MCX futures instruments`);
    
    return mcxFutures;
  } catch (error) {
    console.error('Failed to fetch MCX instruments:', error.message);
    return mcxInstrumentsCache || []; // Return stale cache if available
  }
}

// Get nearest month contract for a commodity
function getNearestContract(instruments, baseName) {
  const now = new Date();
  
  // Filter for this commodity's futures (exact base match, not mini contracts)
  const contracts = instruments.filter(inst => {
    const symbolUpper = inst.symbol.toUpperCase();
    // Match exact base name followed by year/month (e.g., GOLD26APRFUT, not GOLDGUINEA)
    const regex = new RegExp(`^${baseName}\\d{2}[A-Z]{3}FUT$`);
    return regex.test(symbolUpper) && inst.expiry > now;
  });
  
  if (contracts.length === 0) return null;
  
  // Sort by expiry and get nearest
  contracts.sort((a, b) => a.expiry - b.expiry);
  
  return {
    symbol: contracts[0].symbol,
    token: contracts[0].token,
    expiry: contracts[0].expiry,
  };
}

// Fetch commodities from Kite MCX with dynamic contract selection
async function fetchCommoditiesFromKite() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    console.log('Kite credentials not available for commodities');
    return null;
  }

  try {
    // Fetch MCX instruments and find nearest contracts
    const instruments = await fetchMCXInstruments();
    
    const contracts = {};
    for (const [key, { base, name }] of Object.entries(MCX_COMMODITY_NAMES)) {
      const contract = getNearestContract(instruments, base);
      if (contract) {
        contracts[key] = { ...contract, name };
        console.log(`${name}: ${contract.symbol} (expires ${contract.expiry.toLocaleDateString()})`);
      }
    }
    
    if (Object.keys(contracts).length === 0) {
      console.log('No MCX contracts found');
      return null;
    }
    
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    const symbols = Object.values(contracts).map(c => `MCX:${c.symbol}`);
    const ohlcData = await kite.getOHLC(symbols);
    console.log('MCX commodities OHLC fetched');

    const processComm = (key) => {
      const contract = contracts[key];
      if (!contract) return null;
      
      const data = ohlcData[`MCX:${contract.symbol}`];
      if (!data) return null;

      const lastPrice = data.last_price;
      const prevClose = data.ohlc?.close || lastPrice;
      const change = lastPrice - prevClose;
      const changePercent = prevClose ? ((change / prevClose) * 100) : 0;

      return {
        price: lastPrice,
        change,
        changePercent,
        name: contract.name,
        contract: contract.symbol,
      };
    };

    return {
      crude: processComm('CRUDEOIL'),
      gold: processComm('GOLD'),
      silver: processComm('SILVER'),
      natGas: processComm('NATURALGAS'),
    };
  } catch (error) {
    console.error('Kite commodities fetch error:', error.message);
    return null;
  }
}

// Fallback: Fetch commodities from Yahoo
async function fetchCommoditiesFromYahoo() {
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
      crude: { price: crude.chart.result[0].meta.regularMarketPrice, change: null, changePercent: null },
      gold: { price: gold.chart.result[0].meta.regularMarketPrice, change: null, changePercent: null }
    };
  } catch (error) {
    console.error('Yahoo commodities fetch error:', error);
    return null;
  }
}

// Nifty 50 constituents for market breadth calculation
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

// Fetch Nifty 50 market breadth (advances/declines)
async function fetchMarketBreadth() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  if (!apiKey || !accessToken) {
    return null;
  }
  
  try {
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);
    
    const instrumentKeys = NIFTY_50_STOCKS.map(symbol => `NSE:${symbol}`);
    const ohlcData = await kite.getOHLC(instrumentKeys);
    
    let advances = 0;
    let declines = 0;
    let unchanged = 0;
    
    for (const symbol of NIFTY_50_STOCKS) {
      const key = `NSE:${symbol}`;
      const data = ohlcData[key];
      
      if (!data) continue;
      
      const lastPrice = data.last_price;
      const prevClose = data.ohlc?.close || lastPrice;
      
      if (lastPrice > prevClose) advances++;
      else if (lastPrice < prevClose) declines++;
      else unchanged++;
    }
    
    console.log(`Market Breadth: ${advances}↑ ${declines}↓`);
    
    return {
      advances,
      declines,
      unchanged,
      display: `${advances}↑ ${declines}↓`
    };
  } catch (error) {
    console.error('Market breadth error:', error.message);
    return null;
  }
}

export async function GET() {
  try {
    // Check cache
    const cached = await redis.get('market-data');
    const cacheTime = await redis.get('market-data-timestamp');
    
    // During off-market hours (10 PM - 7 AM), always return cached data
    if (cached && !isMarketHours()) {
      console.log('Off-market hours: serving from cache');
      return Response.json({ ...cached, fromCache: true, offMarketHours: true });
    }
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 60000) { // 1 minute cache for faster updates
        console.log(`Serving from cache (${Math.floor(age / 1000)}s old)`);
        return Response.json({ ...cached, fromCache: true, cacheAge: age });
      }
    }

    console.log('Fetching fresh market data...');

    // Try Kite first for Indian indices, fallback to Yahoo
    // Fetch commodities - try Kite first, fallback to Yahoo
    const [kiteIndices, globalIndices, kiteCommodities, yahooCommodities, giftNifty, breadthData] = await Promise.all([
      fetchIndianIndicesFromKite(),
      fetchGlobalIndices(),
      fetchCommoditiesFromKite(),
      fetchCommoditiesFromYahoo(),
      fetchGIFTNifty(),
      fetchMarketBreadth()
    ]);

    // Use Kite data if available, otherwise fallback to Yahoo
    let niftyData, sensex, bankNifty, vix;
    
    if (kiteIndices) {
      console.log('Using Kite data for Indian indices');
      niftyData = kiteIndices.nifty;
      bankNifty = kiteIndices.bankNifty;
      sensex = kiteIndices.sensex;
      vix = kiteIndices.vix;
    } else {
      console.log('Kite unavailable, falling back to Yahoo');
      const [yahooNifty, yahooSensex, yahooBankNifty, yahooVix] = await Promise.all([
        fetchNiftyFromYahoo(),
        fetchSensex(),
        fetchBankNifty(),
        fetchVIX()
      ]);
      niftyData = yahooNifty;
      sensex = yahooSensex;
      bankNifty = yahooBankNifty;
      vix = yahooVix;
    }

    // Calculate EMA9-based bias
    let bias = 'Neutral';
    let niftyEMA9 = null;
    
    // Try to get historical data for EMA calculation
    const historicalPrices = await fetchNiftyHistoricalFromKite();
    if (historicalPrices && historicalPrices.length >= 9) {
      // Append current price to historical for latest EMA
      const pricesWithCurrent = [...historicalPrices];
      if (niftyData?.price) {
        pricesWithCurrent.push(niftyData.price);
      }
      niftyEMA9 = calculateEMA9(pricesWithCurrent);
      
      if (niftyEMA9 && niftyData?.price) {
        bias = niftyData.price > niftyEMA9 ? 'Bullish' : 'Bearish';
        console.log(`EMA9: ${niftyEMA9.toFixed(2)}, Nifty: ${niftyData.price}, Bias: ${bias}`);
      }
    } else {
      // Fallback to simple % change if no historical data
      console.log('No historical data for EMA, using % change fallback');
      if (niftyData?.changePercent) {
        if (niftyData.changePercent > 0.5) bias = 'Bullish';
        else if (niftyData.changePercent < -0.5) bias = 'Bearish';
      }
    }

    // If GIFT Nifty not available, approximate with Nifty + small spread
    let giftNiftyPrice = giftNifty;
    if (!giftNiftyPrice && niftyData) {
      giftNiftyPrice = niftyData.price + 15;
      console.log('Using Nifty approximation for GIFT Nifty');
    }

    const marketData = {
      indices: {
        nifty: niftyData?.price ? niftyData.price.toFixed(2) : null,
        niftyPreviousClose: niftyData?.prevClose ? niftyData.prevClose.toFixed(2) : null,
        niftyChange: niftyData?.change ? niftyData.change.toFixed(2) : null,
        niftyChangePercent: niftyData?.changePercent ? niftyData.changePercent.toFixed(2) : null, 
        niftyHigh: niftyData?.high ? niftyData.high.toFixed(2) : null,
        niftyLow: niftyData?.low ? niftyData.low.toFixed(2) : null,
        sensex: sensex?.price ? sensex.price.toFixed(2) : (typeof sensex === 'number' ? sensex.toFixed(2) : null),
        sensexChange: sensex?.change ? sensex.change.toFixed(2) : null,
        sensexChangePercent: sensex?.changePercent ? sensex.changePercent.toFixed(2) : null,
        bankNifty: bankNifty?.price ? bankNifty.price.toFixed(2) : (typeof bankNifty === 'number' ? bankNifty.toFixed(2) : null),
        bankNiftyChange: bankNifty?.change ? bankNifty.change.toFixed(2) : null,
        bankNiftyChangePercent: bankNifty?.changePercent ? bankNifty.changePercent.toFixed(2) : null,
        giftNifty: giftNiftyPrice ? (typeof giftNiftyPrice === 'number' ? giftNiftyPrice.toFixed(2) : giftNiftyPrice) : null,
        vix: vix?.price ? vix.price.toFixed(2) : (typeof vix === 'number' ? vix.toFixed(2) : null),
        vixChange: vix?.change ? vix.change.toFixed(2) : null,
        niftyEMA9: niftyEMA9 ? niftyEMA9.toFixed(2) : null,
      },
      global: {
        dow: globalIndices?.dow ? globalIndices.dow.toFixed(2) : null,
        nasdaq: globalIndices?.nasdaq ? globalIndices.nasdaq.toFixed(2) : null,
        dax: globalIndices?.dax ? globalIndices.dax.toFixed(2) : null
      },
      sentiment: {
        bias: bias,
        advDecline: breadthData?.display || '---',
        advances: breadthData?.advances || 0,
        declines: breadthData?.declines || 0,
        pcr: '---'
      },
      commodities: {
        crude: kiteCommodities?.crude?.price ? `₹${kiteCommodities.crude.price.toFixed(2)}` : (yahooCommodities?.crude?.price ? `$${yahooCommodities.crude.price.toFixed(2)}` : '---'),
        crudeChange: kiteCommodities?.crude?.changePercent ?? null,
        gold: kiteCommodities?.gold?.price ? `₹${kiteCommodities.gold.price.toFixed(2)}` : (yahooCommodities?.gold?.price ? `$${yahooCommodities.gold.price.toFixed(2)}` : '---'),
        goldChange: kiteCommodities?.gold?.changePercent ?? null,
        silver: kiteCommodities?.silver?.price ? `₹${kiteCommodities.silver.price.toFixed(2)}` : '---',
        silverChange: kiteCommodities?.silver?.changePercent ?? null,
        natGas: kiteCommodities?.natGas?.price ? `₹${kiteCommodities.natGas.price.toFixed(2)}` : '---',
        natGasChange: kiteCommodities?.natGas?.changePercent ?? null,
      },
      source: kiteIndices ? 'kite' : 'yahoo',
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