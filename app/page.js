'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Lightbulb, Gamepad2, TrendingUp, Github, Linkedin, Mail, ArrowRight } from 'lucide-react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
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
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Bhatiaverse
          </span>
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#articles" className="hover:text-purple-400 transition">Articles</a>
          <a href="#musings" className="hover:text-purple-400 transition">Musings</a>
          <a href="/trades" className="hover:text-purple-400 transition">Trades</a>
          <a href="#games" className="hover:text-purple-400 transition">AI Games</a>
          <a href="#contact" className="hover:text-purple-400 transition">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className="px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm border border-purple-500/30">
              Welcome to the Universe
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            The Bhatiaverse
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            A cosmic space where <span className="text-purple-400 font-semibold">ideas</span>,{' '}
            <span className="text-blue-400 font-semibold">thoughts</span>, and{' '}
            <span className="text-pink-400 font-semibold">interactive experiences</span> collide.
          </p>
          <p className="text-lg text-gray-400 mb-12">
            Created by <span className="text-white font-semibold">Amandeep Bhatia</span> - 
            Developer, Writer, and AI Enthusiast
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#articles"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:scale-105 transition transform flex items-center justify-center gap-2"
            >
              Explore Content <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#contact"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition border border-white/20 flex items-center justify-center gap-2"
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
            className="group p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-purple-500/50 transition transform hover:scale-105 hover:bg-white/10"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Articles</h3>
            <p className="text-gray-400 mb-6">
              Deep dives into technology, AI, development, and everything in between. 
              Thoughtful analysis and practical insights.
            </p>
            <a href="#" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 font-semibold">
              Read Articles <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Musings Card */}
          <div
            id="musings"
            className="group p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-pink-500/50 transition transform hover:scale-105 hover:bg-white/10"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Musings</h3>
            <p className="text-gray-400 mb-6">
              Random thoughts, observations, and reflections on life, tech, and the universe. 
              Sometimes profound, sometimes just fun.
            </p>
            <a href="#" className="text-pink-400 hover:text-pink-300 flex items-center gap-2 font-semibold">
              Explore Thoughts <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trades Card */}
          <div
            id="trades"
            className="group p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-yellow-500/50 transition transform hover:scale-105 hover:bg-white/10"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Trades</h3>
            <p className="text-gray-400 mb-6">
              Trading insights, market analysis, and financial perspectives. 
              Strategies, tips, and lessons from the markets.
            </p>
            <a href="/trades" className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2 font-semibold">
              View Trades <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* AI Games Card */}
          <div
            id="games"
            className="group p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-green-500/50 transition transform hover:scale-105 hover:bg-white/10"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">AI Games</h3>
            <p className="text-gray-400 mb-6">
              Interactive experiences powered by artificial intelligence. 
              Play, learn, and explore the possibilities of AI.
            </p>
            <a href="#" className="text-green-400 hover:text-green-300 flex items-center gap-2 font-semibold">
              Start Playing <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">About This Universe</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            The Bhatiaverse is my personal corner of the internet where I share my journey through 
            technology, artificial intelligence, and creative thinking. Whether you're here for 
            technical insights, philosophical musings, or just to play with some cool AI-powered 
            experiences, there's something for everyone.
          </p>
          <p className="text-lg text-gray-400 leading-relaxed">
            This space is constantly evolving, just like the universe itself. New content, 
            experiments, and ideas are always on the horizon.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Let's Connect</h2>
          <p className="text-gray-300 mb-12">
            Have a question, idea, or just want to say hi? I'd love to hear from you.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href="mailto:your.email@example.com"
              className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-gray-400">
          <p>© 2025 Bhatiaverse. Built with passion and curiosity.</p>
        </div>
      </footer>
    </div>
  );
}