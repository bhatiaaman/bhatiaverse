import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';
import { SUPER_USER_ID } from '@/app/lib/super-credentials';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const PBKDF2_ITERATIONS = Number(process.env.FINPLAN_PASSWORD_ITERATIONS) || 120000;

function userKey(userId) { return `${NS}:user:${userId}`; }
function normalizeUserId(userId) { return String(userId || '').trim().toLowerCase(); }

export async function POST(req) {
  // Only superuser may call this
  const sessionUserId = await getSessionUserId(req);
  if (!sessionUserId || sessionUserId !== SUPER_USER_ID) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const targetUserId = normalizeUserId(body?.userId);
  const newPassword  = String(body?.newPassword || '');

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  // Superuser's own password cannot be changed here (it's in env vars)
  if (targetUserId === SUPER_USER_ID) {
    return NextResponse.json({ error: 'Superuser password is managed via env vars.' }, { status: 400 });
  }

  const existing = await redis.get(userKey(targetUserId));
  if (!existing) {
    return NextResponse.json({ error: `No user found for "${targetUserId}".` }, { status: 404 });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(newPassword, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');

  await redis.set(userKey(targetUserId), { salt, hash, iterations: PBKDF2_ITERATIONS });

  return NextResponse.json({ success: true, userId: targetUserId });
}
