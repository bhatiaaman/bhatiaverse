"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const LEADERS = [
  {
    name: 'Sri Ramakrishna',
    dates: '1836 – 1886',
    role: 'Mystic & Saint',
    bio: 'One of the greatest mystics of 19th century India, Ramakrishna experienced the divine through multiple religious paths and taught that all religions lead to the same truth.',
    quote: 'God can be realized through all paths. All religions are true.',
    color: '#c8a96e',
    href: null,
  },
  {
    name: 'Swami Vivekananda',
    dates: '1863 – 1902',
    role: 'Philosopher & Spiritual Leader',
    bio: 'Disciple of Ramakrishna who brought Vedanta and Yoga to the West. His Parliament of Religions address in 1893 is one of history\'s most powerful speeches.',
    quote: 'Arise, awake, and stop not till the goal is reached.',
    color: '#7b5ea7',
    href: null,
  },
  {
    name: 'Paramahansa Yogananda',
    dates: '1893 – 1952',
    role: 'Yogi & Author',
    bio: 'Author of the spiritual classic "Autobiography of a Yogi", Yogananda introduced millions of Westerners to meditation and the teachings of Kriya Yoga.',
    quote: 'The season of failure is the best time for sowing the seeds of success.',
    color: '#4a9eff',
    href: null,
  },
  {
    name: 'Sri Aurobindo',
    dates: '1872 – 1950',
    role: 'Philosopher, Yogi & Poet',
    bio: 'A revolutionary turned spiritual giant, Aurobindo\'s Integral Yoga sought to bring the Divine down into everyday life. His epic poem Savitri is a literary masterpiece.',
    quote: 'All life is yoga.',
    color: '#3ecf8e',
    href: null,
  },
  {
    name: 'Osho',
    dates: '1931 – 1990',
    role: 'Mystic & Meditation Pioneer',
    bio: 'Controversial and brilliant, Osho challenged every convention and institution. His talks on meditation, love, and freedom remain deeply transformative for millions.',
    quote: 'Be — don\'t try to become.',
    color: '#f0a050',
    href: '/spiritual-leaders/osho',
  },
];

const BOOKS = [
  {
    title: 'Bhagavad Gita',
    author: 'Vyasa',
    category: 'Scripture',
    description: 'The timeless dialogue between Arjuna and Krishna on the battlefield of Kurukshetra. A complete guide to living with purpose, detachment, and devotion.',
    insight: 'The concept of nishkama karma — action without attachment to results — transformed how I approach both work and life.',
    color: '#c8a96e',
  },
  {
    title: 'Autobiography of a Yogi',
    author: 'Paramahansa Yogananda',
    category: 'Memoir',
    description: 'A breathtaking account of one yogi\'s journey through mystical India and the West. Steve Jobs had this book on his iPad and requested it be given to attendees at his memorial.',
    insight: 'This book opened my mind to the possibility that reality is far more mysterious and vast than our ordinary perception suggests.',
    color: '#7b5ea7',
  },
  {
    title: 'The Prophet',
    author: 'Kahlil Gibran',
    category: 'Philosophy & Poetry',
    description: 'Twenty-six poetic essays on life\'s greatest themes: love, marriage, children, work, pain, joy, and death. Gibran\'s prose is luminous and eternal.',
    insight: 'The chapter on children — "your children are not your children" — is one of the most profound things I have ever read.',
    color: '#4a9eff',
  },
  {
    title: 'The Book of Secrets',
    author: 'Osho',
    category: 'Meditation',
    description: '112 meditation techniques drawn from the ancient Vigyan Bhairav Tantra. Each technique is a doorway. You only need one to work.',
    insight: 'A practical companion to spiritual life. Not philosophy — direct method.',
    color: '#f0a050',
  },
];

const PERSPECTIVES = [
  {
    num: '01',
    title: 'The Witness Within',
    body: 'Behind every thought, emotion, and experience, there is a silent witness — awareness itself. Spiritual practice is simply learning to rest as that witness rather than getting lost in the content of experience. This is what all traditions point to, whether they call it Atman, Buddha-nature, or the Kingdom of Heaven within.',
    color: '#7b5ea7',
  },
  {
    num: '02',
    title: 'Action Without Attachment',
    body: 'The Gita\'s teaching of nishkama karma isn\'t passive resignation — it\'s radical presence. You give 100% to the work, and 0% to the anxiety about outcome. The quality of the action transforms completely when you remove the weight of expectation from it. This isn\'t just philosophy; it\'s one of the most practical things I have applied to my life.',
    color: '#c8a96e',
  },
  {
    num: '03',
    title: 'All Paths Lead Home',
    body: 'Ramakrishna\'s most radical gift was his lived demonstration that all religions are true paths. He didn\'t just intellectually accept other traditions — he practiced them and found the same divine truth in each. In a world increasingly divided by religion, this is perhaps the most needed teaching of our time.',
    color: '#3ecf8e',
  },
  {
    num: '04',
    title: 'The Courage to Be Still',
    body: 'In a culture obsessed with productivity and noise, choosing stillness is an act of quiet rebellion. Meditation is not about stopping thoughts — it\'s about no longer being enslaved by them. Even ten minutes of real silence changes the texture of an entire day.',
    color: '#4a9eff',
  },
];

const QUOTES = [
  { text: 'You have the right to perform your actions, but you are not entitled to the fruits of your actions.', source: 'Bhagavad Gita' },
  { text: 'The greatest religion is to be true to your own nature. Have faith in yourselves.', source: 'Swami Vivekananda' },
  { text: 'In the beginner\'s mind there are many possibilities, but in the expert\'s mind there are few.', source: 'Shunryu Suzuki' },
  { text: 'The wound is the place where the Light enters you.', source: 'Rumi' },
  { text: 'Be — don\'t try to become.', source: 'Osho' },
];

export default function SpiritualityPage() {
  const canvasRef     = useRef(null);
  const cursorRef     = useRef(null);
  const cursorRingRef = useRef(null);
  const mouseRef      = useRef({ x: 0, y: 0 });
  const ringPosRef    = useRef({ x: 0, y: 0 });
  const rafRef        = useRef(null);
  const starRafRef    = useRef(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [activeSection] = useState('All');

  // Rotate quotes every 5s
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring   = cursorRingRef.current;
    if (!cursor || !ring) return;
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      cursor.style.left = (e.clientX - 4) + 'px';
      cursor.style.top  = (e.clientY - 4) + 'px';
    };
    const animateRing = () => {
      ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x - 18) * 0.12;
      ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y - 18) * 0.12;
      ring.style.left = ringPosRef.current.x + 'px';
      ring.style.top  = ringPosRef.current.y + 'px';
      rafRef.current = requestAnimationFrame(animateRing);
    };
    document.addEventListener('mousemove', onMove);
    rafRef.current = requestAnimationFrame(animateRing);
    const interactives = document.querySelectorAll('a, button, .card-hover');
    const onEnter = () => { cursor.style.transform='scale(2.5)'; ring.style.transform='scale(1.5)'; ring.style.borderColor='rgba(123,94,167,0.7)'; };
    const onLeave = () => { cursor.style.transform='scale(1)';   ring.style.transform='scale(1)';   ring.style.borderColor='rgba(200,169,110,0.4)'; };
    interactives.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Star canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [], W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const createStars = () => {
      stars = [];
      const count = Math.floor((W * H) / 4500);
      for (let i = 0; i < count; i++) {
        stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+0.2, opacity: Math.random()*0.6+0.1, twinkle: Math.random()*Math.PI*2, twinkleSpeed: Math.random()*0.018+0.004, color: Math.random()>0.85?'#c8a96e':Math.random()>0.7?'#a8b8d8':'#ffffff' });
      }
    };
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const op = s.opacity*(0.6+0.4*Math.sin(s.twinkle));
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=s.color; ctx.globalAlpha=op; ctx.fill();
      });
      ctx.globalAlpha=1;
      starRafRef.current = requestAnimationFrame(draw);
    };
    resize(); createStars(); draw();
    window.addEventListener('resize', ()=>{ resize(); createStars(); });
    return () => cancelAnimationFrame(starRafRef.current);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }), { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [activeSection]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />

      <style>{`
        .bv-root { cursor: none; }
        .bv-cursor { position:fixed; width:8px; height:8px; background:#c8a96e; border-radius:50%; pointer-events:none; z-index:9999; transition:transform 0.1s; mix-blend-mode:screen; }
        .bv-cursor-ring { position:fixed; width:36px; height:36px; border:1px solid rgba(200,169,110,0.4); border-radius:50%; pointer-events:none; z-index:9998; transition:transform 0.15s ease, border-color 0.15s ease; }
        .reveal { opacity:0; transform:translateY(30px); transition:opacity 0.7s ease, transform 0.7s ease; }
        .reveal.revealed { opacity:1; transform:translateY(0); }
        .nav-link { position:relative; font-family:'DM Mono',monospace; font-size:0.72rem; letter-spacing:0.15em; text-transform:uppercase; color:#a8b8d8; text-decoration:none; transition:color 0.3s; }
        .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; right:100%; height:1px; background:#c8a96e; transition:right 0.3s ease; }
        .nav-link:hover { color:#c8a96e; }
        .nav-link:hover::after { right:0; }
        .spirit-card { position:relative; background:rgba(13,13,43,0.75); border:1px solid rgba(255,255,255,0.05); overflow:hidden; transition:transform 0.4s ease; cursor:none; }
        .spirit-card:hover { transform:translateY(-5px); }
        .spirit-card::after { content:''; position:absolute; bottom:0; left:0; right:100%; height:1px; background:#7b5ea7; transition:right 0.5s ease; }
        .spirit-card:hover::after { right:0; }
        .quote-fade { animation: quoteFade 0.6s ease; }
        @keyframes quoteFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .pill { font-family:'DM Mono',monospace; font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; border:1px solid rgba(168,184,216,0.15); padding:0.5rem 1.2rem; background:transparent; color:#a8b8d8; cursor:none; transition:all 0.25s ease; white-space:nowrap; }
        .pill:hover { border-color:rgba(123,94,167,0.4); color:#7b5ea7; }
        .pill.active { background:rgba(123,94,167,0.12); border-color:#7b5ea7; color:#7b5ea7; }
        .card-link-arrow { transition:gap 0.3s; }
        .card-link-arrow:hover { gap:1.2rem !important; }
        .marquee-track { animation: marquee 28s linear infinite; }
        @keyframes marquee { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        .glyph-ring-a { animation:orbitSpin 18s linear infinite; }
        .glyph-ring-b { animation:orbitSpin 30s linear infinite reverse; }
        @keyframes orbitSpin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
        .glyph-pulse { animation:glyphPulse 4s ease infinite; }
        @keyframes glyphPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.7;} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:1;} }
        @media(max-width:900px){ .leaders-grid{grid-template-columns:1fr !important;} .perspectives-grid{grid-template-columns:1fr !important;} .books-grid{grid-template-columns:1fr !important;} }
      `}</style>

      <div className="bv-root" style={{ background: '#02020a', color: '#f0f4ff', minHeight: '100vh', overflowX: 'hidden' }}>

        <div className="bv-cursor" ref={cursorRef} />
        <div className="bv-cursor-ring" ref={cursorRingRef} />
        <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }} />

        {/* Glow orbs */}
        <div style={{ position:'fixed', width:600, height:600, background:'rgba(123,94,167,0.08)', borderRadius:'50%', filter:'blur(120px)', top:'-10%', right:'-10%', zIndex:0, pointerEvents:'none' }} />
        <div style={{ position:'fixed', width:500, height:500, background:'rgba(200,169,110,0.04)', borderRadius:'50%', filter:'blur(120px)', bottom:'10%', left:'-10%', zIndex:0, pointerEvents:'none' }} />

        {/* NAV */}
        <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'1.5rem 3rem', display:'flex', alignItems:'center', justifyContent:'space-between', backdropFilter:'blur(20px)', background:'linear-gradient(to bottom, rgba(2,2,10,0.9) 0%, transparent 100%)', borderBottom:'1px solid rgba(200,169,110,0.08)' }}>
          <Link href="/" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'#c8a96e', textDecoration:'none' }}>
            Bhatiaverse
          </Link>
          <ul style={{ display:'flex', gap:'2.5rem', listStyle:'none', margin:0, padding:0, flexWrap:'wrap', alignItems:'center' }}>
            <li><Link href="/articles" className="nav-link">Articles</Link></li>
            <li><Link href="/spirituality" className="nav-link" style={{ color:'#7b5ea7' }}>Spirituality</Link></li>
            <li><Link href="/trades" className="nav-link">Trades</Link></li>
            <li><Link href="/aigames" className="nav-link">AI Games</Link></li>
            <li><Link href="/#contact" className="nav-link">Contact</Link></li>
          </ul>
        </nav>

        {/* HERO */}
        <section style={{ position:'relative', minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'10rem 2rem 6rem', zIndex:1, overflow:'hidden' }}>

          {/* Glyph decoration */}
          <div style={{ position:'absolute', width:500, height:500, top:'50%', left:'50%', pointerEvents:'none' }}>
            {[['100%','rgba(123,94,167,0.06)','glyph-ring-b'],['65%','rgba(200,169,110,0.08)','glyph-ring-a']].map(([size,color,cls])=>(
              <div key={cls} className={cls} style={{ position:'absolute', borderRadius:'50%', border:`1px solid ${color}`, width:size, height:size, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
            ))}
            <div className="glyph-pulse" style={{ position:'absolute', top:'50%', left:'50%', width:60, height:60, background:'radial-gradient(circle,#7b5ea7 0%,rgba(123,94,167,0.2) 60%,transparent 100%)', borderRadius:'50%', boxShadow:'0 0 60px rgba(123,94,167,0.25)' }} />
          </div>

          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.7rem', letterSpacing:'0.4em', textTransform:'uppercase', color:'#7b5ea7', opacity:0.85, marginBottom:'2rem' }}>
            ✦ Inner Cosmos
          </p>

          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(3.5rem,10vw,8rem)', fontWeight:800, lineHeight:0.9, letterSpacing:'-0.03em', marginBottom:'0.5rem' }}>
            <span style={{ display:'block', background:'linear-gradient(135deg,#f0f4ff 0%,#a8b8d8 50%,#f0f4ff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Spirit</span>
            <span style={{ display:'block', fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:300, fontSize:'0.5em', background:'linear-gradient(135deg,#7b5ea7 0%,#b48fd8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginTop:'0.2em' }}>
              & Philosophy
            </span>
          </h1>

          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:300, color:'#a8b8d8', maxWidth:560, lineHeight:1.8, margin:'2.5rem auto 0', fontStyle:'italic' }}>
            Reflections on consciousness, contemplative traditions, and the quiet art of being alive. The universe within mirrors the universe without.
          </p>

          {/* Rotating quote */}
          <div className="quote-fade" key={quoteIdx} style={{ marginTop:'3.5rem', maxWidth:600, padding:'2rem', border:'1px solid rgba(123,94,167,0.2)', background:'rgba(123,94,167,0.05)' }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.15rem', fontStyle:'italic', color:'rgba(240,244,255,0.8)', lineHeight:1.8, marginBottom:'0.75rem' }}>
              &ldquo;{QUOTES[quoteIdx].text}&rdquo;
            </p>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(123,94,167,0.6)' }}>
              — {QUOTES[quoteIdx].source}
            </span>
          </div>

          {/* Quote dots */}
          <div style={{ display:'flex', gap:'0.5rem', marginTop:'1.25rem' }}>
            {QUOTES.map((_, i) => (
              <button key={i} className="card-hover" onClick={() => setQuoteIdx(i)} style={{ width:6, height:6, borderRadius:'50%', border:'none', background: i===quoteIdx ? '#7b5ea7' : 'rgba(123,94,167,0.25)', cursor:'none', transition:'background 0.3s', padding:0 }} />
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ overflow:'hidden', padding:'1.2rem 0', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)', position:'relative', zIndex:1 }}>
          <div className="marquee-track" style={{ display:'flex', gap:'3rem', width:'max-content' }}>
            {[1,2].map(k => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:'3rem', whiteSpace:'nowrap', fontFamily:"'Syne',sans-serif", fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(168,184,216,0.15)' }}>
                Vedanta <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Meditation <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Consciousness <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Bhagavad Gita <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Yoga <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Non-Duality <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Inner Peace <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Awareness <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span> Silence <span style={{ color:'rgba(123,94,167,0.3)' }}>✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main style={{ maxWidth:1400, margin:'0 auto', padding:'6rem 3rem 8rem', position:'relative', zIndex:1 }}>

          {/* SPIRITUAL LEADERS */}
          <div style={{ marginBottom:'7rem' }}>
            <div className="reveal" style={{ display:'flex', alignItems:'baseline', gap:'1.5rem', marginBottom:'3rem' }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.65rem', letterSpacing:'0.3em', color:'rgba(123,94,167,0.6)', textTransform:'uppercase' }}>/ 01</span>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, background:'linear-gradient(135deg,#f0f4ff,#a8b8d8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:0 }}>Spiritual Teachers</h2>
            </div>

            <div className="leaders-grid reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5px' }}>
              {LEADERS.map((leader, i) => (
                <div key={leader.name} className="spirit-card card-hover" style={{ padding:'2.5rem', transitionDelay:`${i*0.1}s`, ...(leader.href ? {} : {}) }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:leader.color, boxShadow:`0 0 10px ${leader.color}` }} />
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.55rem', letterSpacing:'0.2em', textTransform:'uppercase', color:`${leader.color}99` }}>{leader.role}</span>
                  </div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.3rem', fontWeight:700, color:'#f0f4ff', marginBottom:'0.35rem', lineHeight:1.2 }}>
                    {leader.href ? (
                      <Link href={leader.href} className="card-hover" style={{ color:'#f0f4ff', textDecoration:'none', borderBottom:`1px solid ${leader.color}44`, paddingBottom:'1px' }}>{leader.name}</Link>
                    ) : leader.name}
                  </h3>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.55rem', color:'rgba(168,184,216,0.35)', letterSpacing:'0.1em' }}>{leader.dates}</span>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem', lineHeight:1.8, color:'rgba(168,184,216,0.65)', fontWeight:300, margin:'1rem 0 1.5rem' }}>
                    {leader.bio}
                  </p>
                  <blockquote style={{ borderLeft:`2px solid ${leader.color}55`, paddingLeft:'1rem', margin:0 }}>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1rem', color:`${leader.color}cc`, lineHeight:1.7, margin:0 }}>
                      &ldquo;{leader.quote}&rdquo;
                    </p>
                  </blockquote>
                </div>
              ))}
            </div>
          </div>

          {/* COSMIC DIVIDER */}
          <div style={{ height:1, background:'linear-gradient(to right, transparent, rgba(123,94,167,0.3), transparent)', marginBottom:'7rem' }} />

          {/* MY PERSPECTIVES */}
          <div style={{ marginBottom:'7rem' }}>
            <div className="reveal" style={{ display:'flex', alignItems:'baseline', gap:'1.5rem', marginBottom:'3rem' }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.65rem', letterSpacing:'0.3em', color:'rgba(123,94,167,0.6)', textTransform:'uppercase' }}>/ 02</span>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, background:'linear-gradient(135deg,#f0f4ff,#a8b8d8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:0 }}>My Perspectives</h2>
            </div>

            <div className="perspectives-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5px' }}>
              {PERSPECTIVES.map((p, i) => (
                <div key={p.num} className="spirit-card card-hover reveal" style={{ padding:'3rem', transitionDelay:`${i*0.12}s` }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'1rem', marginBottom:'1.5rem' }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.2em', color:`${p.color}66` }}>{p.num}</span>
                    <div style={{ height:1, flex:1, background:`linear-gradient(to right, ${p.color}33, transparent)` }} />
                  </div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.5rem', fontWeight:700, color:'#f0f4ff', marginBottom:'1.25rem', lineHeight:1.2 }}>{p.title}</h3>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.08rem', lineHeight:1.9, color:'rgba(168,184,216,0.7)', fontWeight:300 }}>{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* COSMIC DIVIDER */}
          <div style={{ height:1, background:'linear-gradient(to right, transparent, rgba(200,169,110,0.25), transparent)', marginBottom:'7rem' }} />

          {/* BOOKS */}
          <div>
            <div className="reveal" style={{ display:'flex', alignItems:'baseline', gap:'1.5rem', marginBottom:'3rem' }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.65rem', letterSpacing:'0.3em', color:'rgba(123,94,167,0.6)', textTransform:'uppercase' }}>/ 03</span>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, background:'linear-gradient(135deg,#f0f4ff,#a8b8d8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:0 }}>Books That Moved Me</h2>
            </div>

            <div className="books-grid reveal" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1.5px' }}>
              {BOOKS.map((book, i) => (
                <div key={book.title} className="spirit-card card-hover" style={{ padding:'2.5rem', transitionDelay:`${i*0.1}s` }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.55rem', letterSpacing:'0.2em', textTransform:'uppercase', color:`${book.color}88`, border:`1px solid ${book.color}33`, padding:'0.25rem 0.7rem', display:'inline-block', marginBottom:'1.25rem' }}>{book.category}</span>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'#f0f4ff', marginBottom:'0.35rem', lineHeight:1.2 }}>{book.title}</h3>
                  <p style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.6rem', color:'rgba(168,184,216,0.4)', letterSpacing:'0.1em', marginBottom:'1.25rem' }}>by {book.author}</p>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem', lineHeight:1.8, color:'rgba(168,184,216,0.65)', fontWeight:300, marginBottom:'1.5rem' }}>{book.description}</p>
                  <div style={{ borderLeft:`2px solid ${book.color}44`, paddingLeft:'0.875rem' }}>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.95rem', color:`${book.color}bb`, lineHeight:1.7, margin:0 }}>{book.insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{ position:'relative', zIndex:1, padding:'2rem 3rem', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <Link href="/" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'0.85rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(200,169,110,0.5)', textDecoration:'none' }}>
            ← Bhatiaverse
          </Link>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.15em', color:'rgba(168,184,216,0.3)' }}>© 2025 Bhatiaverse. Built with passion and curiosity.</div>
        </footer>

      </div>
    </>
  );
}
