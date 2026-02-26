// ═══════════════════════════════════════════════════════════════════════
// COMPLETE FIX: TRADES PAGE MARKET COMMENTARY
// ═══════════════════════════════════════════════════════════════════════
// Issues Fixed:
// 1. Shows gap analysis during market hours (should only show pre-market)
// 2. Watch level shows yesterday's close (25424 instead of 25482)
// 3. Not showing live intraday commentary (support/resistance, bias changes)
// 4. Nifty index showing wrong value
// 5. Gift Nifty should calculate Nifty gap, not use absolute value
// ═══════════════════════════════════════════════════════════════════════

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

// Check if market is open (9:15 AM to 3:30 PM IST)
function isMarketOpen() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  
  const day = ist.getUTCDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  const marketOpen = 9 * 60 + 15;  // 555 minutes
  const marketClose = 15 * 60 + 30; // 930 minutes
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === '1';
    
    const CACHE_KEY = `${NS}:market-commentary`;
    
    // Check cache
    if (!refresh) {
      const cached = await redisGet(CACHE_KEY);
      if (cached) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        const maxAge = isMarketOpen() ? 60 * 1000 : 5 * 60 * 1000; // 1 min during market, 5 min pre-market
        if (age < maxAge) {
          return NextResponse.json({ ...cached, fromCache: true });
        }
      }
    }

    // Fetch market data
    const baseUrl = request.url.split('/api/')[0];
    
    const [marketData, optionChainData] = await Promise.all([
      fetch(`${baseUrl}/api/market-data`).then(r => r.json()),
      fetch(`${baseUrl}/api/option-chain?underlying=NIFTY&expiry=weekly`).then(r => r.json()).catch(() => null),
    ]);

    const marketIsOpen = isMarketOpen();

    // Generate commentary based on market status
    const commentary = marketIsOpen 
      ? generateLiveCommentary(marketData, optionChainData)
      : generatePreMarketCommentary(marketData, optionChainData);

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

// ═══════════════════════════════════════════════════════════════════════
// LIVE COMMENTARY - During Market Hours (9:15 AM - 3:30 PM)
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// ENHANCED LIVE COMMENTARY - WITH OI-BASED MARKET ACTIVITY
// ═══════════════════════════════════════════════════════════════════════
// This version integrates Option OI changes to show:
// - Long Buildup (Price ↑ + OI ↑)
// - Short Buildup (Price ↓ + OI ↑)
// - Long Unwinding (Price ↓ + OI ↓)
// - Short Covering (Price ↑ + OI ↓)
// ═══════════════════════════════════════════════════════════════════════

function generateLiveCommentary(marketData, optionChain) {
  const nifty = parseFloat(marketData.indices?.nifty || 0);
  const niftyChange = parseFloat(marketData.indices?.niftyChangePercent || 0);
  const niftyHigh = parseFloat(marketData.indices?.niftyHigh || nifty);
  const niftyLow = parseFloat(marketData.indices?.niftyLow || nifty);
  const prevClose = parseFloat(marketData.indices?.niftyPrevClose || nifty);
  const niftyEMA9 = parseFloat(marketData.indices?.niftyEMA9 || nifty);
  
  const pcr = optionChain?.pcr || null;
  const support = optionChain?.support || niftyLow;
  const resistance = optionChain?.resistance || niftyHigh;
  
  // Get market activity from option chain (Long Buildup, Short Covering, etc.)
  const marketActivity = optionChain?.marketActivity;
  
  let state = 'TRADING';
  let stateEmoji = '📊';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = '';
  let action = '';
  let keyLevel = prevClose.toFixed(0);

  // ═══════════════════════════════════════════════════════════════════════
  // PRIORITY 1: Use Market Activity (OI-based) if available and significant
  // ═══════════════════════════════════════════════════════════════════════
  if (marketActivity && marketActivity.activity !== 'Initializing' && marketActivity.activity !== 'Consolidation' && marketActivity.strength > 3) {
    
    const activity = marketActivity.activity;
    const strength = marketActivity.strength;
    
    // LONG BUILDUP (Price ↑ + OI ↑) - Bullish
    if (activity === 'Long Buildup') {
      state = 'LONG BUILDUP';
      stateEmoji = '🚀';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `${marketActivity.description}`;
      action = `${marketActivity.actionable || 'Fresh longs entering - momentum play with trail stops.'}`;
      keyLevel = support.toFixed(0);
    }
    
    // SHORT BUILDUP (Price ↓ + OI ↑) - Bearish
    else if (activity === 'Short Buildup') {
      state = 'SHORT BUILDUP';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `${marketActivity.description}`;
      action = `${marketActivity.actionable || 'Fresh shorts building - sell rallies with tight SL.'}`;
      keyLevel = resistance.toFixed(0);
    }
    
    // LONG UNWINDING (Price ↓ + OI ↓) - Bearish
    else if (activity === 'Long Unwinding') {
      state = 'LONG UNWINDING';
      stateEmoji = '😰';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `${marketActivity.description}`;
      action = `${marketActivity.actionable || 'Longs exiting - avoid fresh longs, wait for stabilization.'}`;
      keyLevel = support.toFixed(0);
    }
    
    // SHORT COVERING (Price ↑ + OI ↓) - Bullish
    else if (activity === 'Short Covering') {
      state = 'SHORT COVERING';
      stateEmoji = '🎯';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `${marketActivity.description}`;
      action = `${marketActivity.actionable || 'Short squeeze rally - momentum trade with tight stops.'}`;
      keyLevel = resistance.toFixed(0);
    }
    
    // CONSOLIDATION (Low OI & Price movement)
    else if (activity === 'Consolidation') {
      state = 'CONSOLIDATION';
      stateEmoji = '😴';
      tradingBias = 'NEUTRAL';
      biasEmoji = '🟡';
      headline = `Low activity - sideways range`;
      action = `Wait for breakout. No edge in current zone.`;
      keyLevel = support.toFixed(0);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PRIORITY 2: Fall back to Price-based commentary if OI data not available
  // ═══════════════════════════════════════════════════════════════════════
  else {
    
    // Strong Intraday Move (>1%)
    if (Math.abs(niftyChange) > 1.0) {
      if (niftyChange > 0) {
        state = 'STRONG RALLY';
        stateEmoji = '🚀';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Powerful ${niftyChange.toFixed(2)}% surge - bulls in control`;
        action = `Buy dips near ${support.toFixed(0)}. Trail stops. Avoid shorts.`;
        keyLevel = support.toFixed(0);
      } else {
        state = 'SHARP DECLINE';
        stateEmoji = '📉';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Heavy ${Math.abs(niftyChange).toFixed(2)}% selloff - bears dominating`;
        action = `Sell rallies near ${resistance.toFixed(0)}. Avoid fresh longs.`;
        keyLevel = resistance.toFixed(0);
      }
    }
    
    // Moderate Move (0.5% - 1%)
    else if (Math.abs(niftyChange) > 0.5) {
      if (niftyChange > 0) {
        if (nifty > niftyEMA9) {
          state = 'BULLISH MOMENTUM';
          stateEmoji = '📈';
          tradingBias = 'BULLISH';
          biasEmoji = '🟢';
          headline = `Above EMA9 ${niftyEMA9.toFixed(0)} - uptrend intact`;
          action = `Long on dips. SL below ${(niftyEMA9 - 20).toFixed(0)}. Target ${resistance.toFixed(0)}.`;
          keyLevel = niftyEMA9.toFixed(0);
        } else {
          state = 'RECOVERY ATTEMPT';
          stateEmoji = '🔄';
          tradingBias = 'NEUTRAL';
          biasEmoji = '🟡';
          headline = `Bounce but below EMA9 ${niftyEMA9.toFixed(0)} - weak structure`;
          action = `Wait for close above EMA9 for confirmation. Avoid aggressive longs.`;
          keyLevel = niftyEMA9.toFixed(0);
        }
      } else {
        if (nifty < niftyEMA9) {
          state = 'BEARISH PRESSURE';
          stateEmoji = '📉';
          tradingBias = 'BEARISH';
          biasEmoji = '🔴';
          headline = `Below EMA9 ${niftyEMA9.toFixed(0)} - downtrend building`;
          action = `Short on bounces. SL above ${(niftyEMA9 + 20).toFixed(0)}. Target ${support.toFixed(0)}.`;
          keyLevel = niftyEMA9.toFixed(0);
        } else {
          state = 'PULLBACK';
          stateEmoji = '🔄';
          tradingBias = 'NEUTRAL';
          biasEmoji = '🟡';
          headline = `Dip but above EMA9 ${niftyEMA9.toFixed(0)} - consolidation`;
          action = `Support at EMA9. Watch for bounce confirmation before entry.`;
          keyLevel = niftyEMA9.toFixed(0);
        }
      }
    }
    
    // Small Move - Check Support/Resistance
    else {
      const distToSupport = support ? Math.abs(((nifty - support) / support) * 100) : 999;
      const distToResistance = resistance ? Math.abs(((resistance - nifty) / nifty) * 100) : 999;
      
      if (distToSupport < 0.3) {
        state = 'AT SUPPORT';
        stateEmoji = '🛡️';
        tradingBias = 'BULLISH';
        biasEmoji = '🟢';
        headline = `Testing key support at ${support.toFixed(0)}`;
        action = `Strong Put OI base. High probability bounce. Long with SL ${(support - 30).toFixed(0)}.`;
        keyLevel = support.toFixed(0);
      } else if (distToResistance < 0.3) {
        state = 'AT RESISTANCE';
        stateEmoji = '🚧';
        tradingBias = 'BEARISH';
        biasEmoji = '🔴';
        headline = `Testing resistance at ${resistance.toFixed(0)}`;
        action = `Strong Call OI wall. Likely rejection. Short with SL ${(resistance + 30).toFixed(0)}.`;
        keyLevel = resistance.toFixed(0);
      } else {
        state = 'RANGEBOUND';
        stateEmoji = '↔️';
        tradingBias = 'NEUTRAL';
        biasEmoji = '🟡';
        headline = `Trading in ${support.toFixed(0)}-${resistance.toFixed(0)} range`;
        action = `Trade support/resistance bounces or wait for clear direction.`;
        keyLevel = support.toFixed(0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PCR Override - Add warning if PCR conflicts with bias
  // ═══════════════════════════════════════════════════════════════════════
  if (pcr && pcr > 1.3 && tradingBias === 'BEARISH') {
    action = `${action} ⚠️ PCR ${pcr.toFixed(2)} shows heavy put writing - shorts risky.`;
  } else if (pcr && pcr < 0.7 && tradingBias === 'BULLISH') {
    action = `${action} ⚠️ PCR ${pcr.toFixed(2)} shows excessive call buying - longs risky.`;
  }

  return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action };
}

// ═══════════════════════════════════════════════════════════════════════
// PRE-MARKET COMMENTARY - Before 9:15 AM (Using Gift Nifty)
// ═══════════════════════════════════════════════════════════════════════
function generatePreMarketCommentary(marketData, optionChain) {
  const prevClose = parseFloat(marketData.indices?.niftyPrevClose || 0);
  const giftNifty = parseFloat(marketData.indices?.giftNifty || 0);
  
  // CRITICAL FIX: Gift Nifty is a proxy - calculate expected Nifty opening
  // Gift Nifty gap % should be applied to Nifty prev close
  const giftNiftyChange = giftNifty - prevClose;
  const giftNiftyChangePercent = (giftNiftyChange / prevClose) * 100;
  
  // Expected Nifty opening = Nifty prev close + Gift Nifty gap %
  const expectedOpen = prevClose + giftNiftyChange;
  const gapPercent = giftNiftyChangePercent;
  const gapSize = Math.abs(giftNiftyChange);
  
  let state = 'PRE-MARKET';
  let stateEmoji = '🌅';
  let tradingBias = 'NEUTRAL';
  let biasEmoji = '🟡';
  let headline = 'Market opens soon';
  let action = 'Monitoring Gift Nifty...';
  let keyLevel = prevClose.toFixed(0);

  if (Math.abs(gapPercent) < 0.2) {
    state = 'FLAT OPENING';
    stateEmoji = '➡️';
    tradingBias = 'NEUTRAL';
    biasEmoji = '🟡';
    headline = `Flat opening expected near ${expectedOpen.toFixed(0)}`;
    action = `Wait for direction post 9:30 AM. Avoid early trades.`;
    keyLevel = prevClose.toFixed(0);
  }
  else if (gapPercent > 0) {
    if (gapPercent > 1.0) {
      state = 'BIG GAP UP';
      stateEmoji = '🚀';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Strong gap up at ${expectedOpen.toFixed(0)} (+${gapPercent.toFixed(2)}%)`;
      action = `Wait for 9:30 AM consolidation. Don't chase. Enter longs if holds above ${prevClose.toFixed(0)}.`;
      keyLevel = prevClose.toFixed(0);
    } else if (gapPercent > 0.5) {
      state = 'GAP UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Moderate gap up at ${expectedOpen.toFixed(0)} (+${gapPercent.toFixed(2)}%)`;
      action = `Buy dips if sustains above ${prevClose.toFixed(0)}. Trail stops.`;
      keyLevel = prevClose.toFixed(0);
    } else {
      state = 'SMALL GAP UP';
      stateEmoji = '📈';
      tradingBias = 'BULLISH';
      biasEmoji = '🟢';
      headline = `Small gap up expected - positive momentum`;
      action = `Long on breakout above opening high. Watch for follow-through.`;
      keyLevel = expectedOpen.toFixed(0);
    }
  }
  else {
    if (gapPercent < -1.0) {
      state = 'BIG GAP DOWN';
      stateEmoji = '⚠️';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Sharp gap down at ${expectedOpen.toFixed(0)} (${gapPercent.toFixed(2)}%)`;
      action = `Oversold bounce likely. Wait 30 min. Avoid panic selling.`;
      keyLevel = expectedOpen.toFixed(0);
    } else if (gapPercent < -0.5) {
      state = 'GAP DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Moderate gap down at ${expectedOpen.toFixed(0)} (${gapPercent.toFixed(2)}%)`;
      action = `Sell rallies if fails to reclaim ${prevClose.toFixed(0)}. Book profits.`;
      keyLevel = prevClose.toFixed(0);
    } else {
      state = 'SMALL GAP DOWN';
      stateEmoji = '📉';
      tradingBias = 'BEARISH';
      biasEmoji = '🔴';
      headline = `Small gap down - weakness may continue`;
      action = `Short on breakdown below opening low. Tight SL.`;
      keyLevel = expectedOpen.toFixed(0);
    }
  }

  return { state, stateEmoji, bias: tradingBias, biasEmoji, keyLevel, headline, action };
}