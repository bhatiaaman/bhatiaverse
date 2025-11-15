"use client";

import React from 'react';

export default function RecentArticles({ articles = [], isDark }) {
  return (
    <section className={`rounded-2xl p-4 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Articles</h3>
      <div className="grid grid-cols-3 gap-4">
        {articles.map((a) => (
          <div key={a.id} className={`rounded overflow-hidden shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="h-24 bg-gray-200" />
            <div className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="font-serif font-semibold text-lg">{a.title}</div>
              <div className="text-xs mt-2">{a.date}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
