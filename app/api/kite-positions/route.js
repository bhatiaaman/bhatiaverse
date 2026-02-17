import { NextResponse } from 'next/server';
import { getKiteCredentials } from '@/app/lib/kite-credentials';


export async function GET(request) {
  try {
    const { apiKey, accessToken } = await getKiteCredentials();
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kite not connected',
        positions: { day: [], net: [] }
      });
    }

    // Fetch positions from Kite
    const res = await fetch('https://api.kite.trade/portfolio/positions', {
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': '3'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Kite positions error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch positions',
        positions: { day: [], net: [] }
      });
    }

    const data = await res.json();
    
    if (data.status === 'success') {
      // Filter for active MIS or NFO positions with net quantity > 0
      const filtered = (data.data.net || []).filter(p => {
        // product: 'MIS' or exchange: 'NFO', and net quantity > 0
        const isMIS = p.product === 'MIS';
        const isNFO = p.exchange === 'NFO';
        const isActive = (p.quantity || 0) > 0;
        return (isMIS || isNFO) && isActive;
      });
      return NextResponse.json({
        success: true,
        positions: filtered
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: data.message || 'Unknown error',
      positions: { day: [], net: [] }
    });
    
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      positions: { day: [], net: [] }
    }, { status: 500 });
  }
}
