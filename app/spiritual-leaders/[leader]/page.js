"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../../../lib/theme-context";
import { useParams } from "next/navigation";

const leaderData = {
  osho: {
    name: "Osho (Rajneesh)",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Osho_in_1977.jpg",
    bio: `Osho, also known as Bhagwan Shree Rajneesh, was a modern spiritual teacher, mystic, and meditation pioneer. His teachings emphasize awareness, love, celebration, courage, creativity, and humor. Osho's discourses cover a wide range of topics from meditation to relationships, and he is known for his radical approach to spirituality.`,
    sections: [
      {
        title: "Biography",
        content: `Born in India in 1931, Osho became a professor of philosophy before embarking on his spiritual journey. He founded the Osho International Meditation Resort in Pune, which attracts seekers from around the world.`
      },
      {
        title: "Teachings",
        content: `Osho's teachings focus on meditation, mindfulness, living in the present moment, and breaking free from societal conditioning. He encouraged people to find their own path to enlightenment.`
      },
      {
        title: "Books",
        content: `Osho authored over 600 books, including 'The Book of Secrets', 'Love, Freedom, Aloneness', and 'Courage: The Joy of Living Dangerously'. His works have been translated into dozens of languages.`
      },
      {
        title: "Quotes",
        content: `"Be — don't try to become."\n"Courage is a love affair with the unknown."\n"The greatest fear in the world is of the opinions of others."`
      },
      {
        title: "Meditation Techniques",
        content: `Osho developed dynamic meditation techniques designed for modern people, including Dynamic Meditation, Kundalini Meditation, and Nadabrahma Meditation.`
      }
    ]
  }
};

export default function SpiritualLeaderPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const leaderKey = params.leader?.toLowerCase();
  const leader = leaderData[leaderKey];

  if (!leader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Spiritual Leader Not Found</h1>
        <Link href="/musings" className="text-blue-600 underline">Back to Musings</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className={`border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={leader.image} alt={leader.name} className="w-12 h-12 rounded-full object-cover border" />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{leader.name}</h1>
          </div>
          <Link
            href="/musings"
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-slate-900'}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Musings
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <img src={leader.image} alt={leader.name} className="w-32 h-32 rounded-full object-cover mx-auto border mb-4" />
          <p className={`text-lg text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{leader.bio}</p>
        </div>
        <div className="space-y-8">
          {leader.sections.map((section, idx) => (
            <section key={idx} className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.title}</h2>
              <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{section.content}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
