"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

export default function TicTacToe() {
  const { isDark } = useTheme();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Calculate winner
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Check if board is full
  const isBoardFull = board.every((square) => square !== null);

  // Update game state when board changes
  useEffect(() => {
    const w = calculateWinner(board);
    if (w) {
      setWinner(w);
      setGameOver(true);
    } else if (isBoardFull) {
      setGameOver(true);
    }
  }, [board, isBoardFull]);

  const handleClick = (index) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tic Tac Toe
            </h1>
          </div>
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          <div className={`rounded-2xl p-8 border shadow-lg transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tic Tac Toe Game
            </h2>
            <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {gameOver
                ? winner
                  ? `🎉 ${winner} Wins! 🎉`
                  : "It's a Draw!"
                : `Current Player: ${isXNext ? 'X' : 'O'}`}
            </p>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              {board.map((value, index) => (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  className={`h-20 rounded-lg font-bold text-2xl transition ${
                    value
                      ? isDark
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-900'
                      : isDark
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  disabled={gameOver || value !== null}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetGame}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {gameOver ? 'Play Again' : 'Reset Game'}
            </button>

            {/* Instructions */}
            <div className={`mt-8 p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>How to Play:</h3>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• Click any empty square to place your mark</li>
                <li>• X goes first</li>
                <li>• Get 3 marks in a row to win</li>
                <li>• Play horizontally, vertically, or diagonally</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
