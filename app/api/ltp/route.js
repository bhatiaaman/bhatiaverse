import { NextResponse } from 'next/server';
import { getKiteCredentials } from '@/app/lib/kite-credentials';

const INDEX_INSTRUMENTS = {
  'NIFTY':      'NSE:NIFTY 50',
  'BANKNIFTY':  'NSE:NIFTY BANK',
  'FINNIFTY':   'NSE:NIFTY FIN SERVICE',
  'MIDCPNIFTY': 'NSE:NIFTY MID SELECT',
  'SENSEX':     'BSE:SENSEX',
  'BANKEX':     'BSE:BANKEX',
};

// Hardcoded fallback lot sizes
const FALLBACK_LOT_SIZES = {
  NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 40, MIDCPNIFTY: 120,
  SENSEX: 10, BANKEX: 15, RELIANCE: 250, TCS: 150, INFY: 300,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 1500, HDFC: 300,
  BHARTIARTL: 500, COFORGE: 375, LT: 175, HAVELLS: 500,
};

// Cache lot sizes for 24 hours
let lotSizeCache = null;
let lotSizeCacheTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function getLotSizeMap(apiKey, accessToken) {
  const now = Date.now();
  if (lotSizeCache && lotSizeCacheTime && (now - lotSizeCacheTime) < CACHE_DURATION) {
    return lotSizeCache;
  }

  try {
    const nfoRes = await fetch('https://api.kite.trade/instruments/NFO', {
      headers: { 'Authorization': `token ${apiKey}:${accessToken}` },
    });
    if (!nfoRes.ok) return FALLBACK_LOT_SIZES;

    const nfoCsv  = await nfoRes.text();
    const lines   = nfoCsv.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const nameIdx = headers.indexOf('name');
    const typeIdx = headers.indexOf('instrument_type');
    const lotIdx  = headers.indexOf('lot_size');

    const nfoMap = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols[typeIdx] === 'FUT') {
        const name = cols[nameIdx]?.trim();
        const lot  = parseInt(cols[lotIdx]) || 0;
        // Only store first occurrence (nearest expiry = current lot size)
        if (name && lot > 0 && !nfoMap[name]) {
          nfoMap[name] = lot;
        }
      }
    }
    // NFO data wins over hardcoded fallback
    const map = { ...FALLBACK_LOT_SIZES, ...nfoMap };

    lotSizeCache     = map;
    lotSizeCacheTime = now;
    return map;
  } catch (err) {
    console.error('getLotSizeMap error:', err);
    return FALLBACK_LOT_SIZES;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    }

    const clean = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    const upper = clean.toUpperCase();

    const { apiKey, accessToken } = await getKiteCredentials();
    if (!apiKey || !accessToken) {
      return NextResponse.json({ success: false, error: 'Kite not authenticated' }, { status: 401 });
    }

    const instrument = INDEX_INSTRUMENTS[upper] || `NSE:${upper}`;

    // Fetch LTP and lot size map in parallel
    const [kiteRes, lotSizeMap] = await Promise.all([
      fetch(`https://api.kite.trade/quote/ltp?i=${encodeURIComponent(instrument)}`, {
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3',
        },
      }),
      getLotSizeMap(apiKey, accessToken),
    ]);

    if (!kiteRes.ok) {
      const err = await kiteRes.text();
      console.error('Kite LTP error:', err);
      return NextResponse.json({ success: false, error: 'Kite API error' }, { status: 502 });
    }

    const kiteData = await kiteRes.json();
    const ltp = kiteData.data?.[instrument]?.last_price || null;

    if (!ltp) {
      return NextResponse.json({ success: false, error: 'Symbol not found or no price' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ltp,
      lotSize: lotSizeMap[upper] || 1,
      symbol: upper,
    });

  } catch (error) {
    console.error('LTP route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}