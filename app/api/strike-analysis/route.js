import { NextResponse } from 'next/server';
import { KiteConnect } from 'kiteconnect';
import { getKiteCredentials } from '@/app/lib/kite-credentials';

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
    await fetch(`${REDIS_URL}/set/${key}/${encoded}?ex=${exSeconds}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
  } catch {}
}

// Get NFO instruments — separate cache key for full list (option-chain only caches NIFTY/BANKNIFTY)
async function getNFOInstruments(kite) {
  const cacheKey = `${NS}:nfo-instruments-full`;
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  console.log('Fetching full NFO instruments list...');
  const instruments = await kite.getInstruments('NFO');
  const options = instruments.filter(i =>
    i.instrument_type === 'CE' || i.instrument_type === 'PE'
  );
  console.log(`Cached ${options.length} NFO options`);
  await redisSet(cacheKey, options, 86400);
  return options;
}

function fmtOI(oi) {
  if (oi >= 1e7) return (oi / 1e7).toFixed(1) + 'Cr';
  if (oi >= 1e5) return (oi / 1e5).toFixed(1) + 'L';
  if (oi >= 1e3) return (oi / 1e3).toFixed(1) + 'K';
  return String(oi);
}

function generateSignals(strike, type, ceOI, peOI, strikeData, pcr, maxPain) {
  const signals = [];

  // PCR signal
  if (pcr > 1.3)      signals.push({ type: 'bullish', text: `PCR ${pcr.toFixed(2)} — bullish market bias` });
  else if (pcr < 0.7) signals.push({ type: 'bearish', text: `PCR ${pcr.toFixed(2)} — bearish market bias` });
  else                signals.push({ type: 'neutral',  text: `PCR ${pcr.toFixed(2)} — neutral market` });

  // Max pain vs strike
  const painDiff = Math.abs(strike - maxPain);
  if (painDiff <= 50) {
    signals.push({ type: 'warning', text: `Strike near max pain ₹${maxPain} — sellers favored here` });
  } else {
    signals.push({ type: 'neutral', text: `Max pain ₹${maxPain} · ${painDiff} pts ${strike > maxPain ? 'above' : 'below'}` });
  }

  // OI at this strike vs others in range
  const maxCeOI = Math.max(...strikeData.map(s => s.ceOI), 1);
  const maxPeOI = Math.max(...strikeData.map(s => s.peOI), 1);
  const ceRatio  = ceOI / maxCeOI;
  const peRatio  = peOI / maxPeOI;

  if (type === 'CE') {
    if (ceRatio > 0.8) signals.push({ type: 'bearish', text: `Highest call OI in range — strong resistance at ${strike}` });
    else if (ceRatio > 0.5) signals.push({ type: 'neutral', text: `Moderate call OI — not the dominant resistance` });
    else signals.push({ type: 'bullish', text: `Low call OI at ${strike} — less resistance here` });
  } else {
    if (peRatio > 0.8) signals.push({ type: 'bullish', text: `Highest put OI in range — strong support at ${strike}` });
    else if (peRatio > 0.5) signals.push({ type: 'neutral', text: `Moderate put OI — not the dominant support` });
    else signals.push({ type: 'bearish', text: `Low put OI at ${strike} — weak support here` });
  }

  // CE vs PE at this strike
  if (ceOI > peOI * 1.5) {
    signals.push({ type: 'bearish', text: `Call OI (${fmtOI(ceOI)}) >> Put OI (${fmtOI(peOI)}) — resistance heavy strike` });
  } else if (peOI > ceOI * 1.5) {
    signals.push({ type: 'bullish', text: `Put OI (${fmtOI(peOI)}) >> Call OI (${fmtOI(ceOI)}) — support heavy strike` });
  } else if (ceOI > 0 || peOI > 0) {
    signals.push({ type: 'neutral', text: `Balanced CE/PE OI at this strike` });
  }

  return signals;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol     = searchParams.get('symbol')?.toUpperCase();
  const strike     = parseInt(searchParams.get('strike'));
  const type       = searchParams.get('type')?.toUpperCase(); // CE or PE
  const expiryType = searchParams.get('expiryType') || 'monthly';
  const strikeGap  = parseInt(searchParams.get('strikeGap') || '50');
  const spotPrice  = parseFloat(searchParams.get('spotPrice') || '0');

  if (!symbol || !strike || !type) {
    return NextResponse.json({ error: 'symbol, strike and type required' }, { status: 400 });
  }

  const cacheKey = `${NS}:strike-analysis:${symbol}:${strike}:${type}:${expiryType}:${strikeGap}`;
  const cached = await redisGet(cacheKey);
  if (cached) return NextResponse.json({ ...cached, fromCache: true });

  try {
    const { apiKey, accessToken } = await getKiteCredentials();
    if (!apiKey || !accessToken) {
      return NextResponse.json({ error: 'Kite not authenticated' }, { status: 401 });
    }

    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Get all NFO instruments (cached 24h)
    const allInstruments = await getNFOInstruments(kite);

    // Filter for this symbol's options
    const symbolOptions = allInstruments.filter(i => i.name === symbol);

    if (symbolOptions.length === 0) {
      const availableNames = [...new Set(allInstruments.map(i => i.name))].sort();
      const similar = availableNames.filter(n => n.includes(symbol) || symbol.includes(n));
      console.log(`No options for ${symbol}. Similar:`, similar.slice(0, 10));
      return NextResponse.json({
        error: `No NFO options found for ${symbol}`,
        hint: similar.length > 0 ? `Did you mean: ${similar.slice(0,3).join(', ')}?` : 'Symbol not in NFO'
      }, { status: 404 });
    }

    // Get available expiries, pick nearest weekly or monthly
    const today = new Date(); today.setHours(0,0,0,0);
    const expiries = [...new Set(symbolOptions.map(o => o.expiry))]
      .filter(e => new Date(e) >= today)
      .sort((a, b) => new Date(a) - new Date(b));

    let selectedExpiry;
    if (expiryType === 'weekly') {
      selectedExpiry = expiries[0]; // nearest expiry
    } else {
      // Monthly = last expiry of current month, or first of next month
      const monthlyExpiries = expiries.filter(exp => {
        const date = new Date(exp);
        const next = expiries.find(e => new Date(e) > date);
        if (!next) return true;
        return new Date(next).getMonth() !== date.getMonth();
      });
      selectedExpiry = monthlyExpiries[0] || expiries[0];
    }

    if (!selectedExpiry) {
      return NextResponse.json({ error: `No valid expiry found for ${symbol}` }, { status: 404 });
    }

    // Build strike range: selected strike ± 3 steps
    const strikes = [-3,-2,-1,0,1,2,3].map(i => strike + i * strikeGap);

    // Find actual tradingsymbols for each strike from instruments list
    const relevantOptions = allInstruments.filter(i =>
      i.name === symbol &&
      i.expiry === selectedExpiry &&
      strikes.includes(i.strike) &&
      (i.instrument_type === 'CE' || i.instrument_type === 'PE')
    );

    if (relevantOptions.length === 0) {
      return NextResponse.json({ error: `No options found for ${symbol} at these strikes for expiry ${selectedExpiry}` }, { status: 404 });
    }

    // Fetch OHLC quotes using real tradingsymbols
    const quoteSymbols = relevantOptions.map(o => `NFO:${o.tradingsymbol}`);
    const quotes = await kite.getOHLC(quoteSymbols);

    // Build strike data map
    const strikeMap = {};
    for (const opt of relevantOptions) {
      const q = quotes[`NFO:${opt.tradingsymbol}`];
      if (!strikeMap[opt.strike]) strikeMap[opt.strike] = { strike: opt.strike, ceOI: 0, peOI: 0, ceLtp: 0, peLtp: 0 };
      if (opt.instrument_type === 'CE') {
        strikeMap[opt.strike].ceOI  = q?.oi || 0;
        strikeMap[opt.strike].ceLtp = q?.last_price || 0;
      } else {
        strikeMap[opt.strike].peOI  = q?.oi || 0;
        strikeMap[opt.strike].peLtp = q?.last_price || 0;
      }
    }

    const strikeData = strikes
      .map(s => strikeMap[s] || { strike: s, ceOI: 0, peOI: 0, ceLtp: 0, peLtp: 0 })
      .sort((a, b) => a.strike - b.strike);

    const selected = strikeMap[strike] || { ceOI: 0, peOI: 0, ceLtp: 0, peLtp: 0 };

    // PCR from range
    const totalCE = strikeData.reduce((a, s) => a + s.ceOI, 0);
    const totalPE = strikeData.reduce((a, s) => a + s.peOI, 0);
    const pcr = totalCE > 0 ? parseFloat((totalPE / totalCE).toFixed(2)) : 0;

    // Max pain from range
    let minPain = Infinity, maxPain = strike;
    for (const testStrike of strikes) {
      let pain = 0;
      for (const s of strikeData) {
        if (s.ceOI > 0 && testStrike < s.strike) pain += s.ceOI * (s.strike - testStrike);
        if (s.peOI > 0 && testStrike > s.strike) pain += s.peOI * (testStrike - s.strike);
      }
      if (pain < minPain) { minPain = pain; maxPain = testStrike; }
    }

    const ltp = type === 'CE' ? selected.ceLtp : selected.peLtp;
    const signals = generateSignals(strike, type, selected.ceOI, selected.peOI, strikeData, pcr, maxPain);

    const expiryDate = new Date(selectedExpiry);
    const result = {
      symbol, strike, type, expiryType,
      expiry:    expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
      ltp,
      ceOI:      selected.ceOI,
      peOI:      selected.peOI,
      pcr,
      maxPain,
      strikeData,
      signals,
      totalStrikes: relevantOptions.length,
      timestamp: new Date().toISOString(),
    };

    await redisSet(cacheKey, result, 60);
    return NextResponse.json(result);

  } catch (error) {
    console.error('strike-analysis error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}