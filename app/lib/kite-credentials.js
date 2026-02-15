// Shared helper - copy to app/lib/kite-credentials.js
// Reads Kite credentials directly from Redis + process.env
// No internal HTTP calls, works on Vercel without NEXT_PUBLIC_BASE_URL

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

export async function getKiteCredentials() {
  const redisApiKey      = await redisGet('kite:api_key');
  const redisAccessToken = await redisGet('kite:access_token');
  const disconnected     = await redisGet('kite:disconnected');

  const apiKey = redisApiKey || process.env.KITE_API_KEY || '';

  // If explicitly disconnected, don't fall back to process.env token
  const accessToken = (disconnected === '1')
    ? ''
    : (redisAccessToken || process.env.KITE_ACCESS_TOKEN || '');

  return { apiKey, accessToken };
}