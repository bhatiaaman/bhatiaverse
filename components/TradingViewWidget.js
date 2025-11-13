"use client";

import React, { useEffect, useRef } from 'react';

export default function TradingViewWidget({ symbol = 'NASDAQ:AAPL', interval = 'W', containerId }) {
  const ref = useRef(null);
  const id = containerId || `tv_${symbol.replace(/[:.]/g, '_')}`;

  useEffect(() => {
    const createWidget = () => {
      try {
        // remove any previous iframe/content
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = '';

        // TradingView widget expects a global `TradingView` constructor from tv.js
        // eslint-disable-next-line no-undef
        new window.TradingView.widget({
          width: '100%',
          height: 520,
          symbol,
          interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0f172a',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: id,
        });
      } catch (e) {
        // If TradingView isn't ready yet this will catch errors
        // We'll let the script onload try again
        // console.error('TradingView init error', e);
      }
    };

    // If tv.js already loaded, create immediately
    if (typeof window !== 'undefined' && window.TradingView) {
      createWidget();
      return;
    }

    // Otherwise inject the script and create on load
    const existing = document.getElementById('tradingview-script');
    if (existing) {
      existing.addEventListener('load', createWidget);
      return () => existing.removeEventListener('load', createWidget);
    }

    const script = document.createElement('script');
    script.id = 'tradingview-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = createWidget;
    document.head.appendChild(script);

    return () => {
      if (script) script.onload = null;
    };
  }, [symbol, interval, id]);

  return (
    <div className="rounded-lg overflow-hidden border border-white/5 bg-slate-800">
      <div id={id} ref={ref} />
    </div>
  );
}
