"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';
import TradingViewWidget from '../../components/TradingViewWidget';

export default function TradesPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('NASDAQ:AAPL');

  const watchItem = (label, exchangeSymbol, price, change, changeClass) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedSymbol(exchangeSymbol)}
      onKeyDown={(e) => { if (e.key === 'Enter') setSelectedSymbol(exchangeSymbol); }}
      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${selectedSymbol === exchangeSymbol ? 'ring-2 ring-yellow-400 bg-white/4' : 'bg-white/3 hover:bg-white/5'}`}
    >
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-gray-400">{exchangeSymbol.split(':')[1]}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{price}</div>
        <div className={`text-sm ${changeClass}`}>{change}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-900" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Trades</h1>
          </div>
          <p className="text-gray-300 mb-8">
            Market insights, weekly charts, and a curated watchlist. This page is a starting
            point for your trading exploration.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* Weekly Charts */}
          <section className="p-2 bg-transparent">
            <h2 className="text-2xl font-bold mb-4 text-white">Weekly Charts</h2>
            <p className="text-gray-400 mb-6">A snapshot of weekly price action for highlighted symbols.</p>
            <div className="space-y-4">
              {/* Single interactive TradingView chart (user can change symbol) */}
              <TradingViewWidget symbol={selectedSymbol} interval="W" containerId="tv_widget" />
            </div>
          </section>

          {/* Watchlist */}
          <section className="p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
            <p className="text-gray-400 mb-6">Track symbols you're interested in — price, change, and quick notes.</p>
            <div className="space-y-3">
              {watchItem('Apple Inc.', 'NASDAQ:AAPL', '$194.23', '+1.8%', 'text-green-400')}
              {watchItem('Tesla, Inc.', 'NASDAQ:TSLA', '$255.10', '-0.6%', 'text-red-400')}
              {watchItem('Microsoft Corp.', 'NASDAQ:MSFT', '$360.75', '+0.9%', 'text-green-400')}
              {watchItem('Pegasystems Inc.', 'NASDAQ:PEGA', '$45.12', '+0.4%', 'text-green-400')}
              {watchItem('ServiceNow', 'NYSE:NOW', '$635.20', '+0.2%', 'text-green-400')}
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
          >
            Back Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
