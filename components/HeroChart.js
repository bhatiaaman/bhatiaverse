"use client";

import React from 'react';
import TradingViewWidget from './TradingViewWidget';

export default function HeroChart({ symbol = 'NASDAQ:AAPL', onSelect, isDark }) {
  return (
    <section className={`rounded-2xl p-6 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Weekly Chart Idea</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Top chart idea of the week</p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`px-3 py-1 rounded ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-slate-900'}`}>Explore Ideas</button>
        </div>
      </div>

      <div className="mb-4 rounded-lg overflow-hidden border">
        <TradingViewWidget symbol={symbol} interval="D" containerId="hero_tv" isDark={isDark} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Weekly highlight: {symbol}</div>
        <button
          onClick={() => onSelect && onSelect(symbol)}
          className={`px-3 py-1 rounded font-semibold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
        >
          Load Chart
        </button>
      </div>
    </section>
  );
}
