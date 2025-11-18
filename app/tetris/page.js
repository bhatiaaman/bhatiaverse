"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

// Memory Match - simple emoji card matching game for kids
const EMOJIS = ['🦊','🐶','🐱','🐻','🐼','🐵','🐸','🐷'];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Tetris() {
  const { isDark } = useTheme();
  const [cards, setCards] = useState([]); // {id, emoji, matched}
  const [flipped, setFlipped] = useState([]); // indices
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    startGame();
  }, []);

  function startGame() {
    const pairEmojis = EMOJIS.concat(EMOJIS); // duplicate
    const shuffled = shuffle(pairEmojis).map((emoji, idx) => ({ id: idx, emoji, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setDisabled(false);
  }

  function flipCard(index) {
    if (disabled) return;
    if (flipped.includes(index) || cards[index].matched) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves((m) => m + 1);
      const [i, j] = newFlipped;
      if (cards[i].emoji === cards[j].emoji) {
        // match
        setTimeout(() => {
          setCards((prev) => prev.map((c, idx) => (idx === i || idx === j ? { ...c, matched: true } : c)));
          setFlipped([]);
          setMatches((m) => m + 1);
          setDisabled(false);
        }, 600);
      } else {
        // not match
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 800);
      }
    }
  }

  const allMatched = matches === EMOJIS.length;

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Memory Match (Kids)
            </h1>
          </div>
          <Link href="/" className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'}`}>
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-2xl p-6 border shadow-lg transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Find the matching animals!</h2>
                <div className="text-sm text-gray-500">Moves: {moves} • Matches: {matches}/{EMOJIS.length}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={startGame} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Restart</button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {cards.map((card, idx) => {
                const isFlipped = flipped.includes(idx) || card.matched;
                return (
                  <button
                    key={card.id}
                    onClick={() => flipCard(idx)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-3xl transition transform ${isFlipped ? 'bg-white' : 'bg-blue-500'} ${card.matched ? 'opacity-70' : ''}`}>
                    {isFlipped ? card.emoji : '❓'}
                  </button>
                );
              })}
            </div>

            {allMatched && (
              <div className="mt-6 p-4 rounded bg-yellow-50 text-yellow-800 text-center font-semibold">Great job! You matched all the animals 🎉</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
