"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, X, Plus } from 'lucide-react';
import TradingViewWidget from '../../components/TradingViewWidget';
import { fetchStockPrice, getMockPrice } from '../../lib/stockPrices';

const DEFAULT_WATCHLIST = [
  { name: 'Apple Inc.', symbol: 'NASDAQ:AAPL' },
  { name: 'Tesla, Inc.', symbol: 'NASDAQ:TSLA' },
  { name: 'Microsoft Corp.', symbol: 'NASDAQ:MSFT' },
  { name: 'Pegasystems Inc.', symbol: 'NASDAQ:PEGA' },
  { name: 'ServiceNow', symbol: 'NYSE:NOW' },
];

export default function TradesPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('NASDAQ:AAPL');
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [prices, setPrices] = useState({});
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [mounted, setMounted] = useState(false);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tradingWatchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load watchlist from localStorage', e);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('tradingWatchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, mounted]);

  // Fetch prices for all items in watchlist
  useEffect(() => {
    const fetchAllPrices = async () => {
      const newPrices = {};
      for (const item of watchlist) {
        const priceData = await fetchStockPrice(item.symbol);
        newPrices[item.symbol] = priceData;
      }
      setPrices(newPrices);
    };
    fetchAllPrices();
  }, [watchlist]);

  const addToWatchlist = () => {
    if (!newSymbolInput.trim()) return;

    // Format symbol (assume NASDAQ if no exchange given)
    let formattedSymbol = newSymbolInput.toUpperCase().trim();
    if (!formattedSymbol.includes(':')) {
      formattedSymbol = `NASDAQ:${formattedSymbol}`;
    }

    // Check for duplicates
    if (watchlist.some((item) => item.symbol === formattedSymbol)) {
      alert('Symbol already in watchlist');
      return;
    }

    // Add to watchlist
    const cleanSymbol = formattedSymbol.split(':')[1];
    const newItem = { name: cleanSymbol, symbol: formattedSymbol };
    setWatchlist([...watchlist, newItem]);
    setNewSymbolInput('');
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
  };

  const watchItem = (item) => {
    const priceData = prices[item.symbol] || { price: 0, change: 0, changePercent: 0 };
    const changeClass = priceData.change >= 0 ? 'text-green-400' : 'text-red-400';
    const changeSign = priceData.change >= 0 ? '+' : '';

    return (
      <div
        key={item.symbol}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedSymbol(item.symbol)}
        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedSymbol(item.symbol); }}
        className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition group ${
          selectedSymbol === item.symbol ? 'ring-2 ring-yellow-400 bg-white/4' : 'bg-white/3 hover:bg-white/5'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{item.name}</div>
          <div className="text-xs text-gray-400">{item.symbol.split(':')[1]}</div>
        </div>
        <div className="text-right flex-1">
          <div className="font-semibold text-sm">${priceData.price.toFixed(2)}</div>
          <div className={`text-xs ${changeClass}`}>
            {changeSign}{priceData.change.toFixed(2)} ({changeSign}{priceData.changePercent.toFixed(2)}%)
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromWatchlist(item.symbol);
          }}
          className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20 rounded"
          title="Remove from watchlist"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>
    );
  };

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

            {/* Add new symbol form */}
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Add symbol (e.g., GOOGL, NVDA)"
                value={newSymbolInput}
                onChange={(e) => setNewSymbolInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addToWatchlist(); }}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={addToWatchlist}
                className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md hover:bg-yellow-500/30 transition flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Watchlist items */}
            <div className="space-y-2">
              {watchlist.length > 0 ? (
                watchlist.map((item) => watchItem(item))
              ) : (
                <p className="text-gray-400 text-sm py-4">No symbols in watchlist. Add one above!</p>
              )}
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
