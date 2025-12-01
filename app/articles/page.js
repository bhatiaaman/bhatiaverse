"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../../lib/theme-context';

export default function ArticlesPage() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Articles</h1>
          <Link href="/" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <section className={`rounded-2xl border p-6 mb-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h2>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            A collection of security-focused writings and curated links. Below is a featured post I recommend reading:
          </p>
          <div className={`p-4 rounded ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
            <h3 className="font-semibold">If I had to interview security again</h3>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>A thoughtful piece about interviewing for security roles and practical advice.</p>
            <a
              href="https://secengweekly.substack.com/p/if-i-had-to-interview-security-again?r=4ho8ua&utm_medium=ios&triedRedirect=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Read on SecEng Weekly →
            </a>
          </div>
        </section>

        <section className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Other Topics</h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>More articles will be added here soon.</p>
        </section>
      </main>
    </div>
  );
}
