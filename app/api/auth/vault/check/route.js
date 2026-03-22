import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { getSessionUserId, parseCookies } from '@/app/lib/finplan-auth';
import { SUPER_USER_ID } from '@/app/lib/super-credentials';

const NS           = process.env.FINPLAN_REDIS_NAMESPACE || 'bv-finance';
const VAULT_COOKIE = 'bv_finance_vault';
const vaultKey     = (uid) => `${NS}:vault_phrase:${uid}`;

export async function GET(req) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (userId === SUPER_USER_ID) return NextResponse.json({ unlocked: true, passphraseSet: false });

  const vaultRecord = await redis.get(vaultKey(userId));
  if (!vaultRecord) return NextResponse.json({ unlocked: true, passphraseSet: false });

  const vaultToken = parseCookies(req.headers.get('cookie') || '')[VAULT_COOKIE];
  if (!vaultToken || !/^[A-Za-z0-9_-]{20,200}$/.test(vaultToken)) {
    return NextResponse.json({ unlocked: false, passphraseSet: true });
  }

  const stored = await redis.get(`${NS}:vault:${vaultToken}`);
  // Also return remaining TTL so the client can show a countdown
  const ttl = stored ? await redis.ttl(`${NS}:vault:${vaultToken}`) : 0;
  return NextResponse.json({ unlocked: !!stored, passphraseSet: true, ttl: ttl > 0 ? ttl : 0 });
}
