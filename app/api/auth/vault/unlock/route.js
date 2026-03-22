import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';
import { checkAuthLimit } from '@/app/lib/finplan-rate-limit';

const NS           = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const vaultKey     = (uid) => `${NS}:vault_phrase:${uid}`;
const VAULT_COOKIE = 'bv_finance_vault';
const VAULT_TTL    = 4 * 60 * 60; // 4 hours
const ITERATIONS   = 120000;

function pbkdf2Hex(phrase, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(phrase, salt, ITERATIONS, 32, 'sha256').toString('hex');
}

function timingSafeEqHex(a, b) {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function makeToken() {
  return crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function POST(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkAuthLimit(req, `vault-unlock:${userId}`);
  if (rl.limited) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.` },
      { status: 429 }
    );
  }

  const { passphrase } = await req.json();
  if (!passphrase) return NextResponse.json({ success: false, error: 'Passphrase required.' }, { status: 400 });

  let record = await redis.get(vaultKey(userId));
  if (!record) return NextResponse.json({ success: false, error: 'Vault not configured.' }, { status: 400 });

  if (typeof record === 'string') {
    try { record = JSON.parse(record); } catch { /* ignore */ }
  }

  const { salt, hash } = record;
  if (!salt || !hash) return NextResponse.json({ success: false, error: 'Vault record invalid.' }, { status: 500 });

  const actualHash = pbkdf2Hex(String(passphrase), salt);
  if (!timingSafeEqHex(actualHash, hash)) {
    return NextResponse.json({ success: false, error: 'Incorrect passphrase.' }, { status: 401 });
  }

  const token = makeToken();
  await redis.set(`${NS}:vault:${token}`, userId, { ex: VAULT_TTL });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie',
    `${VAULT_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${VAULT_TTL}; SameSite=Strict${secure}`
  );
  return res;
}
