import { NextResponse } from 'next/server';
import crypto from 'crypto';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis helpers
async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result || null;
}

async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${key}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result === 'OK';
}

// Exchange request_token for access_token
export async function POST(request) {
  try {
    const { requestToken, apiSecret, useEnvSecret } = await request.json();

    if (!requestToken) {
      return NextResponse.json({ success: false, error: 'Request token is required' }, { status: 400 });
    }

    // Get API key from Redis first, fall back to process.env
    const apiKey = (await redisGet('kite:api_key')) || process.env.KITE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key must be configured first' }, { status: 400 });
    }

    // Get secret: from request body OR from process.env if useEnvSecret
    const secretToUse = useEnvSecret
      ? (process.env.KITE_SECRET || process.env.KITE_API_SECRET)
      : apiSecret;

    if (!secretToUse) {
      return NextResponse.json({
        success: false,
        error: useEnvSecret
          ? 'API Secret not found in environment variables'
          : 'API Secret is required',
      }, { status: 400 });
    }

    // Generate checksum: SHA256(api_key + request_token + api_secret)
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + requestToken + secretToUse)
      .digest('hex');

    // Exchange request_token for access_token via Kite API
    const response = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        request_token: requestToken,
        checksum: checksum,
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.data?.access_token) {
      const accessToken = data.data.access_token;

      // Save access token to Redis and clear disconnected flag
      const saved = await redisSet('kite:access_token', accessToken);
      await fetch(`${REDIS_URL}/del/kite:disconnected`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });

      return NextResponse.json({
        success: true,
        accessToken,
        user: data.data.user_name || data.data.user_id,
        message: saved
          ? 'Access token saved successfully'
          : 'Token generated but could not be saved',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.message || 'Failed to get access token',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}