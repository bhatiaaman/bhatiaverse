import { NextResponse } from 'next/server';
import { nseStrikeSteps } from '@/app/lib/nseStrikeSteps';

async function getKiteCredentials() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const configRes = await fetch(`${baseUrl}/api/kite-config`);
  const configData = await configRes.json();
  return {
    apiKey:      configData.config?.apiKey      || process.env.KITE_API_KEY,
    accessToken: configData.config?.accessToken || process.env.KITE_ACCESS_TOKEN,
    tokenValid:  configData.tokenValid,
  };
}

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];

function getStrikeStep(symbol, price) {
  if (nseStrikeSteps[symbol]) return nseStrikeSteps[symbol];
  const p = Number(price) || 0;
  if (p >= 5000) return 50;
  if (p >= 1000) return 20;
  if (p >= 500)  return 10;
  if (p >= 100)  return 5;
  return 2.5;
}

function getLastThursdayOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1);
  return d;
}

function getLastTuesdayOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  while (d.getDay() !== 2) d.setDate(d.getDate() - 1);
  return d;
}

// Next Thursday from today (weekly expiry for NIFTY)
function getNextThursday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilThursday);
  return d;
}

function getNextExpiry(symbol, fromDate = new Date(), expiryType = 'monthly') {
  const upper = symbol.toUpperCase();
  const isIndex = INDICES.includes(upper);

  if (upper === 'NIFTY' && expiryType === 'weekly') {
    return getNextThursday(fromDate);
  }
  if (isIndex) {
    const expiry = getLastThursdayOfMonth(fromDate);
    if (fromDate > expiry) {
      return getLastThursdayOfMonth(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 15));
    }
    return expiry;
  }
  // Stocks — last Tuesday of month
  const expiry = getLastTuesdayOfMonth(fromDate);
  if (fromDate > expiry) {
    return getLastTuesdayOfMonth(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 15));
  }
  return expiry;
}

function buildKiteSymbol(symbol, strike, optionType, expiry) {
  const yy  = String(expiry.getFullYear()).slice(-2);
  const mmm = expiry.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${symbol}${yy}${mmm}${strike}${optionType}`;
}

function buildTvSymbol(symbol, strike, optionType, expiry) {
  const yy = String(expiry.getFullYear() % 100).padStart(2, '0');
  const mm = String(expiry.getMonth() + 1).padStart(2, '0');
  const dd = String(expiry.getDate()).padStart(2, '0');
  const t  = optionType === 'CE' ? 'C' : 'P';
  return `${symbol}${yy}${mm}${dd}${t}${strike}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol         = searchParams.get('symbol')?.toUpperCase();
    const spotPrice      = parseFloat(searchParams.get('spotPrice') || '0');
    const instrumentType = searchParams.get('instrumentType')?.toUpperCase(); // CE or PE
    const expiryType     = searchParams.get('expiryType') || 'monthly';       // weekly | monthly

    if (!symbol || !instrumentType || !spotPrice) {
      return NextResponse.json({ error: 'Missing symbol, spotPrice or instrumentType' }, { status: 400 });
    }
    if (instrumentType !== 'CE' && instrumentType !== 'PE') {
      return NextResponse.json({ error: 'instrumentType must be CE or PE' }, { status: 400 });
    }

    const { apiKey, accessToken, tokenValid } = await getKiteCredentials();
    if (!accessToken || !tokenValid) {
      return NextResponse.json({ error: 'Kite not authenticated' }, { status: 401 });
    }

    // ATM strike
    const step = getStrikeStep(symbol, spotPrice);
    const atmStrike = instrumentType === 'CE'
      ? Math.ceil(spotPrice / step) * step
      : Math.floor(spotPrice / step) * step;

    const now    = new Date();
    const expiry = getNextExpiry(symbol, now, expiryType);

    const kiteSymbol = buildKiteSymbol(symbol, atmStrike, instrumentType, expiry);
    const tvSymbol   = buildTvSymbol(symbol, atmStrike, instrumentType, expiry);

    // Fetch LTP from Kite
    const ltpRes = await fetch(
      `https://api.kite.trade/quote/ltp?i=${encodeURIComponent(`NFO:${kiteSymbol}`)}`,
      {
        headers: {
          'Authorization':  `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3',
        },
      }
    );

    let ltp = 0;
    if (ltpRes.ok) {
      const ltpData = await ltpRes.json();
      ltp = ltpData.data?.[`NFO:${kiteSymbol}`]?.last_price || 0;
    } else {
      console.error('option-details LTP fetch failed:', await ltpRes.text());
    }

    return NextResponse.json({
      optionSymbol: kiteSymbol,
      tvSymbol,
      strike:       atmStrike,
      ltp,
      expiry:       expiry.toISOString(),
      expiryDay:    expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      step,
    });

  } catch (error) {
    console.error('option-details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}