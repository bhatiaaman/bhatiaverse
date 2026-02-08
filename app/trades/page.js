"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, X, Plus, BarChart3, ListChecks, Moon, Sun } from 'lucide-react';
import TradingViewWidget from '../../components/TradingViewWidget';
import HeroChart from '../../components/HeroChart';
import WatchlistTabs from '../../components/WatchlistTabs';
import ChartExplorer from '../../components/ChartExplorer';
import FeaturedArticles from '../../components/FeaturedArticles';
import SidebarWidgets from '../../components/SidebarWidgets';
import RecentArticles from '../../components/RecentArticles';
import { fetchStockPrice, getMockPrice } from '../../lib/stockPrices';
import { useTheme } from '../../lib/theme-context';

const DEFAULT_WATCHLIST = [
  { name: 'Apple Inc.', symbol: 'NASDAQ:AAPL' },
  { name: 'Tesla, Inc.', symbol: 'NASDAQ:TSLA' },
  { name: 'Microsoft Corp.', symbol: 'NASDAQ:MSFT' },
  { name: 'Pegasystems Inc.', symbol: 'NASDAQ:PEGA' },
  { name: 'ServiceNow', symbol: 'NYSE:NOW' },
];

const ARTICLES = [
  {
    id: 1,
    title: 'Understanding Market Cycles',
    excerpt: 'Learn how market cycles work and how to identify them in real-time trading.',
    date: 'Nov 12, 2025',
    author: 'Trading Team',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Technical Analysis Basics',
    excerpt: 'A comprehensive guide to reading charts and identifying key support/resistance levels.',
    date: 'Nov 10, 2025',
    author: 'Trading Team',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'Risk Management Strategies',
    excerpt: 'Master the art of protecting your capital with proven risk management techniques.',
    date: 'Nov 8, 2025',
    author: 'Trading Team',
    readTime: '6 min read',
  },
];

export default function TradesPage() {
  const { isDark, toggleTheme } = useTheme();
  const [selectedSymbol, setSelectedSymbol] = useState('NASDAQ:AAPL');
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [prices, setPrices] = useState({});
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' or 'watchlist'
  const [chartMaximized, setChartMaximized] = useState(false); // Toggle chart fullscreen
  const [openArticle, setOpenArticle] = useState(null); // article modal
  const [watchlistGroup, setWatchlistGroup] = useState({ short: DEFAULT_WATCHLIST.slice(0, 2), mid: DEFAULT_WATCHLIST.slice(2, 4), long: DEFAULT_WATCHLIST.slice(4) });
  const [selectedWatchTab, setSelectedWatchTab] = useState('short');
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setWatchlistModalOpen(true);
    window.addEventListener('openWatchlistModal', handler);
    return () => window.removeEventListener('openWatchlistModal', handler);
  }, []);

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

    let formattedSymbol = newSymbolInput.toUpperCase().trim();
    if (!formattedSymbol.includes(':')) {
      formattedSymbol = `NASDAQ:${formattedSymbol}`;
    }

    if (watchlist.some((item) => item.symbol === formattedSymbol)) {
      alert('Symbol already in watchlist');
      return;
    }

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
          <div className="text-xs text-gray-400">${priceData.price.toFixed(2)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xs font-semibold ${changeClass}`}>
            {changeSign}{priceData.changePercent.toFixed(2)}%
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromWatchlist(item.symbol);
          }}
          className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20 rounded"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className={isDark ? 'w-8 h-8 text-blue-500' : 'w-8 h-8 text-blue-600'} />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trading Hub
            </h1>
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
              className={`px-4 py-2 text-sm rounded-lg transition-colors border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'
              }`}
            >
              Back Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Maximized Chart Full Screen */}
        {chartMaximized && (
          <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 sm:p-6 border-b transition-colors ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h2 className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedSymbol} - Weekly Chart</h2>
              <button
                onClick={() => setChartMaximized(false)}
                className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-slate-900'
                }`}
              >
                Exit Fullscreen
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="h-full">
                <TradingViewWidget symbol={selectedSymbol} interval="D" containerId="tv_widget_max" isDark={isDark} />
              </div>
            </div>
          </div>
        )}

        {/* Main grid: Responsive layout - stacks on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-6">
          {/* Left: Watchlist, Charts - Hidden on mobile, visible on tablet+ */}
          <aside className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col gap-3 sm:gap-6">
            <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
              <h4 className="text-base sm:text-lg font-semibold mb-3">Watchlist</h4>
              <WatchlistTabs groups={watchlistGroup} selectedTab={selectedWatchTab} setSelectedTab={setSelectedWatchTab} onSelect={(s) => setSelectedSymbol(s)} isDark={false} prices={prices} />
            </div>
            <Link href="/stock-updates/scanner" className="rounded-2xl bg-blue-500 hover:bg-blue-600 border border-blue-600 p-4 shadow-sm text-white transition-colors">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <h4 className="font-semibold text-sm sm:text-base">Stock Scanner</h4>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-2">View stock scans and technical analysis</p>
            </Link>
            <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
              <h4 className="text-sm sm:text-md font-semibold mb-3">Charts</h4>
              <ChartExplorer onSearch={(q) => { const fq = q && q.includes(':') ? q : `NASDAQ:${q}`; setSelectedSymbol(fq); }} isDark={false} />
              <div className="mt-4 rounded overflow-hidden border relative">
                <TradingViewWidget symbol={selectedSymbol} interval="D" containerId="small_tv" isDark={false} />
                <button
                  onClick={() => setChartMaximized(true)}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-600 shadow hover:bg-gray-200"
                  title="Maximize chart"
                >
                  Maximize
                </button>
              </div>
            </div>
          </aside>

          {/* Center: Featured Article + Articles grid - Full width on mobile, col-span-6 on desktop */}
          <main className="col-span-1 sm:col-span-2 lg:col-span-6 flex flex-col gap-3 sm:gap-6" id="articles-list">
            <FeaturedArticles articles={ARTICLES} isDark={false} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {ARTICLES.map((article) => (
                <article key={article.id} onClick={() => setOpenArticle(article)} className="cursor-pointer rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
                  <div className="font-serif font-semibold text-base sm:text-lg mb-2">{article.title}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{article.excerpt}</div>
                  <div className="text-xs text-gray-400 mt-3">{article.date} • {article.readTime}</div>
                </article>
              ))}
            </div>
            <div className="mt-4 sm:mt-6 text-right">
              <a href="#articles-list" className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs sm:text-sm">View All Articles</a>
            </div>
          </main>

          {/* Right: Ads, Contact, Environment - Hidden on mobile, visible on desktop */}
          <aside className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm flex items-center justify-center min-h-[100px] sm:min-h-[120px]">
              <span className="text-gray-400 text-sm sm:text-base">Advertise</span>
            </div>
            <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-4 shadow-sm">
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Contact</h4>
              <div className="text-xs sm:text-sm text-gray-600">ame@bhatiiverse.com</div>
              <div className="mt-3 flex gap-2">
                <a href="#" className="text-gray-500 text-xs sm:text-sm">Twitter</a>
                <a href="#" className="text-gray-500 text-xs sm:text-sm">GitHub</a>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-4 shadow-sm">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Visitor Stats</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Visits</span>
                  <span className="font-semibold text-slate-900">12,458</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-semibold text-slate-900">3,421</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold text-blue-600">892</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Today</span>
                  <span className="font-semibold text-emerald-600">142</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
        {/* Watchlist Modal */}
        {watchlistModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={() => setWatchlistModalOpen(false)} />
            <div className="relative bg-white max-w-lg w-full mx-3 sm:mx-4 rounded-2xl shadow-lg p-4 sm:p-6">
              <button onClick={() => setWatchlistModalOpen(false)} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded text-gray-500">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold mb-4">All Watchlist Symbols</h2>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {watchlist.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer text-xs sm:text-sm" onClick={() => { setSelectedSymbol(item.symbol); setWatchlistModalOpen(false); }}>
                    <div className="font-medium">{item.symbol.replace(/^.*:/,'')}</div>
                    <div className="text-right text-gray-700">{prices[item.symbol]?.price ? `$${prices[item.symbol].price.toFixed(2)}` : '--'}</div>
                    <div className={`text-right text-xs sm:text-sm ${prices[item.symbol]?.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{prices[item.symbol]?.changePercent ? `${prices[item.symbol].changePercent.toFixed(2)}%` : '--'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Article Detail Modal */}
        {openArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setOpenArticle(null)} />
            <div className="relative bg-white max-w-3xl w-full rounded-2xl shadow-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setOpenArticle(null)} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded text-gray-500">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl sm:text-2xl font-serif font-bold mb-2">{openArticle.title}</h2>
              <div className="text-xs sm:text-sm text-gray-500 mb-4">{openArticle.date} • {openArticle.readTime} • {openArticle.author}</div>
              <div className="prose prose-sm max-w-none text-gray-700 text-xs sm:text-sm">
                {openArticle.content || openArticle.excerpt || 'Full article content will appear here.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}
