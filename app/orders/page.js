'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  RefreshCw,
  Wallet,
  BarChart2,
  ExternalLink
} from 'lucide-react';

export default function OrdersPage() {

  const [isLoading, setIsLoading] = useState(true);
  const [isKiteConnected, setIsKiteConnected] = useState(false);
  const [ltpLoading, setLtpLoading] = useState(false);
  const [instrumentType, setInstrumentType] = useState('EQ');
  const [optionSymbol, setOptionSymbol] = useState('');
  const [optionTvSymbol, setOptionTvSymbol] = useState('');
  const [optionLtp, setOptionLtp] = useState(null);
  const [optionStrike, setOptionStrike] = useState(null);
  const [optionExpiry, setOptionExpiry] = useState('');
  const [transactionType, setTransactionType] = useState('BUY');
  const [productType, setProductType] = useState('MIS');
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [lotSize, setLotSize] = useState(1);
  const [searching, setSearching] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [spotPrice, setSpotPrice] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [openOrders, setOpenOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [expiryType, setExpiryType] = useState('weekly');

  const popularStocks = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'HDFC', 'BHARTIARTL'];
  const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

  const checkKiteConnection = async () => {
    try {
      const res = await fetch('/api/kite-config');
      const data = await res.json();
      setIsKiteConnected(data.tokenValid);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/kite-orders?limit=50');
      const data = await res.json();
      if (data.success) {
        setOpenOrders(data.orders.filter(o => ['OPEN', 'PENDING', 'TRIGGER PENDING'].includes(o.status?.toUpperCase())));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchPositions = async () => {
    setPositionsLoading(true);
    try {
      const res = await fetch('/api/kite-positions');
      const data = await res.json();
      if (data.success && Array.isArray(data.positions)) {
        setPositions(data.positions);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.error('Error:', err);
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  useEffect(() => {
    checkKiteConnection();
    fetchOpenOrders();
    fetchPositions();
  }, []);

  useEffect(() => {
    if ((instrumentType === 'CE' || instrumentType === 'PE') && symbol && spotPrice) {
      fetchOptionDetails();
    } else if (instrumentType === 'EQ') {
      setOptionSymbol(''); setOptionTvSymbol(''); setOptionLtp(null); setOptionStrike(null); setOptionExpiry('');
      setQuantity(1);
    } else if (instrumentType === 'FUT') {
      setOptionSymbol(''); setOptionTvSymbol(''); setOptionLtp(null); setOptionStrike(null); setOptionExpiry('');
      setQuantity(lotSize || 1);
    }
  }, [instrumentType, symbol, spotPrice, lotSize, expiryType]);

  useEffect(() => {
    if (instrumentType === 'EQ' && productType === 'NRML') setProductType('MIS');
    else if ((instrumentType === 'FUT' || instrumentType === 'CE' || instrumentType === 'PE') && productType === 'CNC') setProductType('MIS');
  }, [instrumentType]);

  const fetchOptionDetails = async () => {
    if (!symbol || !spotPrice) return;
    try {
      const url = `/api/option-details?symbol=${symbol}&spotPrice=${spotPrice}&instrumentType=${instrumentType}&expiryType=${expiryType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.optionSymbol) {
        setOptionSymbol(data.optionSymbol || '');
        setOptionTvSymbol(data.tvSymbol || '');
        setOptionLtp(data.ltp || null);
        setOptionStrike(data.strike || null);
        setOptionExpiry(data.expiryDay || '');
        setQuantity(lotSize || 1);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSearch = async (query) => {
    setSymbol(query);
    if (!query || query.length < 1) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search-instruments?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.instruments && data.instruments.length > 0) {
        setSearchResults(data.instruments.slice(0, 10));
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectStock = async (selectedSymbol, knownLotSize = null) => {
    setSymbol(selectedSymbol);
    setShowDropdown(false);
    setSearchResults([]);
    // Apply lot size from search result immediately if available
    if (knownLotSize && knownLotSize > 1) setLotSize(knownLotSize);
    setLtpLoading(true);
    try {
      const res = await fetch(`/api/ltp?symbol=${selectedSymbol}`);
      const data = await res.json();
      if (data.success && data.ltp) {
        setSpotPrice(data.ltp);
        // Only use ltp lotSize if we don't already have one from search
        if (data.lotSize && data.lotSize > 1 && !knownLotSize) setLotSize(data.lotSize);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLtpLoading(false);
    }
  };

  const openChart = (chartSymbol, isOption = false) => {
    const tvSymbol = isOption ? chartSymbol : `NSE:${chartSymbol}`;
    window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`, '_blank');
  };

  const getEstimatedValue = () => {
    const p = (instrumentType === 'EQ' || instrumentType === 'FUT') ? spotPrice : optionLtp;
    const ep = orderType === 'MARKET' ? p : (parseFloat(price) || p);
    if (!ep || !quantity) return null;
    return (ep * quantity).toFixed(2);
  };

  const placeOrder = async () => {
    if (!symbol) return;
    let ts, ex;
    if (instrumentType === 'EQ') {
      ts = symbol; ex = 'NSE';
    } else if (instrumentType === 'FUT') {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mmm = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      ts = `${symbol}${yy}${mmm}FUT`; ex = 'NFO';
    } else {
      ts = optionSymbol; ex = 'NFO';
    }
    if (!ts) { alert('Invalid symbol'); return; }
    setOrderPlacing(true);
    try {
      const payload = {
        variety: 'regular',
        exchange: ex,
        tradingsymbol: ts,
        transaction_type: transactionType,
        quantity: parseInt(quantity),
        product: productType,
        order_type: orderType
      };
      if (orderType === 'LIMIT' || orderType === 'SL') payload.price = parseFloat(price);
      if (orderType === 'SL' || orderType === 'SL-M') payload.trigger_price = parseFloat(triggerPrice);
      const res = await fetch('/api/kite-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Order placed! ID: ${data.order_id}`);
        fetchOpenOrders();
        fetchPositions();
        setPrice('');
        setTriggerPrice('');
      } else {
        alert(`Failed: ${data.error || 'Unknown'}`);
      }
    } catch (err) {
      alert('Error placing order');
    } finally {
      setOrderPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/trades" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                  Order Management
                </h1>
                <p className="text-sm text-gray-400">Place trades & manage positions</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isKiteConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isKiteConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              {isKiteConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel: Stock Selection & Order Form (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-400" /> Place Order
              </h2>
              <div className="mb-4 relative">
                <label className="text-sm text-gray-400 mb-1.5 block">Stock / Index</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => handleSearch(e.target.value.toUpperCase())}
                    placeholder="Search any NSE symbol..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                  />
                  {searching && <RefreshCw size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {searchResults.map((inst, idx) => (
                      <button
                        key={`${inst.symbol}-${idx}`}
                        onClick={() => selectStock(inst.symbol, inst.lotSize)}
                        className="w-full px-4 py-2.5 text-left hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0"
                      >
                        <div>
                          <span className="font-medium text-sm">{inst.symbol}</span>
                          <span className="text-xs text-gray-500 ml-2">{inst.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${inst.type === 'INDEX' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {inst.type === 'INDEX' ? 'INDEX' : inst.exchange}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1.5 block">Quick Select</label>
                <div className="flex flex-wrap gap-2">
                  {popularStocks.map((s) => (
                    <button
                      key={s}
                      onClick={() => selectStock(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg border ${symbol === s ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {symbol && (
                <>
                  {symbol === 'NIFTY' && (instrumentType === 'CE' || instrumentType === 'PE') && (
                    <div className="mb-2 flex gap-2 items-center">
                      <span className="text-xs text-gray-400">Expiry:</span>
                      <button
                        className={`px-2 py-1 rounded text-xs font-medium border ${expiryType === 'weekly' ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-300'}`}
                        onClick={() => setExpiryType('weekly')}
                      >Weekly</button>
                      <button
                        className={`px-2 py-1 rounded text-xs font-medium border ${expiryType === 'monthly' ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-300'}`}
                        onClick={() => setExpiryType('monthly')}
                      >Monthly</button>
                    </div>
                  )}
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-sm">Spot Price</span>
                        <p className="text-lg font-semibold">{symbol}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {ltpLoading
                          ? <RefreshCw size={20} className="animate-spin text-gray-400" />
                          : spotPrice
                            ? <span className="text-2xl font-bold">₹{spotPrice.toLocaleString()}</span>
                            : <span className="text-gray-500">--</span>
                        }
                        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg px-2 py-1 border border-white/10">
                          <BarChart2 size={14} className="text-gray-400 mr-1" />
                          <button
                            onClick={() => openChart(symbol, false)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium px-1.5 py-0.5 hover:bg-blue-500/20 rounded transition-colors flex items-center gap-0.5"
                            title="Equity Chart"
                          >
                            EQ <ExternalLink size={10} />
                          </button>
                          <button
                            onClick={() => optionTvSymbol && instrumentType === 'CE' ? openChart(optionTvSymbol, true) : alert('Select CE option first')}
                            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5 ${instrumentType === 'CE' && optionTvSymbol ? 'text-green-400 hover:text-green-300 hover:bg-green-500/20' : 'text-gray-500'}`}
                            title="CE Option Chart"
                          >
                            CE <ExternalLink size={10} />
                          </button>
                          <button
                            onClick={() => optionTvSymbol && instrumentType === 'PE' ? openChart(optionTvSymbol, true) : alert('Select PE option first')}
                            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5 ${instrumentType === 'PE' && optionTvSymbol ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' : 'text-gray-500'}`}
                            title="PE Option Chart"
                          >
                            PE <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {symbol && spotPrice && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 p-5">
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1.5 block">Instrument Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(INDICES.includes(symbol) ? ['FUT', 'CE', 'PE'] : ['EQ', 'CE', 'PE']).map((t) => (
                      <button
                        key={t}
                        onClick={() => setInstrumentType(t)}
                        className={`py-2 rounded-lg text-sm font-medium ${instrumentType === t
                          ? (t === 'EQ' || t === 'FUT' ? 'bg-blue-500' : t === 'CE' ? 'bg-green-500' : 'bg-red-500') + ' text-white'
                          : 'bg-white/5 border border-white/10'}`}
                      >
                        {t === 'EQ' ? 'Equity' : t === 'FUT' ? 'Futures' : t === 'CE' ? 'Call (CE)' : 'Put (PE)'}
                      </button>
                    ))}
                  </div>
                </div>
                {(instrumentType === 'CE' || instrumentType === 'PE') && optionSymbol && (
                  <div className="mb-4 p-3 bg-slate-900/70 rounded-xl border border-white/5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500 text-xs">Symbol</span><p className="font-medium text-xs">{optionSymbol}</p></div>
                      <div><span className="text-gray-500 text-xs">Strike</span><p className="font-medium">₹{optionStrike}</p></div>
                      <div><span className="text-gray-500 text-xs">Expiry</span><p className="font-medium text-xs">{optionExpiry}</p></div>
                      <div><span className="text-gray-500 text-xs">LTP</span><p className={`font-bold ${instrumentType === 'CE' ? 'text-green-400' : 'text-red-400'}`}>₹{optionLtp || '--'}</p></div>
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1.5 block">Transaction</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTransactionType('BUY')}
                      className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${transactionType === 'BUY' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}
                    >
                      <TrendingUp size={18} /> BUY
                    </button>
                    <button
                      onClick={() => setTransactionType('SELL')}
                      className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${transactionType === 'SELL' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}
                    >
                      <TrendingDown size={18} /> SELL
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1.5 block">Product Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setProductType('MIS')}
                      className={`py-2 rounded-lg text-sm font-medium ${productType === 'MIS' ? 'bg-purple-500 text-white' : 'bg-white/5 border border-white/10'}`}
                    >
                      MIS (Intraday)
                    </button>
                    {instrumentType === 'EQ' ? (
                      <button
                        onClick={() => setProductType('CNC')}
                        className={`py-2 rounded-lg text-sm font-medium ${productType === 'CNC' ? 'bg-indigo-500 text-white' : 'bg-white/5 border border-white/10'}`}
                      >
                        CNC (Delivery)
                      </button>
                    ) : (
                      <button
                        onClick={() => setProductType('NRML')}
                        className={`py-2 rounded-lg text-sm font-medium ${productType === 'NRML' ? 'bg-indigo-500 text-white' : 'bg-white/5 border border-white/10'}`}
                      >
                        NRML (Carryover)
                      </button>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1.5 block">Order Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['MARKET', 'LIMIT', 'SL', 'SL-M'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={`py-2 rounded-lg text-xs font-medium ${orderType === t ? 'bg-blue-500 text-white' : 'bg-white/5 border border-white/10'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1.5 block">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                  />
                  {instrumentType !== 'EQ' && lotSize > 1 && (
                    <p className="text-xs text-gray-500 mt-1">Lot Size: {lotSize}</p>
                  )}
                </div>
                {(orderType === 'LIMIT' || orderType === 'SL') && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1.5 block">Price</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.05"
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                )}
                {(orderType === 'SL' || orderType === 'SL-M') && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1.5 block">Trigger Price</label>
                    <input
                      type="number"
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(e.target.value)}
                      step="0.05"
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                )}
                {getEstimatedValue() && (
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Est. Value</span>
                      <span className="font-bold text-lg">₹{parseFloat(getEstimatedValue()).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={placeOrder}
                  disabled={orderPlacing || !symbol}
                  className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${transactionType === 'BUY' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} disabled:opacity-50`}
                >
                  {orderPlacing
                    ? <><RefreshCw size={18} className="animate-spin" /> Placing...</>
                    : <>{transactionType === 'BUY' ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {transactionType} {instrumentType === 'EQ' || instrumentType === 'FUT' ? symbol + (instrumentType === 'FUT' ? ' FUT' : '') : optionSymbol || symbol}</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Positions & Open Orders (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 p-4 flex-[3]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Wallet size={18} className="text-green-400" /> Positions
                </h2>
                <button onClick={fetchPositions} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                  <RefreshCw size={14} className={positionsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              {positionsLoading
                ? <div className="flex items-center justify-center py-8"><RefreshCw size={20} className="animate-spin text-gray-400" /></div>
                : !Array.isArray(positions) || positions.length === 0
                  ? <div className="text-center py-8 text-gray-500"><Wallet size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No positions</p></div>
                  : <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {positions.map((p, i) => (
                        <div key={`${p.tradingsymbol}-${i}`} className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <span className="font-medium text-sm">{p.tradingsymbol}</span>
                              <span className="text-xs text-gray-500 ml-2">{p.exchange}</span>
                            </div>
                            <div className={`text-sm font-bold ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {p.pnl >= 0 ? '+' : ''}₹{p.pnl?.toFixed(2) || '0'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={p.quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                              {p.quantity > 0 ? 'LONG' : 'SHORT'} {Math.abs(p.quantity)}
                            </span>
                            <span className="text-gray-400">Avg: ₹{p.average_price?.toFixed(2)}</span>
                            <span className="text-gray-400">LTP: ₹{p.last_price?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
              }
            </div>
            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl border border-amber-500/20 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" /> Open Orders
                </h2>
                <button onClick={fetchOpenOrders} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                  <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              {ordersLoading
                ? <div className="flex items-center justify-center py-4"><RefreshCw size={16} className="animate-spin text-gray-400" /></div>
                : openOrders.length === 0
                  ? <div className="text-center py-4 text-gray-500"><p className="text-xs">No open orders</p></div>
                  : <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {openOrders.map((o) => (
                        <div key={o.order_id} className="p-2.5 bg-slate-900/50 rounded-lg border border-amber-500/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${o.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                {o.transaction_type}
                              </span>
                              <span className="text-xs font-medium truncate max-w-[100px]">{o.tradingsymbol}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-amber-400">
                              <Clock size={10} />{o.status}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{o.quantity} × ₹{o.price || '-'}</div>
                        </div>
                      ))}
                    </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}