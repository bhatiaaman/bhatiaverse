"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MusingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/spirituality'), 600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Musings has moved to Spirituality</h1>
      <p className="mb-4">You'll be redirected shortly — or click below to go now.</p>
      <Link href="/spirituality" className="px-4 py-2 rounded bg-emerald-600 text-white">Go to Spirituality</Link>
    </div>
  );
}

