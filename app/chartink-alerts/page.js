"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Moon, Sun } from 'lucide-react';
import ChartinkAlerts from '../../components/ChartinkAlerts';
import { useTheme } from '../../lib/theme-context';

export default function ChartinkAlertsPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation Header */}
      <header className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className={`flex items-center gap-2 font-semibold transition-colors ${
              isDark
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Chartink Alerts
            </h1>
          </div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time trading alerts from Chartink
          </p>
        </div>

        {/* Alerts Component */}
        <div
          className={`rounded-lg shadow-lg p-6 ${
            isDark
              ? 'bg-gray-800 text-gray-100'
              : 'bg-white text-gray-900'
          }`}
        >
          <ChartinkAlerts />
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Setup Instructions
            </h2>
            <ol className={`space-y-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex gap-3">
                <span className="font-bold text-blue-500 flex-shrink-0">1.</span>
                <span>Go to your Chartink account settings</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-500 flex-shrink-0">2.</span>
                <span>Find the Alert/Webhook configuration section</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-500 flex-shrink-0">3.</span>
                <span>Add your webhook URL from the alerts section below</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-500 flex-shrink-0">4.</span>
                <span>Test the alert - it should appear here within seconds</span>
              </li>
            </ol>
          </div>

          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Expected Alert Format
            </h2>
            <pre
              className={`text-xs overflow-x-auto p-3 rounded ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <code className={isDark ? 'text-gray-300' : 'text-gray-700'}>
{`{
  "symbol": "INFY",
  "type": "buy",
  "price": 2450.50,
  "message": "Breakout signal",
  "reason": "Golden Cross",
  "indicator": "MA(50,200)"
}`}
              </code>
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
