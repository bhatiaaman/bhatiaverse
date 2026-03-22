import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getSessionUserId } from '@/app/lib/finplan-auth';

const NS           = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const VAULT_COOKIE = 'bv_finance_vault';
const vaultKey     = (uid) => `${NS}:vault_phrase:${uid}`;

function parseCookies(header) {
  const result = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    result[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return result;
}

export async function GET(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vaultRecord = await redis.get(vaultKey(userId));
  if (!vaultRecord) {
    // No passphrase configured — treat as unlocked
    return NextResponse.json({ unlocked: true, passphraseSet: false });
  }

  const vaultToken = parseCookies(req.headers.get('cookie') || '')[VAULT_COOKIE];
  if (!vaultToken || !/^[A-Za-z0-9_-]{20,200}$/.test(vaultToken)) {
    return NextResponse.json({ unlocked: false, passphraseSet: true });
  }

  const stored = await redis.get(`${NS}:vault:${vaultToken}`);
  return NextResponse.json({ unlocked: !!stored, passphraseSet: true });
}
