import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getDataUserId } from '@/app/lib/finplan-auth';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function vaultMetaKey(userId) {
  return `${NS}:vault:meta:${userId}`;
}

// Returns the Blob URL (and IV/salt) so the client can fetch + decrypt
export async function GET(req) {
  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');
  if (!fileId) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const existing = (await redis.get(vaultMetaKey(userId))) || [];
  const target = existing.find((f) => f.id === fileId);
  if (!target) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

  // Return the URL + decryption parameters — client will fetch blob and decrypt in-browser
  return NextResponse.json({
    url:  target.url,
    iv:   target.iv,
    salt: target.salt,
    name: target.name,
    mime: target.mime,
  });
}
