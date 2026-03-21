import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

const COOKIE_NAME = 'bv_finance_session';
const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function sessionKey(token) {
  return `${NS}:session:${token}`;
}

function parseCookies(cookieHeader) {
  const header = cookieHeader || '';
  const result = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    result[key] = decodeURIComponent(val);
  });
  return result;
}

export async function POST(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];

  if (token && typeof token === 'string') {
    try {
      // Best-effort invalidation.
      await redis.set(sessionKey(token), '', { ex: 1 }).catch(() => {});
    } catch {
      // ignore
    }
  }

  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
  return res;
}

