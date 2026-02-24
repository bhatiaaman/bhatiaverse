// app/api/market-commentary/route.js
// FIXED: Shows gap analysis pre-market, real-time commentary during market hours

import { NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const NS = process.env.REDIS_NAMESPACE || 'default';

async function redisGet(key) {
  try {
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch { return null; }
}

async function redisSet(key, value, exSeconds) {
  try {
    const encoded = encodeURIComponent(JSON.stringify(value));
    const url = exSeconds
      ? `${REDIS_URL}/set/${key}/${encoded}?ex=${exSeconds}`
      : `${REDIS_URL}/set/${key}/${encoded}`;
    await fetch(url, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } });
  } catch (e) { console.error('Redis set error:', e); }
}

// Check if market is open
function isMarketOpen() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  
  const day = ist.getUTCDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Market hours: 9:15 AM to 3:30 PM IST
  const marketOpen = 9 * 60 + 15;  // 555 minutes
  const marketClose = 15 * 60 + 30; // 930 minutes
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === '1';
    
    const CACHE_KEY = `${NS}:market-commentary`;
    
    // Check cache (1 minute TTL during market hours, 5 minutes pre-market)
    if (!refresh) {
      const cached = await redisGet(CACHE_KEY);
      if (cached) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        const maxAge = isMarketOpen() ? 60 * 1000 : 5 * 60 * 1000;
        if (age < maxAge) {
          return NextResponse.json({ ...cached, fromCache: true, cacheAge: age });
        }
      }
    }

    // Fetch market data
    const baseUrl = request.url.split('/api/')[0];
    
    const [marketData, optionChainData, gapData] = await Promise.all([
      fetch(`${baseUrl}/api/market-data`).then(r => r.json()),
      fetch(`${baseUrl}/api/option-chain?underlying=NIFTY&expiry=weekly`).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/pre-market/gap-calculator?symbol=NIFTY`).then(r => r.json()).catch(() => null),
    ]);

    const marketIsOpen = isMarketOpen();

    // Generate commentary based on market status
    const commentary = marketIsOpen 
      ? generateLiveCommentary(marketData, optionChainData)
      : generatePreMarketCommentary(marketData, optionChainData, gapData);

    const result = {
      success: true,
      commentary,
      method: 'rule-based',
      marketStatus: marketIsOpen ? 'OPEN' : 'PRE_MARKET',
      timestamp: new Date().toISOString(),
    };

    await redisSet(CACHE_KEY, result, marketIsOpen ? 60 : 300);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Market commentary error:', error);
    
    return NextResponse.json({
      success: true,
      commentary: {
        state: 'LOADING',
        stateEmoji: '⏳',
        bias: 'NEUTRAL',
        biasEmoji: '🟡',
        keyLevel: null,
        headline: 'Market data loading...',
        action: 'Please wait',
      },
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}

// LIVE COMMENTARY - During market hours (9:15 AM - 3:30 PM)
function generateLiveCommentary(marketData, optionChain) {
  const nifty = parseFloat(marketData.indices?.nifty || 0);
  const niftyChange = parseFloat(marketData.indices?.niftyChangePercent || 0);
  const niftyHigh = parseFloat(marketData.indices?.niftyHigh || nifty);
  const niftyLow = parseFloat(marketData.indices?.niftyLow || nifty);
  const niftyEMA9 = parseFloat(marketData.indices?.niftyEMA9 || nifty);
  
  const pcr = optionChain?.pcr || null;
  const support = optionChain?.support || niftyLow;
  const resistance = optionChain?.resistance || niftyHigh;
  
  let state = 'CONSOLIDATING';
  let stateEmoji = '↔️';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = '';
  let action = '';
  let keyLevel = support;

  const range = niftyHigh - niftyLow;
  const rangePercent = (range / niftyLow) * 100;

  // Rule 1: Strong Trend
  if (Math.abs(niftyChange) > 1) {
    if (niftyChange > 0) {
      state = 'TRENDING UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Strong ${niftyChange.toFixed(2)}% rally - momentum in control`;
      action = `Buy dips near ${support?.toLocaleString()}, trail stop loss. Avoid shorts.`;
      keyLevel = support?.toFixed(0);
    } else {
      state = 'TRENDING DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Sharp ${Math.abs(niftyChange).toFixed(2)}% decline - bears dominating`;
      action = `Sell rallies near ${resistance?.toLocaleString()}, avoid fresh longs`;
      keyLevel = resistance?.toFixed(0);
    }
  }
  // Rule 2: Moderate Trend
  else if (Math.abs(niftyChange) > 0.5) {
    if (niftyChange > 0 && nifty > niftyEMA9) {
      state = 'TRENDING UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Above EMA9 at ${niftyEMA9.toFixed(0)} - bullish structure intact`;
      action = `Long on dips with SL below ${(niftyEMA9 - 20).toFixed(0)}`;
      keyLevel = niftyEMA9.toFixed(0);
    } else if (niftyChange < 0 && nifty < niftyEMA9) {
      state = 'TRENDING DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Below EMA9 at ${niftyEMA9.toFixed(0)} - bearish pressure building`;
      action = `Short on bounces with SL above ${(niftyEMA9 + 20).toFixed(0)}`;
      keyLevel = niftyEMA9.toFixed(0);
    } else {
      state = 'CONSOLIDATING';
      stateEmoji = '↔️';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Range-bound between ${support?.toLocaleString()} - ${resistance?.toLocaleString()}`;
      action = `Trade the range or wait for breakout`;
      keyLevel = support?.toFixed(0);
    }
  }
  // Rule 3: Near Support/Resistance
  else {
    const distToSupport = support ? Math.abs(((nifty - support) / support) * 100) : 999;
    const distToResistance = resistance ? Math.abs(((resistance - nifty) / nifty) * 100) : 999;
    
    if (distToSupport < 0.5) {
      state = 'AT SUPPORT';
      stateEmoji = '🛡️';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Testing key support at ${support?.toLocaleString()}`;
      action = `High probability bounce. Long with SL below ${(support - 20).toFixed(0)}`;
      keyLevel = support?.toFixed(0);
    } else if (distToResistance < 0.5) {
      state = 'AT RESISTANCE';
      stateEmoji = '🚧';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Testing resistance at ${resistance?.toLocaleString()}`;
      action = `High probability rejection. Short with SL above ${(resistance + 20).toFixed(0)}`;
      keyLevel = resistance?.toFixed(0);
    } else {
      state = 'CONSOLIDATING';
      stateEmoji = '↔️';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Range-bound between ${support?.toLocaleString()} - ${resistance?.toLocaleString()}`;
      action = `Wait for clear direction. No edge in current zone.`;
      keyLevel = support?.toFixed(0);
    }
  }

  // PCR override
  if (pcr && pcr > 1.3 && tradingBias === 'BEARISH') {
    tradingBias = 'NEUTRAL';
    biasEmoji = '🟡';
    action = `${action} [PCR ${pcr.toFixed(2)} suggests caution on shorts]`;
  } else if (pcr && pcr < 0.7 && tradingBias === 'BULLISH') {
    tradingBias = 'NEUTRAL';
    biasEmoji = '🟡';
    action = `${action} [PCR ${pcr.toFixed(2)} suggests caution on longs]`;
  }

  return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action };
}

// PRE-MARKET COMMENTARY - Before 9:15 AM
function generatePreMarketCommentary(marketData, optionChain, gapData) {
  const hasGapData = gapData?.success;
  const gapType = gapData?.gap?.type;
  const gapSize = gapData?.gap?.size;
  const gapPercent = gapData?.gap?.percent || 0;
  const expectedOpen = gapData?.expectedOpen;
  const previousClose = gapData?.previousClose;
  
  let state = 'PRE-MARKET';
  let stateEmoji = '🌅';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = 'Market opens soon';
  let action = 'Analyzing pre-market data...';
  let keyLevel = previousClose?.toFixed(0);

  if (hasGapData && Math.abs(gapPercent) > 0.2) {
    
    if (gapType === 'GAP_UP') {
      if (gapSize === 'Large') {
        state = 'GAP UP EXPECTED';
        stateEmoji = '🚀';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Strong gap up expected at ${expectedOpen} (+${gapPercent.toFixed(2)}%)`;
        action = `Wait for 9:30 AM consolidation. Enter longs only if holds above ${previousClose?.toFixed(0)}. Avoid chasing.`;
        keyLevel = previousClose?.toFixed(0);
      } else if (gapSize === 'Medium') {
        state = 'GAP UP EXPECTED';
        stateEmoji = '📈';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Moderate gap up expected at ${expectedOpen} (+${gapPercent.toFixed(2)}%)`;
        action = `Buy dips if sustains above ${previousClose?.toFixed(0)}`;
        keyLevel = previousClose?.toFixed(0);
      } else {
        state = 'SMALL GAP UP';
        stateEmoji = '📈';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Small gap up expected - momentum likely`;
        action = `Buy on breakout above opening high. Trail stop loss.`;
        keyLevel = expectedOpen?.toFixed(0);
      }
    }
    
    else if (gapType === 'GAP_DOWN') {
      if (gapSize === 'Large') {
        state = 'GAP DOWN EXPECTED';
        stateEmoji = '⚠️';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Sharp gap down expected at ${expectedOpen} (${gapPercent.toFixed(2)}%)`;
        action = `High chance of bounce. Avoid shorts initially. Look for reversal.`;
        keyLevel = expectedOpen?.toFixed(0);
      } else if (gapSize === 'Medium') {
        state = 'GAP DOWN EXPECTED';
        stateEmoji = '📉';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Moderate gap down expected at ${expectedOpen} (${gapPercent.toFixed(2)}%)`;
        action = `Sell rallies if fails to reclaim ${previousClose?.toFixed(0)}`;
        keyLevel = previousClose?.toFixed(0);
      } else {
        state = 'SMALL GAP DOWN';
        stateEmoji = '📉';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Small gap down expected - weakness may continue`;
        action = `Short on breakdown below opening range low.`;
        keyLevel = expectedOpen?.toFixed(0);
      }
    }
  }

  return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action };
}