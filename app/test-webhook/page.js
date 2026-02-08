"use client";

import { useState } from "react";

const DEFAULT_PAYLOAD = `{
  "stocks": "SEPOWER,ASTEC,EDUCOMP,KSERASERA,IOLCP,GUJAPOLLO,EMCO",
  "trigger_prices": "3.75,541.8,2.1,0.2,329.6,166.8,1.25",
  "triggered_at": "2:34 pm",
  "scan_name": "Short term breakouts",
  "scan_url": "short-term-breakouts",
  "alert_name": "Alert for Short term breakouts",
  "webhook_url": "http://your-web-hook-url.com"
}`;

export default function TestWebhookPage() {
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendTestWebhook() {
    setLoading(true);
    setResult(null);

    let payload;

    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      setResult({
        error: "Invalid JSON",
        details: e.message,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chartink-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      setResult({
        status: res.status,
        response: data,
        sentPayload: payload,
      });
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
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        🧪 Test Chartink Webhook
      </h1>

      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        Paste JSON below and send it to <code>/api/chartink-webhook</code>
      </p>

      <div style={{ display: "grid", gap: 12, maxWidth: 1000 }}>
        <textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 240,
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 12,
            padding: 14,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 13,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={sendTestWebhook}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: loading ? "#222" : "#16a34a",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "🚀 Send Webhook"}
          </button>

          <button
            onClick={() => {
              setPayloadText(DEFAULT_PAYLOAD);
              setResult(null);
            }}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#111",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Reset JSON
          </button>

          <button
            onClick={() => window.open("/stock-updates/scanner", "_blank")}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Open Scanner Page →
          </button>
        </div>

        <div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Response</h3>
          <pre
            style={{
              background: "#111",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #333",
              overflowX: "auto",
              maxWidth: "100%",
              fontSize: 13,
            }}
          >
            {result ? JSON.stringify(result, null, 2) : "No response yet"}
          </pre>
        </div>
      </div>
    </div>
  );
}