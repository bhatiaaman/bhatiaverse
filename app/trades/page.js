'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import Card from '../../components/ui/cards';

export default function TradesPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'
      }`}
    >
      {/* ================= HEADER ================= */}
      <header
        className={`border-b transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp
              className={isDark ? 'w-7 h-7 text-blue-500' : 'w-7 h-7 text-blue-600'}
            />
            <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-slate-600'
              }`}
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              href="/"
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Back Home
            </Link>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="container mx-auto px-4 py-6">
        {/* Market Context Tabs */}
        <div className="mb-5 flex gap-2">
          {['Indices', 'Global', 'Commodities'].map((tab) => (
            <button
              key={tab}
              className="px-4 py-2 rounded-lg text-sm font-medium
                         bg-slate-800 text-slate-200
                         hover:bg-slate-700 transition"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Chartink Scanners */}
          <Card title="Chartink Scanners" className="lg:col-span-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stock-updates/scanner"
                  className="flex items-center justify-between
                             rounded-lg px-3 py-2
                             bg-slate-800/60 hover:bg-slate-700/60
                             transition"
                >
                  <span>Bullish BO 15 min scanner</span>
                  <span className="text-slate-400">→</span>
                </Link>
              </li>
            </ul>
          </Card>

          {/* Sector Strength */}
          <Card title="Sector Strength" className="lg:col-span-4">
            <div className="grid grid-cols-3 gap-2">
              {['IT', 'BANK', 'AUTO', 'FMCG', 'METAL', 'PHARMA'].map((sector) => (
                <div
                  key={sector}
                  className="rounded-lg py-4 text-center font-semibold
                             bg-emerald-500/20 text-emerald-300"
                >
                  {sector}
                </div>
              ))}
            </div>
          </Card>

          {/* Options Snapshot */}
          <Card title="Options Snapshot" className="lg:col-span-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>PCR</span>
                <span className="text-slate-400">—</span>
              </div>
              <div className="flex justify-between">
                <span>Max Pain</span>
                <span className="text-slate-400">—</span>
              </div>
              <div className="flex justify-between">
                <span>OI Bias</span>
                <span className="text-slate-400">—</span>
              </div>
            </div>
          </Card>

          {/* Chart Placeholder */}
          <Card className="lg:col-span-12">
            <div
              className="h-[360px] flex items-center justify-center
                         text-slate-500 border border-dashed
                         border-white/10 rounded-lg"
            >
              Chart Area (to be added later)
            </div>
          </Card>

          {/* News */}
          <Card title="News & Events" className="lg:col-span-12">
            <ul className="space-y-2">
              <li>• RBI policy decision awaited</li>
              <li>• Weekly expiry today</li>
              <li>• Global markets mixed</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}