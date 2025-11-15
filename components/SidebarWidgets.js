"use client";

import React from 'react';

export default function SidebarWidgets({ trending = [], isDark }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trending</h4>
        <div className="space-y-2">
          {trending.map((t) => (
            <div key={t.symbol} className="flex items-center justify-between">
              <div className={`${isDark ? 'text-gray-200' : 'text-slate-900'}`}>{t.symbol}</div>
              <div className={`text-sm ${t.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.change >= 0 ? '+' : ''}{t.change}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-4 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Sentiment</h4>
        <div className={`h-28 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>Heatmap / AI Picks</div>
      </div>
    </div>
  );
}
