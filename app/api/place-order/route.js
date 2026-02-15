import { NextResponse } from 'next/server';
import { KiteConnect } from 'kiteconnect';

// Check if current time is within market hours (7 AM - 10 PM IST)
function isMarketHours() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  // Market hours: 7 AM (7) to 10 PM (22)
  return hours >= 7 && hours < 22;
}

// Check if it's a trading day (Mon-Fri, not a holiday)
function isTradingDay() {
  const now = new Date();
  const day = now.getDay();
  // 0 = Sunday, 6 = Saturday
  return day !== 0 && day !== 6;
}

export async function POST(request) {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return NextResponse.json(
      { error: 'Kite API not configured. Please set up your API credentials.' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const {
      tradingsymbol,
      exchange = 'NSE',
      transaction_type, // BUY or SELL
      quantity,
      product = 'CNC', // CNC, MIS, NRML
      order_type = 'MARKET', // MARKET, LIMIT, SL, SL-M
      price = null,
      trigger_price = null,
      validity = 'DAY',
      variety = 'regular', // regular, amo, co, iceberg
      disclosed_quantity = 0,
      tag = '',
    } = body;

    // Validation
    if (!tradingsymbol) {
      return NextResponse.json({ error: 'Trading symbol is required' }, { status: 400 });
    }

    if (!transaction_type || !['BUY', 'SELL'].includes(transaction_type)) {
      return NextResponse.json({ error: 'Transaction type must be BUY or SELL' }, { status: 400 });
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }

    // Initialize Kite
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    // Build order params
    const orderParams = {
      tradingsymbol: tradingsymbol.toUpperCase(),
      exchange: exchange.toUpperCase(),
      transaction_type: transaction_type.toUpperCase(),
      quantity: parseInt(quantity),
      product: product.toUpperCase(),
      order_type: order_type.toUpperCase(),
      validity,
      variety,
    };

    // Add price for LIMIT orders
    if (order_type === 'LIMIT' && price) {
      orderParams.price = parseFloat(price);
    }

    // Add trigger price for SL/SL-M orders
    if (['SL', 'SL-M'].includes(order_type) && trigger_price) {
      orderParams.trigger_price = parseFloat(trigger_price);
    }

    // Add disclosed quantity if provided
    if (disclosed_quantity > 0) {
      orderParams.disclosed_quantity = parseInt(disclosed_quantity);
    }

    // Add tag if provided
    if (tag) {
      orderParams.tag = tag.substring(0, 20); // Max 20 chars
    }

    console.log('Placing order:', orderParams);

    // Place the order
    const orderResponse = await kite.placeOrder(variety, orderParams);

    console.log('Order placed successfully:', orderResponse);

    return NextResponse.json({
      success: true,
      order_id: orderResponse.order_id,
      message: `Order placed successfully. Order ID: ${orderResponse.order_id}`,
      details: orderParams,
    });

  } catch (error) {
    console.error('Order placement error:', error);

    // Handle specific Kite errors
    let errorMessage = error.message || 'Failed to place order';
    let statusCode = 500;

    if (error.message?.includes('Token')) {
      errorMessage = 'Session expired. Please re-authenticate with Kite.';
      statusCode = 401;
    } else if (error.message?.includes('margin')) {
      errorMessage = 'Insufficient margin for this order.';
      statusCode = 400;
    } else if (error.message?.includes('quantity')) {
      errorMessage = 'Invalid quantity. Please check lot size requirements.';
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}

// GET endpoint to fetch order book
export async function GET(request) {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return NextResponse.json(
      { error: 'Kite API not configured' },
      { status: 400 }
    );
  }

  try {
    const kite = new KiteConnect({ api_key: apiKey });
    kite.setAccessToken(accessToken);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'orders';

    let data;
    if (type === 'positions') {
      data = await kite.getPositions();
    } else if (type === 'holdings') {
      data = await kite.getHoldings();
    } else {
      data = await kite.getOrders();
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error fetching order data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
