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

function getStrikeStep(symbol, price) {
  if (nseStrikeSteps[symbol]) return nseStrikeSteps[symbol];
  const p = Number(price) || 0;
  if (p >= 5000) return 50;
  if (p >= 1000) return 20;
  if (p >= 500)  return 10;
  if (p >= 100)  return 5;
  return 2.5;
}

// Last Tuesday of current month
function getLastTuesdayOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  while (d.getDay() !== 2) d.setDate(d.getDate() - 1);
  return d;
}

// Nearest upcoming Tuesday (this week or next) for NIFTY weekly
function getNearestTuesday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 2) return d; // today is Tuesday
  if (day < 2) {
    d.setDate(d.getDate() + (2 - day)); // Mon/Sun → this week's Tuesday
  } else {
    d.setDate(d.getDate() + (7 - day + 2)); // Wed-Sat → next week's Tuesday
  }
  return d;
}

function getExpiry(symbol, fromDate = new Date(), expiryType = 'monthly') {
  if (symbol === 'NIFTY' && expiryType === 'weekly') {
    return getNearestTuesday(fromDate);
  }
  const expiry = getLastTuesdayOfMonth(fromDate);
  if (fromDate > expiry) {
    return getLastTuesdayOfMonth(
      new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 15)
    );
  }
  return expiry;
}

// Monthly Kite format: NIFTY25FEB24500CE
function buildKiteMonthlySymbol(symbol, strike, optionType, expiry) {
  const yy  = String(expiry.getFullYear()).slice(-2);
  const mmm = expiry.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${symbol}${yy}${mmm}${strike}${optionType}`;
}

// Weekly Kite format: NIFTY2621725500CE  (YY + M (no padding) + DD + strike + type)
function buildKiteWeeklySymbol(symbol, strike, optionType, expiry) {
  const yy = String(expiry.getFullYear()).slice(-2);
  const m  = String(expiry.getMonth() + 1); // 1-12, no padding
  const dd = String(expiry.getDate()).padStart(2, '0');
  return `${symbol}${yy}${m}${dd}${strike}${optionType}`;
}

// TradingView format: NIFTY260217C25500
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
    const instrumentType = searchParams.get('instrumentType')?.toUpperCase();
    const expiryType     = searchParams.get('expiryType') || 'monthly';

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
    const expiry = getExpiry(symbol, now, expiryType);

    const isWeekly   = symbol === 'NIFTY' && expiryType === 'weekly';
    const kiteSymbol = isWeekly
      ? buildKiteWeeklySymbol(symbol, atmStrike, instrumentType, expiry)
      : buildKiteMonthlySymbol(symbol, atmStrike, instrumentType, expiry);
    const tvSymbol = buildTvSymbol(symbol, atmStrike, instrumentType, expiry);

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
      strike:    atmStrike,
      ltp,
      expiry:    expiry.toISOString(),
      expiryDay: expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      step,
    });

  } catch (error) {
    console.error('option-details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}