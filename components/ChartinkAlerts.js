"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Bell, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function ChartinkAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts on mount and set up polling
  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 5 seconds
    const interval = setInterval(fetchAlerts, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/chartink-alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch('/api/chartink-alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (!response.ok) throw new Error('Failed to delete alert');
      
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const clearAllAlerts = async () => {
    if (!window.confirm('Clear all alerts? This cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/chartink-alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to clear alerts');
      
      setAlerts([]);
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getAlertIcon = (alertType) => {
    if (!alertType) return <Bell className="w-5 h-5" />;
    
    if (alertType.includes('buy') || alertType.includes('bullish')) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
    if (alertType.includes('sell') || alertType.includes('bearish')) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-blue-500" />;
  };

  const getAlertColor = (alertType) => {
    if (!alertType) return 'border-blue-300';
    
    if (alertType.includes('buy') || alertType.includes('bullish')) {
      return 'border-green-300 bg-green-50 dark:bg-green-900/20';
    }
    if (alertType.includes('sell') || alertType.includes('bearish')) {
      return 'border-red-300 bg-red-50 dark:bg-red-900/20';
    }
    return 'border-blue-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Chartink Alerts</h2>
          <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-semibold">
            {alerts.length}
          </span>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No alerts yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Alerts from Chartink will appear here when received
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-4 dark:bg-gray-800 transition-all hover:shadow-md ${getAlertColor(alert.type)}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Symbol */}
                    {alert.symbol && (
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {alert.symbol}
                      </h3>
                    )}
                    
                    {/* Alert type and message */}
                    <div className="mt-1 space-y-1">
                      {alert.type && (
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                          {alert.type}
                        </p>
                      )}
                      {alert.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.message}
                        </p>
                      )}
                    </div>

                    {/* Additional details */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 space-y-0.5">
                      {alert.price && <p>Price: ₹{alert.price}</p>}
                      {alert.reason && <p>Reason: {alert.reason}</p>}
                      {alert.indicator && <p>Indicator: {alert.indicator}</p>}
                      <p>Received: {formatTime(alert.timestamp)}</p>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="flex-shrink-0 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Webhook URL:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">/api/chartink-alerts</code>
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
          Configure this URL in your Chartink alert settings to receive alerts automatically.
        </p>
      </div>
    </div>
  );
}
