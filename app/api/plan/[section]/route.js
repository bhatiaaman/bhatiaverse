import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getDataUserId, planKey } from '@/app/lib/finplan-auth';

const ALLOWED = new Set(['home', 'kids', 'retirement', 'monthly', 'insurance', 'funds', 'goals', 'balance', 'tax', 'loans', 'sip', 'cashflow', 'transactions', 'accounts']);

export async function GET(req, { params }) {
  const { section } = await params;
  if (!ALLOWED.has(section)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await redis.get(planKey(userId, section));
  return NextResponse.json({ data: data ?? null });
}

const MAX_BODY_BYTES = 256 * 1024; // 256 KB per section

export async function POST(req, { params }) {
  const { section } = await params;
  if (!ALLOWED.has(section)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid data shape.' }, { status: 400 });
  }

  await redis.set(planKey(userId, section), body);
  return NextResponse.json({ success: true });
}
