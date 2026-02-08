'use client';

import { useState, useEffect } from 'react';

export default function ScannerPage() {
  const [scans, setScans] = useState({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/get-scans');
        const data = await response.json();
        setScans(data);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching scans:', error);
        setLoading(false);
      }
    };

    fetchScans();
    const interval = setInterval(fetchScans, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading scanner data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 ChartInk Scanner Results</h1>
        {lastUpdate && (
          <p className="text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </header>

      {scans.latest ? (
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Latest Scan</h2>
          <div className="text-sm text-gray-600 mb-4">
            Received: {new Date(scans.latest.receivedAt).toLocaleString()}
          </div>
          <div className="bg-white rounded p-4 overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(scans.latest, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-xl mb-2">⏳ Waiting for scanner data...</p>
          <p className="text-gray-600 text-sm">
            Webhook URL: https://bhatiaverse.com/api/chartink-webhook
          </p>
        </div>
      )}

      {scans.history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Recent Scans ({scans.history.length})
          </h2>
          <div className="space-y-4">
            {scans.history.map((scan) => (
              <div 
                key={scan.id} 
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <span className="font-semibold mr-4">
                  {new Date(scan.receivedAt).toLocaleTimeString()}
                </span>
                <span className="text-gray-600 text-sm">
                  {JSON.stringify(scan).substring(0, 100)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

