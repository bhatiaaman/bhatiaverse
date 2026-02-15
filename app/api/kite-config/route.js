import { NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis GET - returns null if key doesn't exist, or the stored value
async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result ?? null;
}

// Redis SET
async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${key}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result === 'OK';
}

// Redis DEL
async function redisDel(key) {
  const res = await fetch(`${REDIS_URL}/del/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result >= 0;
}

// Validate access token by calling Kite profile endpoint
async function validateAccessToken(apiKey, accessToken) {
  if (!apiKey || !accessToken) return false;
  try {
    const response = await fetch('https://api.kite.trade/user/profile', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

// GET: Fetch current config
export async function GET() {
  try {
    const redisApiKey = await redisGet('kite:api_key');
    const redisAccessToken = await redisGet('kite:access_token');
    const disconnected = await redisGet('kite:disconnected');

    const apiKey = redisApiKey || process.env.KITE_API_KEY || '';

    // If explicitly disconnected, never fall back to process.env token
    const accessToken = (disconnected === '1')
      ? ''
      : (redisAccessToken || process.env.KITE_ACCESS_TOKEN || '');

    const tokenValid = await validateAccessToken(apiKey, accessToken);

    return NextResponse.json({
      success: true,
      config: { apiKey, accessToken },
      tokenValid,
      hasApiSecretInEnv: !!(process.env.KITE_SECRET || process.env.KITE_API_SECRET),
    });
  } catch (error) {
    console.error('kite-config GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save config
export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, accessToken } = body;

    if (apiKey !== undefined) {
      if (apiKey === '') {
        await redisDel('kite:api_key');
      } else {
        await redisSet('kite:api_key', apiKey);
      }
    }

    if (accessToken !== undefined) {
      if (accessToken === '') {
        // Explicit disconnect — delete token and set disconnected flag
        await redisDel('kite:access_token');
        await redisSet('kite:disconnected', '1');
      } else {
        // New valid token — save it and clear disconnected flag
        await redisSet('kite:access_token', accessToken);
        await redisDel('kite:disconnected');
      }
    }

    if (apiKey === undefined && accessToken === undefined) {
      return NextResponse.json({ success: false, error: 'No valid updates provided' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Config saved successfully' });
  } catch (error) {
    console.error('kite-config POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}