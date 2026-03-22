import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';

const COOKIE_NAME = 'bv_finance_session';
const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const SESSION_TTL_SECONDS = Number(process.env.FINPLAN_SESSION_TTL_SECONDS) || (7 * 24 * 60 * 60);
const PBKDF2_ITERATIONS = Number(process.env.FINPLAN_PASSWORD_ITERATIONS) || 120000;

function userKey(userId) {
  return `${NS}:user:${userId}`;
}

function sessionKey(token) {
  return `${NS}:session:${token}`;
}

function normalizeUserId(userId) {
  return String(userId || '').trim().toLowerCase();
}

function pbkdf2Hex(password, saltHex, iterations) {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
}

function timingSafeEqHex(aHex, bHex) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = normalizeUserId(body?.userId);
    const password = String(body?.password || '');

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'Missing user id or password.' }, { status: 400 });
    }

    const existing = await redis.get(userKey(userId));

    let userRecord = existing;
    // Upstash Redis may return objects already, but handle string fallback.
    if (typeof userRecord === 'string') {
      try {
        userRecord = JSON.parse(userRecord);
      } catch {
        // ignore
      }
    }

    // Seed users from env on first login (admin + optional guest).
    if (!userRecord) {
      const seedUser = normalizeUserId(process.env.FINPLAN_ADMIN_USER_ID);
      const seedPass = process.env.FINPLAN_ADMIN_PASSWORD;
      const guestUser = normalizeUserId(process.env.FINPLAN_GUEST_USER_ID);
      const guestPass = process.env.FINPLAN_GUEST_PASSWORD;

      let seedId, seedPw;
      if (userId && seedUser && userId === seedUser && typeof seedPass === 'string' && seedPass.length > 0) {
        seedId = seedUser; seedPw = seedPass;
      } else if (userId && guestUser && userId === guestUser && typeof guestPass === 'string' && guestPass.length > 0) {
        seedId = guestUser; seedPw = guestPass;
      }

      if (seedId) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = pbkdf2Hex(seedPw, salt, PBKDF2_ITERATIONS);
        userRecord = { salt, hash, iterations: PBKDF2_ITERATIONS };
        await redis.set(userKey(userId), userRecord);
      } else {
        return NextResponse.json({ success: false, error: 'Invalid user id or password.' }, { status: 401 });
      }
    }

    const saltHex = userRecord?.salt;
    const expectedHash = userRecord?.hash;
    const iterations = Number(userRecord?.iterations || PBKDF2_ITERATIONS);

    if (!saltHex || !expectedHash || !Number.isFinite(iterations)) {
      return NextResponse.json({ success: false, error: 'User record is invalid.' }, { status: 500 });
    }

    const actualHash = pbkdf2Hex(password, saltHex, iterations);
    const ok = timingSafeEqHex(actualHash, expectedHash);

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid user id or password.' }, { status: 401 });
    }

    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    // Check if TOTP 2FA is enabled for this user
    const totpSecret = await redis.get(`${NS}:totp:${userId}`);
    if (totpSecret) {
      // Issue short-lived pre-auth token — full session issued only after TOTP verify
      const preToken = crypto.randomBytes(32).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      await redis.set(`${NS}:preauth:${preToken}`, userId, { ex: 300 }); // 5 min
      const cookie = `bv_preauth=${encodeURIComponent(preToken)}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax${secureFlag}`;
      const res = NextResponse.json({ success: true, requires2FA: true });
      res.headers.set('Set-Cookie', cookie);
      return res;
    }

    const token = crypto
      .randomBytes(48)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    await redis.set(sessionKey(token), userId, { ex: SESSION_TTL_SECONDS });

    const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secureFlag}`;

    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Login failed.' }, { status: 500 });
  }
}

