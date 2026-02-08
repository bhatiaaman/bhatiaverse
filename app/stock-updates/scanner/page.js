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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading scanner data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">📊 ChartInk Scanner Results</h1>
          {lastUpdate && (
            <p className="text-slate-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </header>

        {scans.latest ? (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">Latest Scan</h2>
            <div className="text-sm text-slate-400 mb-4">
              Received: {new Date(scans.latest.receivedAt).toLocaleString()}
            </div>
            <div className="bg-slate-950 rounded p-4 overflow-x-auto border border-slate-700">
              <pre className="text-sm text-green-400">{JSON.stringify(scans.latest, null, 2)}</pre>
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

        {scans.history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Recent Scans ({scans.history.length})
            </h2>
            <div className="space-y-4">
              {scans.history.map((scan) => (
                <div 
                  key={scan.id} 
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors"
                >
                  <span className="font-semibold mr-4 text-white">
                    {new Date(scan.receivedAt).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {JSON.stringify(scan).substring(0, 100)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}