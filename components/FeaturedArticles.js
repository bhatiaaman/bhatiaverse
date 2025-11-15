"use client";

import React from 'react';

export default function FeaturedArticles({ articles = [], isDark }) {
  return (
    <section className={`rounded-2xl p-4 transition-colors ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Featured Article</h3>
      {articles.length > 0 && (
        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-800 text-white' : 'bg-blue-900 text-white'} p-6 flex items-center justify-between`}> 
          <div className="max-w-xs">
            <div className="text-xs uppercase opacity-80">Technical Analysis</div>
            <h3 className="text-2xl font-bold mt-2">{articles[0].title}</h3>
            <div className="text-sm mt-2 opacity-90">by {articles[0].author} • {articles[0].date}</div>
            <div className="mt-4">
              <a href="#articles-list" className="px-4 py-2 bg-white text-blue-900 rounded block text-center">Browse Articles</a>
            </div>
          </div>
          <div className="w-40 h-28 bg-slate-700 rounded-md" />
        </div>
      )}
    </section>
  );
}
