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

const CACHE_TTL = 60; // 1 minute cache
const HISTORY_TTL = 3600; // 1 hour history for change tracking
const INSTRUMENTS_CACHE_KEY = 'nfo-instruments-all';
const INSTRUMENTS_CACHE_TTL = 86400; // 24 hours

// Underlying details
const UNDERLYING_CONFIG = {
  NIFTY: {
    spotSymbol: 'NIFTY 50',
    name: 'NIFTY',
    lotSize: 25,
    strikeGap: 50,
  },
  BANKNIFTY: {
    spotSymbol: 'NIFTY BANK',
    name: 'BANKNIFTY',
    lotSize: 15,
    strikeGap: 100,
  },
};

// Format OI in lakhs
function formatOI(oi) {
  return (oi / 100000).toFixed(1) + 'L';
}

// Round to nearest strike
function roundToStrike(price, gap) {
  return Math.round(price / gap) * gap;
}

// Generate OI change commentary
function generateCommentary(current, previous, underlying) {
  const alerts = [];
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  if (!previous) {
    return [{ type: 'info', time: timestamp, message: `${underlying} options data initialized. Tracking OI changes...` }];
  }
  
  // PCR change
  const pcrChange = current.pcr - previous.pcr;
  if (Math.abs(pcrChange) >= 0.05) {
    const direction = pcrChange > 0 ? 'increased' : 'decreased';
    const sentiment = pcrChange > 0 ? 'bullish' : 'bearish';
    alerts.push({
      type: pcrChange > 0 ? 'bullish' : 'bearish',
      time: timestamp,
      message: `PCR ${direction} from ${previous.pcr.toFixed(2)} → ${current.pcr.toFixed(2)} (${sentiment} shift)`,
    });
  }
  
  // Support level change
  if (current.support !== previous.support) {
    const direction = current.support > previous.support ? 'moved up' : 'moved down';
    alerts.push({
      type: current.support > previous.support ? 'bullish' : 'bearish',
      time: timestamp,
      message: `Support ${direction}: ${previous.support} → ${current.support}`,
    });
  }
  
  // Resistance level change
  if (current.resistance !== previous.resistance) {
    const direction = current.resistance > previous.resistance ? 'moved up' : 'moved down';
    alerts.push({
      type: current.resistance > previous.resistance ? 'bullish' : 'bearish',
      time: timestamp,
      message: `Resistance ${direction}: ${previous.resistance} → ${current.resistance}`,
    });
  }
  
  // Max Pain shift
  if (current.maxPain !== previous.maxPain) {
    const direction = current.maxPain > previous.maxPain ? 'higher' : 'lower';
    alerts.push({
      type: 'info',
      time: timestamp,
      message: `Max Pain shifted ${direction}: ${previous.maxPain} → ${current.maxPain}`,
    });
  }
  
  // Support OI change (weakening/strengthening)
  const supportOIChange = current.supportOI - previous.supportOI;
  const supportOIChangePct = previous.supportOI > 0 ? (supportOIChange / previous.supportOI) * 100 : 0;
  if (Math.abs(supportOIChangePct) >= 5) {
    if (supportOIChange < 0) {
      alerts.push({
        type: 'warning',
        time: timestamp,
        message: `⚠️ Support ${current.support} weakening: Put OI dropped ${formatOI(Math.abs(supportOIChange))} (${Math.abs(supportOIChangePct).toFixed(1)}%)`,
      });
    } else {
      alerts.push({
        type: 'bullish',
        time: timestamp,
        message: `Support ${current.support} strengthening: Put OI added ${formatOI(supportOIChange)} (+${supportOIChangePct.toFixed(1)}%)`,
      });
    }
  }
  
  // Resistance OI change (weakening/strengthening)
  const resistanceOIChange = current.resistanceOI - previous.resistanceOI;
  const resistanceOIChangePct = previous.resistanceOI > 0 ? (resistanceOIChange / previous.resistanceOI) * 100 : 0;
  if (Math.abs(resistanceOIChangePct) >= 5) {
    if (resistanceOIChange < 0) {
      alerts.push({
        type: 'bullish',
        time: timestamp,
        message: `Resistance ${current.resistance} weakening: Call OI dropped ${formatOI(Math.abs(resistanceOIChange))} (${Math.abs(resistanceOIChangePct).toFixed(1)}%)`,
      });
    } else {
      alerts.push({
        type: 'warning',
        time: timestamp,
        message: `⚠️ Resistance ${current.resistance} strengthening: Call OI added ${formatOI(resistanceOIChange)} (+${resistanceOIChangePct.toFixed(1)}%)`,
      });
    }
  }
  
  // Total OI buildup
  const totalOIChange = (current.totalCallOI + current.totalPutOI) - (previous.totalCallOI + previous.totalPutOI);
  const totalOIChangePct = (previous.totalCallOI + previous.totalPutOI) > 0 
    ? (totalOIChange / (previous.totalCallOI + previous.totalPutOI)) * 100 : 0;
  if (Math.abs(totalOIChangePct) >= 3) {
    const direction = totalOIChange > 0 ? 'added' : 'unwound';
    alerts.push({
      type: 'info',
      time: timestamp,
      message: `Total OI ${direction}: ${formatOI(Math.abs(totalOIChange))} (${totalOIChange > 0 ? '+' : ''}${totalOIChangePct.toFixed(1)}%)`,
    });
  }
  
  return alerts;
}

// Calculate Max Pain
function calculateMaxPain(optionData, spotPrice, config) {
  const strikes = [...new Set(optionData.map(o => o.strike))].sort((a, b) => a - b);
  
  let minPain = Infinity;
  let maxPainStrike = roundToStrike(spotPrice, config.strikeGap);
  
  for (const testStrike of strikes) {
    let totalPain = 0;
    
    for (const option of optionData) {
      if (option.type === 'CE') {
        if (testStrike < option.strike) {
          totalPain += option.oi * config.lotSize * (option.strike - testStrike);
        }
      } else {
        if (testStrike > option.strike) {
          totalPain += option.oi * config.lotSize * (testStrike - option.strike);
        }
      }
    }
    
    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = testStrike;
    }
  }
  
  return maxPainStrike;
}

// Find Support & Resistance from OI
function findSupportResistance(optionData, spotPrice, config) {
  const atmStrike = roundToStrike(spotPrice, config.strikeGap);
  
  const putsBelow = optionData
    .filter(o => o.type === 'PE' && o.strike <= atmStrike)
    .sort((a, b) => b.oi - a.oi);
  
  const callsAbove = optionData
    .filter(o => o.type === 'CE' && o.strike >= atmStrike)
    .sort((a, b) => b.oi - a.oi);
  
  const support = putsBelow[0]?.strike || atmStrike - (2 * config.strikeGap);
  const resistance = callsAbove[0]?.strike || atmStrike + (2 * config.strikeGap);
  const support2 = putsBelow[1]?.strike || support - config.strikeGap;
  const resistance2 = callsAbove[1]?.strike || resistance + config.strikeGap;
  
  return {
    support: { level: support, oi: putsBelow[0]?.oi || 0 },
    support2: { level: support2, oi: putsBelow[1]?.oi || 0 },
    resistance: { level: resistance, oi: callsAbove[0]?.oi || 0 },
    resistance2: { level: resistance2, oi: callsAbove[1]?.oi || 0 },
  };
}

// Get NFO instruments from cache or fetch
async function getNFOInstruments(kite) {
  try {
    const cached = await redis.get(INSTRUMENTS_CACHE_KEY);
    if (cached) {
      console.log('Using cached NFO instruments');
      return cached;
    }
  } catch (e) {
    console.log('Redis cache miss for instruments');
  }
  
  console.log('Fetching NFO instruments from Kite...');
  const instruments = await kite.getInstruments('NFO');
  
  // Filter NIFTY and BANKNIFTY options
  const options = instruments.filter(i => 
    (i.name === 'NIFTY' || i.name === 'BANKNIFTY') && 
    (i.instrument_type === 'CE' || i.instrument_type === 'PE')
  );
  
  console.log(`Filtered options: ${options.length}`);
  
  // Cache for 24 hours
  try {
    await redis.set(INSTRUMENTS_CACHE_KEY, options, { ex: INSTRUMENTS_CACHE_TTL });
  } catch (e) {
    console.log('Failed to cache instruments:', e.message);
  }
  
  return options;
}

// Get expiries for an underlying
function getExpiries(options, underlyingName) {
  const underlyingOptions = options.filter(o => o.name === underlyingName);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all unique expiries sorted
  const allExpiries = [...new Set(underlyingOptions.map(o => o.expiry))]
    .filter(exp => new Date(exp) >= today)
    .sort((a, b) => new Date(a) - new Date(b));
  
  // Find weekly (nearest) expiry
  const weeklyExpiry = allExpiries[0];
  
  // Find monthly expiry (last Thursday of month)
  // Monthly expiries are typically at month end
  const monthlyExpiries = allExpiries.filter(exp => {
    const date = new Date(exp);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Check if this is the last expiry of the month
    const nextExpiry = allExpiries.find(e => {
      const d = new Date(e);
      return d > date;
    });
    
    if (!nextExpiry) return true; // Last expiry overall
    
    const nextDate = new Date(nextExpiry);
    return nextDate.getMonth() !== month || nextDate.getFullYear() !== year;
  });
  
  const monthlyExpiry = monthlyExpiries[0] || weeklyExpiry;
  
  return {
    weekly: weeklyExpiry,
    monthly: monthlyExpiry,
    all: allExpiries.slice(0, 8), // Return first 8 expiries for UI
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const underlying = searchParams.get('underlying') || 'NIFTY';
  const expiryType = searchParams.get('expiry') || 'weekly';
  
  const config = UNDERLYING_CONFIG[underlying];
  if (!config) {
    return NextResponse.json({ error: 'Invalid underlying' });
  }
  
  const cacheKey = `option-chain-${underlying}-${expiryType}`;
  
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;
  
  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    
    // During off-market hours (10 PM - 7 AM), always return cached data
    if (cached && !isMarketHours()) {
      console.log(`Off-market hours: returning cached ${underlying} ${expiryType} option chain`);
      return NextResponse.json({ ...cached, fromCache: true, offMarketHours: true });
    }
    
    if (cached) {
      console.log(`Returning cached ${underlying} ${expiryType} option chain`);
      return NextResponse.json({ ...cached, fromCache: true });
    }
    
    if (!apiKey || !accessToken) {
      return NextResponse.json({
        error: 'Kite API not configured',
        pcr: null,
        maxPain: null,
        support: null,
        resistance: null,
      });
    }

    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Get spot price
    const spotData = await kite.getOHLC([`NSE:${config.spotSymbol}`]);
    const spotPrice = spotData[`NSE:${config.spotSymbol}`]?.last_price;
    
    if (!spotPrice) {
      throw new Error(`Could not fetch ${underlying} spot price`);
    }
    
    console.log(`${underlying} Spot: ${spotPrice}`);
    
    // Get NFO instruments
    const allOptions = await getNFOInstruments(kite);
    
    // Get expiries
    const expiries = getExpiries(allOptions, config.name);
    const selectedExpiry = expiryType === 'monthly' ? expiries.monthly : expiries.weekly;
    
    console.log(`Selected ${expiryType} expiry: ${selectedExpiry}`);
    console.log(`Available expiries: weekly=${expiries.weekly}, monthly=${expiries.monthly}`);
    
    // Calculate ATM and strike range
    const atmStrike = roundToStrike(spotPrice, config.strikeGap);
    const minStrike = atmStrike - (10 * config.strikeGap);
    const maxStrike = atmStrike + (10 * config.strikeGap);
    
    // Filter options for this underlying, expiry, and strike range
    const relevantOptions = allOptions.filter(o => 
      o.name === config.name &&
      o.expiry === selectedExpiry &&
      o.strike >= minStrike &&
      o.strike <= maxStrike
    );
    
    console.log(`Found ${relevantOptions.length} relevant options for ${underlying}`);
    
    if (relevantOptions.length === 0) {
      throw new Error(`No ${underlying} option contracts found for ${expiryType} expiry`);
    }
    
    // Build quote symbols
    const quoteSymbols = relevantOptions.map(o => `NFO:${o.tradingsymbol}`);
    
    // Fetch quotes in batches of 500
    const batchSize = 500;
    const allQuotes = {};
    
    for (let i = 0; i < quoteSymbols.length; i += batchSize) {
      const batch = quoteSymbols.slice(i, i + batchSize);
      const quotes = await kite.getQuote(batch);
      Object.assign(allQuotes, quotes);
    }
    
    // Process option data
    const optionData = [];
    let totalCallOI = 0;
    let totalPutOI = 0;
    
    for (const option of relevantOptions) {
      const symbol = `NFO:${option.tradingsymbol}`;
      const data = allQuotes[symbol];
      
      if (!data) continue;
      
      const oi = data.oi || 0;
      const ltp = data.last_price || 0;
      const volume = data.volume || 0;
      
      optionData.push({
        strike: option.strike,
        type: option.instrument_type,
        symbol: option.tradingsymbol,
        oi,
        ltp,
        volume,
      });
      
      if (option.instrument_type === 'CE') totalCallOI += oi;
      else totalPutOI += oi;
    }
    
    console.log(`Processed ${optionData.length} options`);
    console.log(`Total Call OI: ${totalCallOI.toLocaleString()}, Put OI: ${totalPutOI.toLocaleString()}`);
    
    // Calculate metrics
    const pcr = totalCallOI > 0 ? (totalPutOI / totalCallOI) : 0;
    const maxPain = calculateMaxPain(optionData, spotPrice, config);
    const { support, support2, resistance, resistance2 } = findSupportResistance(optionData, spotPrice, config);
    
    // Get previous data for change tracking
    const historyKey = `option-history-${underlying}-${expiryType}`;
    let previousData = null;
    let alertHistory = [];
    
    try {
      const historyData = await redis.get(historyKey);
      if (historyData) {
        previousData = historyData.current;
        alertHistory = historyData.alerts || [];
      }
    } catch (e) {
      console.log('No previous data for comparison');
    }
    
    // Current metrics for comparison
    const currentMetrics = {
      pcr: parseFloat(pcr.toFixed(2)),
      maxPain,
      support: support.level,
      supportOI: support.oi,
      resistance: resistance.level,
      resistanceOI: resistance.oi,
      totalCallOI,
      totalPutOI,
      timestamp: new Date().toISOString(),
    };
    
    // Generate alerts based on changes
    const newAlerts = generateCommentary(currentMetrics, previousData, underlying);
    
    // Merge with existing alerts, keep last 10
    if (newAlerts.length > 0) {
      alertHistory = [...newAlerts, ...alertHistory].slice(0, 10);
    }
    
    // Save current data for future comparison
    try {
      await redis.set(historyKey, {
        current: currentMetrics,
        alerts: alertHistory,
      }, { ex: HISTORY_TTL });
    } catch (e) {
      console.log('Failed to save history:', e.message);
    }
    
    const response = {
      underlying,
      expiryType,
      spotPrice: spotPrice.toFixed(2),
      atmStrike,
      expiry: selectedExpiry,
      expiries: {
        weekly: expiries.weekly,
        monthly: expiries.monthly,
      },
      pcr: parseFloat(pcr.toFixed(2)),
      maxPain,
      support: support.level,
      supportOI: support.oi,
      support2: support2.level,
      support2OI: support2.oi,
      resistance: resistance.level,
      resistanceOI: resistance.oi,
      resistance2: resistance2.level,
      resistance2OI: resistance2.oi,
      totalCallOI,
      totalPutOI,
      alerts: alertHistory,
      optionChain: optionData.sort((a, b) => a.strike - b.strike),
      timestamp: new Date().toISOString(),
    };
    
    // Cache the response
    await redis.set(cacheKey, response, { ex: CACHE_TTL });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching option chain:', error.message);
    return NextResponse.json({
      error: error.message,
      underlying,
      expiryType,
      pcr: null,
      maxPain: null,
      support: null,
      resistance: null,
    });
  }
}
