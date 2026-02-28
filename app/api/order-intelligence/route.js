import { NextResponse } from 'next/server';
import { getSector } from './lib/sector-map.js';
import { runBehavioralAgent } from './agents/behavioral.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Normalise the many bias strings from sentiment API → BULLISH / BEARISH / NEUTRAL
function normaliseBias(bias) {
  if (!bias) return 'NEUTRAL';
  const b = bias.toLowerCase();
  if (b.includes('bullish')) return 'BULLISH';
  if (b.includes('bearish')) return 'BEARISH';
  return 'NEUTRAL';
}

// Derive bias from sector % change (value field from sector-performance)
function sectorChangeToBias(changePercent) {
  if (changePercent == null) return 'NEUTRAL';
  if (changePercent > 0.3)  return 'BULLISH';
  if (changePercent < -0.3) return 'BEARISH';
  return 'NEUTRAL';
}

// Build a base URL for internal API calls from the request
function baseUrl(req) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all data in parallel — each failure is isolated (never blocks others)
// ─────────────────────────────────────────────────────────────────────────────
async function collectData(symbol, exchange, base) {
  const [positionsRes, ordersRes, sentimentRes, sectorRes] = await Promise.allSettled([
    fetch(`${base}/api/kite-positions`),
    fetch(`${base}/api/kite-orders?limit=50`),
    fetch(`${base}/api/sentiment`),
    fetch(`${base}/api/sector-performance`),
  ]);

  // ── Positions ─────────────────────────────────────────────────────────────
  let allPositions = [];
  try {
    if (positionsRes.status === 'fulfilled' && positionsRes.value.ok) {
      const d = await positionsRes.value.json();
      allPositions = d.positions || [];
    }
  } catch {}

  const openPositions = allPositions.filter(p => p.quantity !== 0);
  const sameSymbol    = openPositions.find(
    p => p.tradingsymbol?.toUpperCase() === symbol?.toUpperCase() ||
         p.tradingsymbol?.startsWith(symbol?.toUpperCase())   // matches options like NIFTY24...
  ) ?? null;

  // ── Orders ────────────────────────────────────────────────────────────────
  let openOrders = [];
  try {
    if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
      const d = await ordersRes.value.json();
      const all = d.orders || [];
      openOrders = all.filter(o =>
        ['OPEN', 'TRIGGER PENDING', 'AMO REQ RECEIVED'].includes(o.status?.toUpperCase())
      );
    }
  } catch {}

  // ── Sentiment ─────────────────────────────────────────────────────────────
  let sentiment = { overallBias: 'NEUTRAL', intradayBias: 'NEUTRAL', overallScore: 50, intradayScore: 50 };
  try {
    if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
      const d = await sentimentRes.value.json();
      sentiment = {
        overallBias:   normaliseBias(d.timeframes?.daily?.bias),
        intradayBias:  normaliseBias(d.timeframes?.intraday?.bias),
        overallScore:  d.timeframes?.daily?.score   ?? 50,
        intradayScore: d.timeframes?.intraday?.score ?? 50,
      };
    }
  } catch {}

  // ── Sector ────────────────────────────────────────────────────────────────
  let sector = { name: null, change: null, bias: 'NEUTRAL' };
  try {
    if (sectorRes.status === 'fulfilled' && sectorRes.value.ok) {
      const d  = await sectorRes.value.json();
      const symbolSector = getSector(symbol);
      if (symbolSector && Array.isArray(d.sectors)) {
        const match = d.sectors.find(s => s.name === symbolSector);
        if (match) {
          sector = {
            name:   match.name,
            change: match.value,   // % change today
            bias:   sectorChangeToBias(match.value),
          };
        }
      }
    }
  } catch {}

  return {
    positions: {
      all:        openPositions,
      count:      openPositions.length,
      sameSymbol,
    },
    orders: {
      open:      openOrders,
      openCount: openOrders.length,
    },
    sentiment,
    sector,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/order-intelligence
// Body: { symbol, exchange, instrumentType, transactionType, spotPrice }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { symbol, exchange, instrumentType, transactionType, spotPrice } = body;

    if (!symbol || !transactionType) {
      return NextResponse.json(
        { error: 'symbol and transactionType are required' },
        { status: 400 }
      );
    }

    const base = baseUrl(req);

    // 1. Collect all data once
    const collectedData = await collectData(symbol, exchange, base);

    // 2. Build the shared data object consumed by agents
    const agentData = {
      order: { symbol, exchange, instrumentType, transactionType, spotPrice },
      ...collectedData,
    };

    // 3. Run agents
    const behavioral = runBehavioralAgent(agentData);

    // 4. Return combined result
    return NextResponse.json({
      // Raw data (useful for display panels later)
      positions:  collectedData.positions,
      orders:     collectedData.orders,
      sentiment:  collectedData.sentiment,
      sector:     collectedData.sector,
      // Agent results
      behavioral,
    });

  } catch (error) {
    console.error('Order intelligence error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
