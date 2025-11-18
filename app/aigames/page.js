"use client";

import React from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

export default function AIGames() {
  const { isDark } = useTheme();

  const games = [
    {
      title: 'Tic Tac Toe',
      description: 'Classic 3x3 grid game. Get three marks in a row to win.',
      href: '/tictactoe',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Memory Match',
      description: 'Flip cards to find matching animal emojis. Fun for kids!',
      href: '/tetris',
      color: 'from-yellow-400 to-yellow-500',
    },
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className={isDark ? 'w-8 h-8 text-violet-500' : 'w-8 h-8 text-violet-600'} />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AI Games
            </h1>
          </div>
          <Link
            href="/"
            className={`px-4 py-2 text-sm rounded-lg transition-colors border ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'
            }`}
          >
            Back Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Choose a Game
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {games.map((game) => (
            <Link key={game.href} href={game.href}>
              <div
                className={`group h-full p-8 rounded-2xl border transition transform hover:scale-105 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-violet-600 hover:bg-slate-700/80'
                    : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition text-white`}>
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {game.title}
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  {game.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
