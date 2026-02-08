'use client';

import { useState } from 'react';

export default function TestWebhook() {
  const [response, setResponse] = useState(null);

  const testWebhook = async () => {
    const res = await fetch('/api/chartink-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stocks: ['RELIANCE', 'TCS', 'INFY'],
        condition: 'breakout',
        timestamp: new Date().toISOString()
      })
    });
    const data = await res.json();
    setResponse(data);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test ChartInk Webhook</h1>
      <button 
        onClick={testWebhook}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Send Test Data
      </button>
      {response && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
      <div className="mt-4">
        <a href="/stock-updates/scanner" className="text-blue-500">
          → View Scanner Page
        </a>
      </div>
    </div>
  );
}