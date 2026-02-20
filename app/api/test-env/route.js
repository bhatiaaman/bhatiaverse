// app/api/test-env/route.js
// Quick diagnostic to check if env vars are loaded

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasKiteKey: !!process.env.KITE_API_KEY,
    hasKiteSecret: !!process.env.KITE_SECRET,
    hasKiteApiSecret: !!process.env.KITE_API_SECRET,
    hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    
    // Lengths (to verify it's not empty string)
    keyLength: process.env.KITE_API_KEY?.length || 0,
    secretLength: process.env.KITE_SECRET?.length || 0,
    apiSecretLength: process.env.KITE_API_SECRET?.length || 0,
    
    // First 4 chars only for security
    keyPrefix: process.env.KITE_API_KEY?.substring(0, 4) || 'none',
    secretPrefix: process.env.KITE_SECRET?.substring(0, 4) || 'none',
    apiSecretPrefix: process.env.KITE_API_SECRET?.substring(0, 4) || 'none',
    
    // Check for common issues
    issues: [
      !process.env.KITE_API_KEY && '❌ KITE_API_KEY missing',
      !process.env.KITE_SECRET && !process.env.KITE_API_SECRET && '❌ KITE_SECRET missing',
      process.env.KITE_SECRET?.includes(' ') && '⚠️ KITE_SECRET has spaces',
      process.env.KITE_SECRET?.includes('"') && '⚠️ KITE_SECRET has quotes',
      process.env.KITE_SECRET && process.env.KITE_SECRET.length !== 32 && `⚠️ KITE_SECRET length is ${process.env.KITE_SECRET.length}, expected 32`,
    ].filter(Boolean),
  });
}