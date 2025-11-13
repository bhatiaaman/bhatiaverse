"use client";

import React, { useRef, useEffect } from 'react';
import { createChart } from 'lightweight-charts';

export default function WeeklyChart({ symbol = 'SYM', data = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 260,
      layout: {
        background: { color: 'rgba(0,0,0,0)' },
        textColor: '#E5E7EB',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addLineSeries({ color: '#60a5fa', lineWidth: 2 });
    series.setData(data);

    const handleResize = () => chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="p-4 bg-white/3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{symbol} — Weekly</div>
      </div>
      <div ref={ref} style={{ width: '100%', height: 260 }} />
    </div>
  );
}
