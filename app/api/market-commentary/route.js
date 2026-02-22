// app/api/market-commentary/route.js
// Rule-based commentary with tomorrow's gap consideration

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
        if (age < 5 * 60 * 1000) {
          return NextResponse.json({ ...cached, fromCache: true, cacheAge: age });
        }
      }
    }

    // Fetch market data AND gap data
    const baseUrl = request.url.split('/api/')[0];
    
    const [marketData, optionChainData, gapData] = await Promise.all([
      fetch(`${baseUrl}/api/market-data`).then(r => r.json()),
      fetch(`${baseUrl}/api/option-chain?underlying=NIFTY&expiry=weekly`).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/pre-market/gap-calculator?symbol=NIFTY`).then(r => r.json()).catch(() => null),
    ]);

    // Generate commentary WITH gap consideration
    const commentary = generateRuleBasedCommentary(marketData, optionChainData, gapData);

    const result = {
      success: true,
      commentary,
      method: 'rule-based',
      timestamp: new Date().toISOString(),
    };

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

function generateRuleBasedCommentary(marketData, optionChain, gapData) {
  const nifty = parseFloat(marketData.indices?.nifty || 0);
  const niftyChange = parseFloat(marketData.indices?.niftyChangePercent || 0);
  const niftyHigh = parseFloat(marketData.indices?.niftyHigh || nifty);
  const niftyLow = parseFloat(marketData.indices?.niftyLow || nifty);
  const niftyEMA9 = parseFloat(marketData.indices?.niftyEMA9 || nifty);
  const bias = marketData.sentiment?.bias || 'Neutral';
  
  const pcr = optionChain?.pcr || null;
  const support = optionChain?.support || niftyLow;
  const resistance = optionChain?.resistance || niftyHigh;
  
  // GAP DATA - KEY ADDITION
  const hasGapData = gapData?.success;
  const gapType = gapData?.gap?.type;
  const gapSize = gapData?.gap?.size;
  const gapPercent = gapData?.gap?.percent || 0;
  const expectedOpen = gapData?.expectedOpen;
  
  let state = 'CONSOLIDATING';
  let stateEmoji = '↔️';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = '';
  let action = '';
  let keyLevel = support;

  // PRIORITY: If gap data available, use it for tomorrow's outlook
  if (hasGapData && Math.abs(gapPercent) > 0.3) {
    
    if (gapType === 'GAP_UP') {
      if (gapSize === 'Large') {
        state = 'GAP UP EXPECTED';
        stateEmoji = '🚀';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Strong gap up expected at ${expectedOpen} (+${gapPercent.toFixed(2)}%)`;
        action = `Wait for 9:30 AM consolidation. Enter longs only if holds above ${nifty.toFixed(0)}. Avoid chasing.`;
        keyLevel = nifty.toFixed(0);
      } else if (gapSize === 'Medium') {
        state = 'GAP UP EXPECTED';
        stateEmoji = '📈';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Moderate gap up expected at ${expectedOpen} (+${gapPercent.toFixed(2)}%)`;
        action = `Buy dips if sustains above ${nifty.toFixed(0)}. Target ${resistance?.toFixed(0)}.`;
        keyLevel = nifty.toFixed(0);
      } else {
        state = 'SMALL GAP UP';
        stateEmoji = '📈';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Small gap up expected - momentum likely to continue`;
        action = `Buy on breakout above opening range high. Trail stop loss.`;
        keyLevel = expectedOpen?.toFixed(0) || nifty.toFixed(0);
      }
      return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action, fullText: `${stateEmoji} ${state}\n${headline}\n\n${biasEmoji} ${action}` };
    }
    
    if (gapType === 'GAP_DOWN') {
      if (gapSize === 'Large') {
        state = 'GAP DOWN EXPECTED';
        stateEmoji = '⚠️';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Sharp gap down expected at ${expectedOpen} (${gapPercent.toFixed(2)}%)`;
        action = `High chance of bounce. Avoid shorts initially. Look for reversal signals.`;
        keyLevel = expectedOpen?.toFixed(0) || nifty.toFixed(0);
      } else if (gapSize === 'Medium') {
        state = 'GAP DOWN EXPECTED';
        stateEmoji = '📉';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Moderate gap down expected at ${expectedOpen} (${gapPercent.toFixed(2)}%)`;
        action = `Sell rallies if fails to reclaim ${nifty.toFixed(0)}. Target ${support?.toFixed(0)}.`;
        keyLevel = nifty.toFixed(0);
      } else {
        state = 'SMALL GAP DOWN';
        stateEmoji = '📉';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Small gap down expected - weakness may continue`;
        action = `Short on breakdown below opening range low.`;
        keyLevel = expectedOpen?.toFixed(0) || nifty.toFixed(0);
      }
      return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action, fullText: `${stateEmoji} ${state}\n${headline}\n\n${biasEmoji} ${action}` };
    }
  }
  
  // FALLBACK: Current market analysis (if no gap data or flat opening)
  const range = niftyHigh - niftyLow;
  const rangePercent = (range / niftyLow) * 100;
  const distanceFromEMA = ((nifty - niftyEMA9) / niftyEMA9) * 100;

  if (rangePercent < 0.3) {
    state = 'TIGHT RANGE';
    stateEmoji = '📊';
    headline = `Narrow ${range.toFixed(0)} point range - breakout imminent`;
    action = `Wait for breakout above ${niftyHigh.toFixed(0)} or below ${niftyLow.toFixed(0)}`;
    tradingBias = 'NEUTRAL';
    biasEmoji = '🟡';
    keyLevel = niftyLow.toFixed(0);
  }
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
      state = 'CONSOLIDATING';
      stateEmoji = '↔️';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Range-bound between ${support?.toLocaleString()} - ${resistance?.toLocaleString()}`;
      action = `Trade the range or wait for breakout. Buy near support, sell near resistance`;
      keyLevel = support?.toFixed(0);
    }
  }
  else {
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
  
  // PCR adjustment
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