'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft } from 'lucide-react';

export default function ScannerPage() {
  const router = useRouter();
  const [scans, setScans] = useState({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lastAlertId, setLastAlertId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [marketData, setMarketData] = useState(null); // Main market data state

  const formatVal = (v, decimals=2) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number') return v.toFixed(decimals);
    return String(v);
  };
  
  const containerRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show notification
  const showNotification = (alertData) => {
    const message = `🔔 New Alert: ${alertData.alertName}`;
    
    // Toast notification
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ChartInk Scanner', {
        body: `${alertData.alertName}\n${alertData.stocks.length} stocks`,
        icon: '/favicon.ico',
        tag: 'chartink-alert'
      });
    }
    
    // Play sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2i78OScTgwOUKni77RgGwU7k9jwzn0sBC' );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Fetch scans
  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/get-scans');
        const data = await response.json();
        
        // Check for new alert
        if (data.latest && data.latest.id !== lastAlertId) {
          if (lastAlertId !== null) {
            const parsedData = parseChartInkData(data.latest);
            if (parsedData) {
              showNotification(parsedData);
            }
          }
          setLastAlertId(data.latest.id);
        }
        
        setScans(data);
        setLastUpdate(new Date());
        setLoading(false);
        
        if (data.latest && !selectedStock) {
          const parsed = parseChartInkData(data.latest);
          if (parsed && parsed.stocks.length > 0) {
            setSelectedStock(parsed.stocks[0].symbol);
          }
        }
      } catch (error) {
        console.error('Error fetching scans:', error);
        setLoading(false);
      }
    };

    fetchScans();
    const interval = setInterval(fetchScans, 30000);

    return () => clearInterval(interval);
  }, [selectedStock, lastAlertId]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data');
        const data = await response.json();
        console.log('Market data fetched:', data);
        setMarketData(data);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 300000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current || isMobile) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newWidth >= 20 && newWidth <= 50) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  const parseChartInkData = (scan) => {
    if (!scan || !scan.stocks) return null;

    const stocks = Array.isArray(scan.stocks)
      ? scan.stocks.map(s => String(s).trim())
      : String(scan.stocks).split(",").map(s => s.trim());
    const prices = scan.trigger_prices
      ? (Array.isArray(scan.trigger_prices)
          ? scan.trigger_prices.map(p => String(p).trim())
          : String(scan.trigger_prices).split(",").map(p => p.trim()))
      : [];
    
    return {
      alertName: scan.alert_name || 'Unknown Alert',
      scanName: scan.scan_name || 'Scan',
      triggeredAt: scan.triggered_at || "N/A",
      receivedAt: scan.receivedAt || null,
      scanUrl: scan.scan_url,
      stocks: stocks.map((stock, idx) => ({
        symbol: stock,
        price: prices[idx] || 'N/A'
      }))
    };
  };

  const openTradingViewChart = (symbol) => {
    window.open(`https://www.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading scanner data...</div>
      </div>
    );
  }

  const latestData = scans.latest ? parseChartInkData(scans.latest) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <span className="font-semibold">{notification}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-2 sm:px-4 py-4 max-w-full">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/trades')}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white text-sm"
              title="Go back to trades"
            >
              <ArrowLeft size={18} />
              <span>Back to Trades</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">📊 ChartInk Scanner</h1>
              {lastUpdate && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </header>

        {latestData ? (
          <>
            {/* Desktop Layout */}
            {!isMobile ? (
              <div 
                ref={containerRef}
                className="flex gap-0 h-[calc(100vh-120px)] relative"
              >
                <div 
                  className="bg-slate-800 rounded-l-lg border border-slate-700 overflow-hidden flex flex-col"
                  style={{ width: `${leftWidth}%` }}
                >
                  <div className="p-4 border-b border-slate-700 bg-slate-750">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white mb-1">
                          {latestData.alertName}
                        </h2>
                        <p className="text-slate-400 text-sm mb-1">{latestData.scanName}</p>
                        {latestData.scanUrl && (
                          <a 
                            href={`https://chartink.com/screener/${latestData.scanUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View on ChartInk →
                          </a>
                        )}
                      </div>
                      <span className="text-slate-400 text-sm whitespace-nowrap ml-4">
                        ⏰ Triggered: {latestData.triggeredAt}
                        {latestData.receivedAt && (
                          <div className="text-slate-500 text-xs mt-1">
                            Received: {new Date(latestData.receivedAt).toLocaleString()}
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-2">
                      Total stocks: {latestData.stocks.length}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-3 text-slate-300 font-semibold text-sm">#</th>
                          <th className="text-left py-3 px-3 text-slate-300 font-semibold text-sm">Stock</th>
                          <th className="text-right py-3 px-3 text-slate-300 font-semibold text-sm">Price</th>
                          <th className="text-center py-3 px-3 text-slate-300 font-semibold text-sm">Chart</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestData.stocks.map((stock, idx) => (
                          <tr 
                            key={idx} 
                            className={`border-b border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer ${
                              selectedStock === stock.symbol ? 'bg-slate-700' : ''
                            }`}
                            onClick={() => setSelectedStock(stock.symbol)}
                          >
                            <td className="py-3 px-3 text-slate-400 text-sm">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className={`font-semibold ${
                                selectedStock === stock.symbol ? 'text-green-300' : 'text-green-400'
                              }`}>
                                {stock.symbol}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-white font-mono text-sm">
                                ₹{stock.price}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTradingViewChart(stock.symbol);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-slate-600"
                                title="Open in TradingView"
                              >
                                📈
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div 
                  className="w-1 bg-slate-600 hover:bg-blue-500 cursor-col-resize transition-colors relative group"
                  onMouseDown={() => setIsDragging(true)}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20"></div>
                </div>

                <div 
                  className="bg-slate-800 border border-slate-700 overflow-hidden flex flex-col"
                  style={{ width: `${100 - leftWidth}%` }}
                >
                  {/* Top Analytics Section */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 sm:p-4 bg-slate-750 border-b border-slate-700">
                    {/* Section 1: Market Indices */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 lg:p-4 flex flex-col justify-center min-h-20 lg:min-h-24">
                      <h4 className="text-slate-300 text-xs font-semibold mb-2 lg:mb-3 text-center">Market Indices</h4>
                      <div className="space-y-1 lg:space-y-2">
                        {/* Nifty with change indicator */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Nifty 50</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white text-xs lg:text-sm font-mono">
                              {marketData?.indices?.nifty || '---'}
                            </span>
                            {marketData?.indices?.niftyChange && (
                              <span className={`text-xs font-mono ${
                                parseFloat(marketData.indices.niftyChange) >= 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {parseFloat(marketData.indices.niftyChange) >= 0 ? '▲' : '▼'}
                                {Math.abs(parseFloat(marketData.indices.niftyChange)).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Bank Nifty */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Bank Nifty</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.indices?.bankNifty || '---'}
                          </span>
                        </div>
                        
                        {/* Sensex */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Sensex</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.indices?.sensex || '---'}
                          </span>
                        </div>
                        
                        {/* VIX */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">India VIX</span>
                          <span className="text-orange-400 text-xs lg:text-sm font-mono">
                            {marketData?.indices?.vix || '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Global Indices */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 lg:p-4 flex flex-col justify-center min-h-20 lg:min-h-24">
                      <h4 className="text-slate-300 text-xs font-semibold mb-2 lg:mb-3 text-center">Global Indices</h4>
                      <div className="space-y-1 lg:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">DOW</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.global?.dow || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">GIFT Nifty</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.indices?.giftNifty || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">NASDAQ</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.global?.nasdaq || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">DAX</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.global?.dax || '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Market Sentiment */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 lg:p-4 flex flex-col justify-center min-h-20 lg:min-h-24">
                      <h4 className="text-slate-300 text-xs font-semibold mb-2 lg:mb-3 text-center">Market Sentiment</h4>
                      <div className="space-y-1 lg:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Nifty Bias</span>
                          <span className={`text-xs lg:text-sm font-mono ${
                            marketData?.sentiment?.bias === 'Bullish' ? 'text-green-400' : 
                            marketData?.sentiment?.bias === 'Bearish' ? 'text-red-400' : 
                            'text-slate-400'
                          }`}>
                            {marketData?.sentiment?.bias || 'Neutral'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Adv/Decline</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.sentiment?.advDecline || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">PCR</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.sentiment?.pcr || '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Commodities */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 lg:p-4 flex flex-col justify-center min-h-20 lg:min-h-24">
                      <h4 className="text-slate-300 text-xs font-semibold mb-2 lg:mb-3 text-center">Commodities</h4>
                      <div className="space-y-1 lg:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Crude Oil</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.commodities?.crude || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Silver</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.commodities?.silver || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Gold</span>
                          <span className="text-yellow-400 text-xs lg:text-sm font-mono">
                            {marketData?.commodities?.gold || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Nat. Gas</span>
                          <span className="text-white text-xs lg:text-sm font-mono">
                            {marketData?.commodities?.natGas || '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Centre Section */}
                    <div className="flex-1 flex flex-col bg-slate-900">
                      <div className="p-4 border-b border-slate-700 bg-slate-800">
                        <h3 className="text-lg font-semibold text-white">
                          {selectedStock ? `${selectedStock}` : 'Scanner Context'}
                        </h3>
                      </div>
                      
                      <div className="flex-1 flex flex-col overflow-y-auto p-6">
                        {/* Analytics Section */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Latest Scan</p>
                            <p className="text-3xl font-bold text-blue-400">{latestData.stocks.length}</p>
                            <p className="text-xs text-slate-600 mt-1">Stocks</p>
                          </div>
                          
                          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Last 20 Scans</p>
                            <p className="text-3xl font-bold text-emerald-400">
                              {scans.history && scans.history.length > 0
                                ? (
                                    scans.history.slice(0, 20).reduce((sum, scan) => {
                                      const parsed = parseChartInkData(scan);
                                      return sum + (parsed ? parsed.stocks.length : 0);
                                    }, latestData.stocks.length) / Math.min(scans.history.length + 1, 21)
                                  ).toFixed(1)
                                : latestData.stocks.length
                              }
                            </p>
                            <p className="text-xs text-slate-600 mt-1">Avg Stocks</p>
                          </div>
                        </div>

                        {/* Chart: Last 10 Scans */}
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
                          <p className="text-xs text-slate-500 mb-3 text-center">Stock Count Trend (Last 10 Scans)</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={(() => {
                              const chartData = [];
                              const allScans = [{ stocks: latestData.stocks, name: 'Latest' }, ...scans.history];
                              for (let i = Math.min(9, allScans.length - 1); i >= 0; i--) {
                                const scan = allScans[i];
                                const parsed = i === 0 ? latestData : parseChartInkData(scan);
                                if (parsed) {
                                  chartData.push({
                                    time: `${9 - i}`,
                                    count: parsed.stocks.length
                                  });
                                }
                              }
                              return chartData.length > 0 ? chartData : [{ time: '1', count: latestData.stocks.length }];
                            })()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="time" stroke="#94a3b8" label={{ value: 'Scan #', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                              <YAxis stroke="#94a3b8" label={{ value: 'Stocks', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                              <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="border-t border-slate-700 my-4"></div>

                        <div className="text-center">
                          {selectedStock ? (
                            <>
                              <h2 className="text-3xl font-bold text-green-400 mb-3">{selectedStock}</h2>
                              <div className="space-y-2 text-slate-300 text-sm">
                                <div>
                                  <p className="text-xs text-slate-500">Alert: {latestData.alertName}</p>
                                  <p className="text-xs text-slate-500">Triggered: {latestData.triggeredAt}</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-slate-400 text-sm">👈 Select a stock from the list</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:block w-1 bg-slate-700"></div>

                    {/* Chart Buttons */}
                    <div className="hidden lg:flex w-48 bg-slate-800 flex-col items-center py-4 gap-3 overflow-y-auto px-3">
                      {selectedStock ? (
                        <>
                          <button
                            onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${selectedStock}`, '_blank')}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            📊 TradingView
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BSE:${selectedStock}`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            📋 TradingView BSE
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://www.google.com/finance/quote/${selectedStock}:NSE`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            💹 Google Finance
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://chartink.com/stocks/${selectedStock.toLowerCase()}.html`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            📈 ChartInk
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-400 text-center text-xs py-4">
                          <p>👈 Select a stock</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile Layout */
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    {latestData.alertName}
                  </h2>
                  <p className="text-slate-400 text-sm mb-2">{latestData.scanName}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">⏰ {latestData.triggeredAt}</span>
                    <span className="text-slate-400">Stocks: {latestData.stocks.length}</span>
                  </div>
                  {latestData.scanUrl && (
                    <a 
                      href={`https://chartink.com/screener/${latestData.scanUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs underline mt-2 inline-block"
                    >
                      View on ChartInk →
                    </a>
                  )}
                </div>

                {/* Analytics Boxes Mobile */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 text-center">Market</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Nifty</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.indices?.nifty || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">GIFT</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.indices?.giftNifty || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">VIX</span>
                        <span className="text-orange-400 text-xs font-mono">
                          {marketData?.indices?.vix || '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 text-center">Global</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">DOW</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.global?.dow || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">NASDAQ</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.global?.nasdaq || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">DAX</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.global?.dax || '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 text-center">Sentiment</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Bias</span>
                        <span className={`text-xs font-mono ${
                          marketData?.sentiment?.bias === 'Bullish' ? 'text-green-400' : 
                          marketData?.sentiment?.bias === 'Bearish' ? 'text-red-400' : 
                          'text-slate-400'
                        }`}>
                          {marketData?.sentiment?.bias || 'Neutral'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Adv/Dec</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.sentiment?.advDecline || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">PCR</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.sentiment?.pcr || '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 text-center">Commodities</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Crude</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.commodities?.crude || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Gold</span>
                        <span className="text-yellow-400 text-xs font-mono">
                          {marketData?.commodities?.gold || '---'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Silver</span>
                        <span className="text-white text-xs font-mono">
                          {marketData?.commodities?.silver || '---'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStock && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-green-400 mb-3">{selectedStock}</h2>
                      <div className="bg-slate-900 rounded p-3">
                        <p className="text-xs text-slate-500 mb-1">Total Stocks in Scan</p>
                        <p className="text-4xl font-bold text-blue-400">{latestData.stocks.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-750">
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-2 text-slate-300 font-semibold text-xs">#</th>
                          <th className="text-left py-2 px-2 text-slate-300 font-semibold text-xs">Stock</th>
                          <th className="text-right py-2 px-2 text-slate-300 font-semibold text-xs">Price</th>
                          <th className="text-center py-2 px-2 text-slate-300 font-semibold text-xs">View</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestData.stocks.map((stock, idx) => (
                          <tr 
                            key={idx} 
                            className="border-b border-slate-700 active:bg-slate-700"
                          >
                            <td className="py-3 px-2 text-slate-400 text-xs">{idx + 1}</td>
                            <td className="py-3 px-2">
                              <span className="font-semibold text-green-400 text-sm">
                                {stock.symbol}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-white font-mono text-xs">
                                ₹{stock.price}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => openTradingViewChart(stock.symbol)}
                                className="text-blue-400 active:text-blue-300 text-lg px-2"
                              >
                                📈
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedStock && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Quick Chart Links</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${selectedStock}`, '_blank')}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                      >
                        📊 TradingView
                      </button>
                      <button
                        onClick={() => window.open(`https://www.google.com/finance/quote/${selectedStock}:NSE`, '_blank')}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold"
                      >
                        💹 Google
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            {scans.history.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">
                  Previous Alerts ({Math.max(scans.history.length - 1, 0)})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {scans.history.slice(1).map((scan) => {
                    const data = parseChartInkData(scan);
                    if (!data) return null;
                    
                    return (
                      <div 
                        key={scan.id} 
                        className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 cursor-pointer"
                        onClick={() => {
                          setScans({ ...scans, latest: scan });
                          if (data.stocks.length > 0) {
                            setSelectedStock(data.stocks[0].symbol);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white text-xs sm:text-sm truncate">
                            {data.alertName}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {data.triggeredAt}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs">
                          <span className="font-mono text-green-400 text-xs">
                            {data.stocks.slice(0, 3).map(s => s.symbol).join(', ')}
                          </span>
                          {data.stocks.length > 3 && (
                            <span className="text-slate-500"> +{data.stocks.length - 3}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 sm:p-12 text-center border border-slate-700">
            <p className="text-lg sm:text-xl mb-2 text-white">⏳ Waiting for scanner data...</p>
            <p className="text-slate-400 text-xs sm:text-sm">
              Webhook URL: https://bhatiaverse.com/api/chartink-webhook
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}