'use client';

// app/nse-sectors/page.js
// Main page component for NSE Sector Chart

import { useState, useEffect } from 'react';
import './styles.css';

export default function NSESectorsPage() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSectorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sectors');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setSectors(result.data);
        setLastUpdate(new Date(result.timestamp));
      }

    } catch (err) {
      console.error('Error fetching sector data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSectorData();

    // Auto-refresh every 5 minutes
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSectorData, 5 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatTimestamp = (date) => {
    if (!date) return 'Loading...';
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    
    return `${day}${getOrdinalSuffix(day)} ${month}, ${time}`;
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const maxPercentage = sectors.length > 0 ? Math.max(...sectors.map(s => s.percentage)) : 100;

  return (
    <div className="container">
      <h1>Sector Advances %</h1>
      <div className="timestamp">
        <span className="status-indicator"></span>
        {formatTimestamp(lastUpdate)}
      </div>

      <div className="chart-container">
        {loading && sectors.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            Fetching live NSE sector data...
          </div>
        ) : error ? (
          <div className="error">
            <strong>⚠️ Error loading data</strong><br />
            {error}<br />
            <small>Using fallback data or try refreshing</small>
          </div>
        ) : (
          <div className="chart">
            {sectors.map((sector, index) => {
              const barWidth = (sector.percentage / maxPercentage) * 100;
              const colorClass = `color-${(index % 10) + 1}`;
              
              return (
                <div
                  key={index}
                  className="sector-bar"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="percentage-label">
                    {sector.percentage.toFixed(2)}
                  </div>
                  <div className="bar-wrapper">
                    <div
                      className={`bar ${colorClass}`}
                      style={{ width: `${barWidth}%` }}
                      title={`${sector.name}: ${sector.percentage.toFixed(2)}%`}
                    >
                      {sector.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="controls">
        <div className="refresh-info">
          {autoRefresh ? 'Auto-refreshes every 5 minutes' : 'Auto-refresh paused'}
        </div>
        <button
          className="manual-refresh"
          onClick={fetchSectorData}
          disabled={loading}
        >
          🔄 Refresh Now
        </button>
        <button
          className="manual-refresh"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? '⏸️ Pause' : '▶️ Resume'} Auto-Refresh
        </button>
      </div>
    </div>
  );
}