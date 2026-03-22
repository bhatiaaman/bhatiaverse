import { redis } from '@/app/lib/redis';
import { SUPER_USER_ID, SUPER_DATA_USER_ID } from '@/app/lib/super-credentials';

const COOKIE_NAME = 'bv_finance_session';
const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function parseCookies(header) {
  const result = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    result[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return result;
}

export async function getSessionUserId(req) {
  const token = parseCookies(req.headers.get('cookie') || '')[COOKIE_NAME];
  if (!token || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return null;
  return await redis.get(`${NS}:session:${token}`);
}

// Superuser shares the admin's data namespace so their data is always visible.
export async function getDataUserId(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return null;
  if (userId === SUPER_USER_ID) {
    return SUPER_DATA_USER_ID;
  }
  return userId;
}

export function planKey(userId, section) {
  return `${NS}:plan:${userId}:${section}`;
}
