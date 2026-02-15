'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, RefreshCw, LogIn } from 'lucide-react';
import { nseStrikeSteps } from '@/app/lib/nseStrikeSteps';

export default function OrderModal({ 
  isOpen, 
  onClose, 
  symbol, 
  price, 
  defaultType = 'BUY',
  optionType = null, // 'CE', 'PE', or null for equity
  optionSymbol = null, // Full option trading symbol (passed from scanner, may be TradingView format)
  onOrderPlaced 
}) {
  const [transactionType, setTransactionType] = useState(defaultType);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(optionType ? 'NRML' : 'CNC'); // NRML for options
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [exchange, setExchange] = useState(optionType ? 'NFO' : 'NSE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Kite auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [kiteApiKey, setKiteApiKey] = useState('');
  
  // Option-specific state
  const [kiteOptionSymbol, setKiteOptionSymbol] = useState(null);
  const [optionLtp, setOptionLtp] = useState(null);
  const [strike, setStrike] = useState(null);
  const [expiryDay, setExpiryDay] = useState(null);
  const [lotSize, setLotSize] = useState(1);
  const [fetchingLtp, setFetchingLtp] = useState(false);

  // Check Kite auth status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkKiteAuth();
    }
  }, [isOpen]);

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
    // Open settings page in popup for full login flow
    const popup = window.open('/settings/kite', 'KiteSettings', 'width=600,height=700,scrollbars=yes');
    
    // Listen for success message from popup
    const handleMessage = (event) => {
      if (event.data?.type === 'KITE_LOGIN_SUCCESS') {
        checkKiteAuth();
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Poll for popup close
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        // Re-check auth after popup closes
        setTimeout(() => checkKiteAuth(), 500);
      }
    }, 500);
  };

  // Fetch option details and LTP from Kite when modal opens for options
  useEffect(() => {
    if (isOpen && optionType && symbol && price && isLoggedIn) {
      fetchOptionDetails();
    }
  }, [isOpen, optionType, symbol, price, isLoggedIn]);

  const fetchOptionDetails = async () => {
    setFetchingLtp(true);
    setError(''); // Clear previous errors
    try {
      const res = await fetch(`/api/option-ltp?symbol=${symbol}&price=${price}&type=${optionType}`);
      const data = await res.json();
      
      if (res.ok && data.optionSymbol) {
        setKiteOptionSymbol(data.optionSymbol);
        setOptionLtp(data.ltp);
        setStrike(data.strike);
        setExpiryDay(data.expiryDay);
        if (data.lotSize) setLotSize(data.lotSize);
        setLimitPrice(data.ltp?.toString() || '');
      } else if (res.status === 401) {
        // Auth error - don't show as error, just leave LTP unavailable
        // The login prompt will be shown by the auth check
        setIsLoggedIn(false);
      } else {
        setError(data.error || 'Failed to fetch option details');
      }
    } catch (err) {
      console.error('Error fetching option LTP:', err);
      setError('Failed to fetch option price');
    } finally {
      setFetchingLtp(false);
    }
  };

  // Calculate expected strike based on price (using NSE strike steps data)
  const getExpectedStrike = (sym, prc, type) => {
    const p = parseFloat(prc) || 0;
    // Use NSE strike steps data, fallback to price-based heuristic
    let step = nseStrikeSteps[sym];
    if (!step) {
      if (p >= 5000) step = 50;
      else if (p >= 1000) step = 20;
      else if (p >= 500) step = 10;
      else if (p >= 100) step = 5;
      else step = 2.5;
    }
    
    return type === 'CE' 
      ? Math.ceil(p / step) * step 
      : Math.floor(p / step) * step;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransactionType(defaultType);
      setQuantity(optionType ? 1 : 1);
      setProduct(optionType ? 'NRML' : 'CNC');
      setOrderType(optionType ? 'LIMIT' : 'MARKET'); // Default to LIMIT for options
      setLimitPrice(price?.toString() || '');
      setTriggerPrice('');
      setExchange(optionType ? 'NFO' : 'NSE');
      setError('');
      setSuccess('');
      setKiteOptionSymbol(null);
      setOptionLtp(null);
      setExpiryDay(null);
      // Calculate expected strike immediately for UI display
      if (optionType && price) {
        setStrike(getExpectedStrike(symbol, price, optionType));
      } else {
        setStrike(null);
      }
    }
  }, [isOpen, defaultType, price, optionType, symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Please login to Kite first');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use Kite option symbol for options, otherwise stock symbol
      const tradingSymbol = optionType ? (kiteOptionSymbol || optionSymbol) : symbol;
      
      const orderData = {
        tradingsymbol: tradingSymbol,
        exchange,
        transaction_type: transactionType,
        quantity: parseInt(quantity),
        product,
        order_type: orderType,
        variety: 'regular',
      };

      if (orderType === 'LIMIT' && limitPrice) {
        orderData.price = parseFloat(limitPrice);
      }

      if (['SL', 'SL-M'].includes(orderType) && triggerPrice) {
        orderData.trigger_price = parseFloat(triggerPrice);
        if (orderType === 'SL' && limitPrice) {
          orderData.price = parseFloat(limitPrice);
        }
      }

      const response = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      setSuccess(`Order placed! ID: ${result.order_id}`);
      
      if (onOrderPlaced) {
        onOrderPlaced(result);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // For options, use option LTP; for stocks, use stock price
  const displayPrice = optionType ? (optionLtp || 0) : (price || 0);
  const estimatedValue = quantity * (parseFloat(limitPrice) || displayPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 border-b border-slate-700 flex items-center justify-between ${
          transactionType === 'BUY' ? 'bg-green-900/30' : 'bg-red-900/30'
        }`}>
          <div className="flex items-center gap-3">
            {transactionType === 'BUY' ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{symbol}</h2>
                {optionType && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    optionType === 'CE' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {optionType}
                  </span>
                )}
              </div>
              {optionType && kiteOptionSymbol && (
                <p className="text-slate-300 text-xs font-mono">{kiteOptionSymbol}</p>
              )}
              {optionType && strike && (
                <p className="text-slate-400 text-xs">
                  Spot: ₹{price?.toLocaleString('en-IN') || '---'} • Strike: ₹{strike.toLocaleString('en-IN')} 
                  {expiryDay && <span className="text-blue-400"> • Exp: {expiryDay}</span>}
                </p>
              )}
              {optionType && (
                <p className="text-slate-400 text-xs">
                  {fetchingLtp ? (
                    <span className="text-blue-400">Loading option LTP...</span>
                  ) : optionLtp ? (
                    <span className="text-green-400">Option LTP: ₹{optionLtp.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-yellow-500">Option LTP unavailable</span>
                  )}
                </p>
              )}
              {!optionType && (
                <p className="text-slate-400 text-sm">
                  Stock Price: ₹{price?.toLocaleString('en-IN') || '---'} • {exchange}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {optionType && (
              <button
                type="button"
                onClick={fetchOptionDetails}
                disabled={fetchingLtp}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Refresh LTP"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${fetchingLtp ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Auth Check */}
        {checkingAuth ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Checking Kite authentication...</p>
          </div>
        ) : !isLoggedIn ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-600/30">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Connect to Kite</h3>
            <p className="text-slate-400 text-sm text-center mb-6 max-w-xs">
              Login to your Zerodha Kite account to place orders directly from here
            </p>
            <button
              type="button"
              onClick={handleKiteLogin}
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login to Kite
            </button>
            <button
              type="button"
              onClick={checkKiteAuth}
              className="mt-4 text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTransactionType('BUY')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                transactionType === 'BUY'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('SELL')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                transactionType === 'SELL'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Product Type</label>
            <div className="flex gap-2">
              {(optionType ? [
                { value: 'NRML', label: 'NRML', desc: 'Overnight' },
                { value: 'MIS', label: 'MIS', desc: 'Intraday' },
              ] : [
                { value: 'CNC', label: 'CNC', desc: 'Delivery' },
                { value: 'MIS', label: 'MIS', desc: 'Intraday' },
                { value: 'NRML', label: 'NRML', desc: 'F&O' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProduct(opt.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                    product === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Order Type</label>
            <div className="flex gap-2">
              {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    orderType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {/* Warning for Market orders on Options */}
            {optionType && orderType === 'MARKET' && (
              <div className="mt-2 p-2 bg-amber-900/30 border border-amber-600/50 rounded-lg">
                <p className="text-amber-400 text-xs flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Market orders are not allowed for Options on Kite. Please use LIMIT order.</span>
                </p>
              </div>
            )}
          </div>

          {/* Quantity and Price/LTP Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {orderType === 'LIMIT' || orderType === 'SL' ? (
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">
                  {orderType === 'SL' ? 'Limit Price' : 'Price'}
                </label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  step="0.05"
                  placeholder={displayPrice?.toString()}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  required={orderType === 'LIMIT'}
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">
                  {optionType ? 'LTP (Market)' : 'Price (Market)'}
                </label>
                <input
                  type="text"
                  value={displayPrice ? `₹${displayPrice.toLocaleString('en-IN')}` : 'Fetching...'}
                  disabled
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-slate-300 text-sm cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Trigger Price for SL orders */}
          {['SL', 'SL-M'].includes(orderType) && (
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Trigger Price</label>
              <input
                type="number"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                step="0.05"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Estimated Value */}
          <div className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Estimated Value</span>
            <span className="text-white font-mono font-semibold">
              ₹{estimatedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              transactionType === 'BUY'
                ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-800'
                : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800'
            } disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              `${transactionType} ${symbol}`
            )}
          </button>

          {/* Disclaimer */}
          <p className="text-slate-500 text-[10px] text-center">
            Orders are placed via Kite Connect API. Market orders execute at current market price.
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
