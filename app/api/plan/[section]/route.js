import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getSessionUserId, planKey } from '@/app/lib/finplan-auth';

const ALLOWED = new Set(['home', 'kids', 'retirement', 'monthly', 'insurance']);

export async function GET(req, { params }) {
  const { section } = await params;
  if (!ALLOWED.has(section)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await redis.get(planKey(userId, section));
  return NextResponse.json({ data: data ?? null });
}

export async function POST(req, { params }) {
  const { section } = await params;
  if (!ALLOWED.has(section)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await redis.set(planKey(userId, section), body);
  return NextResponse.json({ success: true });
}
