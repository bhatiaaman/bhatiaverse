"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ['All', 'AI', 'System Design', 'Cloud', 'Security', 'Development'];

const ARTICLES = [
  // AI
  {
    id: 1,
    category: 'AI',
    featured: true,
    tag: 'Deep Dive',
    title: 'Building Production-Ready LLM Applications',
    subtitle: 'Beyond the prototype — what it really takes to ship AI at scale',
    excerpt: 'Everyone can build a chatbot in an afternoon. But getting LLMs to behave reliably, cost-effectively, and safely in production is an entirely different challenge. Here\'s what I learned shipping three LLM-powered products.',
    readTime: '12 min read',
    date: 'Feb 2025',
    color: '#7b5ea7',
    href: '#',
  },
  {
    id: 2,
    category: 'AI',
    featured: false,
    tag: 'Architecture',
    title: 'RAG vs Fine-tuning: Choosing the Right Strategy',
    subtitle: 'A decision framework for AI engineers',
    excerpt: 'Retrieval-Augmented Generation and fine-tuning solve different problems. Use the wrong one and you\'ll spend weeks wondering why your AI still hallucinates.',
    readTime: '8 min read',
    date: 'Jan 2025',
    color: '#7b5ea7',
    href: '#',
  },
  {
    id: 3,
    category: 'AI',
    featured: false,
    tag: 'Opinion',
    title: 'The Hidden Costs of AI in Production',
    subtitle: 'Token pricing is just the beginning',
    excerpt: 'Latency, retry logic, prompt engineering maintenance, eval pipelines, observability — the real cost of AI products isn\'t the API bill.',
    readTime: '6 min read',
    date: 'Dec 2024',
    color: '#7b5ea7',
    href: '#',
  },
  // System Design
  {
    id: 4,
    category: 'System Design',
    featured: true,
    tag: 'Deep Dive',
    title: 'Designing High-Throughput Event Pipelines',
    subtitle: 'Kafka, queues, and the art of not losing messages',
    excerpt: 'When your system needs to process millions of events per day without dropping a single one, your architecture choices compound. This is how I think about event-driven systems.',
    readTime: '15 min read',
    date: 'Feb 2025',
    color: '#4a9eff',
    href: '#',
  },
  {
    id: 5,
    category: 'System Design',
    featured: false,
    tag: 'Patterns',
    title: 'API Gateway Patterns for Microservices',
    subtitle: 'BFF, aggregation, and when to keep it simple',
    excerpt: 'Not every microservice architecture needs a sophisticated API gateway. But when you do — here are the patterns that actually work in production.',
    readTime: '9 min read',
    date: 'Nov 2024',
    color: '#4a9eff',
    href: '#',
  },
  {
    id: 6,
    category: 'System Design',
    featured: false,
    tag: 'Database',
    title: 'Sharding Strategies That Scale',
    subtitle: 'Hash, range, and directory-based approaches compared',
    excerpt: 'Database sharding is one of those topics where the theory is clean and the practice is messy. Let\'s talk about the mess.',
    readTime: '11 min read',
    date: 'Oct 2024',
    color: '#4a9eff',
    href: '#',
  },
  // Cloud
  {
    id: 7,
    category: 'Cloud',
    featured: true,
    tag: 'Cost Ops',
    title: 'Kubernetes Cost Optimization That Actually Works',
    subtitle: 'Cutting cloud bills without sacrificing reliability',
    excerpt: 'Most "optimize your Kubernetes costs" guides stop at right-sizing pods. I\'ll show you the full picture — from node groups to spot instances to KEDA.',
    readTime: '13 min read',
    date: 'Jan 2025',
    color: '#3ecf8e',
    href: '#',
  },
  {
    id: 8,
    category: 'Cloud',
    featured: false,
    tag: 'Architecture',
    title: 'Multi-Region Deployment Strategies',
    subtitle: 'Active-active vs active-passive and everything in between',
    excerpt: 'Going multi-region is expensive, operationally complex, and often unnecessary. Here\'s a framework for deciding if you need it — and how to do it right.',
    readTime: '10 min read',
    date: 'Dec 2024',
    color: '#3ecf8e',
    href: '#',
  },
  {
    id: 9,
    category: 'Cloud',
    featured: false,
    tag: 'Serverless',
    title: 'Serverless: When It Shines and When It Burns',
    subtitle: 'Honest lessons from three years of Lambda and Cloud Functions',
    excerpt: 'Cold starts, vendor lock-in, debugging nightmares — and also genuine magic for the right use cases. An honest assessment.',
    readTime: '7 min read',
    date: 'Sep 2024',
    color: '#3ecf8e',
    href: '#',
  },
  // Security
  {
    id: 10,
    category: 'Security',
    featured: true,
    tag: 'Career',
    title: 'If I Had to Interview Security Again',
    subtitle: 'A thoughtful guide to security engineering interviews',
    excerpt: 'A practical roadmap for approaching security engineering interviews — what to study, how to think about threat modeling questions, and the mindset shift that matters most.',
    readTime: '9 min read',
    date: 'Oct 2024',
    color: '#c8a96e',
    href: 'https://secengweekly.substack.com/p/if-i-had-to-interview-security-again?r=4ho8ua&utm_medium=ios&triedRedirect=true',
    external: true,
  },
  {
    id: 11,
    category: 'Security',
    featured: false,
    tag: 'Architecture',
    title: 'Zero Trust in Practice',
    subtitle: 'Moving beyond the buzzword to real implementation',
    excerpt: 'Zero Trust is the most misunderstood concept in security. Most teams say they\'re doing it. Very few actually are. Here\'s what it looks like when it\'s done right.',
    readTime: '10 min read',
    date: 'Nov 2024',
    color: '#c8a96e',
    href: '#',
  },
  {
    id: 12,
    category: 'Security',
    featured: false,
    tag: 'AI Security',
    title: 'Securing LLM Applications Against Prompt Injection',
    subtitle: 'The attack surface you can\'t ignore',
    excerpt: 'Prompt injection is the SQL injection of the AI era. If you\'re building LLM-powered products and not thinking about this, you\'re shipping vulnerable software.',
    readTime: '8 min read',
    date: 'Jan 2025',
    color: '#c8a96e',
    href: '#',
  },
  // Development
  {
    id: 13,
    category: 'Development',
    featured: true,
    tag: 'Engineering',
    title: 'The Art of the Boring Architecture Decision',
    subtitle: 'Why the best engineers choose dull over clever',
    excerpt: 'Every time I\'ve chosen a "clever" solution over a boring one, I\'ve regretted it. After years of overengineering, here\'s my framework for making decisions that your future self will thank you for.',
    readTime: '7 min read',
    date: 'Feb 2025',
    color: '#f0a050',
    href: '#',
  },
  {
    id: 14,
    category: 'Development',
    featured: false,
    tag: 'DX',
    title: 'Developer Experience Is a Product Decision',
    subtitle: 'Why internal tooling deserves the same love as user-facing features',
    excerpt: 'Slow CI, confusing onboarding, brittle tests — these aren\'t just annoyances. They compound into weeks of lost productivity and team morale. DX is a business decision.',
    readTime: '6 min read',
    date: 'Dec 2024',
    color: '#f0a050',
    href: '#',
  },
];

const categoryColors = {
  'AI':            '#7b5ea7',
  'System Design': '#4a9eff',
  'Cloud':         '#3ecf8e',
  'Security':      '#c8a96e',
  'Development':   '#f0a050',
};

export default function ArticlesPage() {
  const canvasRef     = useRef(null);
  const cursorRef     = useRef(null);
  const cursorRingRef = useRef(null);
  const mouseRef      = useRef({ x: 0, y: 0 });
  const ringPosRef    = useRef({ x: 0, y: 0 });
  const rafRef        = useRef(null);
  const starRafRef    = useRef(null);
  const [activeCategory, setActiveCategory] = useState('All');

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
    const onEnter = () => { cursor.style.transform = 'scale(2.5)'; ring.style.transform = 'scale(1.5)'; ring.style.borderColor = 'rgba(200,169,110,0.7)'; };
    const onLeave = () => { cursor.style.transform = 'scale(1)'; ring.style.transform = 'scale(1)'; ring.style.borderColor = 'rgba(200,169,110,0.4)'; };
    interactives.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });

    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Star canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const createStars = () => {
      stars = [];
      const count = Math.floor((W * H) / 5000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          opacity: Math.random() * 0.5 + 0.1,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.015 + 0.004,
          color: Math.random() > 0.85 ? '#c8a96e' : Math.random() > 0.7 ? '#a8b8d8' : '#ffffff',
        });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const op = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color; ctx.globalAlpha = op; ctx.fill();
      });
      ctx.globalAlpha = 1;
      starRafRef.current = requestAnimationFrame(draw);
    };
    resize(); createStars(); draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
    return () => cancelAnimationFrame(starRafRef.current);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [activeCategory]);

  const filtered = activeCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory);

  const featuredArticles = filtered.filter(a => a.featured);
  const regularArticles  = filtered.filter(a => !a.featured);

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
        .cat-pill { font-family:'DM Mono',monospace; font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; border:1px solid rgba(168,184,216,0.15); padding:0.5rem 1.2rem; background:transparent; color:#a8b8d8; cursor:none; transition:all 0.25s ease; white-space:nowrap; }
        .cat-pill:hover { border-color:rgba(200,169,110,0.4); color:#c8a96e; }
        .cat-pill.active { background:rgba(200,169,110,0.1); border-color:#c8a96e; color:#c8a96e; }
        .article-card { position:relative; background:rgba(13,13,43,0.7); border:1px solid rgba(255,255,255,0.04); overflow:hidden; transition:transform 0.4s ease, border-color 0.3s ease; cursor:none; }
        .article-card:hover { transform:translateY(-4px); }
        .article-card::after { content:''; position:absolute; bottom:0; left:0; right:100%; height:1px; transition:right 0.5s ease; }
        .article-card:hover::after { right:0; }
        .article-card-ai::after    { background:#7b5ea7; }
        .article-card-sd::after    { background:#4a9eff; }
        .article-card-cloud::after { background:#3ecf8e; }
        .article-card-sec::after   { background:#c8a96e; }
        .article-card-dev::after   { background:#f0a050; }
        .featured-card { background:linear-gradient(135deg,rgba(26,26,78,0.8) 0%,rgba(13,13,43,0.95) 100%); border:1px solid rgba(255,255,255,0.06); }
        .card-link-arrow { transition:gap 0.3s; }
        .card-link-arrow:hover { gap:1.2rem !important; }
        .marquee-track { animation: marquee 25s linear infinite; }
        @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @media(max-width:768px){ .articles-grid-3{ grid-template-columns:1fr !important; } .featured-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div className="bv-root" style={{ background: '#02020a', color: '#f0f4ff', minHeight: '100vh', overflowX: 'hidden' }}>

        <div className="bv-cursor" ref={cursorRef} />
        <div className="bv-cursor-ring" ref={cursorRingRef} />

        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div style={{ position: 'fixed', width: 600, height: 600, background: 'rgba(74,158,255,0.06)', borderRadius: '50%', filter: 'blur(120px)', top: '-10%', right: '-10%', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', width: 500, height: 500, background: 'rgba(123,94,167,0.05)', borderRadius: '50%', filter: 'blur(120px)', bottom: '10%', left: '-10%', zIndex: 0, pointerEvents: 'none' }} />

        {/* NAV */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '1.5rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: 'linear-gradient(to bottom, rgba(2,2,10,0.9) 0%, transparent 100%)', borderBottom: '1px solid rgba(200,169,110,0.08)' }}>
          <Link href="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none' }}>
            Bhatiaverse
          </Link>
          <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <li><Link href="/articles" className="nav-link" style={{ color: '#4a9eff' }}>Articles</Link></li>
            <li><Link href="/#spirituality" className="nav-link">Spirituality</Link></li>
            <li><Link href="/trades" className="nav-link">Trades</Link></li>
            <li><Link href="/aigames" className="nav-link">AI Games</Link></li>
            <li><Link href="/#contact" className="nav-link">Contact</Link></li>
          </ul>
        </nav>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10rem 2rem 6rem', zIndex: 1 }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#4a9eff', opacity: 0.8, marginBottom: '2rem' }}>
            ✦ Technical Writing &amp; Ideas
          </p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(4rem,11vw,8rem)', fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#f0f4ff 0%,#a8b8d8 50%,#f0f4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Articles</span>
            <span style={{ display: 'block', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 300, fontSize: '0.5em', background: 'linear-gradient(135deg,#4a9eff 0%,#7bb8ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '0.3em' }}>
              Where complexity meets clarity
            </span>
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.25rem', fontWeight: 300, color: '#a8b8d8', maxWidth: 560, lineHeight: 1.8, margin: '2rem auto 0', fontStyle: 'italic' }}>
            Deep dives into AI, cloud architecture, system design, and software engineering. Written for practitioners, not textbooks.
          </p>

          {/* Category stat pills */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '3rem' }}>
            {Object.entries(categoryColors).map(([cat, color]) => (
              <div key={cat} style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color, border: `1px solid ${color}33`, padding: '0.4rem 1rem' }}>
                {cat}
              </div>
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ overflow: 'hidden', padding: '1.2rem 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1 }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '3rem', width: 'max-content' }}>
            {[1, 2].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '3rem', whiteSpace: 'nowrap', fontFamily: "'Syne',sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(168,184,216,0.18)' }}>
                AI &amp; ML <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> System Design <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> Cloud Architecture <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> Security Engineering <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> Developer Experience <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> LLMs <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> Kubernetes <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span> Microservices <span style={{ color: 'rgba(200,169,110,0.25)' }}>✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={{ position: 'sticky', top: '72px', zIndex: 50, background: 'rgba(2,2,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '1rem 3rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', maxWidth: 1400, margin: '0 auto', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-pill card-hover ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat !== 'All' && (
                  <span style={{ marginLeft: '0.5rem', opacity: 0.5 }}>
                    ({ARTICLES.filter(a => a.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ARTICLES CONTENT */}
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '5rem 3rem 8rem', position: 'relative', zIndex: 1 }}>

          {/* Featured articles */}
          {featuredArticles.length > 0 && (
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase' }}>Featured</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(200,169,110,0.15), transparent)' }} />
              </div>

              <div className="featured-grid reveal" style={{ display: 'grid', gridTemplateColumns: featuredArticles.length === 1 ? '1fr' : featuredArticles.length === 2 ? '1fr 1fr' : '2fr 1fr', gap: '1.5px' }}>
                {featuredArticles.map((article, i) => {
                  const cardClass = `article-card featured-card card-hover article-card-${article.category === 'AI' ? 'ai' : article.category === 'System Design' ? 'sd' : article.category === 'Cloud' ? 'cloud' : article.category === 'Security' ? 'sec' : 'dev'}`;
                  const isBig = i === 0 && featuredArticles.length > 1;
                  const content = (
                    <div className={cardClass} style={{ padding: isBig ? '4rem' : '3rem', height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: article.color, border: `1px solid ${article.color}44`, padding: '0.3rem 0.8rem' }}>{article.tag}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(168,184,216,0.4)' }}>{article.category}</span>
                      </div>
                      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isBig ? '2rem' : '1.5rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2, marginBottom: '0.75rem' }}>
                        {article.title}
                      </h2>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.05rem', color: 'rgba(168,184,216,0.6)', marginBottom: '1.25rem', fontWeight: 300 }}>
                        {article.subtitle}
                      </p>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(168,184,216,0.65)', fontWeight: 300, marginBottom: '2.5rem' }}>
                        {article.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.15em', color: 'rgba(168,184,216,0.35)', textTransform: 'uppercase' }}>{article.date} · {article.readTime}</span>
                        <span className="card-link-arrow" style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.color, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                          {article.external ? 'Read External →' : 'Read Article →'}
                        </span>
                      </div>
                    </div>
                  );
                  return article.external ? (
                    <a key={article.id} href={article.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
                  ) : (
                    <a key={article.id} href={article.href} style={{ textDecoration: 'none' }}>{content}</a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular articles grid */}
          {regularArticles.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(168,184,216,0.3)', textTransform: 'uppercase' }}>All Articles</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(168,184,216,0.08), transparent)' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(168,184,216,0.3)', textTransform: 'uppercase' }}>{regularArticles.length} articles</span>
              </div>

              <div className="articles-grid-3 reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5px' }}>
                {regularArticles.map(article => {
                  const cardClass = `article-card card-hover article-card-${article.category === 'AI' ? 'ai' : article.category === 'System Design' ? 'sd' : article.category === 'Cloud' ? 'cloud' : article.category === 'Security' ? 'sec' : 'dev'}`;
                  const content = (
                    <div className={cardClass} style={{ padding: '2.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: article.color, border: `1px solid ${article.color}33`, padding: '0.25rem 0.6rem' }}>{article.tag}</span>
                      </div>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.25, marginBottom: '0.6rem' }}>
                        {article.title}
                      </h3>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(168,184,216,0.5)', marginBottom: '1rem', fontWeight: 300 }}>
                        {article.subtitle}
                      </p>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', lineHeight: 1.8, color: 'rgba(168,184,216,0.6)', fontWeight: 300, marginBottom: '2rem' }}>
                        {article.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.12em', color: 'rgba(168,184,216,0.3)', textTransform: 'uppercase' }}>{article.date} · {article.readTime}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: article.color }}>→</span>
                      </div>
                    </div>
                  );
                  return article.external ? (
                    <a key={article.id} href={article.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
                  ) : (
                    <a key={article.id} href={article.href} style={{ textDecoration: 'none' }}>{content}</a>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontStyle: 'italic', color: 'rgba(168,184,216,0.4)' }}>No articles in this category yet.</p>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(168,184,216,0.2)', marginTop: '0.75rem', textTransform: 'uppercase' }}>Check back soon</p>
            </div>
          )}
        </main>

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
