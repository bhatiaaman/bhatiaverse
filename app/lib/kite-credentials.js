// Shared helper - copy to app/lib/kite-credentials.js
// Reads Kite credentials directly from Redis + process.env
// No internal HTTP calls, works on Vercel without NEXT_PUBLIC_BASE_URL

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Namespace keys by environment so staging and prod don't clash in same Redis db
// Set REDIS_NAMESPACE=staging or REDIS_NAMESPACE=prod in Vercel env vars
const NS = process.env.REDIS_NAMESPACE || 'default';

function key(name) {
  return `${NS}:kite:${name}`;
}

async function redisGet(k) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/get/${k}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

export async function getKiteCredentials() {
  const redisApiKey      = await redisGet(key('api_key'));
  const redisAccessToken = await redisGet(key('access_token'));
  const disconnected     = await redisGet(key('disconnected'));

  const apiKey = redisApiKey || process.env.KITE_API_KEY || '';

  const accessToken = (disconnected === '1')
    ? ''
    : (redisAccessToken || process.env.KITE_ACCESS_TOKEN || '');

  return { apiKey, accessToken };
}