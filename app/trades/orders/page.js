'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, RefreshCw, 
  CheckCircle, XCircle, Clock, AlertCircle, LogIn, Loader2,
  ShoppingCart, History, Zap
} from 'lucide-react';
import { nseStrikeSteps } from '@/app/lib/nseStrikeSteps';

export default function OrdersPage() {
  const router = useRouter();
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [kiteApiKey, setKiteApiKey] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [spotPrice, setSpotPrice] = useState(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  
  // Order form state
  const [instrumentType, setInstrumentType] = useState('EQ'); // EQ, CE, PE
  const [transactionType, setTransactionType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState('CNC'); // CNC, MIS, NRML
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  
  // Option state
  const [optionLtp, setOptionLtp] = useState(null);
  const [optionSymbol, setOptionSymbol] = useState(null);
  const [strike, setStrike] = useState(null);
  const [expiryDay, setExpiryDay] = useState(null);
  const [fetchingOption, setFetchingOption] = useState(false);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // UI state
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check Kite auth on mount
  useEffect(() => {
    checkKiteAuth();
    fetchOrders();
  }, []);

  const checkKiteAuth = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/kite-config');
      const data = await res.json();
      setIsLoggedIn(data.tokenValid === true);
      setKiteApiKey(data.config?.apiKey || '');
    } catch (err) {
      console.error('Error checking Kite auth:', err);
      setIsLoggedIn(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleKiteLogin = () => {
    const popup = window.open('/settings/kite', 'KiteSettings', 'width=600,height=700,scrollbars=yes');
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        setTimeout(() => checkKiteAuth(), 500);
      }
    }, 500);
  };

  // Search stocks
  const searchStocks = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/search-instruments?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.instruments || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocks(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchStocks]);

  // Fetch spot price when symbol selected
  const fetchSpotPrice = async (symbol) => {
    setFetchingPrice(true);
    try {
      const res = await fetch(`/api/stock-price?symbol=${symbol}`);
      const data = await res.json();
      setSpotPrice(data.price || null);
    } catch (err) {
      console.error('Error fetching price:', err);
      setSpotPrice(null);
    } finally {
      setFetchingPrice(false);
    }
  };

  // Fetch option details when CE/PE selected
  const fetchOptionDetails = async () => {
    if (!selectedSymbol || !spotPrice || instrumentType === 'EQ') return;
    
    setFetchingOption(true);
    try {
      const res = await fetch(`/api/option-ltp?symbol=${selectedSymbol}&price=${spotPrice}&type=${instrumentType}`);
      const data = await res.json();
      
      if (data.optionSymbol) {
        setOptionSymbol(data.optionSymbol);
        setOptionLtp(data.ltp);
        setStrike(data.strike);
        setExpiryDay(data.expiryDay);
      }
    } catch (err) {
      console.error('Error fetching option:', err);
    } finally {
      setFetchingOption(false);
    }
  };

  useEffect(() => {
    if (instrumentType !== 'EQ' && selectedSymbol && spotPrice && isLoggedIn) {
      fetchOptionDetails();
    } else {
      setOptionSymbol(null);
      setOptionLtp(null);
      setStrike(null);
    }
  }, [instrumentType, selectedSymbol, spotPrice, isLoggedIn]);

  // Select symbol
  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchQuery(symbol);
    setSearchResults([]);
    fetchSpotPrice(symbol);
    setProduct(instrumentType === 'EQ' ? 'CNC' : 'NRML');
  };

  // Fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/kite-orders');
      const data = await res.json();
      if (data.orders) {
        // Get last 10 orders
        setOrders(data.orders.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!selectedSymbol) {
      setMessage({ type: 'error', text: 'Please select a symbol' });
      return;
    }

    setPlacing(true);
    setMessage({ type: '', text: '' });

    try {
      const tradingSymbol = instrumentType === 'EQ' ? selectedSymbol : optionSymbol;
      const exchange = instrumentType === 'EQ' ? 'NSE' : 'NFO';

      if (!tradingSymbol) {
        throw new Error('Invalid trading symbol');
      }

      const orderParams = {
        tradingsymbol: tradingSymbol,
        exchange,
        transaction_type: transactionType,
        order_type: orderType,
        quantity: parseInt(quantity),
        product: instrumentType === 'EQ' ? product : 'NRML',
        validity: 'DAY',
      };

      if (orderType === 'LIMIT' || orderType === 'SL') {
        orderParams.price = parseFloat(limitPrice);
      }
      if (orderType === 'SL' || orderType === 'SL-M') {
        orderParams.trigger_price = parseFloat(triggerPrice);
      }

      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderParams),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Order placed! ID: ${data.orderId}` });
        fetchOrders(); // Refresh orders
        // Reset form
        setQuantity(1);
        setLimitPrice('');
        setTriggerPrice('');
      } else {
        throw new Error(data.error || 'Order failed');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPlacing(false);
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETE':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle size={14} className="text-red-400" />;
      case 'PENDING':
      case 'OPEN':
        return <Clock size={14} className="text-yellow-400" />;
      default:
        return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETE':
        return 'text-green-400 bg-green-500/10';
      case 'REJECTED':
      case 'CANCELLED':
        return 'text-red-400 bg-red-500/10';
      case 'PENDING':
      case 'OPEN':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-6">
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/trades')}
                  className="flex items-center justify-center w-10 h-10 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white hover:scale-105"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={24} className="text-indigo-400" />
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Order Management
                    </h1>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Place trades on Kite Connect</p>
                </div>
              </div>
              
              {/* Kite Status */}
              <div className="flex items-center gap-3">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-xl border border-green-500/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Kite Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={handleKiteLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 text-sm font-medium transition-all"
                  >
                    <LogIn size={16} />
                    Connect Kite
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Order Form */}
          <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Place Order
            </h2>

            {/* Symbol Search */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs mb-1.5 block">Symbol</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSymbol(null);
                    setSpotPrice(null);
                  }}
                  placeholder="Search stock (e.g., TCS, RELIANCE)"
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
                {searching && (
                  <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && !selectedSymbol && (
                <div className="absolute z-50 mt-1 w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {searchResults.slice(0, 10).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSymbol(item.tradingsymbol || item.symbol)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-700 text-sm flex items-center justify-between"
                    >
                      <span className="text-white font-medium">{item.tradingsymbol || item.symbol}</span>
                      <span className="text-slate-500 text-xs">{item.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Symbol Info */}
            {selectedSymbol && (
              <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-400 font-bold text-lg">{selectedSymbol}</span>
                    <span className="text-slate-500 text-xs ml-2">NSE</span>
                  </div>
                  <div className="text-right">
                    {fetchingPrice ? (
                      <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : spotPrice ? (
                      <span className="text-white font-mono text-lg">₹{spotPrice}</span>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instrument Type */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs mb-1.5 block">Instrument</label>
              <div className="flex gap-2">
                {['EQ', 'CE', 'PE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setInstrumentType(type);
                      setProduct(type === 'EQ' ? 'CNC' : 'NRML');
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      instrumentType === type
                        ? type === 'EQ' 
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                          : type === 'CE'
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                    }`}
                  >
                    {type === 'EQ' ? 'Equity' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Option Info */}
            {instrumentType !== 'EQ' && selectedSymbol && (
              <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                {fetchingOption ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm">Fetching option...</span>
                  </div>
                ) : optionSymbol ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-semibold ${instrumentType === 'CE' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {optionSymbol}
                      </span>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Strike: ₹{strike} • Exp: {expiryDay}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-mono">₹{optionLtp || '--'}</span>
                      <div className="text-slate-500 text-xs">LTP</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">Option not available</span>
                )}
              </div>
            )}

            {/* Transaction Type */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs mb-1.5 block">Transaction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransactionType('BUY')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    transactionType === 'BUY'
                      ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingUp size={16} />
                  BUY
                </button>
                <button
                  onClick={() => setTransactionType('SELL')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    transactionType === 'SELL'
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingDown size={16} />
                  SELL
                </button>
              </div>
            </div>

            {/* Quantity & Product */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {instrumentType === 'EQ' ? (
                    <>
                      <option value="CNC">CNC (Delivery)</option>
                      <option value="MIS">MIS (Intraday)</option>
                    </>
                  ) : (
                    <>
                      <option value="NRML">NRML (Overnight)</option>
                      <option value="MIS">MIS (Intraday)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Order Type */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs mb-1.5 block">Order Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['MARKET', 'LIMIT', 'SL', 'SL-M'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    disabled={instrumentType !== 'EQ' && type === 'MARKET'}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      orderType === type
                        ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                    } ${instrumentType !== 'EQ' && type === 'MARKET' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {instrumentType !== 'EQ' && orderType === 'MARKET' && (
                <p className="text-yellow-400 text-xs mt-2">⚠️ Market orders not allowed for options</p>
              )}
            </div>

            {/* Price Fields */}
            {(orderType === 'LIMIT' || orderType === 'SL') && (
              <div className="mb-4">
                <label className="text-slate-400 text-xs mb-1.5 block">Limit Price</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  step="0.05"
                  placeholder="Enter limit price"
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {(orderType === 'SL' || orderType === 'SL-M') && (
              <div className="mb-4">
                <label className="text-slate-400 text-xs mb-1.5 block">Trigger Price</label>
                <input
                  type="number"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  step="0.05"
                  placeholder="Enter trigger price"
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {/* Message */}
            {message.text && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {message.text}
              </div>
            )}

            {/* Place Order Button */}
            <button
              onClick={placeOrder}
              disabled={placing || !isLoggedIn || !selectedSymbol || (instrumentType !== 'EQ' && !optionSymbol)}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                transactionType === 'BUY'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-lg shadow-red-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {placing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {transactionType === 'BUY' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {transactionType} {instrumentType === 'EQ' ? selectedSymbol : optionSymbol || 'Option'}
                </>
              )}
            </button>
          </div>

          {/* Right: Order History */}
          <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History size={18} className="text-blue-400" />
                Recent Orders
              </h2>
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <RefreshCw size={16} className={`text-slate-400 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="text-center py-12">
                <LogIn size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Connect Kite to view orders</p>
              </div>
            ) : loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No orders today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {orders.map((order, idx) => (
                  <div
                    key={order.order_id || idx}
                    className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${
                            order.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {order.transaction_type}
                          </span>
                          <span className="text-white font-medium text-sm">{order.tradingsymbol}</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          {order.exchange} • {order.product} • {order.order_type}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Qty: <span className="text-white">{order.quantity}</span>
                        {order.filled_quantity > 0 && order.filled_quantity !== order.quantity && (
                          <span className="text-slate-500"> ({order.filled_quantity} filled)</span>
                        )}
                      </span>
                      <span className="text-slate-400">
                        {order.average_price > 0 ? (
                          <>Avg: <span className="text-white">₹{order.average_price}</span></>
                        ) : order.price > 0 ? (
                          <>Price: <span className="text-white">₹{order.price}</span></>
                        ) : null}
                      </span>
                    </div>
                    {order.status_message && order.status === 'REJECTED' && (
                      <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
                        {order.status_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </div>
  );
}
