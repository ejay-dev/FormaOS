'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';
import { SparklesCore } from '@/components/marketing/SparklesCore';

/**
 * AuroraBackground
 * ────────────────
 * Enterprise-grade immersive hero atmosphere combining:
 * 1. Deep-space aurora gradient blobs (CSS animated)
 * 2. Multi-layer particle star field (tsparticles)
 * 3. Luminous gradient beams for headline anchoring
 * 4. Subtle noise grain for analog depth
 *
 * Respects prefers-reduced-motion throughout.
 */

interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      style={{ background: '#030712' }}
      aria-hidden="true"
    >
      {/* ── Layer 0: Deep space base ────────────────────── */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* ── Layer 1: Aurora gradient blobs ──────────────── */}
      {/* Teal — top-left quadrant */}
      <div
        className={cn(
          'aurora-blob absolute -left-[15%] -top-[25%] h-[80vmin] w-[80vmin] sm:h-[80vh] sm:w-[80vh] rounded-full opacity-[0.28]',
          !shouldReduceMotion && 'animate-aurora-1',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(45,212,191,0.5) 0%, rgba(20,184,166,0.18) 45%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Cyan — center-right */}
      <div
        className={cn(
          'aurora-blob absolute -right-[8%] top-[5%] h-[70vmin] w-[70vmin] sm:h-[70vh] sm:w-[70vh] rounded-full opacity-[0.22]',
          !shouldReduceMotion && 'animate-aurora-2',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(34,211,238,0.45) 0%, rgba(6,182,212,0.15) 45%, transparent 70%)',
          filter: 'blur(110px)',
        }}
      />
      {/* Violet/indigo — bottom */}
      <div
        className={cn(
          'aurora-blob absolute -bottom-[15%] left-[15%] h-[70vmin] w-[90vmin] sm:h-[70vh] sm:w-[90vh] rounded-full opacity-[0.20]',
          !shouldReduceMotion && 'animate-aurora-3',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(129,140,248,0.42) 0%, rgba(167,139,250,0.12) 45%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />
      {/* Emerald accent — subtle center */}
      <div
        className={cn(
          'aurora-blob absolute left-[35%] top-[25%] h-[55vmin] w-[55vmin] sm:h-[55vh] sm:w-[55vh] rounded-full opacity-[0.12]',
          !shouldReduceMotion && 'animate-aurora-4',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(52,211,153,0.35) 0%, rgba(16,185,129,0.10) 50%, transparent 70%)',
          filter: 'blur(110px)',
        }}
      />

      {/* ── Layer 2: Deep-field star particles ─────────── */}
      {/* Background layer — tiny dim stars for depth */}
      <SparklesCore
        id="hero-stars-deep"
        className="absolute inset-0 h-full w-full"
        background="transparent"
        particleColor="#94a3b8"
        minSize={0.3}
        maxSize={0.8}
        speed={0.8}
        particleDensity={80}
      />
      {/* Midground layer — brand-colored teal sparkles */}
      <SparklesCore
        id="hero-stars-mid"
        className="absolute inset-0 h-full w-full"
        background="transparent"
        particleColor="#67e8f9"
        minSize={0.5}
        maxSize={1.6}
        speed={2}
        particleDensity={60}
      />
      {/* Foreground layer — rare bright white highlights */}
      <SparklesCore
        id="hero-stars-bright"
        className="absolute inset-0 h-full w-full"
        background="transparent"
        particleColor="#e2e8f0"
        minSize={1}
        maxSize={2.8}
        speed={4}
        particleDensity={25}
      />

      {/* ── Layer 3: Luminous horizon beam ─────────────── */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2">
        <div className="relative h-48 w-[50rem] max-w-[90vw]">
          {/* Primary teal beam — wide glow */}
          <div className="absolute inset-x-0 top-0 h-[3px] w-full bg-gradient-to-r from-transparent via-teal-400/80 to-transparent blur-sm" />
          <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
          {/* Secondary cyan beam — concentrated center */}
          <div className="absolute inset-x-[15%] top-0 h-[5px] w-[70%] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent blur-sm" />
          <div className="absolute inset-x-[15%] top-0 h-px w-[70%] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          {/* Tertiary violet accent — inner highlight */}
          <div className="absolute inset-x-[30%] top-0 h-[4px] w-[40%] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent blur-[3px]" />
          <div className="absolute inset-x-[30%] top-0 h-px w-[40%] bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />
          {/* Downward radial mask — particles fade below beam */}
          <div
            className="absolute inset-0 h-full w-full bg-[#030712]"
            style={{
              maskImage:
                'radial-gradient(ellipse 50% 60% at 50% 0%, transparent 30%, black 70%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 50% 60% at 50% 0%, transparent 30%, black 70%)',
            }}
          />
        </div>
      </div>

      {/* ── Layer 4: Subtle atmospheric haze ────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.06)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(129,140,248,0.04)_0%,transparent_50%)]" />

      {/* ── Layer 5: Film grain for analog depth ────────── */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <style jsx>{`
        @keyframes aurora-drift-1 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          25% {
            transform: translate(12%, 8%) scale(1.08);
          }
          50% {
            transform: translate(4%, 16%) scale(0.96);
          }
          75% {
            transform: translate(-8%, 6%) scale(1.04);
          }
        }
        @keyframes aurora-drift-2 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          25% {
            transform: translate(-10%, 12%) scale(1.06);
          }
          50% {
            transform: translate(-16%, 4%) scale(0.94);
          }
          75% {
            transform: translate(-4%, -8%) scale(1.1);
          }
        }
        @keyframes aurora-drift-3 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          30% {
            transform: translate(14%, -8%) scale(1.12);
          }
          60% {
            transform: translate(-6%, -4%) scale(0.92);
          }
          85% {
            transform: translate(8%, 4%) scale(1.04);
          }
        }
        @keyframes aurora-drift-4 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          20% {
            transform: translate(-12%, 10%) scale(1.08);
          }
          55% {
            transform: translate(8%, -6%) scale(0.96);
          }
          80% {
            transform: translate(-4%, -12%) scale(1.06);
          }
        }

        .animate-aurora-1 {
          animation: aurora-drift-1 24s ease-in-out infinite;
        }
        .animate-aurora-2 {
          animation: aurora-drift-2 30s ease-in-out infinite;
          animation-delay: -6s;
        }
        .animate-aurora-3 {
          animation: aurora-drift-3 26s ease-in-out infinite;
          animation-delay: -10s;
        }
        .animate-aurora-4 {
          animation: aurora-drift-4 32s ease-in-out infinite;
          animation-delay: -14s;
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-blob {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AuroraBackground;
