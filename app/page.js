"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const DARK = {
  bg: '#02020a',
  text: '#f0f4ff',
  textSub: 'rgba(168,184,216,0.75)',
  textMuted: 'rgba(168,184,216,0.4)',
  textMuted2: 'rgba(168,184,216,0.6)',
  navBg: 'rgba(2,2,10,0.9)',
  navLink: '#a8b8d8',
  cardBgBlue: 'linear-gradient(135deg,rgba(26,26,78,0.8) 0%,rgba(13,13,43,0.8) 100%)',
  cardBgPurple: 'linear-gradient(135deg,rgba(123,94,167,0.08) 0%,rgba(13,13,43,0.8) 100%)',
  cardBgGold: 'linear-gradient(135deg,rgba(200,169,110,0.06) 0%,rgba(13,13,43,0.8) 100%)',
  cardBgGreen: 'linear-gradient(135deg,rgba(62,207,142,0.05) 0%,rgba(13,13,43,0.8) 100%)',
  border: 'rgba(255,255,255,0.04)',
  borderSub: 'rgba(255,255,255,0.05)',
  marqueeBorder: 'rgba(255,255,255,0.04)',
  marqueeTxt: 'rgba(168,184,216,0.2)',
  glowOrb1: 'rgba(123,94,167,0.08)',
  glowOrb2: 'rgba(200,169,110,0.05)',
  heroTitle: 'linear-gradient(135deg,#f0f4ff 0%,#a8b8d8 50%,#f0f4ff 100%)',
  sectionTitle: 'linear-gradient(135deg,#f0f4ff,#a8b8d8)',
  footerBorder: 'rgba(255,255,255,0.04)',
  footerText: 'rgba(200,169,110,0.5)',
  footerSub: 'rgba(168,184,216,0.3)',
  tagBorder: 'rgba(168,184,216,0.2)',
  tagColor: '#a8b8d8',
  getInTouchColor: '#c8a96e',
  getInTouchBorder: 'rgba(200,169,110,0.4)',
  inputBg: 'rgba(13,13,43,0.8)',
  inputBorderFocus: '#c8a96e',
  cursorBlend: 'screen',
  toggleBorder: 'rgba(200,169,110,0.35)',
};

const LIGHT = {
  bg: '#faf8f3',
  text: '#1a1a2e',
  textSub: 'rgba(26,26,46,0.65)',
  textMuted: 'rgba(26,26,46,0.35)',
  textMuted2: 'rgba(26,26,46,0.5)',
  navBg: 'rgba(250,248,243,0.92)',
  navLink: '#3d3d6b',
  cardBgBlue: 'linear-gradient(135deg,rgba(74,158,255,0.05) 0%,rgba(255,255,255,0.92) 100%)',
  cardBgPurple: 'linear-gradient(135deg,rgba(123,94,167,0.07) 0%,rgba(255,255,255,0.92) 100%)',
  cardBgGold: 'linear-gradient(135deg,rgba(200,169,110,0.08) 0%,rgba(255,255,255,0.92) 100%)',
  cardBgGreen: 'linear-gradient(135deg,rgba(62,207,142,0.06) 0%,rgba(255,255,255,0.92) 100%)',
  border: 'rgba(0,0,0,0.08)',
  borderSub: 'rgba(0,0,0,0.06)',
  marqueeBorder: 'rgba(0,0,0,0.06)',
  marqueeTxt: 'rgba(26,26,46,0.15)',
  glowOrb1: 'rgba(123,94,167,0.05)',
  glowOrb2: 'rgba(200,169,110,0.07)',
  heroTitle: 'linear-gradient(135deg,#1a1a2e 0%,#3d3d6b 50%,#1a1a2e 100%)',
  sectionTitle: 'linear-gradient(135deg,#1a1a2e,#3d3d6b)',
  footerBorder: 'rgba(0,0,0,0.07)',
  footerText: 'rgba(200,169,110,0.6)',
  footerSub: 'rgba(26,26,46,0.3)',
  tagBorder: 'rgba(26,26,46,0.15)',
  tagColor: '#3d3d6b',
  getInTouchColor: '#1a1a2e',
  getInTouchBorder: 'rgba(26,26,46,0.3)',
  inputBg: 'rgba(255,255,255,0.9)',
  inputBorderFocus: '#c8a96e',
  cursorBlend: 'normal',
  toggleBorder: 'rgba(26,26,46,0.2)',
};

export default function Home() {
  const canvasRef      = useRef(null);
  const cursorRef      = useRef(null);
  const cursorRingRef  = useRef(null);
  const mouseRef       = useRef({ x: 0, y: 0 });
  const ringPosRef     = useRef({ x: 0, y: 0 });
  const rafRef         = useRef(null);
  const themeRef       = useRef('dark');

  const [theme, setTheme] = useState('dark');
  const T = theme === 'dark' ? DARK : LIGHT;

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('bv-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      themeRef.current = saved;
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    themeRef.current = next;
    localStorage.setItem('bv-theme', next);
  };

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = cursorRingRef.current;
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
    interactives.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });

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
    let W, H, animFrame;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const createStars = () => {
      stars = [];
      const count = Math.floor((W * H) / 4000);
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.2,
          opacity: Math.random() * 0.7 + 0.1,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          colorType: rand > 0.85 ? 'gold' : rand > 0.7 ? 'mid' : 'base',
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const isDark = themeRef.current === 'dark';
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const opacity = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
        const color = s.colorType === 'gold' ? '#c8a96e'
          : s.colorType === 'mid'  ? (isDark ? '#a8b8d8' : '#8899bb')
          : (isDark ? '#ffffff' : '#6666aa');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = isDark ? opacity : opacity * 0.5;
        ctx.fill();
      });
      if (Math.random() < 0.003) {
        const sx = Math.random() * W, sy = Math.random() * H * 0.5;
        const len = Math.random() * 80 + 40;
        const grad = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
        grad.addColorStop(0, 'rgba(200,169,110,0.8)');
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = themeRef.current === 'dark' ? 0.7 : 0.4;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy + len * 0.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(draw);
    };

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });

    return () => { cancelAnimationFrame(animFrame); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Parallax hero on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const title = document.querySelector('.hero-title-el');
      const sub = document.querySelector('.hero-sub-el');
      const orbit = document.querySelector('.orbit-container');
      if (title) title.style.transform = `translateY(${y * 0.15}px)`;
      if (sub) sub.style.transform = `translateY(${y * 0.08}px)`;
      if (orbit) orbit.style.transform = `translate(-50%, calc(-50% + ${y * 0.2}px))`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
          transition: transform 0.1s; mix-blend-mode: ${T.cursorBlend};
        }
        .bv-cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1px solid rgba(200,169,110,0.4); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .orbit-container {
          position: absolute; width: 600px; height: 600px;
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
        .orbit-1 { width:300px;height:300px; border-color:rgba(200,169,110,0.08); animation-duration:20s; }
        .orbit-2 { width:450px;height:450px; border-color:rgba(123,94,167,0.08); animation-duration:35s; animation-direction:reverse; }
        .orbit-3 { width:600px;height:600px; border-color:rgba(74,158,255,0.05); animation-duration:55s; }
        .orbit-dot {
          position: absolute; width: 6px; height: 6px; border-radius: 50%;
          background: #c8a96e; top: -3px; left: 50%;
          transform: translateX(-50%); box-shadow: 0 0 10px #c8a96e;
        }
        .orbit-2 .orbit-dot { background:#7b5ea7; box-shadow:0 0 10px #7b5ea7; }
        .orbit-3 .orbit-dot { background:#4a9eff; box-shadow:0 0 10px #4a9eff; }
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
        .marquee-track { animation: marquee 22s linear infinite; }
        @keyframes marquee {
          from { transform:translateX(0); }
          to   { transform:translateX(-50%); }
        }
        .card-bottom-line::after {
          content:''; position:absolute; bottom:0; left:0; right:100%; height:1px;
          background:#c8a96e; transition:right 0.5s ease;
        }
        .card-bottom-line:hover::after { right:0; }
        .card-trades::after { background:#c8a96e; }
        .card-spirit::after { background:#7b5ea7; }
        .card-games::after  { background:#3ecf8e; }
        .card-articles::after { background:#4a9eff; }
        .glyph-ring-a { animation:orbitSpin 15s linear infinite; }
        .glyph-ring-b { animation:orbitSpin 25s linear infinite reverse; }
        .glyph-ring-c { animation:orbitSpin 40s linear infinite; }
        .glyph-pulse { animation:glyphPulse 3s ease infinite; }
        @keyframes glyphPulse {
          0%,100% { transform:translate(-50%,-50%) scale(1); opacity:0.8; }
          50%      { transform:translate(-50%,-50%) scale(1.1); opacity:1; }
        }
        .nav-link {
          position:relative; font-family:'DM Mono',monospace;
          font-size:0.72rem; letter-spacing:0.15em; text-transform:uppercase;
          color:${T.navLink}; text-decoration:none; transition:color 0.3s;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:-4px; left:0; right:100%;
          height:1px; background:#c8a96e; transition:right 0.3s ease;
        }
        .nav-link:hover { color:#c8a96e; }
        .nav-link:hover::after { right:0; }
        .card-link-arrow { transition:gap 0.3s; }
        .card-link-arrow:hover { gap:1.2rem !important; }
        .theme-toggle {
          background: none; border: 1px solid ${T.toggleBorder}; border-radius: 4px;
          padding: 0.3rem 0.75rem; cursor: pointer; color: ${T.navLink};
          font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.12em;
          text-transform: uppercase; transition: all 0.3s;
        }
        .theme-toggle:hover { border-color: #c8a96e; color: #c8a96e; }
        .grad-hero-primary {
          display: block;
          background: ${T.heroTitle};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grad-section-title {
          background: ${T.sectionTitle};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media(max-width:900px){
          .orbit-container{width:300px;height:300px;}
          .orbit-1{width:150px;height:150px;}
          .orbit-2{width:225px;height:225px;}
          .orbit-3{width:300px;height:300px;}
        }
      `}</style>

      <div className="bv-root" style={{ background: T.bg, color: T.text, minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.4s ease, color 0.4s ease' }}>

        {/* Custom cursor */}
        <div className="bv-cursor" ref={cursorRef} />
        <div className="bv-cursor-ring" ref={cursorRingRef} />

        {/* Star canvas */}
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div style={{ position: 'fixed', width: 600, height: 600, background: T.glowOrb1, borderRadius: '50%', filter: 'blur(120px)', top: '-10%', right: '-10%', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', width: 500, height: 500, background: T.glowOrb2, borderRadius: '50%', filter: 'blur(120px)', bottom: '20%', left: '-10%', zIndex: 0, pointerEvents: 'none' }} />

        {/* NAV */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '1.5rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          background: `linear-gradient(to bottom, ${T.navBg} 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(200,169,110,0.08)',
        }}>
          <Link href="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' }}>
            Bhatiaverse
          </Link>
          <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <li><Link href="/articles" className="nav-link">Articles</Link></li>
            <li><Link href="/spirituality" className="nav-link">Spirituality</Link></li>
            <li><Link href="/trades" className="nav-link">Trades</Link></li>
            <li><Link href="/aigames" className="nav-link">AI Games</Link></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
            <li>
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'dark' ? '☀ Light' : '☾ Dark'}
              </button>
            </li>
          </ul>
        </nav>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8rem 2rem 4rem', zIndex: 1 }}>
          <div className="orbit-container">
            <div className="orbit orbit-1"><div className="orbit-dot" /></div>
            <div className="orbit orbit-2"><div className="orbit-dot" /></div>
            <div className="orbit orbit-3"><div className="orbit-dot" /></div>
          </div>

          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c8a96e', opacity: 0.8, marginBottom: '2rem' }}>
            ✦ Welcome to the Universe
          </p>

          <h1 className="hero-title-el" style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(4rem,12vw,9rem)', fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            <span className="grad-hero-primary">The</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#c8a96e 0%,#e8c98e 50%,#c8a96e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic', fontWeight: 400, fontFamily: "'Cormorant Garamond',serif", fontSize: '0.65em' }}>Bhatiaverse</span>
          </h1>

          <p className="hero-sub-el" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 300, color: T.textSub, maxWidth: 520, lineHeight: 1.7, margin: '2.5rem auto', fontStyle: 'italic' }}>
            A cosmic space where ideas, thoughts, and interactive experiences collide.
          </p>

          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: T.textMuted2, letterSpacing: '0.2em', marginBottom: '3rem' }}>
            — Amandeep Bhatia &nbsp;·&nbsp; Developer, Writer &amp; AI Enthusiast
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#content" style={{
              fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#02020a', background: '#c8a96e', padding: '1rem 2.5rem', textDecoration: 'none',
              position: 'relative', overflow: 'hidden', transition: 'opacity 0.3s',
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Explore Content</span>
            </a>
            <a href="#contact" style={{
              fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: T.getInTouchColor, background: 'transparent', padding: '1rem 2.5rem', textDecoration: 'none',
              border: `1px solid ${T.getInTouchBorder}`, transition: 'all 0.3s',
            }}>
              Get in Touch
            </a>
          </div>

          <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: T.textMuted, textTransform: 'uppercase' }}>Scroll</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ overflow: 'hidden', padding: '1.5rem 0', borderTop: `1px solid ${T.marqueeBorder}`, borderBottom: `1px solid ${T.marqueeBorder}`, position: 'relative', zIndex: 1 }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '3rem', width: 'max-content' }}>
            {[1, 2].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '3rem', whiteSpace: 'nowrap', fontFamily: "'Syne',sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: T.marqueeTxt }}>
                Articles <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Spirituality <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Trades <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> AI Games <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Technology <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Consciousness <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Markets <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Ideas <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span> Innovation <span style={{ color: 'rgba(200,169,110,0.3)' }}>✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* CARDS SECTION */}
        <section id="content" style={{ padding: '8rem 3rem', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.3em', color: '#c8a96e', textTransform: 'uppercase', opacity: 0.7 }}>/ 01</span>
            <h2 className="grad-section-title" style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 800, margin: 0 }}>Explore the Universe</h2>
          </div>

          {/* Row 1: Articles (featured) + Spirituality */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5px', marginBottom: '1.5px' }}>

            {/* Articles — featured */}
            <div id="articles" className="card-hover card-bottom-line card-articles reveal" style={{ position: 'relative', padding: '4rem', background: T.cardBgBlue, border: `1px solid ${T.border}`, overflow: 'hidden', transition: 'transform 0.5s ease', cursor: 'none' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.4)' }}>01 — Articles</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.2rem', fontWeight: 700, color: T.text, margin: '1rem 0' }}>Deep Dives into Technology &amp; AI</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', lineHeight: 1.8, color: T.textSub, fontWeight: 300, marginBottom: '2rem' }}>
                Thoughtful analysis and practical insights at the intersection of technology, artificial intelligence, and development. Where complexity meets clarity.
              </p>
              <Link href="/articles" className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a9eff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
                Read Articles →
              </Link>
              <div style={{ display: 'flex', gap: '4rem', marginTop: '3rem', paddingTop: '3rem', borderTop: `1px solid ${T.borderSub}` }}>
                {[['∞','Ideas Explored'],['↗','Always Growing'],['✦','Original Thought']].map(([num,label]) => (
                  <div key={label}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#c8a96e', display: 'block', lineHeight: 1, marginBottom: '0.3rem' }}>{num}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.textMuted }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spirituality */}
            <div id="spirituality" className="card-hover card-bottom-line card-spirit reveal" style={{ position: 'relative', padding: '3rem', background: T.cardBgPurple, border: `1px solid ${T.border}`, overflow: 'hidden', transition: 'transform 0.5s ease', cursor: 'none', transitionDelay: '0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.4)' }}>02 — Spirituality</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: T.text, margin: '1rem 0' }}>Inner Cosmos</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', lineHeight: 1.8, color: T.textSub, fontWeight: 300, marginBottom: '2rem' }}>
                Reflections on life, consciousness, and inner growth. The universe within mirrors the universe without.
              </p>
              <Link href="/spirituality" className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7b5ea7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
                Explore →
              </Link>
            </div>
          </div>

          {/* Row 2: Trades (featured) + AI Games */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5px' }}>

            {/* Trades — featured */}
            <div className="card-hover card-bottom-line card-trades reveal" style={{ position: 'relative', padding: '4rem', background: T.cardBgGold, border: `1px solid ${T.border}`, overflow: 'hidden', transition: 'transform 0.5s ease', cursor: 'none', transitionDelay: '0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.4)' }}>03 — Trades</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.2rem', fontWeight: 700, color: T.text, margin: '1rem 0' }}>Markets &amp; Analysis</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', lineHeight: 1.8, color: T.textSub, fontWeight: 300, marginBottom: '2rem' }}>
                Live option chain analysis, pre-market intelligence, sector performance, and market commentary. Real-time data for informed decisions.
              </p>
              <Link href="/trades" className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
                View Trades →
              </Link>
              <div style={{ display: 'flex', gap: '4rem', marginTop: '3rem', paddingTop: '3rem', borderTop: `1px solid ${T.borderSub}` }}>
                {[['NSE','Live Markets'],['OI','Option Chain'],['AI','Pre-Market']].map(([num,label]) => (
                  <div key={label}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 800, color: '#c8a96e', display: 'block', lineHeight: 1, marginBottom: '0.3rem' }}>{num}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.textMuted }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Games */}
            <div id="aigames" className="card-hover card-bottom-line card-games reveal" style={{ position: 'relative', padding: '3rem', background: T.cardBgGreen, border: `1px solid ${T.border}`, overflow: 'hidden', transition: 'transform 0.5s ease', cursor: 'none', transitionDelay: '0.25s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.4)' }}>04 — AI Games</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: T.text, margin: '1rem 0' }}>Play the Future</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', lineHeight: 1.8, color: T.textSub, fontWeight: 300, marginBottom: '2rem' }}>
                Interactive experiences powered by artificial intelligence. Play, learn, and explore the possibilities of AI.
              </p>
              <Link href="/aigames" className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3ecf8e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
                Start Playing →
              </Link>
            </div>
          </div>
        </section>

        {/* COSMIC DIVIDER */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,169,110,0.3), transparent)', margin: '0 3rem', position: 'relative', zIndex: 1 }} />

        {/* ABOUT SECTION */}
        <section style={{ padding: '8rem 3rem', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '6rem', alignItems: 'center' }}>

            {/* Animated glyph */}
            <div className="reveal" style={{ position: 'relative' }}>
              <div style={{ width: '100%', aspectRatio: 1, maxWidth: 400, position: 'relative', margin: '0 auto' }}>
                {[['100%','rgba(74,158,255,0.15)','glyph-ring-c'],['80%','rgba(123,94,167,0.2)','glyph-ring-b'],['60%','rgba(200,169,110,0.3)','glyph-ring-a']].map(([size,color,cls]) => (
                  <div key={cls} className={cls} style={{ position: 'absolute', borderRadius: '50%', border: `1px solid ${color}`, width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                ))}
                <div className="glyph-pulse" style={{ position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, background: 'radial-gradient(circle, #c8a96e 0%, rgba(200,169,110,0.3) 60%, transparent 100%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(200,169,110,0.3)' }} />
              </div>
            </div>

            {/* Text */}
            <div className="reveal" style={{ transitionDelay: '0.2s' }}>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.35em', color: '#c8a96e', textTransform: 'uppercase', marginBottom: '1.5rem' }}>/ About this universe</p>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem', color: T.text }}>
                A Corner of the Internet That Thinks
              </h2>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', lineHeight: 1.9, color: T.textSub, fontWeight: 300, marginBottom: '1.5rem' }}>
                The Bhatiaverse is my personal space where I share my journey through{' '}
                <span style={{ color: '#c8a96e' }}>technology</span>,{' '}
                <span style={{ color: '#c8a96e' }}>artificial intelligence</span>, and creative thinking. Whether you're here for technical insights, spiritual reflections, market analysis, or just to play with cool AI-powered experiences — there's something for you.
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', lineHeight: 1.9, color: T.textSub, fontWeight: 300, marginBottom: '2rem' }}>
                This space is <span style={{ color: '#c8a96e' }}>constantly evolving</span>, just like the universe itself.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['Developer','Writer','AI Enthusiast','Trader','Explorer'].map(t => (
                  <span key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: T.tagColor, border: `1px solid ${T.tagBorder}`, padding: '0.4rem 1rem' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COSMIC DIVIDER */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,169,110,0.3), transparent)', margin: '0 3rem', position: 'relative', zIndex: 1 }} />

        {/* CONTACT SECTION */}
        <section id="contact" style={{ padding: '8rem 3rem 6rem', maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 className="reveal" style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(3rem,7vw,6rem)', fontWeight: 800, lineHeight: 0.95, marginBottom: '1.5rem', color: T.text }}>
            Let&apos;s
            <span style={{ display: 'block', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 300, background: 'linear-gradient(135deg,#c8a96e,#e8c98e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Connect
            </span>
          </h2>
          <p className="reveal" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: T.textMuted2, fontWeight: 300, marginBottom: '3rem', lineHeight: 1.8 }}>
            Have a question, idea, or just want to say hi? I&apos;d love to hear from you.
          </p>
          <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '3rem' }}>
            <input type="text" placeholder="Your name..." style={{ background: T.inputBg, border: 'none', borderLeft: '2px solid rgba(200,169,110,0.2)', padding: '1.3rem 1.8rem', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: T.text, outline: 'none', width: '100%' }} onFocus={e => e.target.style.borderLeftColor='#c8a96e'} onBlur={e => e.target.style.borderLeftColor='rgba(200,169,110,0.2)'} />
            <input type="email" placeholder="Your email..." style={{ background: T.inputBg, border: 'none', borderLeft: '2px solid rgba(200,169,110,0.2)', padding: '1.3rem 1.8rem', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: T.text, outline: 'none', width: '100%' }} onFocus={e => e.target.style.borderLeftColor='#c8a96e'} onBlur={e => e.target.style.borderLeftColor='rgba(200,169,110,0.2)'} />
            <textarea placeholder="Your message to the universe..." rows={5} style={{ background: T.inputBg, border: 'none', borderLeft: '2px solid rgba(200,169,110,0.2)', padding: '1.3rem 1.8rem', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: T.text, outline: 'none', resize: 'none', width: '100%' }} onFocus={e => e.target.style.borderLeftColor='#c8a96e'} onBlur={e => e.target.style.borderLeftColor='rgba(200,169,110,0.2)'} />
            <button style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#02020a', background: 'linear-gradient(135deg,#c8a96e,#e8c98e)', padding: '1.2rem 3rem', border: 'none', cursor: 'pointer', width: '100%', fontWeight: 500, transition: 'opacity 0.3s,transform 0.3s' }} onMouseEnter={e => { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}>
              Transmit Message →
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ position: 'relative', zIndex: 1, padding: '2rem 3rem', borderTop: `1px solid ${T.footerBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.footerText }}>Bhatiaverse</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.15em', color: T.footerSub }}>© 2025 Bhatiaverse. Built with passion and curiosity.</div>
        </footer>

      </div>
    </>
  );
}
