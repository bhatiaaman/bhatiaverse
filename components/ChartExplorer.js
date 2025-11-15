"use client";

import React, { useState } from 'react';

export default function ChartExplorer({ onSearch, isDark }) {
  const [query, setQuery] = useState('');
  const [indicators, setIndicators] = useState({ rsi: true, macd: false });

  return (
    <section className={`rounded-2xl p-4 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
      <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Chart Explorer</h3>
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol (e.g. AAPL)"
          className={`flex-1 px-2 py-1.5 rounded text-sm ${isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-gray-100 text-slate-900 border border-gray-200'}`}
        />
        <button
          onClick={() => onSearch && onSearch(query)}
          className="px-2 py-1.5 rounded bg-blue-600 text-white text-xs font-medium"
        >
          Go
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={indicators.rsi} onChange={() => setIndicators((s) => ({ ...s, rsi: !s.rsi }))} />
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>RSI</span>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={indicators.macd} onChange={() => setIndicators((s) => ({ ...s, macd: !s.macd }))} />
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>MACD</span>
        </label>
      </div>
    </section>
  );
}
