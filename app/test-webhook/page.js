"use client";

import { useState } from "react";

export default function TestWebhookPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendTestWebhook() {
    setLoading(true);
    setResult(null);

    const payload = {
      scan_name: "TEST - Chartink Scan",
      stocks: ["RELIANCE", "TCS", "INFY"],
      triggeredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/chartink-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult({ status: res.status, data });
    } catch (err) {
      setResult({ error: err.message });
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#0b0b0b",
        color: "white",
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>
        Test Chartink Webhook
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Click button to send a fake webhook payload to{" "}
        <code>/api/chartink-webhook</code>
      </p>

      <button
        onClick={sendTestWebhook}
        disabled={loading}
        style={{
          padding: "14px 18px",
          borderRadius: 10,
          border: "1px solid #333",
          background: loading ? "#222" : "#16a34a",
          color: "white",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending..." : "Send Test Webhook"}
      </button>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Response</h3>

        <pre
          style={{
            background: "#111",
            padding: 14,
            borderRadius: 10,
            border: "1px solid #333",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {result ? JSON.stringify(result, null, 2) : "No result yet"}
        </pre>
      </div>
    </div>
  );
}