import { getKiteCredentials } from '@/app/lib/kite-credentials';

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded tokens for indices (not in NSE instruments list as EQ type)
// ─────────────────────────────────────────────────────────────────────────────
const INDEX_TOKENS = {
  NIFTY:       256265,
  BANKNIFTY:   260105,
  FINNIFTY:    257801,
  MIDCPNIFTY:  288009,
  SENSEX:      265,
};

// Module-level cache (lives for process lifetime, reset every 24h)
let _tokenMap  = null;
let _cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────────────────────────
// Build symbol→token map from Kite NSE instruments CSV
// ─────────────────────────────────────────────────────────────────────────────
async function buildTokenMap(apiKey, accessToken) {
  const res = await fetch('https://api.kite.trade/instruments/NSE', {
    headers: {
      'Authorization':  `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });
  if (!res.ok) {
    console.error('resolve-token: instruments fetch failed', res.status);
    return {};
  }

  const csv  = await res.text();
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return {};

  const hdrs   = lines[0].split(',');
  const symIdx = hdrs.indexOf('tradingsymbol');
  const tokIdx = hdrs.indexOf('instrument_token');
  const typIdx = hdrs.indexOf('instrument_type');

  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols[typIdx]?.trim() === 'EQ') {
      const sym = cols[symIdx]?.trim().toUpperCase();
      const tok = parseInt(cols[tokIdx], 10);
      if (sym && !isNaN(tok)) map[sym] = tok;
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — returns instrument_token for symbol, or null on failure
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveToken(symbol) {
  const upper = symbol?.toUpperCase();
  if (!upper) return null;

  // Indices: return hardcoded token immediately
  if (INDEX_TOKENS[upper] != null) return INDEX_TOKENS[upper];

  const now = Date.now();

  // Rebuild cache if stale or missing
  if (!_tokenMap || now - _cacheTime > CACHE_TTL) {
    try {
      const { apiKey, accessToken } = await getKiteCredentials();
      if (!apiKey || !accessToken) { _tokenMap = {}; }
      else {
        _tokenMap  = await buildTokenMap(apiKey, accessToken);
        _cacheTime = now;
      }
    } catch (e) {
      console.error('resolve-token: cache build failed', e);
      _tokenMap = {};
    }
  }

  return _tokenMap[upper] ?? null;
}
