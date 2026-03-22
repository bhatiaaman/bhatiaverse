import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';

const NS                  = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const SESSION_TTL_SECONDS = Number(process.env.FINPLAN_SESSION_TTL_SECONDS) || (7 * 24 * 60 * 60);
const SESSION_COOKIE      = 'bv_finance_session';
const PREAUTH_COOKIE      = 'bv_preauth';

function parseCookies(header) {
  const result = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    result[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return result;
}

function makeToken() {
  return crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function POST(req) {
  const cookies    = parseCookies(req.headers.get('cookie') || '');
  const preToken   = cookies[PREAUTH_COOKIE];

  if (!preToken || !/^[A-Za-z0-9_-]{20,200}$/.test(preToken)) {
    return NextResponse.json({ success: false, error: 'No pre-auth session found. Please log in again.' }, { status: 401 });
  }

  const userId = await redis.get(`${NS}:preauth:${preToken}`);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Pre-auth expired. Please log in again.' }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ success: false, error: 'Code required.' }, { status: 400 });

  const secret = await redis.get(`${NS}:totp:${userId}`);
  if (!secret) return NextResponse.json({ success: false, error: '2FA not configured.' }, { status: 400 });

  const isValid = authenticator.verify({ token: String(code).replace(/\s/g, ''), secret });
  if (!isValid) return NextResponse.json({ success: false, error: 'Invalid code. Try again.' }, { status: 401 });

  // Issue full session
  const sessionToken = makeToken();
  await redis.set(`${NS}:session:${sessionToken}`, userId, { ex: SESSION_TTL_SECONDS });
  await redis.del(`${NS}:preauth:${preToken}`);

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`
  );
  // Clear preauth cookie
  res.headers.append('Set-Cookie',
    `${PREAUTH_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
  );
  return res;
}
