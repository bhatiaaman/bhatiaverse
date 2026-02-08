'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScannerPage() {
  const [scans, setScans] = useState({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/get-scans');
        const data = await response.json();
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
  }, [selectedStock]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
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
  }, [isDragging]);

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
    // Try different TradingView URL formats
    const urls = [
      `https://www.tradingview.com/chart/?symbol=NSE:${symbol}`,
      `https://www.tradingview.com/chart/?symbol=BSE:${symbol}`,
      `https://in.tradingview.com/symbols/NSE-${symbol}/`,
    ];
    
    // Open the first URL (users can try others if needed)
    window.open(urls[0], '_blank');
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
      <div className="container mx-auto px-4 py-4 max-w-full">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-white">📊 ChartInk Scanner</h1>
          {lastUpdate && (
            <p className="text-slate-400 text-sm">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </header>

        {latestData ? (
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
              className="bg-slate-800 rounded-r-lg border border-slate-700 overflow-hidden flex flex-col"
              style={{ width: `${100 - leftWidth}%` }}
            >
              <div className="p-4 border-b border-slate-700 bg-slate-750">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedStock ? `${selectedStock}` : 'Select a stock'}
                  </h3>
                  
                  {selectedStock && (
                    <button
                      onClick={() => openTradingViewChart(selectedStock)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
                    >
                      Open in TradingView ↗
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-slate-900">
                {selectedStock ? (
                  <div className="text-center p-8">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-white mb-2">{selectedStock}</h2>
                      <p className="text-slate-400">Click button above to view chart on TradingView</p>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${selectedStock}`, '_blank')}
                        className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        📊 TradingView (NSE)
                      </button>
                      
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BSE:${selectedStock}`, '_blank')}
                        className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        📊 TradingView (BSE)
                      </button>
                      
                      <button
                        onClick={() => window.open(`https://www.google.com/finance/quote/${selectedStock}:NSE`, '_blank')}
                        className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        💹 Google Finance
                      </button>
                      
                      <button
                        onClick={() => window.open(`https://chartink.com/stocks/${selectedStock.toLowerCase()}.html`, '_blank')}
                        className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        📈 ChartInk
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center">
                    <p className="text-xl mb-2">👈 Select a stock from the list</p>
                    <p className="text-sm">Click on any stock to view chart options</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-xl mb-2 text-white">⏳ Waiting for scanner data...</p>
            <p className="text-slate-400 text-sm">
              Webhook URL: https://bhatiaverse.com/api/chartink-webhook
            </p>
          </div>
        )}

        {scans.history.length > 1 && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-3 text-white">
              Previous Alerts ({scans.history.length - 1})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {scans.history.slice(1).map((scan) => {
                const data = parseChartInkData(scan);
                if (!data) return null;
                
                return (
                  <div 
                    key={scan.id} 
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 transition-colors cursor-pointer"
                    onClick={() => {
                      setScans({ ...scans, latest: scan });
                      if (data.stocks.length > 0) {
                        setSelectedStock(data.stocks[0].symbol);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm truncate">
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
      </div>
    </div>
  );
}