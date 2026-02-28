import { getSector } from '../lib/sector-map.js';

// ─────────────────────────────────────────────────────────────────────────────
// Direction helper
// BUY CE = Bullish, SELL CE = Bearish
// BUY PE = Bearish, SELL PE = Bullish
// BUY EQ = Bullish, SELL EQ = Bearish
// ─────────────────────────────────────────────────────────────────────────────
function getTradeBias(instrumentType, transactionType) {
  if (instrumentType === 'CE') return transactionType === 'BUY' ? 'BULLISH' : 'BEARISH';
  if (instrumentType === 'PE') return transactionType === 'BUY' ? 'BEARISH' : 'BULLISH';
  return transactionType === 'BUY' ? 'BULLISH' : 'BEARISH'; // EQ / FUT
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOR 1: Adding to a losing position
// Fires when user already holds the same symbol in the same direction at a loss.
// ─────────────────────────────────────────────────────────────────────────────
function checkAddingToLoser(data) {
  const { sameSymbol } = data.positions;
  if (!sameSymbol) return null;

  const addingLong  = sameSymbol.quantity > 0 && data.order.transactionType === 'BUY';
  const addingShort = sameSymbol.quantity < 0 && data.order.transactionType === 'SELL';
  if (!addingLong && !addingShort) return null;

  const threshold = data.order.exchange === 'NFO' ? -500 : -200;
  if (sameSymbol.pnl >= threshold) return null;

  const loss = Math.abs(sameSymbol.pnl).toFixed(0);
  return {
    type: 'ADDING_TO_LOSER',
    severity: 'warning',
    title: 'Adding to a losing position',
    detail: `${sameSymbol.tradingsymbol} is currently down ₹${loss}. Averaging in increases your risk.`,
    riskScore: 25,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOR 2: Going against the trend (overall market + sector)
// Fires when trade direction conflicts with overall market and/or sector bias.
// ─────────────────────────────────────────────────────────────────────────────
function checkAgainstTrend(data) {
  const { overallBias, intradayBias } = data.sentiment ?? {};
  const { bias: sectorBias, name: sectorName } = data.sector ?? {};
  const { transactionType, instrumentType, symbol } = data.order;

  const tradeBias = getTradeBias(instrumentType, transactionType);

  // Use intraday bias if available, fallback to overall
  const marketBias = intradayBias || overallBias;

  const conflicts = [];

  if (marketBias && marketBias !== 'NEUTRAL' && marketBias !== tradeBias) {
    conflicts.push({ label: 'Market', bias: marketBias });
  }

  // Only check sector if the symbol has a known sector mapping
  const symbolSector = getSector(symbol);
  if (symbolSector && sectorBias && sectorBias !== 'NEUTRAL' && sectorBias !== tradeBias) {
    conflicts.push({ label: sectorName || symbolSector, bias: sectorBias });
  }

  if (conflicts.length === 0) return null;

  const bothConflict = conflicts.length === 2;
  const conflictText = conflicts
    .map(c => `${c.label} is ${c.bias.toLowerCase()}`)
    .join(' and ');

  return {
    type: 'AGAINST_TREND',
    severity: bothConflict ? 'warning' : 'caution',
    title: 'Going against the trend',
    detail: `Counter-trend trade: ${conflictText}.`,
    riskScore: bothConflict ? 20 : 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOR 3: Too many open positions
// Fires when 4+ positions are open before placing another order.
// ─────────────────────────────────────────────────────────────────────────────
function checkPositionCount(data) {
  const count = data.positions?.count ?? 0;
  if (count < 4) return null;

  return {
    type: 'HIGH_POSITION_COUNT',
    severity: count >= 6 ? 'warning' : 'caution',
    title: 'High number of open positions',
    detail: `You already have ${count} open positions. Adding more increases overall portfolio risk.`,
    riskScore: count >= 6 ? 15 : 8,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry — add new behavior checks here, nothing else needs to change
// ─────────────────────────────────────────────────────────────────────────────
const BEHAVIORS = [
  checkAddingToLoser,
  checkAgainstTrend,
  checkPositionCount,
];

// ─────────────────────────────────────────────────────────────────────────────
// Verdict from cumulative risk score
// ─────────────────────────────────────────────────────────────────────────────
function scoreToVerdict(score) {
  if (score === 0)  return 'clear';
  if (score < 20)   return 'caution';
  if (score < 45)   return 'warning';
  return 'danger';
}

// Labels shown when a check passes (keyed by function name)
const PASS_LABELS = {
  checkAddingToLoser: 'No loser averaging',
  checkAgainstTrend:  'Trade aligned with trend',
  checkPositionCount: 'Position count OK',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export — run all registered behaviors against the shared data object
// ─────────────────────────────────────────────────────────────────────────────
export function runBehavioralAgent(data) {
  const checks = BEHAVIORS.map(check => {
    try {
      const result = check(data);
      if (result) return { ...result, passed: false };
      return { type: check.name, passed: true, title: PASS_LABELS[check.name] ?? check.name };
    } catch (e) {
      console.error(`Behavior check error:`, e);
      return { type: check.name, passed: true, title: PASS_LABELS[check.name] ?? check.name };
    }
  });

  const triggered = checks.filter(c => !c.passed);
  const riskScore = triggered.reduce((sum, b) => sum + (b.riskScore ?? 0), 0);
  const verdict   = scoreToVerdict(riskScore);

  return { behaviors: triggered, checks, verdict, riskScore };
}
