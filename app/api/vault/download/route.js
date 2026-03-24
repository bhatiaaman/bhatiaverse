import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getDataUserId } from '@/app/lib/finplan-auth';

const NS = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';

function vaultMetaKey(userId) {
  return `${NS}:vault:meta:${userId}`;
}

// Two modes:
// GET ?id=x&meta=1  → returns IV/salt/name/mime only (no blob content)
// GET ?id=x         → proxies the encrypted blob bytes back to the client
export async function GET(req) {
  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fileId  = searchParams.get('id');
  const metaOnly = searchParams.get('meta') === '1';
  if (!fileId) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const existing = (await redis.get(vaultMetaKey(userId))) || [];
  const target = existing.find((f) => f.id === fileId);
  if (!target) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

  if (metaOnly) {
    return NextResponse.json({
      iv:   target.iv,
      salt: target.salt,
      name: target.name,
      mime: target.mime,
    });
  }

  // Proxy the private blob through the server using the read-write token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  let blobRes;
  try {
    blobRes = await fetch(target.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${err?.message}` }, { status: 502 });
  }

  if (!blobRes.ok) {
    return NextResponse.json({ error: `Blob fetch returned ${blobRes.status}` }, { status: 502 });
  }

  // Stream encrypted bytes back — client will decrypt in-browser
  return new NextResponse(blobRes.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Vault-IV':   target.iv,
      'X-Vault-Salt': target.salt,
      'X-Vault-Name': encodeURIComponent(target.name),
      'X-Vault-Mime': target.mime,
    },
  });
}
