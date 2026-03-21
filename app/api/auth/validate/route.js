import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';

const COOKIE_NAME = 'bv_finance_session';
const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const SESSION_TTL_SECONDS = Number(process.env.FINPLAN_SESSION_TTL_SECONDS) || (7 * 24 * 60 * 60);

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

export async function GET(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ authenticated: false });
  }

  // Basic sanity: tokens should look URL-safe; avoid pathological keys.
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    return NextResponse.json({ authenticated: false });
  }

  const stored = await redis.get(sessionKey(token));
  const authenticated = !!stored;

  return NextResponse.json({
    authenticated,
    userId: authenticated ? stored : null,
    // Expose TTL hint for UI/debugging (optional)
    sessionTtlSeconds: authenticated ? SESSION_TTL_SECONDS : null,
  });
}

