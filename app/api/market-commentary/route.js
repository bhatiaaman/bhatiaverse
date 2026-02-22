// app/api/market-commentary/route.js
// Rule-based commentary (no AI required)

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === '1';
    
    const CACHE_KEY = `${NS}:market-commentary`;
    
    // Check cache (5 minute TTL)
    if (!refresh) {
      const cached = await redisGet(CACHE_KEY);
      if (cached) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        if (age < 5 * 60 * 1000) { // 5 minutes
          return NextResponse.json({ ...cached, fromCache: true, cacheAge: age });
        }
      }
    }

    // Fetch market data
    const baseUrl = request.url.split('/api/')[0];
    
    const [marketData, optionChainData] = await Promise.all([
      fetch(`${baseUrl}/api/market-data`).then(r => r.json()),
      fetch(`${baseUrl}/api/option-chain?underlying=NIFTY&expiry=weekly`).then(r => r.json()).catch(() => null),
    ]);

    // Generate rule-based commentary
    const commentary = generateRuleBasedCommentary(marketData, optionChainData);

    const result = {
      success: true,
      commentary,
      method: 'rule-based',
      timestamp: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await redisSet(CACHE_KEY, result, 300);

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
        fullText: 'Fetching market data...',
      },
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}

function generateRuleBasedCommentary(marketData, optionChain) {
  const nifty = parseFloat(marketData.indices?.nifty || 0);
  const niftyChange = parseFloat(marketData.indices?.niftyChangePercent || 0);
  const niftyHigh = parseFloat(marketData.indices?.niftyHigh || nifty);
  const niftyLow = parseFloat(marketData.indices?.niftyLow || nifty);
  const niftyEMA9 = parseFloat(marketData.indices?.niftyEMA9 || nifty);
  const bias = marketData.sentiment?.bias || 'Neutral';
  const advances = marketData.sentiment?.advances || 0;
  const declines = marketData.sentiment?.declines || 0;
  
  const pcr = optionChain?.pcr || null;
  const support = optionChain?.support || niftyLow;
  const resistance = optionChain?.resistance || niftyHigh;
  
  const range = niftyHigh - niftyLow;
  const rangePercent = (range / niftyLow) * 100;
  const distanceFromEMA = ((nifty - niftyEMA9) / niftyEMA9) * 100;
  
  let state = 'CONSOLIDATING';
  let stateEmoji = '↔️';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = '';
  let action = '';
  let keyLevel = support;

  // Rule 1: Tight Range (< 0.3%)
  if (rangePercent < 0.3) {
    state = 'TIGHT RANGE';
    stateEmoji = '📊';
    headline = `Narrow ${range.toFixed(0)} point range - breakout imminent`;
    action = `Wait for breakout above ${niftyHigh.toFixed(0)} or below ${niftyLow.toFixed(0)}`;
    tradingBias = 'NEUTRAL';
    biasEmoji = '🟡';
    keyLevel = niftyLow.toFixed(0);
  }
  
  // Rule 2: Strong Trend (> 1% move)
  else if (Math.abs(niftyChange) > 1) {
    if (niftyChange > 0) {
      state = 'TRENDING UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Strong ${niftyChange.toFixed(2)}% rally - momentum in control`;
      action = `Buy dips near ${support?.toLocaleString() || niftyLow.toFixed(0)}, trail stop loss. Avoid shorts.`;
      keyLevel = support?.toFixed(0) || niftyLow.toFixed(0);
    } else {
      state = 'TRENDING DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Sharp ${Math.abs(niftyChange).toFixed(2)}% decline - bears dominating`;
      action = `Sell rallies near ${resistance?.toLocaleString() || niftyHigh.toFixed(0)}, avoid fresh longs`;
      keyLevel = resistance?.toFixed(0) || niftyHigh.toFixed(0);
    }
  }
  
  // Rule 3: Moderate Move (0.5-1%)
  else if (Math.abs(niftyChange) > 0.5) {
    if (niftyChange > 0 && nifty > niftyEMA9) {
      state = 'TRENDING UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Above EMA9 at ${niftyEMA9.toFixed(0)} - bullish structure intact`;
      action = `Long on dips to ${(nifty - 30).toFixed(0)}-${(nifty - 20).toFixed(0)} zone with SL below ${(nifty - 50).toFixed(0)}`;
      keyLevel = niftyEMA9.toFixed(0);
    } else if (niftyChange < 0 && nifty < niftyEMA9) {
      state = 'TRENDING DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Below EMA9 at ${niftyEMA9.toFixed(0)} - bearish pressure building`;
      action = `Short on bounces to ${(nifty + 20).toFixed(0)}-${(nifty + 30).toFixed(0)} with SL above ${(nifty + 50).toFixed(0)}`;
      keyLevel = niftyEMA9.toFixed(0);
    } else {
      state = 'MIXED SIGNALS';
      stateEmoji = '⚠️';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Conflicting signals - price at ${nifty.toFixed(0)} vs EMA9 ${niftyEMA9.toFixed(0)}`;
      action = `Wait for clear direction. Watch ${support?.toFixed(0)} support and ${resistance?.toFixed(0)} resistance`;
      keyLevel = niftyEMA9.toFixed(0);
    }
  }
  
  // Rule 4: Small Move (< 0.5%)
  else {
    // Check if near support/resistance
    const distToSupport = support ? ((nifty - support) / support) * 100 : 999;
    const distToResistance = resistance ? ((resistance - nifty) / nifty) * 100 : 999;
    
    if (distToSupport < 0.3) {
      state = 'AT SUPPORT';
      stateEmoji = '🛡️';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Testing key support at ${support?.toLocaleString()}`;
      action = `High probability bounce zone. Long with tight SL below ${(support - 20).toFixed(0)}. Target ${resistance?.toLocaleString()}`;
      keyLevel = support?.toFixed(0);
    } else if (distToResistance < 0.3) {
      state = 'AT RESISTANCE';
      stateEmoji = '🔴';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Testing key resistance at ${resistance?.toLocaleString()}`;
      action = `High probability rejection zone. Short with SL above ${(resistance + 20).toFixed(0)}. Target ${support?.toLocaleString()}`;
      keyLevel = resistance?.toFixed(0);
    } else {
      state = 'CONSOLIDATING';
      stateEmoji = '↔️';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Range-bound between ${support?.toLocaleString()} - ${resistance?.toLocaleString()}`;
      action = `Trade the range or wait for breakout. Buy near support, sell near resistance`;
      keyLevel = (nifty < (support + resistance) / 2) ? support?.toFixed(0) : resistance?.toFixed(0);
    }
  }
  
  // Rule 5: Reversal Setup (price crossed EMA recently)
  if (Math.abs(distanceFromEMA) < 0.5 && Math.abs(niftyChange) > 0.3) {
    state = 'REVERSAL SETUP';
    stateEmoji = '🔄';
    headline = `Price testing EMA9 at ${niftyEMA9.toFixed(0)} - potential reversal`;
    
    if (nifty > niftyEMA9 && niftyChange > 0) {
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      action = `Bullish reversal if sustains above ${niftyEMA9.toFixed(0)}. Long on confirmation with SL ${(niftyEMA9 - 20).toFixed(0)}`;
    } else if (nifty < niftyEMA9 && niftyChange < 0) {
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      action = `Bearish reversal if breaks below ${niftyEMA9.toFixed(0)}. Short on confirmation with SL ${(niftyEMA9 + 20).toFixed(0)}`;
    }
    keyLevel = niftyEMA9.toFixed(0);
  }
  
  // Rule 6: PCR-based sentiment override
  if (pcr) {
    if (pcr > 1.3 && tradingBias === 'BEARISH') {
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      action = `${action} [PCR ${pcr.toFixed(2)} suggests caution on shorts]`;
    } else if (pcr < 0.7 && tradingBias === 'BULLISH') {
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      action = `${action} [PCR ${pcr.toFixed(2)} suggests caution on longs]`;
    }
  }
  
  // Rule 7: Market Breadth confirmation
  const advDecRatio = declines > 0 ? advances / declines : advances > 0 ? 999 : 1;
  if (advDecRatio > 2 && tradingBias !== 'BULLISH') {
    action = `${action} [Strong advance/decline favors bulls]`;
  } else if (advDecRatio < 0.5 && tradingBias !== 'BEARISH') {
    action = `${action} [Weak advance/decline favors bears]`;
  }
  
  const fullText = `${stateEmoji} ${state}\n${headline}\n\n${biasEmoji} ${tradingBias}\nKey Level: ${keyLevel}\n\n${action}`;

  return {
    state,
    stateEmoji,
    bias: tradingBias,
    biasEmoji,
    keyLevel,
    headline,
    action,
    fullText,
  };
}