'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CHART_SCENARIOS } from '../data/chart-scenarios';

// ─── helpers ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SVG Candlestick chart ───────────────────────────────────────────────────
function CandlestickChart({ candles, revealCandles, revealed, keyLevel, keyLabel }) {
  const W = 640, H = 280, PAD = { top: 30, bottom: 30, left: 52, right: 16 };
  const allCandles = revealed ? [...candles, ...revealCandles] : candles;

  const lo   = Math.min(...allCandles.map(c => c.l));
  const hi   = Math.max(...allCandles.map(c => c.h));
  const span = hi - lo || 1;
  const pad  = span * 0.08;
  const yMin = lo - pad, yMax = hi + pad;
  const yRange = yMax - yMin;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const totalSlots = candles.length + revealCandles.length;
  const slotW = chartW / totalSlots;
  const candleW = Math.max(4, slotW * 0.6);

  const toX = (i) => PAD.left + i * slotW + slotW / 2;
  const toY = (price) => PAD.top + chartH - ((price - yMin) / yRange) * chartH;

  // Y-axis ticks
  const tickCount = 5;
  const tickStep  = yRange / tickCount;
  const yTicks    = Array.from({ length: tickCount + 1 }, (_, i) => yMin + i * tickStep);

  const keyY = toY(keyLevel);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}
    >
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1}
          />
          <text
            x={PAD.left - 6} y={toY(t) + 4}
            textAnchor="end" fill="rgba(168,184,216,0.5)"
            fontSize={9} fontFamily="monospace"
          >
            {Math.round(t).toLocaleString('en-IN')}
          </text>
        </g>
      ))}

      {/* Key level */}
      <line
        x1={PAD.left} y1={keyY} x2={W - PAD.right} y2={keyY}
        stroke="rgba(200,169,110,0.45)" strokeWidth={1} strokeDasharray="4,3"
      />
      <text x={W - PAD.right + 4} y={keyY + 4} fill="#c8a96e" fontSize={9} fontFamily="monospace">
        {keyLabel}
      </text>

      {/* Divider between visible and reveal */}
      {revealed && (
        <line
          x1={toX(candles.length - 1) + slotW / 2} y1={PAD.top}
          x2={toX(candles.length - 1) + slotW / 2} y2={H - PAD.bottom}
          stroke="rgba(62,207,142,0.25)" strokeWidth={1} strokeDasharray="3,3"
        />
      )}

      {/* Candles */}
      {allCandles.map((c, i) => {
        const isReveal = i >= candles.length;
        const isGreen  = c.c >= c.o;
        const color    = isReveal
          ? (isGreen ? '#2de08a' : '#ff5f6d')
          : (isGreen ? '#3ecf8e' : '#ef5350');
        const cx = toX(i);
        const bodyTop    = toY(Math.max(c.o, c.c));
        const bodyBottom = toY(Math.min(c.o, c.c));
        const bodyH      = Math.max(1, bodyBottom - bodyTop);

        return (
          <g key={i} opacity={isReveal && !revealed ? 0 : 1} style={{ transition: 'opacity 0.5s' }}>
            {/* Wick */}
            <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={color} strokeWidth={1} />
            {/* Body */}
            <rect
              x={cx - candleW / 2} y={bodyTop}
              width={candleW} height={bodyH}
              fill={isGreen ? color : 'none'}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {/* ? zone label when not revealed */}
      {!revealed && (
        <g>
          <rect
            x={toX(candles.length - 1) + slotW / 2} y={PAD.top}
            width={(W - PAD.right) - (toX(candles.length - 1) + slotW / 2)}
            height={chartH}
            fill="rgba(168,184,216,0.03)"
          />
          <text
            x={((toX(candles.length - 1) + slotW / 2) + (W - PAD.right)) / 2}
            y={PAD.top + chartH / 2}
            textAnchor="middle" fill="rgba(168,184,216,0.2)"
            fontSize={28} fontFamily="'Syne',sans-serif" fontWeight={800}
          >
            ?
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Difficulty badge ────────────────────────────────────────────────────────
function DiffBadge({ diff }) {
  const map = { easy: ['#3ecf8e', 'Easy'], medium: ['#f59e0b', 'Medium'], hard: ['#ef5350', 'Hard'] };
  const [col, label] = map[diff] || ['#a8b8d8', diff];
  return (
    <span style={{
      fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.15em',
      textTransform: 'uppercase', color: col, border: `1px solid ${col}44`,
      padding: '0.2rem 0.6rem',
    }}>
      {label}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function WhatHappensNextPage() {
  const [theme, setTheme]       = useState('dark');
  const [queue, setQueue]       = useState([]);
  const [idx, setIdx]           = useState(0);
  const [chosen, setChosen]     = useState(null);   // 'UP' | 'DOWN' | 'SIDEWAYS'
  const [revealed, setRevealed] = useState(false);
  const [score, setScore]       = useState({ correct: 0, total: 0 });
  const [done, setDone]         = useState(false);

  const scenario = queue[idx] ?? null;

  useEffect(() => {
    const saved = localStorage.getItem('bv-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    setQueue(shuffle(CHART_SCENARIOS));
    const s = localStorage.getItem('bv-whn-score');
    if (s) setScore(JSON.parse(s));
  }, []);

  const isDark = theme === 'dark';
  const T = {
    bg:      isDark ? '#02020a' : '#faf8f3',
    card:    isDark ? 'rgba(13,13,43,0.9)' : 'rgba(255,255,255,0.92)',
    border:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    text:    isDark ? '#f0f4ff' : '#1a1a2e',
    textSub: isDark ? 'rgba(168,184,216,0.75)' : 'rgba(26,26,46,0.65)',
    muted:   isDark ? 'rgba(168,184,216,0.45)' : 'rgba(26,26,46,0.4)',
  };

  function handleGuess(dir) {
    if (chosen) return;
    setChosen(dir);
    setRevealed(true);
    const correct = dir === scenario.answer;
    const newScore = { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 };
    setScore(newScore);
    localStorage.setItem('bv-whn-score', JSON.stringify(newScore));
  }

  function nextScenario() {
    if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
      setRevealed(false);
    }
  }

  function restart() {
    setQueue(shuffle(CHART_SCENARIOS));
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setDone(false);
  }

  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  const CHOICES = [
    { dir: 'UP',       label: '↑ Will go UP',       color: '#3ecf8e' },
    { dir: 'DOWN',     label: '↓ Will go DOWN',      color: '#ef5350' },
    { dir: 'SIDEWAYS', label: '→ Will go SIDEWAYS',  color: '#f59e0b' },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />

      <style>{`
        body { margin: 0; }
        .choice-btn {
          font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; transition: all 0.2s;
          border: 1px solid; padding: 0.9rem 2rem; background: none;
        }
        .choice-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .choice-btn:disabled { opacity: 0.5; cursor: default; }
        .next-btn {
          font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.15em;
          text-transform: uppercase; cursor: pointer; transition: all 0.2s;
          border: 1px solid #3ecf8e; padding: 0.8rem 2rem;
          background: #3ecf8e; color: #02020a;
        }
        .next-btn:hover { opacity: 0.85; }
        .pulse-in { animation: pulseIn 0.4s ease; }
        @keyframes pulseIn { 0%{transform:scale(0.96);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ background: T.bg, color: T.text, minHeight: '100vh', transition: 'background 0.3s', fontFamily: "'Syne',sans-serif" }}>

        {/* NAV */}
        <nav style={{
          padding: '1.2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.border}`, background: T.card, backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/aigames" style={{ color: '#c8a96e', textDecoration: 'none', fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.15em' }}>
              ← AI Games
            </Link>
            <span style={{ color: T.muted, fontSize: '0.65rem', fontFamily: "'DM Mono',monospace" }}>/ What Happens Next?</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: '#3ecf8e' }}>
              {score.correct}/{score.total} correct
              {score.total > 0 && ` · ${pct}%`}
            </span>
            <button
              onClick={() => {
                const n = theme === 'dark' ? 'light' : 'dark';
                setTheme(n);
                localStorage.setItem('bv-theme', n);
              }}
              style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.1em' }}
            >
              {isDark ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.35em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Trading Game — Chart Reading
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              What Happens Next?
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: T.textSub, marginTop: '0.6rem', fontStyle: 'italic' }}>
              Study the chart, read the context, then predict the next 5 candles.
            </p>
          </div>

          {done ? (
            /* ── DONE SCREEN ── */
            <div className="pulse-in" style={{ textAlign: 'center', padding: '4rem 2rem', background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                {pct >= 70 ? '🎯' : pct >= 50 ? '📈' : '📚'}
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '2rem', margin: '0 0 0.5rem' }}>Round Complete</h2>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.85rem', color: '#3ecf8e', marginBottom: '0.25rem' }}>
                {score.correct} / {score.total} correct · {pct}%
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: T.textSub, fontStyle: 'italic', maxWidth: 420, margin: '1rem auto 2rem' }}>
                {pct >= 70
                  ? 'Strong chart reading. Your pattern recognition is developing well.'
                  : pct >= 50
                  ? 'Good foundation. Keep studying the explanations — patterns take time.'
                  : 'Every miss is a lesson. Read each explanation carefully before replaying.'}
              </p>
              <button className="next-btn" onClick={restart}>Play Again</button>
            </div>
          ) : scenario ? (
            /* ── SCENARIO ── */
            <div className="pulse-in">
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: T.muted }}>
                  {idx + 1} / {queue.length}
                </span>
                <DiffBadge diff={scenario.difficulty} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: T.muted, letterSpacing: '0.1em' }}>
                  {scenario.pattern}
                </span>
              </div>

              {/* Title */}
              <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1rem', color: T.text }}>
                {scenario.title}
              </h2>

              {/* Context box */}
              <div style={{
                background: isDark ? 'rgba(200,169,110,0.06)' : 'rgba(200,169,110,0.08)',
                border: '1px solid rgba(200,169,110,0.15)',
                padding: '1rem 1.4rem', marginBottom: '1.5rem',
              }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.05em', color: T.textSub, margin: 0, lineHeight: 1.7 }}>
                  <span style={{ color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.6rem' }}>Context — </span>
                  {scenario.context}
                </p>
              </div>

              {/* Chart */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '1.2rem', marginBottom: '1.5rem' }}>
                <CandlestickChart
                  candles={scenario.candles}
                  revealCandles={scenario.revealCandles}
                  revealed={revealed}
                  keyLevel={scenario.keyLevel}
                  keyLabel={scenario.keyLabel}
                />
              </div>

              {/* Choice buttons */}
              {!chosen && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {CHOICES.map(({ dir, label, color }) => (
                    <button
                      key={dir}
                      className="choice-btn"
                      style={{ color, borderColor: `${color}55` }}
                      onClick={() => handleGuess(dir)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Result panel */}
              {chosen && (
                <div className="pulse-in" style={{
                  border: `1px solid ${chosen === scenario.answer ? '#3ecf8e55' : '#ef535055'}`,
                  background: chosen === scenario.answer
                    ? (isDark ? 'rgba(62,207,142,0.06)' : 'rgba(62,207,142,0.08)')
                    : (isDark ? 'rgba(239,83,80,0.06)' : 'rgba(239,83,80,0.08)'),
                  padding: '1.4rem', marginBottom: '1.2rem',
                }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.6rem', color: chosen === scenario.answer ? '#3ecf8e' : '#ef5350' }}>
                    {chosen === scenario.answer ? '✓ Correct' : `✗ Wrong — answer was ${scenario.answer}`}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: T.textSub, margin: '0 0 1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                    {scenario.explanation}
                  </p>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '0.8rem' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pattern: </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: '#c8a96e' }}>{scenario.pattern}</span>
                  </div>
                </div>
              )}

              {chosen && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="next-btn" onClick={nextScenario}>
                    {idx + 1 >= queue.length ? 'See Results →' : 'Next Scenario →'}
                  </button>
                </div>
              )}
            </div>
          ) : null}

        </div>
      </div>
    </>
  );
}
