import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { redis } from '@/app/lib/redis';
import { getDataUserId } from '@/app/lib/finplan-auth';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function vaultMetaKey(userId) {
  return `${NS}:vault:meta:${userId}`;
}

export async function DELETE(req) {
  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const fileId = String(body?.id || '');
  if (!fileId) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const existing = (await redis.get(vaultMetaKey(userId))) || [];
  const target = existing.find((f) => f.id === fileId);
  if (!target) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

  // Delete from Vercel Blob
  try {
    await del(target.url);
  } catch {
    // Proceed even if blob deletion fails (already deleted or URL changed)
  }

  // Remove from Redis metadata
  const updated = existing.filter((f) => f.id !== fileId);
  await redis.set(vaultMetaKey(userId), updated);

  return NextResponse.json({ success: true });
}
