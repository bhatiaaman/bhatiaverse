"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const games = [
  {
    num: '01',
    title: 'Tic Tac Toe',
    subtitle: 'Classic Intelligence',
    description: 'The timeless battle of X and O — now with an AI opponent that learns and adapts. Can you outwit the machine?',
    href: '/tictactoe',
    color: '#4a9eff',
    accent: 'card-ttt',
    stats: [['3×3', 'Grid'], ['AI', 'Opponent'], ['∞', 'Replays']],
  },
  {
    num: '02',
    title: 'Memory Match',
    subtitle: 'Cognitive Challenge',
    description: 'Flip cards, find pairs, beat the clock. A game of memory and pattern recognition wrapped in a cosmic shell.',
    href: '/tetris',
    color: '#3ecf8e',
    accent: 'card-memory',
    stats: [['16', 'Cards'], ['🧠', 'Memory'], ['⏱', 'Timed']],
  },
];

export default function AIGames() {
  const canvasRef       = useRef(null);
  const cursorRef       = useRef(null);
  const cursorRingRef   = useRef(null);
  const mouseRef        = useRef({ x: 0, y: 0 });
  const ringPosRef      = useRef({ x: 0, y: 0 });
  const rafRef          = useRef(null);
  const starRafRef      = useRef(null);

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
    const onEnter = () => {
      cursor.style.transform = 'scale(2.5)';
      ring.style.transform = 'scale(1.5)';
      ring.style.borderColor = 'rgba(200,169,110,0.7)';
    };
    const onLeave = () => {
      cursor.style.transform = 'scale(1)';
      ring.style.transform = 'scale(1)';
      ring.style.borderColor = 'rgba(200,169,110,0.4)';
    };
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Star canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const createStars = () => {
      stars = [];
      const count = Math.floor((W * H) / 4000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.2,
          opacity: Math.random() * 0.7 + 0.1,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: Math.random() > 0.85 ? '#c8a96e' : Math.random() > 0.7 ? '#a8b8d8' : '#ffffff',
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const opacity = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      });
      if (Math.random() < 0.003) {
        const sx  = Math.random() * W;
        const sy  = Math.random() * H * 0.5;
        const len = Math.random() * 80 + 40;
        const grad = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
        grad.addColorStop(0, 'rgba(200,169,110,0.8)');
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy + len * 0.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      starRafRef.current = requestAnimationFrame(draw);
    };

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });

    return () => { cancelAnimationFrame(starRafRef.current); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }); },
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />

      <style>{`
        .bv-root { cursor: none; }
        .bv-cursor {
          position: fixed; width: 8px; height: 8px;
          background: #c8a96e; border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transition: transform 0.1s; mix-blend-mode: screen;
        }
        .bv-cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1px solid rgba(200,169,110,0.4); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .orbit-container {
          position: absolute; width: 500px; height: 500px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .orbit {
          position: absolute; border-radius: 50%; border: 1px solid;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: orbitSpin linear infinite;
        }
        .orbit-1 { width:240px;height:240px; border-color:rgba(62,207,142,0.1); animation-duration:18s; }
        .orbit-2 { width:360px;height:360px; border-color:rgba(74,158,255,0.08); animation-duration:30s; animation-direction:reverse; }
        .orbit-3 { width:500px;height:500px; border-color:rgba(200,169,110,0.05); animation-duration:50s; }
        .orbit-dot {
          position: absolute; width: 6px; height: 6px; border-radius: 50%;
          top: -3px; left: 50%; transform: translateX(-50%);
        }
        .orbit-1 .orbit-dot { background:#3ecf8e; box-shadow:0 0 10px #3ecf8e; }
        .orbit-2 .orbit-dot { background:#4a9eff; box-shadow:0 0 10px #4a9eff; }
        .orbit-3 .orbit-dot { background:#c8a96e; box-shadow:0 0 10px #c8a96e; }
        @keyframes orbitSpin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        .scroll-line {
          width: 1px; height: 50px;
          background: linear-gradient(to bottom, #c8a96e, transparent);
          animation: scrollDrop 2s ease infinite;
        }
        @keyframes scrollDrop {
          0%,100% { opacity:0; transform:scaleY(0); transform-origin:top; }
          50%      { opacity:1; transform:scaleY(1); }
        }
        .reveal { opacity:0; transform:translateY(40px); transition:opacity 0.8s ease, transform 0.8s ease; }
        .reveal.revealed { opacity:1; transform:translateY(0); }
        .card-bottom-line::after {
          content:''; position:absolute; bottom:0; left:0; right:100%; height:1px;
          transition:right 0.5s ease;
        }
        .card-bottom-line:hover::after { right:0; }
        .card-ttt::after    { background:#4a9eff; }
        .card-memory::after { background:#3ecf8e; }
        .nav-link {
          position:relative; font-family:'DM Mono',monospace;
          font-size:0.72rem; letter-spacing:0.15em; text-transform:uppercase;
          color:#a8b8d8; text-decoration:none; transition:color 0.3s;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:-4px; left:0; right:100%;
          height:1px; background:#c8a96e; transition:right 0.3s ease;
        }
        .nav-link:hover { color:#c8a96e; }
        .nav-link:hover::after { right:0; }
        .card-link-arrow { transition:gap 0.3s; }
        .card-link-arrow:hover { gap:1.2rem !important; }
        .game-card-hover { transition: transform 0.5s ease; }
        .game-card-hover:hover { transform: translateY(-6px); }
        @media(max-width:900px){
          .orbit-container{width:260px;height:260px;}
          .orbit-1{width:120px;height:120px;}
          .orbit-2{width:190px;height:190px;}
          .orbit-3{width:260px;height:260px;}
          .games-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="bv-root" style={{ background: '#02020a', color: '#f0f4ff', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* Custom cursor */}
        <div className="bv-cursor" ref={cursorRef} />
        <div className="bv-cursor-ring" ref={cursorRingRef} />

        {/* Star canvas */}
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div style={{ position: 'fixed', width: 600, height: 600, background: 'rgba(62,207,142,0.06)', borderRadius: '50%', filter: 'blur(120px)', top: '-10%', right: '-10%', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', width: 500, height: 500, background: 'rgba(74,158,255,0.05)', borderRadius: '50%', filter: 'blur(120px)', bottom: '20%', left: '-10%', zIndex: 0, pointerEvents: 'none' }} />

        {/* NAV */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '1.5rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(to bottom, rgba(2,2,10,0.9) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(200,169,110,0.08)',
        }}>
          <Link href="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' }}>
            Bhatiaverse
          </Link>
          <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <li><Link href="/articles" className="nav-link">Articles</Link></li>
            <li><Link href="/#spirituality" className="nav-link">Spirituality</Link></li>
            <li><Link href="/trades" className="nav-link">Trades</Link></li>
            <li><Link href="/aigames" className="nav-link" style={{ color: '#3ecf8e' }}>AI Games</Link></li>
            <li><Link href="/#contact" className="nav-link">Contact</Link></li>
          </ul>
        </nav>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8rem 2rem 4rem', zIndex: 1 }}>
          <div className="orbit-container">
            <div className="orbit orbit-1"><div className="orbit-dot" /></div>
            <div className="orbit orbit-2"><div className="orbit-dot" /></div>
            <div className="orbit orbit-3"><div className="orbit-dot" /></div>
          </div>

          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#3ecf8e', opacity: 0.8, marginBottom: '2rem' }}>
            ✦ Interactive Experiences
          </p>

          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(4rem,12vw,9rem)', fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#f0f4ff 0%,#a8b8d8 50%,#f0f4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#3ecf8e 0%,#7ef7c2 50%,#3ecf8e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic', fontWeight: 400, fontFamily: "'Cormorant Garamond',serif", fontSize: '0.65em' }}>Games</span>
          </h1>

          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 300, color: '#a8b8d8', maxWidth: 520, lineHeight: 1.7, margin: '2.5rem auto', fontStyle: 'italic' }}>
            Where artificial intelligence meets play. Step into games that think, adapt, and challenge you to grow.
          </p>

          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: 'rgba(168,184,216,0.6)', letterSpacing: '0.2em', marginBottom: '3rem' }}>
            {games.length} games available &nbsp;·&nbsp; More coming soon
          </p>

          <a href="#games" style={{
            fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#02020a', background: '#3ecf8e', padding: '1rem 2.5rem', textDecoration: 'none',
            transition: 'opacity 0.3s',
          }}>
            Choose a Game
          </a>

          <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(168,184,216,0.4)', textTransform: 'uppercase' }}>Scroll</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* GAMES SECTION */}
        <section id="games" style={{ padding: '8rem 3rem', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '5rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.3em', color: '#3ecf8e', textTransform: 'uppercase', opacity: 0.7 }}>/ 01</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 800, background: 'linear-gradient(135deg,#f0f4ff,#a8b8d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>Choose Your Game</h2>
          </div>

          <div className="games-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5px' }}>
            {games.map((game, i) => (
              <Link key={game.href} href={game.href} style={{ textDecoration: 'none' }}>
                <div
                  className={`card-hover game-card-hover card-bottom-line ${game.accent} reveal`}
                  style={{
                    position: 'relative', padding: '4rem', height: '100%',
                    background: `linear-gradient(135deg,${game.color}08 0%,rgba(13,13,43,0.9) 100%)`,
                    border: '1px solid rgba(255,255,255,0.04)',
                    overflow: 'hidden', cursor: 'none',
                    transitionDelay: `${i * 0.15}s`,
                  }}
                >
                  {/* Number label */}
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: `${game.color}66` }}>
                    {game.num} — {game.subtitle}
                  </span>

                  {/* Background number */}
                  <div style={{
                    position: 'absolute', top: '1.5rem', right: '2rem',
                    fontFamily: "'Syne',sans-serif", fontSize: '8rem', fontWeight: 800,
                    color: `${game.color}08`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                  }}>
                    {game.num}
                  </div>

                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.4rem', fontWeight: 700, color: '#f0f4ff', margin: '1.5rem 0 1rem' }}>
                    {game.title}
                  </div>

                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(168,184,216,0.7)', fontWeight: 300, marginBottom: '2.5rem', maxWidth: 420 }}>
                    {game.description}
                  </p>

                  <div className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: game.color, display: 'inline-flex', alignItems: 'center', gap: '0.7rem', marginBottom: '3rem' }}>
                    Play Now →
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '3rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {game.stats.map(([val, label]) => (
                      <div key={label}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: game.color, display: 'block', lineHeight: 1, marginBottom: '0.3rem' }}>{val}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(168,184,216,0.4)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* COSMIC DIVIDER */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(62,207,142,0.3), transparent)', margin: '0 3rem', position: 'relative', zIndex: 1 }} />

        {/* MORE COMING SECTION */}
        <section style={{ padding: '8rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="reveal">
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.35em', color: '#3ecf8e', textTransform: 'uppercase', marginBottom: '1.5rem' }}>/ The Universe Expands</p>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 800, lineHeight: 1, marginBottom: '1.5rem' }}>
              More Games
              <span style={{ display: 'block', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 300, background: 'linear-gradient(135deg,#3ecf8e,#7ef7c2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Incoming
              </span>
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'rgba(168,184,216,0.6)', fontWeight: 300, lineHeight: 1.8, maxWidth: 600, margin: '0 auto 3rem' }}>
              New interactive experiences are being crafted — AI chess, word games, strategy puzzles, and more. The universe of play is only getting bigger.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['AI Chess', 'Word Games', 'Strategy', 'Puzzles', 'Coming Soon'].map(t => (
                <span key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a8b8d8', border: '1px solid rgba(168,184,216,0.2)', padding: '0.4rem 1rem' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ position: 'relative', zIndex: 1, padding: '2rem 3rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.5)', textDecoration: 'none' }}>
            ← Bhatiaverse
          </Link>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(168,184,216,0.3)' }}>© 2025 Bhatiaverse. Built with passion and curiosity.</div>
        </footer>

      </div>
    </>
  );
}
