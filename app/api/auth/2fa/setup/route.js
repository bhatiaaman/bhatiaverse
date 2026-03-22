import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';
import { generateSecret, keyuri, verifyTotp } from '@/app/lib/totp';

const NS       = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const APP_NAME = process.env.FINPLAN_APP_NAME || 'BhatiaVerse Finance';

const totpKey    = (uid) => `${NS}:totp:${uid}`;
const pendingKey = (uid) => `${NS}:totp_pending:${uid}`;

// GET — return setup info (QR + secret) or { enabled: true } if already active
export async function GET(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await redis.get(totpKey(userId));
  if (existing) return NextResponse.json({ enabled: true });

  // Reuse or generate pending secret (10-min window to complete setup)
  let secret = await redis.get(pendingKey(userId));
  if (!secret) {
    secret = generateSecret();
    await redis.set(pendingKey(userId), secret, { ex: 600 });
  }

  const otpauthUrl = keyuri(userId, APP_NAME, secret);
  const qrDataUrl  = await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 2 });

  return NextResponse.json({ enabled: false, secret, qrDataUrl });
}

// POST — confirm setup by verifying a live code from the authenticator app
export async function POST(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required.' }, { status: 400 });

  const secret = await redis.get(pendingKey(userId));
  if (!secret) return NextResponse.json({ error: 'Setup session expired. Start again.' }, { status: 400 });

  if (!verifyTotp(code, secret)) {
    return NextResponse.json({ error: 'Invalid code. Check your authenticator app and try again.' }, { status: 400 });
  }

  await redis.set(totpKey(userId), secret);
  await redis.del(pendingKey(userId));

  return NextResponse.json({ success: true });
}
