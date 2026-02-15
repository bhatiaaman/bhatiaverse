import { NextResponse } from 'next/server';

// Get Kite credentials from config
async function getKiteCredentials() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const configRes = await fetch(`${baseUrl}/api/kite-config`);
  const configData = await configRes.json();
  return {
    apiKey: configData.config?.apiKey || process.env.KITE_API_KEY,
    accessToken: configData.config?.accessToken || process.env.KITE_ACCESS_TOKEN,
    tokenValid: configData.tokenValid,
  };
}

export async function GET(request) {
  try {
    const { apiKey, accessToken, tokenValid } = await getKiteCredentials();
    
    if (!accessToken || !tokenValid) {
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
      return NextResponse.json({
        success: true,
        positions: data.data
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
