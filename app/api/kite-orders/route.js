import { NextResponse } from 'next/server';
import { getKiteCredentials } from '@/app/lib/kite-credentials';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const { apiKey, accessToken, tokenValid } = await getKiteCredentials();
    
    if (!tokenValid || !accessToken) {
      return NextResponse.json({ 
        error: 'Kite not authenticated',
        orders: []
      }, { status: 401 });
    }

    // Fetch orders from Kite
    const ordersRes = await fetch('https://api.kite.trade/orders', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`,
      },
    });

    if (!ordersRes.ok) {
      const errorText = await ordersRes.text();
      console.error('Kite orders error:', errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch orders from Kite',
        orders: []
      }, { status: ordersRes.status });
    }

    const ordersData = await ordersRes.json();
    
    // Get the orders array and sort by order_timestamp (newest first)
    let orders = ordersData.data || [];
    orders.sort((a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp));
    
    // Limit results
    orders = orders.slice(0, limit);

    return NextResponse.json({ 
      success: true,
      orders,
      total: ordersData.data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching Kite orders:', error);
    return NextResponse.json({ 
      error: error.message,
      orders: []
    }, { status: 500 });
  }
}
