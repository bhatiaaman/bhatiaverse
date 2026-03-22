import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

export async function POST(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required.' }, { status: 400 });

  const secret = await redis.get(`${NS}:totp:${userId}`);
  if (!secret) return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 });

  const isValid = authenticator.verify({ token: String(code).replace(/\s/g, ''), secret });
  if (!isValid) return NextResponse.json({ error: 'Invalid code.' }, { status: 401 });

  await redis.del(`${NS}:totp:${userId}`);
  return NextResponse.json({ success: true });
}
