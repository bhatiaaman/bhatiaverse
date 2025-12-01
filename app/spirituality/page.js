"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Lightbulb, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

const spiritualLeaders = [
  { name: 'Sri Ramakrishna', desc: 'Indian mystic and yogi.' },
  { name: 'Swami Vivekananda', desc: 'Spiritual leader and philosopher.' },
  { name: 'Paramahansa Yogananda', desc: 'Author of Autobiography of a Yogi.' },
  { name: 'Sri Aurobindo', desc: 'Philosopher, yogi, poet.' },
  { name: 'Osho (Rajneesh)', desc: 'Modern spiritual mystic and meditation pioneer.' },
];

const booksILiked = [
  { title: 'Bhagavad Gita', author: 'Vyasa', desc: 'Ancient Indian scripture on life and duty.' },
  { title: 'Autobiography of a Yogi', author: 'Paramahansa Yogananda', desc: 'Spiritual classic.' },
  { title: 'The Prophet', author: 'Kahlil Gibran', desc: 'Philosophical poetry.' },
];

const perspectives = [
  { title: 'Life is a Journey', detail: 'Life is not about reaching a fixed destination, but about embracing the journey itself, learning and growing with every step.' },
  { title: 'True Happiness Comes from Within', detail: 'External success and possessions are temporary. True contentment and joy arise from inner peace, self-acceptance, and spiritual growth.' },
  { title: 'Every Challenge is an Opportunity', detail: 'Obstacles are not roadblocks but stepping stones. They teach us resilience, wisdom, and help us discover our true strength.' },
];

const spiritualImages = [
  { id: 1, title: 'Bhagavad Gita', src: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=800&h=600&fit=crop' },
  { id: 2, title: 'Meditation & Inner Peace', src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' },
  { id: 3, title: 'Spiritual Awakening', src: 'https://images.unsplash.com/photo-1496688033972-ba8e7bc59974?w=800&h=600&fit=crop' },
];

export default function Spirituality() {
  const { isDark } = useTheme();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedPerspective, setSelectedPerspective] = useState(null);

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % spiritualImages.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + spiritualImages.length) % spiritualImages.length);

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className={isDark ? 'w-8 h-8 text-emerald-400' : 'w-8 h-8 text-emerald-600'} />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Spirituality & Philosophy</h1>
          </div>
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-3">
            <div className={`rounded-2xl border p-6 shadow-sm mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Users className="w-5 h-5" /> Spiritual Leaders</h3>
              <ul className="space-y-3">
                {spiritualLeaders.map((leader) => (
                  <li key={leader.name}>
                    {leader.name === 'Osho (Rajneesh)' ? (
                      <Link href="/spiritual-leaders/osho" className="font-semibold text-emerald-700 underline hover:text-emerald-500 transition">
                        {leader.name}
                      </Link>
                    ) : (
                      <div className="font-semibold text-emerald-700">{leader.name}</div>
                    )}
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{leader.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="col-span-6 flex flex-col items-center justify-center">
            <div className={`rounded-2xl border p-8 shadow-lg flex flex-col items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="relative w-full mb-6">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={prevImage} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 rounded-lg overflow-hidden h-80 shadow-lg">
                    <img 
                      src={spiritualImages[currentImageIdx].src}
                      alt={spiritualImages[currentImageIdx].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button onClick={nextImage} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {spiritualImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition ${idx === currentImageIdx ? 'bg-emerald-600' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>

              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Spiritual Reflections</h2>
              <p className={`text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{spiritualImages[currentImageIdx].title}</p>
              <div className="mt-4">
                <span className={`inline-block px-4 py-2 rounded font-semibold ${isDark ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-700'}`}>"You have the right to work, but not to the fruits of work."</span>
              </div>
            </div>
          </main>

          <aside className="col-span-3 flex flex-col gap-6">
            <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><BookOpen className="w-5 h-5" /> Books I Liked</h3>
              <ul className="space-y-3">
                {booksILiked.map((book) => (
                  <li key={book.title}>
                    <div className="font-semibold text-emerald-700">{book.title}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>by {book.author}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{book.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Lightbulb className="w-5 h-5" /> My Perspectives</h3>
              <ul className="space-y-2">
                {perspectives.map((p, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setSelectedPerspective(idx === selectedPerspective ? null : idx)}
                      className={`w-full text-left text-sm p-2 rounded transition ${idx === selectedPerspective ? (isDark ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'text-gray-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <div className="font-semibold">{p.title}</div>
                      {idx === selectedPerspective && <div className="text-xs mt-1 opacity-90">{p.detail}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
