'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScannerPage() {
  const [scans, setScans] = useState({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lastAlertId, setLastAlertId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
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
    
    // Play sound (optional - you can add a sound file)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2i78OScTgwOUKni77RgGwU7k9jwzn0sBC' );
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if autoplay blocked
    } catch (e) {
      // Ignore audio errors
    }
  };

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/get-scans');
        const data = await response.json();
        
        // Check for new alert
        if (data.latest && data.latest.id !== lastAlertId) {
          if (lastAlertId !== null) { // Don't notify on first load
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

    const stocks = scan.stocks.split(',').map(s => s.trim());
    const prices = scan.trigger_prices ? scan.trigger_prices.split(',').map(p => p.trim()) : [];
    
    return {
      alertName: scan.alert_name || 'Unknown Alert',
      scanName: scan.scan_name || 'Scan',
      triggeredAt: scan.triggered_at || scan.receivedAt,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">📊 ChartInk Scanner</h1>
          {lastUpdate && (
            <p className="text-slate-400 text-xs sm:text-sm">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
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
                        ⏰ {latestData.triggeredAt}
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
                  {/* Top Analytics Section: 4 Equal Rectangular Sections */}
                  <div className="grid grid-cols-4 gap-2 p-4 bg-slate-750 border-b border-slate-700">
                    {[1, 2, 3, 4].map((section) => (
                      <div 
                        key={section}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-center min-h-24"
                      >
                        <div className="text-center">
                          <p className="text-slate-400 text-sm">Section {section}</p>
                          <p className="text-slate-500 text-xs mt-1">Analytics</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Centre Section: Context Messages */}
                    <div className="flex-1 flex flex-col bg-slate-900">
                      <div className="p-4 border-b border-slate-700 bg-slate-800">
                        <h3 className="text-lg font-semibold text-white">
                          {selectedStock ? `${selectedStock}` : 'Scanner Context'}
                        </h3>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center p-6">
                        {selectedStock ? (
                          <div className="text-center">
                            <h2 className="text-4xl font-bold text-green-400 mb-4">{selectedStock}</h2>
                            <div className="space-y-4 text-slate-300">
                              <div>
                                <p className="text-sm text-slate-500">Total Stocks in Current Scan</p>
                                <p className="text-5xl font-bold text-blue-400 mt-2">{latestData.stocks.length}</p>
                              </div>
                              <div className="pt-4 border-t border-slate-700">
                                <p className="text-xs text-slate-500">Alert: {latestData.alertName}</p>
                                <p className="text-xs text-slate-500">Triggered: {latestData.triggeredAt}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-center">
                            <p className="text-xl mb-2">👈 Select a stock from the list</p>
                            <div className="mt-4 p-4 bg-slate-800 rounded">
                              <p className="text-sm text-slate-400">Total Stocks Available</p>
                              <p className="text-3xl font-bold text-blue-400 mt-2">{latestData.stocks.length}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-1 bg-slate-700"></div>

                    {/* Rightmost Section: Chart Buttons with Labels */}
                    <div className="w-48 bg-slate-800 flex flex-col items-center py-4 gap-3 overflow-y-auto px-3">
                      {selectedStock ? (
                        <>
                          <button
                            onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${selectedStock}`, '_blank')}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            title="TradingView (NSE)"
                          >
                            📊 TradingView
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BSE:${selectedStock}`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            title="TradingView (BSE)"
                          >
                            📋 TradingView BSE
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://www.google.com/finance/quote/${selectedStock}:NSE`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            title="Google Finance"
                          >
                            💹 Google Finance
                          </button>
                          
                          <button
                            onClick={() => window.open(`https://chartink.com/stocks/${selectedStock.toLowerCase()}.html`, '_blank')}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            title="ChartInk"
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
              /* Mobile Layout - Stacked */
              <div className="space-y-4">
                {/* Alert Header */}
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

                {/* Stock List */}
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

                {/* Quick Chart Links */}
                {selectedStock && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Quick Chart Links
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${selectedStock}`, '_blank')}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold"
                      >
                        📊 TradingView
                      </button>
                      <button
                        onClick={() => window.open(`https://www.google.com/finance/quote/${selectedStock}:NSE`, '_blank')}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded text-xs font-semibold"
                      >
                        💹 Google
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            {scans.history.length > 1 && (
              <div className="mt-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">
                  Previous Alerts ({scans.history.length - 1})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {scans.history.slice(1).map((scan) => {
                    const data = parseChartInkData(scan);
                    if (!data) return null;
                    
                    return (
                      <div 
                        key={scan.id} 
                        className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 active:bg-slate-700 transition-colors cursor-pointer"
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