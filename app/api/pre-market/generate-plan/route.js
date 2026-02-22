// app/api/pre-market/generate-plan/route.js
// Template-based plan generator (no AI required)

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { 
      gapData, 
      keyLevels, 
      globalMarkets, 
      calendar,
      optionsData,
      symbol = 'NIFTY'
    } = await request.json();

    // Generate template-based plan
    const plan = generateTemplatePlan(gapData, keyLevels, globalMarkets, calendar, optionsData, symbol);

    return NextResponse.json({
      success: true,
      plan,
      method: 'template-based',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      fallbackPlan: getFallbackPlan(),
    }, { status: 500 });
  }
}

function generateTemplatePlan(gapData, keyLevels, globalMarkets, calendar, optionsData, symbol) {
  const date = new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  let plan = `TRADING PLAN - ${symbol} (${date})\n`;
  plan += `${'='.repeat(50)}\n\n`;

  // Section 1: Market Overview
  plan += `📊 MARKET OVERVIEW\n`;
  plan += `${'-'.repeat(50)}\n`;

  if (globalMarkets?.markets) {
    const usMarkets = globalMarkets.markets.filter(m => m.region === 'US').slice(0, 2);
    const globalBias = usMarkets.every(m => m.changePercent > 0) ? 'Positive' : 
                       usMarkets.every(m => m.changePercent < 0) ? 'Negative' : 'Mixed';
    plan += `Global Cues: ${globalBias}\n`;
    usMarkets.forEach(m => {
      plan += `  • ${m.name}: ${m.changePercent > 0 ? '+' : ''}${m.changePercent?.toFixed(2)}%\n`;
    });
  }

  if (gapData?.success) {
    plan += `\nExpected Opening: ${gapData.gap.type.replace('_', ' ')}\n`;
    plan += `  • Gap Size: ${gapData.gap.size} (${gapData.gap.points > 0 ? '+' : ''}${gapData.gap.points} pts / ${gapData.gap.percent > 0 ? '+' : ''}${gapData.gap.percent}%)\n`;
    plan += `  • Previous Close: ${gapData.previousClose}\n`;
    plan += `  • Expected Open: ${gapData.expectedOpen}\n`;
  }

  plan += `\n`;

  // Section 2: Key Levels
  plan += `🎯 KEY LEVELS\n`;
  plan += `${'-'.repeat(50)}\n`;

  if (keyLevels?.standard) {
    plan += `Resistance Levels:\n`;
    plan += `  • R3: ${keyLevels.standard.r3} (Strong)\n`;
    plan += `  • R2: ${keyLevels.standard.r2}\n`;
    plan += `  • R1: ${keyLevels.standard.r1} (Immediate)\n`;
    plan += `\n`;
    plan += `Pivot: ${keyLevels.standard.pivot}\n`;
    plan += `\n`;
    plan += `Support Levels:\n`;
    plan += `  • S1: ${keyLevels.standard.s1} (Immediate)\n`;
    plan += `  • S2: ${keyLevels.standard.s2}\n`;
    plan += `  • S3: ${keyLevels.standard.s3} (Strong)\n`;
  }

  plan += `\n`;

  // Section 3: Trading Strategy
  plan += `📈 TRADING STRATEGY\n`;
  plan += `${'-'.repeat(50)}\n`;

  if (gapData?.gap) {
    if (gapData.gap.type === 'GAP_UP') {
      if (gapData.gap.size === 'Large') {
        plan += `Gap Up Strategy (Large):\n`;
        plan += `  • Wait for profit booking (9:15-9:30 AM)\n`;
        plan += `  • Enter longs ONLY if holds above ${gapData.previousClose}\n`;
        plan += `  • Avoid chasing - let price come to you\n`;
        plan += `\n`;
        plan += `Entry Levels:\n`;
        plan += `  • Long: ${(gapData.expectedOpen - gapData.gap.points * 0.3).toFixed(0)} (after pullback)\n`;
        plan += `  • Target 1: ${keyLevels?.standard?.r1 || (gapData.expectedOpen + 50).toFixed(0)} (book 50%)\n`;
        plan += `  • Target 2: ${keyLevels?.standard?.r2 || (gapData.expectedOpen + 100).toFixed(0)} (trail remaining)\n`;
        plan += `  • Stop Loss: ${(gapData.previousClose - 20).toFixed(0)} (below previous close)\n`;
      } else if (gapData.gap.size === 'Medium') {
        plan += `Gap Up Strategy (Medium):\n`;
        plan += `  • Observe first 15 minutes for confirmation\n`;
        plan += `  • Buy dips if sustains above ${gapData.previousClose}\n`;
        plan += `\n`;
        plan += `Entry Levels:\n`;
        plan += `  • Long: ${(gapData.expectedOpen - 15).toFixed(0)} (on minor dip)\n`;
        plan += `  • Target 1: ${keyLevels?.standard?.r1 || (gapData.expectedOpen + 50).toFixed(0)}\n`;
        plan += `  • Target 2: ${keyLevels?.standard?.r2 || (gapData.expectedOpen + 80).toFixed(0)}\n`;
        plan += `  • Stop Loss: ${(gapData.previousClose - 15).toFixed(0)}\n`;
      } else {
        plan += `Gap Up Strategy (Small):\n`;
        plan += `  • Momentum trade - follow trend\n`;
        plan += `  • Buy on breakout above opening range high\n`;
        plan += `\n`;
        plan += `Entry Levels:\n`;
        plan += `  • Long: Opening high + 10 points\n`;
        plan += `  • Target: ${keyLevels?.standard?.r1 || (gapData.expectedOpen + 50).toFixed(0)}\n`;
        plan += `  • Stop Loss: Opening low\n`;
      }
    } else if (gapData.gap.type === 'GAP_DOWN') {
      if (gapData.gap.size === 'Large') {
        plan += `Gap Down Strategy (Large):\n`;
        plan += `  • High probability of bounce - AVOID SHORTS initially\n`;
        plan += `  • Look for reversal signals\n`;
        plan += `  • Consider longs if reclaims ${gapData.previousClose}\n`;
        plan += `\n`;
        plan += `Entry Levels:\n`;
        plan += `  • Long: ${(gapData.expectedOpen + gapData.gap.points * 0.5).toFixed(0)} (on bounce)\n`;
        plan += `  • Target: ${gapData.previousClose.toFixed(0)} (gap fill)\n`;
        plan += `  • Stop Loss: ${(gapData.expectedOpen - 20).toFixed(0)}\n`;
      } else {
        plan += `Gap Down Strategy:\n`;
        plan += `  • Weakness likely to continue\n`;
        plan += `  • Sell rallies if fails to reclaim ${gapData.previousClose}\n`;
        plan += `\n`;
        plan += `Entry Levels:\n`;
        plan += `  • Short: ${(gapData.expectedOpen + 20).toFixed(0)} (on bounce)\n`;
        plan += `  • Target: ${keyLevels?.standard?.s1 || (gapData.expectedOpen - 50).toFixed(0)}\n`;
        plan += `  • Stop Loss: ${gapData.previousClose.toFixed(0)}\n`;
      }
    } else {
      plan += `Flat Opening Strategy:\n`;
      plan += `  • Range-bound session expected\n`;
      plan += `  • Trade within yesterday's range OR wait for breakout\n`;
      plan += `\n`;
      plan += `Entry Levels:\n`;
      plan += `  • Long: Near ${keyLevels?.standard?.s1 || 'support'}\n`;
      plan += `  • Short: Near ${keyLevels?.standard?.r1 || 'resistance'}\n`;
      plan += `  • Breakout: Above/below opening range\n`;
    }
  }

  plan += `\n`;

  // Section 4: Risk Management
  plan += `⚠️ RISK MANAGEMENT\n`;
  plan += `${'-'.repeat(50)}\n`;
  plan += `  • Max risk per trade: 2% of capital\n`;
  plan += `  • Position size: Based on stop loss distance\n`;
  plan += `  • Move SL to breakeven after Target 1\n`;
  plan += `  • Book partial profits at T1 (50%)\n`;
  plan += `  • Trail remaining position with 30-40 point SL\n`;
  plan += `  • NO AVERAGING in losing positions\n`;
  plan += `  • Exit all positions 15 mins before close (3:15 PM)\n`;
  plan += `\n`;

  // Section 5: Important Notes
  plan += `📌 IMPORTANT NOTES\n`;
  plan += `${'-'.repeat(50)}\n`;
  plan += `  • AVOID trading first 15 minutes (9:15-9:30 AM)\n`;
  plan += `  • Let opening range form before entering\n`;
  plan += `  • DO NOT counter-trend trade before 10:00 AM\n`;

  if (optionsData?.pcr) {
    plan += `  • Options PCR: ${optionsData.pcr.toFixed(2)} (${optionsData.pcr > 1.2 ? 'Bullish' : optionsData.pcr < 0.8 ? 'Bearish' : 'Neutral'})\n`;
  }

  if (calendar?.events) {
    const highImpact = calendar.events.filter(e => e.impact === 'HIGH' && e.status !== 'COMPLETED');
    if (highImpact.length > 0) {
      plan += `\n`;
      plan += `📅 HIGH IMPACT EVENTS TODAY:\n`;
      highImpact.forEach(e => {
        plan += `  • ${e.time}: ${e.event} (${e.country})\n`;
      });
      plan += `  → Expect volatility around these times\n`;
    }
  }

  plan += `\n`;
  plan += `${'='.repeat(50)}\n`;
  plan += `⚡ Remember: Plan your trade, Trade your plan!\n`;

  return plan;
}

function getFallbackPlan() {
  const date = new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  return `TRADING PLAN (${date})

📊 MARKET BIAS: Wait for confirmation

🎯 STRATEGY:
1. Observe first 15 minutes (9:15-9:30 AM)
2. Note opening range high/low
3. Trade breakout direction

📈 IF BREAKOUT UP:
• Entry: Opening high + 20 points
• Target: 0.5-1% move
• Stop: Opening low

📉 IF BREAKDOWN:
• Entry: Opening low - 20 points
• Target: 0.5-1% move  
• Stop: Opening high

⚠️ RISK MANAGEMENT:
• Max 2% risk per trade
• Exit at 3:15 PM
• No counter-trend trades before 10 AM

📌 REMEMBER:
Plan your trade, Trade your plan!`;
}