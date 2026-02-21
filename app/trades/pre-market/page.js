'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function PreMarketPage() {
    const [tradingPlan, setTradingPlan] = useState('');

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const savedPlan = localStorage.getItem('tradingPlan') || '';
        setTradingPlan(savedPlan);
      }
    }, []);
  const [globalMarkets, setGlobalMarkets] = useState(null);
  const [keyLevels, setKeyLevels] = useState({ nifty: null, banknifty: null });
  const [gapData, setGapData] = useState({ nifty: null, banknifty: null });
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeToOpen, setTimeToOpen] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('NIFTY');
  const [selectedPivotType, setSelectedPivotType] = useState('standard');

  // Calculate time to market open
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15, 0);
      
      if (now > today) {
        // Market already opened or it's past market hours
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const diff = tomorrow - now;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeToOpen(`Opens tomorrow in ${hours}h ${minutes}m ${seconds}s`);
      } else {
        const diff = today - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeToOpen(`Opens in ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGlobalMarkets(),
        fetchKeyLevels('NIFTY'),
        fetchKeyLevels('BANKNIFTY'),
        fetchGapData('NIFTY'),
        fetchGapData('BANKNIFTY'),
        fetchCalendar(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalMarkets = async () => {
    try {
      const res = await fetch('/api/pre-market/global-markets');
      const data = await res.json();
      setGlobalMarkets(data);
    } catch (error) {
      console.error('Error fetching global markets:', error);
    }
  };

  const fetchKeyLevels = async (symbol) => {
    try {
      const res = await fetch(`/api/pre-market/key-levels?symbol=${symbol}`);
      const data = await res.json();
      setKeyLevels(prev => ({ ...prev, [symbol.toLowerCase()]: data }));
    } catch (error) {
      console.error(`Error fetching key levels for ${symbol}:`, error);
    }
  };

  const fetchGapData = async (symbol) => {
    try {
      const res = await fetch(`/api/pre-market/gap-calculator?symbol=${symbol}`);
      const data = await res.json();
      setGapData(prev => ({ ...prev, [symbol.toLowerCase()]: data }));
    } catch (error) {
      console.error(`Error fetching gap data for ${symbol}:`, error);
    }
  };

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/pre-market/economic-calendar');
      const data = await res.json();
      setCalendar(data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  const currentKeyLevels = keyLevels[selectedIndex.toLowerCase()];
  const currentGapData = gapData[selectedIndex.toLowerCase()];
  const pivotData = currentKeyLevels?.[selectedPivotType];

  return (
    <div className="min-h-screen bg-[#0a1628] text-slate-100">
      {/* Header */}
      <header className="border-b border-blue-800/50 bg-[#0d1d35]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/trades" className="text-slate-400 hover:text-slate-200">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Pre-Market Analysis
                </h1>
                <p className="text-sm text-slate-400">Plan your trading day before market opens</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700/50">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono text-blue-300">{timeToOpen}</span>
              </div>
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Global Markets Banner */}
        <div className="bg-[#112240] border border-blue-800/40 rounded-xl p-4 mb-6 overflow-x-auto">
          <h2 className="text-sm font-semibold text-blue-300 mb-3">🌍 Global Markets Overview</h2>
          <div className="flex gap-6 min-w-max">
            {globalMarkets?.markets?.map((market) => (
              <div key={market.symbol} className="flex items-center gap-2">
                <div className="text-xs">
                  <div className="text-slate-400">{market.name}</div>
                  <div className="font-mono font-semibold">{market.price?.toLocaleString() || '---'}</div>
                </div>
                <div className={`text-xs font-mono px-2 py-0.5 rounded ${
                  market.changePercent > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {market.changePercent > 0 ? '+' : ''}{market.changePercent?.toFixed(2)}%
                </div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded ${
                  market.status === 'OPEN' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {market.status}
                </div>
              </div>
            ))}
          </div>

          {/* Commodities */}
          <div className="flex gap-6 mt-3 min-w-max pt-3 border-t border-blue-800/30">
            {globalMarkets?.commodities?.map((commodity) => (
              <div key={commodity.symbol} className="flex items-center gap-2">
                <div className="text-xs">
                  <div className="text-slate-400">{commodity.name}</div>
                  <div className="font-mono font-semibold">${commodity.price?.toFixed(2) || '---'}</div>
                </div>
                <div className={`text-xs font-mono ${
                  commodity.changePercent > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {commodity.changePercent > 0 ? '+' : ''}{commodity.changePercent?.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Key Levels */}
          <div className="lg:col-span-4 space-y-6">
            {/* Index Selector */}
            <div className="bg-[#112240] border border-blue-800/40 rounded-xl p-4">
              <div className="flex gap-2 mb-4">
                {['NIFTY', 'BANKNIFTY'].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedIndex === idx 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {idx === 'BANKNIFTY' ? 'Bank Nifty' : 'Nifty 50'}
                  </button>
                ))}
              </div>

              {/* Gap Information */}
              {currentGapData?.success && (
                <div className={`p-3 rounded-lg mb-4 ${
                  currentGapData.gap.type === 'GAP_UP' ? 'bg-green-900/20 border border-green-700/50' :
                  currentGapData.gap.type === 'GAP_DOWN' ? 'bg-red-900/20 border border-red-700/50' :
                  'bg-slate-800/50 border border-slate-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Expected Opening</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      currentGapData.gap.type === 'GAP_UP' ? 'bg-green-900/50 text-green-400' :
                      currentGapData.gap.type === 'GAP_DOWN' ? 'bg-red-900/50 text-red-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {currentGapData.gap.size} {currentGapData.gap.direction}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono">{currentGapData.expectedOpen?.toLocaleString()}</span>
                    <div className="flex items-center gap-1">
                      {currentGapData.gap.type === 'GAP_UP' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : currentGapData.gap.type === 'GAP_DOWN' ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                      <span className={`text-sm font-mono ${
                        currentGapData.gap.type === 'GAP_UP' ? 'text-green-400' :
                        currentGapData.gap.type === 'GAP_DOWN' ? 'text-red-400' :
                        'text-slate-400'
                      }`}>
                        {currentGapData.gap.points > 0 ? '+' : ''}{currentGapData.gap.points} ({currentGapData.gap.percent > 0 ? '+' : ''}{currentGapData.gap.percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Previous Close: {currentGapData.previousClose?.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Pivot Type Selector */}
              <div className="flex gap-1 mb-3 bg-slate-800/30 p-1 rounded-lg">
                {['standard', 'fibonacci', 'camarilla'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedPivotType(type)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                      selectedPivotType === type 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Pivot Levels */}
              {pivotData && (
                <div className="space-y-2">
                  {/* Resistances */}
                  <div className="space-y-1">
                    {(selectedPivotType === 'camarilla' ? ['r4', 'r3', 'r2', 'r1'] : ['r3', 'r2', 'r1']).map(level => (
                      <div key={level} className="flex items-center justify-between py-1.5 px-2 bg-red-900/20 rounded border-l-2 border-red-500/50">
                        <span className="text-xs font-medium text-red-400 uppercase">{level}</span>
                        <span className="text-sm font-mono text-slate-200">{pivotData[level]?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pivot */}
                  {selectedPivotType !== 'camarilla' && (
                    <div className="flex items-center justify-between py-2 px-2 bg-blue-900/20 rounded border-l-2 border-blue-500/50">
                      <span className="text-xs font-medium text-blue-400 uppercase">Pivot</span>
                      <span className="text-sm font-mono font-bold text-blue-300">{pivotData.pivot?.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Supports */}
                  <div className="space-y-1">
                    {(selectedPivotType === 'camarilla' ? ['s1', 's2', 's3', 's4'] : ['s1', 's2', 's3']).map(level => (
                      <div key={level} className="flex items-center justify-between py-1.5 px-2 bg-green-900/20 rounded border-l-2 border-green-500/50">
                        <span className="text-xs font-medium text-green-400 uppercase">{level}</span>
                        <span className="text-sm font-mono text-slate-200">{pivotData[level]?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy Recommendation */}
              {currentGapData?.recommendation && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <div className="text-xs font-semibold text-blue-300 mb-1">{currentGapData.recommendation.strategy}</div>
                  <div className="text-xs text-slate-300">{currentGapData.recommendation.advice}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500">Confidence</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      currentGapData.recommendation.confidence === 'High' ? 'bg-green-900/50 text-green-400' :
                      currentGapData.recommendation.confidence === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {currentGapData.recommendation.confidence}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Economic Calendar & Plan */}
          <div className="lg:col-span-8 space-y-6">
            {/* Economic Calendar */}
            <div className="bg-[#112240] border border-blue-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-blue-300">📅 Today's Economic Calendar</h2>
                {calendar?.summary && (
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded">
                      🔴 {calendar.summary.high} High
                    </span>
                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">
                      🟡 {calendar.summary.medium} Medium
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {calendar?.events?.map((event, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                    event.status === 'COMPLETED' ? 'bg-slate-800/30 border-slate-700/50 opacity-60' :
                    event.status === 'SOON' ? 'bg-amber-900/20 border-amber-700/50' :
                    'bg-slate-800/50 border-slate-700/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.impact === 'HIGH' ? 'bg-red-500' :
                        event.impact === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">{event.event}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{event.country}</span>
                          {event.previous && <span>Prev: {event.previous}</span>}
                          {event.forecast && <span>Forecast: {event.forecast}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-slate-300">{event.time}</div>
                      {event.minutesUntil > 0 && (
                        <div className="text-xs text-slate-500">{event.minutesUntil}m</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trading Plan */}
            <div className="bg-[#112240] border border-blue-800/40 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-blue-300 mb-4">📝 Today's Trading Plan</h2>
              <textarea
                className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Write your trading plan here...

Example:
- Market Bias: Bullish (Gap up expected)
- Entry: Long above 23,350 after 9:30 AM
- Target: 23,500 (R1 level)
- Stop Loss: 23,300
- Risk: 50 points = ₹5,000 (1 lot)
- Notes: Avoid first 15 mins, watch for confirmation"
                value={tradingPlan}
                onChange={(e) => {
                  setTradingPlan(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('tradingPlan', e.target.value);
                  }
                }}
                onChange={(e) => localStorage.setItem('tradingPlan', e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                  Save Plan
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}