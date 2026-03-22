import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';

const NS        = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const VAULT_KEY = `${NS}:vault_phrase`;
const ITERATIONS = 120000;

function pbkdf2Hex(phrase, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(phrase, salt, ITERATIONS, 32, 'sha256').toString('hex');
}

// GET — check whether a vault passphrase is configured
export async function GET(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await redis.get(VAULT_KEY);
  return NextResponse.json({ set: !!existing });
}

// POST — set or change vault passphrase
export async function POST(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { passphrase } = await req.json();
  if (!passphrase || String(passphrase).length < 8) {
    return NextResponse.json({ error: 'Passphrase must be at least 8 characters.' }, { status: 400 });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = pbkdf2Hex(String(passphrase), salt);
  await redis.set(VAULT_KEY, { salt, hash });

  return NextResponse.json({ success: true });
}
