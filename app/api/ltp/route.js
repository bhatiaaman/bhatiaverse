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

const LOT_SIZES = {
  NIFTY: 75, BANKNIFTY: 30, FINNIFTY: 40, MIDCPNIFTY: 120,
  SENSEX: 10, BANKEX: 15, RELIANCE: 250, TCS: 150, INFY: 300,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 1500, HDFC: 300, BHARTIARTL: 500,
};

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

    const kiteRes = await fetch(
      `https://api.kite.trade/quote/ltp?i=${encodeURIComponent(instrument)}`,
      {
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3',
        },
      }
    );

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
      lotSize: LOT_SIZES[upper] || 1,
      symbol: upper,
    });

  } catch (error) {
    console.error('LTP route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}