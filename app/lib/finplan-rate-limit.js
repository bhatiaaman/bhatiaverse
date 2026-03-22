import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/app/lib/redis';

// 5 attempts per 15 min — login, TOTP verify, vault unlock
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  prefix: 'rl:finplan-auth',
});

export async function checkAuthLimit(req, identifier) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${identifier}:${ip}`;
  const { success, reset } = await authLimiter.limit(key);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return { limited: true, retryAfter };
  }
  return { limited: false };
}
