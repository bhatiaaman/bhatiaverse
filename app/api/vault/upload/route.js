import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { redis } from '@/app/lib/redis';
import { getDataUserId } from '@/app/lib/finplan-auth';

const NS     = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function vaultMetaKey(userId) {
  return `${NS}:vault:meta:${userId}`;
}

export async function POST(req) {
  const userId = await getDataUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_MB} MB limit.` }, { status: 413 });
  }

  // Expect multipart/form-data with fields: encryptedBlob (Blob), iv (hex), salt (hex), name (original filename), mime (original MIME type)
  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const encryptedBlob = form.get('encryptedBlob');
  const iv   = String(form.get('iv')   || '');
  const salt = String(form.get('salt') || '');
  const name = String(form.get('name') || 'file');
  const mime = String(form.get('mime') || 'application/octet-stream');

  if (!encryptedBlob || typeof encryptedBlob === 'string') {
    return NextResponse.json({ error: 'encryptedBlob is required.' }, { status: 400 });
  }
  if (!/^[0-9a-f]{24}$/i.test(iv)) {
    return NextResponse.json({ error: 'iv must be a 24-char hex string (12 bytes).' }, { status: 400 });
  }
  if (!/^[0-9a-f]{32}$/i.test(salt)) {
    return NextResponse.json({ error: 'salt must be a 32-char hex string (16 bytes).' }, { status: 400 });
  }

  const fileSize = encryptedBlob.size;
  if (fileSize > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_MB} MB limit.` }, { status: 413 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Vault storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel environment variables.' }, { status: 503 });
  }

  // Sanitize name — strip path separators and limit length
  const safeName = name.replace(/[/\\]/g, '_').slice(0, 200);
  const blobPath = `vault/${userId}/${Date.now()}-${safeName}.enc`;

  let url;
  try {
    ({ url } = await put(blobPath, encryptedBlob, {
      access: 'public',   // URL is unguessable; content is encrypted
      contentType: 'application/octet-stream',
    }));
  } catch (err) {
    console.error('[vault/upload] Blob put failed:', err?.message);
    return NextResponse.json({ error: 'File storage failed. Check that BLOB_READ_WRITE_TOKEN is set in Vercel.' }, { status: 502 });
  }

  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const meta = {
    id: fileId,
    name: safeName,
    mime,
    size: fileSize,
    iv,
    salt,
    url,
    uploadedAt: new Date().toISOString(),
  };

  // Append to user's vault metadata list in Redis
  const existing = (await redis.get(vaultMetaKey(userId))) || [];
  await redis.set(vaultMetaKey(userId), [...existing, meta]);

  return NextResponse.json({ success: true, file: meta });
}
