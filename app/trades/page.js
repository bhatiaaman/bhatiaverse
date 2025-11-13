"use client";

import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function TradesPage() {
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
          <section className="p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Weekly Charts</h2>
            <p className="text-gray-400 mb-6">A snapshot of weekly price action for highlighted symbols.</p>
            <div className="space-y-4">
              <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-white/5 flex items-center justify-center text-gray-500">
                Chart placeholder — integrate a charting library (e.g., TradingView, Chart.js) here.
              </div>
              <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-white/5 flex items-center justify-center text-gray-500">
                Chart placeholder — add more symbols or interactivity as needed.
              </div>
            </div>
          </section>

          {/* Watchlist */}
          <section className="p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
            <p className="text-gray-400 mb-6">Track symbols you're interested in — price, change, and quick notes.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/3 rounded-md">
                <div>
                  <div className="font-semibold">AAPL</div>
                  <div className="text-sm text-gray-400">Apple Inc.</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">$194.23</div>
                  <div className="text-sm text-green-400">+1.8%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/3 rounded-md">
                <div>
                  <div className="font-semibold">TSLA</div>
                  <div className="text-sm text-gray-400">Tesla, Inc.</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">$255.10</div>
                  <div className="text-sm text-red-400">-0.6%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/3 rounded-md">
                <div>
                  <div className="font-semibold">MSFT</div>
                  <div className="text-sm text-gray-400">Microsoft Corp.</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">$360.75</div>
                  <div className="text-sm text-green-400">+0.9%</div>
                </div>
              </div>
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
