"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

export default function StockUpdatesPage() {
  const { isDark, toggleTheme } = useTheme();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram-updates');
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
      } else {
        console.error('Failed to fetch updates');
        setUpdates([]);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      setUpdates([]);
    }
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className={isDark ? 'w-8 h-8 text-blue-500' : 'w-8 h-8 text-blue-600'} />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Stock Updates
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchUpdates}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 disabled:opacity-50'
                  : 'bg-gray-200 hover:bg-gray-300 text-slate-600 disabled:opacity-50'
              }`}
              title="Refresh updates"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/trades"
              className={`px-4 py-2 text-sm rounded-lg transition-colors border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Trades
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Telegram Stock Updates</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>

          {loading && updates.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading updates...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Updates Yet</h3>
              <p className="text-gray-500">
                Stock updates from your Telegram group will appear here.
                <br />
                Make sure your Telegram bot is configured and added to the group.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div
                  key={update.message_id || index}
                  className={`rounded-lg border p-6 transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {update.from?.first_name?.[0] || update.from?.username?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {update.from?.first_name || update.from?.username || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(update.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {update.text}
                  </div>

                  {update.photo && (
                    <div className="mt-3">
                      <img
                        src={`/api/telegram-photo?file_id=${update.photo[update.photo.length - 1].file_id}`}
                        alt="Telegram photo"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}

                  <Link href="/stock-updates/scanner" className="mt-4 inline-block text-blue-600 hover:text-blue-800  ">
                    View ChartInk Scanner Results
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}