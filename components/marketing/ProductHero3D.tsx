'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ─── Grain overlay (CSS-only, near-zero cost) ─── */
function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ─── Abstract ribbon / glass slab object ─── */
function AbstractHeroObject({
  shouldAnimate,
  mouseX,
  mouseY,
}: {
  shouldAnimate: boolean;
  mouseX: number;
  mouseY: number;
}) {
  // Subtle parallax tilt from mouse position
  const tiltX = shouldAnimate ? mouseY * 6 : 0;
  const tiltY = shouldAnimate ? mouseX * -6 : 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Ambient glow behind object */}
      <div
        aria-hidden
        className="absolute w-[80%] h-[60%] rounded-full blur-[100px] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,212,251,0.3) 0%, rgba(51,153,255,0.15) 40%, rgba(160,131,255,0.1) 70%, transparent 100%)',
        }}
      />

      {/* Main glass slab / ribbon */}
      <div
        className="relative w-[85%] max-w-[520px] aspect-[4/3]"
        style={{
          transform: `perspective(1200px) rotateX(${12 + tiltX}deg) rotateY(${-8 + tiltY}deg) rotateZ(-3deg)`,
          transformStyle: 'preserve-3d',
          transition: shouldAnimate ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {/* Glass panel base */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,212,251,0.08) 0%, rgba(51,153,255,0.05) 30%, rgba(160,131,255,0.08) 60%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(1px)',
            boxShadow: `
              0 0 80px rgba(0,212,251,0.08),
              0 40px 80px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
          }}
        >
          {/* Internal ribbon wave shapes */}
          <svg
            viewBox="0 0 520 390"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,212,251,0.4)" />
                <stop offset="50%" stopColor="rgba(51,153,255,0.3)" />
                <stop offset="100%" stopColor="rgba(160,131,255,0.4)" />
              </linearGradient>
              <linearGradient id="ribbon2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(160,131,255,0.3)" />
                <stop offset="50%" stopColor="rgba(0,212,251,0.2)" />
                <stop offset="100%" stopColor="rgba(51,153,255,0.35)" />
              </linearGradient>
              <linearGradient id="ribbon3" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,212,251,0.15)" />
                <stop offset="100%" stopColor="rgba(160,131,255,0.2)" />
              </linearGradient>
            </defs>

            {/* Flowing ribbon paths */}
            <path
              d="M0 280 C80 220, 180 340, 260 260 S420 180, 520 220"
              stroke="url(#ribbon1)"
              strokeWidth="40"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
              className={shouldAnimate ? 'animate-ribbon-flow-1' : ''}
            />
            <path
              d="M0 200 C100 140, 160 280, 280 190 S440 120, 520 160"
              stroke="url(#ribbon2)"
              strokeWidth="32"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
              className={shouldAnimate ? 'animate-ribbon-flow-2' : ''}
            />
            <path
              d="M0 140 C120 100, 200 200, 320 130 S460 80, 520 100"
              stroke="url(#ribbon3)"
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
              className={shouldAnimate ? 'animate-ribbon-flow-3' : ''}
            />

            {/* Subtle dot grid within */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 10 }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={26 + col * 52}
                  cy={30 + row * 48}
                  r="1"
                  fill="rgba(255,255,255,0.08)"
                />
              )),
            )}
          </svg>

          {/* Reflection highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[40%]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Floating accent card (small, top-right, like reference) */}
        <div
          className="absolute -top-6 -right-6 w-20 h-14 rounded-lg border border-white/[0.08] overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,212,251,0.15), rgba(51,153,255,0.1))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            transform: 'translateZ(40px)',
            animation: shouldAnimate ? 'float-card 6s ease-in-out infinite' : 'none',
          }}
        >
          <div className="p-2">
            <div className="w-8 h-1 rounded bg-cyan-400/40 mb-1.5" />
            <div className="w-12 h-1 rounded bg-white/10" />
            <div className="w-6 h-1 rounded bg-white/10 mt-1" />
          </div>
        </div>

        {/* Floating accent card 2 (bottom-left) */}
        <div
          className="absolute -bottom-4 -left-8 w-24 h-16 rounded-lg border border-white/[0.08] overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(160,131,255,0.12), rgba(51,153,255,0.08))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            transform: 'translateZ(30px)',
            animation: shouldAnimate ? 'float-card 8s ease-in-out infinite reverse' : 'none',
          }}
        >
          <div className="p-2">
            <div className="flex gap-1 mb-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-400/30" />
              <div className="w-3 h-3 rounded-full bg-blue-400/20" />
            </div>
            <div className="w-14 h-1 rounded bg-white/10" />
            <div className="w-10 h-1 rounded bg-white/10 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop-only particle canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 251, ${p.o})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    // Start after idle
    let started = false;
    const startParticles = () => {
      if (started) return;
      started = true;
      draw();
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(startParticles, { timeout: 2000 });
    } else {
      setTimeout(startParticles, 800);
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60"
      aria-hidden
    />
  );
}

/* ─── Main exported component ─── */
export function ProductHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -15%'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.34, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.97, 0.94]);
  const y = useTransform(scrollYProgress, [0, 0.82, 1], [0, 48, 110]);

  const shouldAnimate = !shouldReduceMotion;

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop || shouldReduceMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    },
    [isDesktop, shouldReduceMotion],
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      {/* CSS animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ribbon-flow-1 {
  0%, 100% { d: path("M0 280 C80 220, 180 340, 260 260 S420 180, 520 220"); }
  50% { d: path("M0 260 C80 300, 180 200, 260 280 S420 220, 520 200"); }
}
@keyframes ribbon-flow-2 {
  0%, 100% { d: path("M0 200 C100 140, 160 280, 280 190 S440 120, 520 160"); }
  50% { d: path("M0 220 C100 260, 160 160, 280 210 S440 160, 520 140"); }
}
@keyframes ribbon-flow-3 {
  0%, 100% { d: path("M0 140 C120 100, 200 200, 320 130 S460 80, 520 100"); }
  50% { d: path("M0 120 C120 180, 200 100, 320 150 S460 120, 520 80"); }
}
@keyframes float-card {
  0%, 100% { transform: translateZ(40px) translateY(0px); }
  50% { transform: translateZ(40px) translateY(-8px); }
}
.animate-ribbon-flow-1 { animation: ribbon-flow-1 10s ease-in-out infinite; }
.animate-ribbon-flow-2 { animation: ribbon-flow-2 12s ease-in-out infinite; }
.animate-ribbon-flow-3 { animation: ribbon-flow-3 14s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .animate-ribbon-flow-1,
  .animate-ribbon-flow-2,
  .animate-ribbon-flow-3 { animation: none !important; }
}
`,
        }}
      />

      <GrainOverlay />

      {/* Ambient background gradients */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full blur-[100px] opacity-15"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)',
          }}
        />
      </div>

      {/* Dot grid (very subtle) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 0.5px, transparent 0)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Desktop particles (deferred) */}
      {isDesktop && !shouldReduceMotion && <ParticleCanvas />}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <motion.div style={{ opacity, scale, y }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: copy */}
            <div className="flex flex-col items-start">
              {/* Page counter like reference */}
              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={shouldAnimate ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
                className="text-[11px] tracking-[0.3em] text-white/30 uppercase font-mono mb-6"
              >
                001 — Product
              </motion.div>

              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slow, delay: 0.2 } : { duration: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/20 mb-8"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium tracking-wide">
                  Compliance Operating System
                </span>
              </motion.div>

              <motion.h1
                initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.05] tracking-tight text-white"
              >
                Your team&apos;s
                <br />
                command center
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  for compliance.
                </span>
              </motion.h1>

              <motion.p
                initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
                className="text-base sm:text-lg text-slate-400 mb-8 max-w-md leading-relaxed"
              >
                Transform regulatory obligations into structured controls, owned
                actions, and audit-ready outcomes — in real time.
              </motion.p>

              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <motion.a
                  href={`${appBase}/auth/signup`}
                  whileHover={
                    shouldAnimate
                      ? { scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' }
                      : undefined
                  }
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-primary group px-8 py-4 text-base"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                <motion.a
                  href="/contact"
                  whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-secondary group px-8 py-4 text-base"
                >
                  <span>Request Demo</span>
                </motion.a>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 1.2 } : { duration: 0 }}
                className="mt-16 flex items-center gap-2 text-[11px] tracking-[0.2em] text-white/20 uppercase"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Discover more
              </motion.div>
            </div>

            {/* Right: abstract hero object */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, scale: 0.92 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldAnimate
                  ? { duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0 }
              }
              className="relative w-full aspect-square max-w-[560px] mx-auto lg:mx-0 lg:ml-auto"
            >
              <AbstractHeroObject
                shouldAnimate={shouldAnimate && isDesktop}
                mouseX={mousePos.x}
                mouseY={mousePos.y}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProductHero3D;
