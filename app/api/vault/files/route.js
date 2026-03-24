import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getDataUserId } from '@/app/lib/finplan-auth';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function vaultMetaKey(userId) {
  return `${NS}:vault:meta:${userId}`;
}

export async function GET(req) {
  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const files = (await redis.get(vaultMetaKey(userId))) || [];
  return NextResponse.json({ files });
}
