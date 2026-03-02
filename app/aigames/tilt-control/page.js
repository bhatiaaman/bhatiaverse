'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TILT_SCENARIOS } from '../data/tilt-scenarios';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

export default function TiltControlPage() {
  const [theme, setTheme]   = useState('dark');
  const [queue, setQueue]   = useState([]);
  const [idx, setIdx]       = useState(0);
  const [chosen, setChosen] = useState(null);  // index of chosen choice
  const [score, setScore]   = useState({ correct: 0, total: 0 });
  const [done, setDone]     = useState(false);

  const scenario = queue[idx] ?? null;

  useEffect(() => {
    const saved = localStorage.getItem('bv-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    setQueue(shuffle(TILT_SCENARIOS));
    const s = localStorage.getItem('bv-tilt-score');
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

  function handleChoice(choiceIdx) {
    if (chosen !== null) return;
    setChosen(choiceIdx);
    const isCorrect = scenario.choices[choiceIdx].isCorrect;
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 };
    setScore(newScore);
    localStorage.setItem('bv-tilt-score', JSON.stringify(newScore));
  }

  function nextScenario() {
    if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
    }
  }

  function restart() {
    setQueue(shuffle(TILT_SCENARIOS));
    setIdx(0);
    setChosen(null);
    setDone(false);
  }

  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
  const selectedChoice = chosen !== null ? scenario?.choices[chosen] : null;

  const ratingMsg = (p) => {
    if (p >= 80) return { emoji: '🧘', msg: 'Excellent discipline. You trade like a pro.' };
    if (p >= 60) return { emoji: '📈', msg: 'Good emotional control. A few blind spots to work on.' };
    if (p >= 40) return { emoji: '🎓', msg: 'Learning in progress. Study each explanation carefully.' };
    return { emoji: '⚠️', msg: 'Tilt risk is high. Focus on the lessons — they\'ll save your capital.' };
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />

      <style>{`
        body { margin: 0; }
        .tilt-choice {
          width: 100%; text-align: left; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.06em;
          transition: all 0.2s; border: 1px solid; padding: 1rem 1.4rem;
          background: none; display: block;
        }
        .tilt-choice:hover:not(:disabled) { transform: translateX(4px); }
        .tilt-choice:disabled { cursor: default; }
        .next-btn {
          font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.15em;
          text-transform: uppercase; cursor: pointer; transition: all 0.2s;
          border: 1px solid #3ecf8e; padding: 0.8rem 2rem;
          background: #3ecf8e; color: #02020a;
        }
        .next-btn:hover { opacity: 0.85; }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
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
            <span style={{ color: T.muted, fontSize: '0.65rem', fontFamily: "'DM Mono',monospace" }}>/ Tilt Control</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: '#f59e0b' }}>
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
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.35em', color: '#ef5350', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Trading Game — Behavioural Psychology
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              Tilt Control
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: T.textSub, marginTop: '0.6rem', fontStyle: 'italic' }}>
              Trading situations designed to trigger bad decisions. Choose wisely.
            </p>
          </div>

          {done ? (
            /* ── DONE ── */
            (() => {
              const { emoji, msg } = ratingMsg(pct);
              return (
                <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', background: T.card, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{emoji}</div>
                  <h2 style={{ fontWeight: 800, fontSize: '2rem', margin: '0 0 0.5rem' }}>Discipline Score</h2>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.9rem', color: '#f59e0b', marginBottom: '0.25rem' }}>
                    {score.correct} / {score.total} correct · {pct}%
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: T.textSub, fontStyle: 'italic', maxWidth: 460, margin: '1rem auto 2rem', lineHeight: 1.75 }}>
                    {msg}
                  </p>
                  <button className="next-btn" onClick={restart}>Play Again</button>
                </div>
              );
            })()
          ) : scenario ? (
            /* ── SCENARIO ── */
            <div className="fade-in" key={idx}>

              {/* Progress + diff */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: T.muted }}>
                  {idx + 1} / {queue.length}
                </span>
                <DiffBadge diff={scenario.difficulty} />
              </div>

              {/* Title */}
              <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1.2rem', color: T.text }}>
                {scenario.title}
              </h2>

              {/* Setup */}
              <div style={{
                background: isDark ? 'rgba(62,207,142,0.05)' : 'rgba(62,207,142,0.07)',
                border: '1px solid rgba(62,207,142,0.15)',
                padding: '1.2rem 1.4rem', marginBottom: '1rem',
              }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.67rem', letterSpacing: '0.04em', color: T.textSub, margin: 0, lineHeight: 1.8 }}>
                  <span style={{ color: '#3ecf8e', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.58rem' }}>Setup — </span>
                  {scenario.setup}
                </p>
              </div>

              {/* Situation */}
              <div style={{
                background: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
                padding: '1.2rem 1.4rem', marginBottom: '1.5rem',
              }}>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.67rem', letterSpacing: '0.04em', color: T.textSub, margin: 0, lineHeight: 1.8 }}>
                  <span style={{ color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.58rem' }}>Situation — </span>
                  {scenario.situation}
                </p>
              </div>

              {/* Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {scenario.choices.map((choice, ci) => {
                  const isSelected = chosen === ci;
                  const isRevealed = chosen !== null;
                  const isCorrect  = choice.isCorrect;

                  let borderColor = T.border;
                  let bgColor     = 'transparent';
                  let textColor   = T.text;

                  if (isRevealed) {
                    if (isCorrect) {
                      borderColor = '#3ecf8e88';
                      bgColor     = isDark ? 'rgba(62,207,142,0.08)' : 'rgba(62,207,142,0.1)';
                      textColor   = '#3ecf8e';
                    } else if (isSelected && !isCorrect) {
                      borderColor = '#ef535088';
                      bgColor     = isDark ? 'rgba(239,83,80,0.08)' : 'rgba(239,83,80,0.1)';
                      textColor   = '#ef5350';
                    } else {
                      borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                      textColor   = T.muted;
                    }
                  }

                  return (
                    <button
                      key={ci}
                      className="tilt-choice"
                      disabled={chosen !== null}
                      style={{ borderColor, background: bgColor, color: textColor }}
                      onClick={() => handleChoice(ci)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{ opacity: isRevealed ? 1 : 0.5, minWidth: '1rem' }}>
                          {isRevealed ? (isCorrect ? '✓' : isSelected ? '✗' : '○') : String.fromCharCode(65 + ci) + ')'}
                        </span>
                        <span style={{ lineHeight: 1.6 }}>{choice.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Outcome + lesson */}
              {selectedChoice && (
                <div className="fade-in" style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  padding: '1.4rem', marginBottom: '1.2rem',
                }}>
                  {/* Outcome */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: selectedChoice.isCorrect ? '#3ecf8e' : '#ef5350', marginBottom: '0.5rem' }}>
                      {selectedChoice.isCorrect ? '✓ What happened' : '✗ What happened'}
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: T.textSub, margin: 0, lineHeight: 1.75, fontStyle: 'italic' }}>
                      {selectedChoice.outcome}
                    </p>
                  </div>

                  {/* Lesson */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem' }}>
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '0.5rem' }}>
                      The lesson
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: T.text, margin: 0, lineHeight: 1.75 }}>
                      {selectedChoice.lesson}
                    </p>
                  </div>
                </div>
              )}

              {/* Also show correct choice's lesson if wrong choice made */}
              {chosen !== null && !selectedChoice?.isCorrect && (
                <div className="fade-in" style={{
                  background: isDark ? 'rgba(62,207,142,0.05)' : 'rgba(62,207,142,0.07)',
                  border: '1px solid rgba(62,207,142,0.2)',
                  padding: '1.2rem 1.4rem', marginBottom: '1.2rem',
                }}>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3ecf8e', marginBottom: '0.5rem' }}>
                    The right move would have been
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: T.textSub, margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
                    {scenario.choices.find(c => c.isCorrect)?.outcome}
                  </p>
                </div>
              )}

              {chosen !== null && (
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
