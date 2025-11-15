"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Lightbulb, Gamepad2, TrendingUp, Github, Linkedin, Mail, ArrowRight, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../lib/theme-context';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen transition-colors overflow-hidden font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Animated background stars */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-slate-400'}`}
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`relative z-10 container mx-auto px-6 py-6 flex justify-between items-center border-b transition-colors ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <Sparkles className={isDark ? 'w-8 h-8 text-blue-500' : 'w-8 h-8 text-blue-600'} />
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Bhatiaverse
          </span>
        </div>
        <div className="hidden md:flex space-x-8 items-center">
          <a href="#articles" className={`transition hover:text-blue-500 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Articles</a>
          <a href="#musings" className={`transition hover:text-blue-500 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Musings</a>
          <a href="/trades" className={`transition hover:text-blue-500 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Trades</a>
          <a href="#games" className={`transition hover:text-blue-500 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>AI Games</a>
          <a href="#contact" className={`transition hover:text-blue-500 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Contact</a>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                : 'bg-gray-200 hover:bg-gray-300 text-slate-600'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}>
              Welcome to the Universe
            </span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'} animate-pulse`}>
            The Bhatiaverse
          </h1>
          <p className={`text-xl md:text-2xl mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            A cosmic space where <span className="text-blue-500 font-semibold">ideas</span>,{' '}
            <span className="text-blue-600 font-semibold">thoughts</span>, and{' '}
            <span className="text-blue-500 font-semibold">interactive experiences</span> collide.
          </p>
          <p className={`text-lg mb-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Created by <span className={isDark ? 'text-white' : 'text-slate-900'}>Amandeep Bhatia</span> - 
            Developer, Writer, and AI Enthusiast
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#articles"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold hover:scale-105 transition transform flex items-center justify-center gap-2"
            >
              Explore Content <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#contact"
              className={`px-8 py-4 rounded-lg font-semibold transition border flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'
              }`}
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Articles Card */}
          <div
            id="articles"
            className={`group p-8 rounded-2xl border transition transform hover:scale-105 ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-blue-600 hover:bg-slate-700/80'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition text-white">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>Articles</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Deep dives into technology, AI, development, and everything in between. 
              Thoughtful analysis and practical insights.
            </p>
            <a href="#" className={`flex items-center gap-2 font-semibold transition hover:gap-3 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              Read Articles <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Musings Card */}
          <div
            id="musings"
            className={`group p-8 rounded-2xl border transition transform hover:scale-105 ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-emerald-600 hover:bg-slate-700/80'
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition text-white">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>Musings</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Random thoughts, observations, and reflections on life, tech, and the universe. 
              Sometimes profound, sometimes just fun.
            </p>
            <a href="#" className={`flex items-center gap-2 font-semibold transition hover:gap-3 ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}>
              Explore Thoughts <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trades Card */}
          <div
            id="trades"
            className={`group p-8 rounded-2xl border transition transform hover:scale-105 ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-amber-600 hover:bg-slate-700/80'
                : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition text-white">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>Trades</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Trading insights, market analysis, and financial perspectives. 
              Strategies, tips, and lessons from the markets.
            </p>
            <Link href="/trades" className={`flex items-center gap-2 font-semibold transition hover:gap-3 ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
              View Trades <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* AI Games Card */}
          <div
            id="games"
            className={`group p-8 rounded-2xl border transition transform hover:scale-105 ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-violet-600 hover:bg-slate-700/80'
                : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50'
            }`}
          >
            <div className="w-16 h-16 bg-violet-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition text-white">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Games</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Interactive experiences powered by artificial intelligence. 
              Play, learn, and explore the possibilities of AI.
            </p>
            <a href="#" className={`flex items-center gap-2 font-semibold transition hover:gap-3 ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}>
              Start Playing <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={`relative z-10 container mx-auto px-6 py-20 rounded-2xl my-8 border transition-colors ${
        isDark
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>About This Universe</h2>
          <p className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            The Bhatiaverse is my personal corner of the internet where I share my journey through 
            technology, artificial intelligence, and creative thinking. Whether you're here for 
            technical insights, philosophical musings, or just to play with some cool AI-powered 
            experiences, there's something for everyone.
          </p>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            This space is constantly evolving, just like the universe itself. New content, 
            experiments, and ideas are always on the horizon.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`relative z-10 container mx-auto px-6 py-20 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Let's Connect</h2>
          <p className={`mb-12 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Have a question, idea, or just want to say hi? I'd love to hear from you.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 border-gray-300 hover:bg-gray-300 text-slate-700'
              }`}
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 border-gray-300 hover:bg-gray-300 text-slate-700'
              }`}
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href="mailto:your.email@example.com"
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 border-gray-300 hover:bg-gray-300 text-slate-700'
              }`}
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t transition-colors mt-20 ${
        isDark
          ? 'border-slate-800 bg-slate-900'
          : 'border-gray-200 bg-gray-100'
      }`}>
        <div className={`container mx-auto px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>© 2025 Bhatiaverse. Built with passion and curiosity.</p>
        </div>
      </footer>
    </div>
  );
}