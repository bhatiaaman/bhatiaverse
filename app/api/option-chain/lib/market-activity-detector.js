// ═══════════════════════════════════════════════════════════════════════
// MARKET ACTIVITY DETECTOR - OI + Price Analysis
// ═══════════════════════════════════════════════════════════════════════

/**
 * Detect market activity based on OI change and price movement
 * @param {Object} current - Current data { totalCallOI, totalPutOI, spot }
 * @param {Object} previous - Previous data { totalCallOI, totalPutOI, spot }
 * @returns {Object} - { activity, strength, description, actionable }
 */
export function detectMarketActivity(current, previous) {
  if (!previous || !current) {
    return { activity: 'Unknown', strength: 0, description: 'Insufficient data', actionable: '' };
  }

  // Calculate changes
  const callOIChange = current.totalCallOI - previous.totalCallOI;
  const putOIChange = current.totalPutOI - previous.totalPutOI;
  const totalOIChange = callOIChange + putOIChange;
  const priceChange = current.spot - previous.spot;

  const callOIChangePct = previous.totalCallOI > 0 ? (callOIChange / previous.totalCallOI) * 100 : 0;
  const putOIChangePct = previous.totalPutOI > 0 ? (putOIChange / previous.totalPutOI) * 100 : 0;
  const totalOIChangePct = (previous.totalCallOI + previous.totalPutOI) > 0 
    ? (totalOIChange / (previous.totalCallOI + previous.totalPutOI)) * 100 : 0;
  const priceChangePct = previous.spot > 0 ? (priceChange / previous.spot) * 100 : 0;

  // Thresholds
  const significantOI = Math.abs(totalOIChangePct) > 2; // 2% OI change
  const significantPrice = Math.abs(priceChangePct) > 0.3; // 0.3% price change

  // Determine activity
  let activity = 'Neutral';
  let strength = 0; // 0-10
  let description = '';
  let actionable = '';
  let emoji = '➡️';

  if (!significantOI && !significantPrice) {
    return {
      activity: 'Consolidation',
      strength: 2,
      description: 'Low OI & price movement - sideways range',
      actionable: 'Wait for breakout confirmation',
      emoji: '😴',
    };
  }

  // ── Long Buildup: Price ↑ + OI ↑ (Bullish) ──
  if (priceChange > 0 && totalOIChange > 0) {
    activity = 'Long Buildup';
    strength = Math.min(10, Math.round((priceChangePct + totalOIChangePct) * 1.5));
    emoji = '🚀';
    
    if (callOIChangePct > putOIChangePct) {
      description = `Fresh long positions - Call OI +${callOIChangePct.toFixed(1)}%, Price +${priceChangePct.toFixed(2)}%`;
      actionable = strength > 6 
        ? 'Strong bullish setup - consider longs on dips'
        : 'Moderate buying - watch for continuation';
    } else {
      description = `Put writing dominates - Put OI +${putOIChangePct.toFixed(1)}%, Price +${priceChangePct.toFixed(2)}%`;
      actionable = 'Bulls defending levels - supports formed';
    }
  }

  // ── Short Buildup: Price ↓ + OI ↑ (Bearish) ──
  else if (priceChange < 0 && totalOIChange > 0) {
    activity = 'Short Buildup';
    strength = Math.min(10, Math.round((Math.abs(priceChangePct) + totalOIChangePct) * 1.5));
    emoji = '📉';
    
    if (putOIChangePct > callOIChangePct) {
      description = `Fresh short positions - Put OI +${putOIChangePct.toFixed(1)}%, Price ${priceChangePct.toFixed(2)}%`;
      actionable = strength > 6
        ? 'Strong bearish setup - consider shorts on rallies'
        : 'Moderate selling - watch for breakdown';
    } else {
      description = `Call writing dominates - Call OI +${callOIChangePct.toFixed(1)}%, Price ${priceChangePct.toFixed(2)}%`;
      actionable = 'Bears capping rallies - resistance formed';
    }
  }

  // ── Long Unwinding: Price ↓ + OI ↓ (Bearish) ──
  else if (priceChange < 0 && totalOIChange < 0) {
    activity = 'Long Unwinding';
    strength = Math.min(10, Math.round((Math.abs(priceChangePct) + Math.abs(totalOIChangePct)) * 1.5));
    emoji = '😰';
    
    if (Math.abs(callOIChangePct) > Math.abs(putOIChangePct)) {
      description = `Long exit pressure - Call OI ${callOIChangePct.toFixed(1)}%, Price ${priceChangePct.toFixed(2)}%`;
      actionable = strength > 6
        ? 'Heavy unwinding - avoid longs, wait for stabilization'
        : 'Profit booking - supports may hold';
    } else {
      description = `Put unwinding + price fall - Put OI ${putOIChangePct.toFixed(1)}%, Price ${priceChangePct.toFixed(2)}%`;
      actionable = 'Bears losing conviction but price weak - cautious';
    }
  }

  // ── Short Covering: Price ↑ + OI ↓ (Bullish) ──
  else if (priceChange > 0 && totalOIChange < 0) {
    activity = 'Short Covering';
    strength = Math.min(10, Math.round((priceChangePct + Math.abs(totalOIChangePct)) * 1.5));
    emoji = '🎯';
    
    if (Math.abs(putOIChangePct) > Math.abs(callOIChangePct)) {
      description = `Short squeeze - Put OI ${putOIChangePct.toFixed(1)}%, Price +${priceChangePct.toFixed(2)}%`;
      actionable = strength > 6
        ? 'Strong covering rally - momentum trade, tight stops'
        : 'Bears retreating - longs have edge';
    } else {
      description = `Call unwinding + price rise - Call OI ${callOIChangePct.toFixed(1)}%, Price +${priceChangePct.toFixed(2)}%`;
      actionable = 'Profit booking in calls but price rising - mixed signals';
    }
  }

  // ── Edge cases ──
  else {
    activity = 'Mixed Signals';
    strength = 3;
    description = `Conflicting moves - OI ${totalOIChangePct > 0 ? '+' : ''}${totalOIChangePct.toFixed(1)}%, Price ${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}%`;
    actionable = 'No clear direction - wait for clarity';
    emoji = '❓';
  }

  return { activity, strength, description, actionable, emoji };
}

/**
 * Generate support/resistance actionable messages
 * @param {Object} optionChain - Full option chain data
 * @param {Number} spot - Current spot price
 * @returns {Array} - Array of actionable insights
 */
export function generateActionableInsights(optionChain, spot) {
  const insights = [];

  if (!optionChain || !optionChain.support || !optionChain.resistance) {
    return insights;
  }

  const { support, resistance, maxPain, pcr } = optionChain;

  // Distance to key levels
  const supportDist = support ? ((spot - support) / spot) * 100 : null;
  const resistanceDist = resistance ? ((resistance - spot) / spot) * 100 : null;
  const maxPainDist = maxPain ? ((spot - maxPain) / spot) * 100 : null;

  // ── Support Analysis ──
  if (supportDist !== null) {
    if (supportDist < 0.5 && supportDist > -0.2) {
      insights.push({
        type: 'support',
        level: 'critical',
        message: `Testing major support at ${support}`,
        action: 'High-probability bounce zone - long entry with SL below support',
        emoji: '🛡️',
      });
    } else if (supportDist > 0.5 && supportDist < 1.5) {
      insights.push({
        type: 'support',
        level: 'near',
        message: `Approaching support at ${support} (${supportDist.toFixed(1)}% away)`,
        action: 'Watch for reversal patterns - prepare long setup',
        emoji: '👀',
      });
    } else if (supportDist < -0.5) {
      insights.push({
        type: 'support',
        level: 'broken',
        message: `Support at ${support} broken - now resistance`,
        action: 'Trend reversal - avoid longs unless reclaimed',
        emoji: '⚠️',
      });
    }
  }

  // ── Resistance Analysis ──
  if (resistanceDist !== null) {
    if (resistanceDist < 0.5 && resistanceDist > -0.2) {
      insights.push({
        type: 'resistance',
        level: 'critical',
        message: `Testing major resistance at ${resistance}`,
        action: 'High-probability rejection zone - short entry with SL above resistance',
        emoji: '🔴',
      });
    } else if (resistanceDist < -0.5 && resistanceDist > -1.5) {
      insights.push({
        type: 'resistance',
        level: 'near',
        message: `Approaching resistance at ${resistance} (${Math.abs(resistanceDist).toFixed(1)}% away)`,
        action: 'Watch for rejection - prepare short setup',
        emoji: '🎯',
      });
    } else if (resistanceDist > 0.5) {
      insights.push({
        type: 'resistance',
        level: 'broken',
        message: `Resistance at ${resistance} broken - now support`,
        action: 'Breakout confirmed - longs favored, dips are buy opportunities',
        emoji: '🚀',
      });
    }
  }

  // ── Max Pain Analysis ──
  if (maxPainDist !== null) {
    if (Math.abs(maxPainDist) < 1.0) {
      insights.push({
        type: 'maxpain',
        level: 'near',
        message: `Price near Max Pain ${maxPain} - gravity effect`,
        action: 'Expect rangebound action - theta decay favors option sellers',
        emoji: '🧲',
      });
    } else if (maxPainDist > 2.0) {
      insights.push({
        type: 'maxpain',
        level: 'far',
        message: `Price ${maxPainDist.toFixed(1)}% above Max Pain ${maxPain}`,
        action: 'Bulls strong but mean reversion likely - book profits in longs',
        emoji: '📈',
      });
    } else if (maxPainDist < -2.0) {
      insights.push({
        type: 'maxpain',
        level: 'far',
        message: `Price ${Math.abs(maxPainDist).toFixed(1)}% below Max Pain ${maxPain}`,
        action: 'Bears strong but mean reversion likely - book profits in shorts',
        emoji: '📉',
      });
    }
  }

  // ── PCR Analysis ──
  if (pcr) {
    if (pcr > 1.3) {
      insights.push({
        type: 'pcr',
        level: 'high',
        message: `PCR ${pcr.toFixed(2)} - Heavy Put OI`,
        action: 'Oversold condition - longs favored, shorts risky',
        emoji: '🟢',
      });
    } else if (pcr < 0.7) {
      insights.push({
        type: 'pcr',
        level: 'low',
        message: `PCR ${pcr.toFixed(2)} - Heavy Call OI`,
        action: 'Overbought condition - shorts favored, longs risky',
        emoji: '🔴',
      });
    }
  }

  return insights;
}