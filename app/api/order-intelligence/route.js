import { NextResponse } from 'next/server';
import { getSector } from './lib/sector-map.js';
import { runBehavioralAgent } from './agents/behavioral.js';
import { runStructureAgent } from './agents/structure.js';
import { resolveToken } from './lib/resolve-token.js';
import { getKiteCredentials } from '@/app/lib/kite-credentials';

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
  const [positionsRes, ordersRes, sentimentRes, sectorRes, marketDataRes] = await Promise.allSettled([
    fetch(`${base}/api/kite-positions`),
    fetch(`${base}/api/kite-orders?limit=50`),
    fetch(`${base}/api/sentiment`),
    fetch(`${base}/api/sector-performance`),
    fetch(`${base}/api/market-data`),
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

  // ── VIX ───────────────────────────────────────────────────────────────────
  let vix = null;
  try {
    if (marketDataRes.status === 'fulfilled' && marketDataRes.value.ok) {
      const d = await marketDataRes.value.json();
      const raw = d.indices?.vix;
      if (raw != null) vix = parseFloat(raw);
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
    vix,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Kite historical candles
// interval: '15minute' | 'day' | 'week'
// days: how many calendar days back to fetch
// ─────────────────────────────────────────────────────────────────────────────
async function fetchKiteCandles(token, interval, days, apiKey, accessToken) {
  try {
    const toDate   = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const pad2 = n => String(n).padStart(2, '0');
    const fmt  = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 00:00:00`;

    const url = `https://api.kite.trade/instruments/historical/${token}/${interval}?from=${encodeURIComponent(fmt(fromDate))}&to=${encodeURIComponent(fmt(toDate))}`;
    const res = await fetch(url, {
      headers: {
        'Authorization':  `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': '3',
      },
    });
    if (!res.ok) return null;

    const d = await res.json();
    const raw = d.data?.candles;
    if (!Array.isArray(raw)) return null;

    // Kite format: [timestamp_str, open, high, low, close, volume]
    return raw.map(c => ({
      time:   new Date(c[0]).getTime() / 1000,
      open:   c[1], high: c[2], low: c[3], close: c[4], volume: c[5],
    }));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect structure data — token first (sequential), then candles in parallel
// ─────────────────────────────────────────────────────────────────────────────
async function collectStructureData(symbol, exchange, productType, base) {
  const token = await resolveToken(symbol);
  if (!token) {
    console.warn(`structure: no token for ${symbol}`);
    return null;
  }

  const { apiKey, accessToken } = await getKiteCredentials();
  if (!apiKey || !accessToken) return null;

  const isSwing = ['NRML', 'CNC'].includes(productType?.toUpperCase());

  const fetches = [
    fetchKiteCandles(token, '15minute', 7,   apiKey, accessToken),  // ~130 candles
    fetchKiteCandles(token, 'day',      90,  apiKey, accessToken),  // ~60 candles
    fetchKiteCandles(256265, 'day',     90,  apiKey, accessToken),  // NIFTY daily
    fetch(`${base}/api/market-breadth`).then(r => r.ok ? r.json() : null).catch(() => null),
  ];

  if (isSwing) {
    fetches.push(fetchKiteCandles(token, 'week', 400, apiKey, accessToken)); // ~52 candles
  }

  const [candles15m, candlesDaily, niftyDaily, breadthJson, candlesWeekly] =
    await Promise.all(fetches);

  // Parse breadth
  let breadth = null;
  try {
    if (breadthJson) {
      const adv = breadthJson.advances ?? breadthJson.data?.advances;
      const dec = breadthJson.declines ?? breadthJson.data?.declines;
      if (adv != null && dec != null) breadth = { advances: adv, declines: dec };
    }
  } catch {}

  return {
    candles15m:    candles15m    ?? [],
    candlesDaily:  candlesDaily  ?? [],
    niftyDaily:    niftyDaily    ?? [],
    candlesWeekly: candlesWeekly ?? [],
    breadth,
    cDay: candlesDaily ?? [],  // alias used by checkRelativeStrength
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/order-intelligence
// Body: { symbol, exchange, instrumentType, transactionType, spotPrice,
//         productType?, includeStructure? }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      symbol, exchange, instrumentType, transactionType, spotPrice,
      productType, includeStructure,
    } = body;

    if (!symbol || !transactionType) {
      return NextResponse.json(
        { error: 'symbol and transactionType are required' },
        { status: 400 }
      );
    }

    const base = baseUrl(req);

    // 1. Collect behavioural data
    const collectedData = await collectData(symbol, exchange, base);

    // 2. Build the shared data object consumed by agents
    const agentData = {
      order: { symbol, exchange, instrumentType, transactionType, spotPrice, productType },
      ...collectedData,
    };

    // 3. Run behavioral agent (always)
    const behavioral = runBehavioralAgent(agentData);

    // 4. Optionally run structure agent
    let structure = null;
    if (includeStructure) {
      const structureData = await collectStructureData(symbol, exchange, productType, base);
      if (structureData) {
        structure = runStructureAgent({ order: agentData.order, structureData });
      } else {
        // Token not found or Kite not authenticated — return empty result
        structure = { behaviors: [], checks: [], verdict: 'clear', riskScore: 0, unavailable: true };
      }
    }

    // 5. Return combined result
    return NextResponse.json({
      positions:  collectedData.positions,
      orders:     collectedData.orders,
      sentiment:  collectedData.sentiment,
      sector:     collectedData.sector,
      vix:        collectedData.vix,
      behavioral,
      structure,
    });

  } catch (error) {
    console.error('Order intelligence error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
