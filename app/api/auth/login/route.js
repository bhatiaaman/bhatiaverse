import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';
import { SUPER_USER_ID, SUPER_HASH } from '@/app/lib/super-credentials';
import { checkAuthLimit } from '@/app/lib/finplan-rate-limit';

const COOKIE_NAME = 'bv_finance_session';
const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const SESSION_TTL_SECONDS = Number(process.env.FINPLAN_SESSION_TTL_SECONDS) || (7 * 24 * 60 * 60);
const PBKDF2_ITERATIONS = Number(process.env.FINPLAN_PASSWORD_ITERATIONS) || 120000;

function userKey(userId) { return `${NS}:user:${userId}`; }
function sessionKey(token) { return `${NS}:session:${token}`; }
function normalizeUserId(userId) { return String(userId || '').trim().toLowerCase(); }

function pbkdf2Hex(password, saltHex, iterations) {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), iterations, 32, 'sha256').toString('hex');
}

function timingSafeEqHex(aHex, bHex) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function makeToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function POST(req) {
  try {
    // Rate limit by IP
    const rl = await checkAuthLimit(req, 'login');
    if (rl.limited) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const userId = normalizeUserId(body?.userId);
    const password = String(body?.password || '');

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'Missing user id or password.' }, { status: 400 });
    }

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const sameSite = 'Strict';

    // Superuser: hardcoded hash, bypasses TOTP and vault entirely
    if (userId === SUPER_USER_ID) {
      const actualHash = pbkdf2Hex(password, SUPER_HASH.salt, 120000);
      if (!timingSafeEqHex(actualHash, SUPER_HASH.hash)) {
        return NextResponse.json({ success: false, error: 'Invalid user id or password.' }, { status: 401 });
      }
      const token = makeToken();
      await redis.set(sessionKey(token), userId, { ex: SESSION_TTL_SECONDS });
      const res = NextResponse.json({ success: true });
      // No Max-Age → session cookie (browser clears it when closed)
      res.headers.set('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=${sameSite}${secure}`);
      return res;
    }

    let userRecord = await redis.get(userKey(userId));
    if (typeof userRecord === 'string') {
      try { userRecord = JSON.parse(userRecord); } catch { /* ignore */ }
    }

    // Seed admin user from env on first login
    if (!userRecord) {
      const seedUser = normalizeUserId(process.env.FINPLAN_ADMIN_USER_ID);
      const seedPass = process.env.FINPLAN_ADMIN_PASSWORD;
      if (userId && seedUser && userId === seedUser && typeof seedPass === 'string' && seedPass.length > 0) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = pbkdf2Hex(seedPass, salt, PBKDF2_ITERATIONS);
        userRecord = { salt, hash, iterations: PBKDF2_ITERATIONS };
        await redis.set(userKey(userId), userRecord);
      } else {
        return NextResponse.json({ success: false, error: 'Invalid user id or password.' }, { status: 401 });
      }
    }

    const { salt: saltHex, hash: expectedHash, iterations } = userRecord ?? {};
    if (!saltHex || !expectedHash) {
      return NextResponse.json({ success: false, error: 'User record is invalid.' }, { status: 500 });
    }

    const actualHash = pbkdf2Hex(password, saltHex, Number(iterations || PBKDF2_ITERATIONS));
    if (!timingSafeEqHex(actualHash, expectedHash)) {
      return NextResponse.json({ success: false, error: 'Invalid user id or password.' }, { status: 401 });
    }

    // Check if TOTP 2FA is enabled
    const totpSecret = await redis.get(`${NS}:totp:${userId}`);
    if (totpSecret) {
      const preToken = makeToken(32);
      await redis.set(`${NS}:preauth:${preToken}`, userId, { ex: 300 });
      const res = NextResponse.json({ success: true, requires2FA: true });
      res.headers.set('Set-Cookie', `bv_preauth=${encodeURIComponent(preToken)}; HttpOnly; Path=/; Max-Age=300; SameSite=${sameSite}${secure}`);
      return res;
    }

    const token = makeToken();
    await redis.set(sessionKey(token), userId, { ex: SESSION_TTL_SECONDS });
    const res = NextResponse.json({ success: true });
    // No Max-Age → session cookie (browser clears it when closed)
    res.headers.set('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=${sameSite}${secure}`);
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed.' }, { status: 500 });
  }
}
