'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';

/**
 * AuroraBackground
 * ────────────────
 * Smooth morphing gradient blobs that slowly drift and blend,
 * producing a premium aurora-like atmosphere behind the hero.
 *
 * Zero JS animation — uses pure CSS @keyframes for performance.
 * Automatically disables motion when prefers-reduced-motion is set.
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
      {/* Base atmosphere — deep dark blue */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Aurora blob 1 — teal, top-left drift */}
      <div
        className={cn(
          'aurora-blob absolute -left-[20%] -top-[30%] h-[70vh] w-[70vh] rounded-full opacity-[0.35]',
          !shouldReduceMotion && 'animate-aurora-1',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(45,212,191,0.55) 0%, rgba(20,184,166,0.25) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Aurora blob 2 — cyan, center-right drift */}
      <div
        className={cn(
          'aurora-blob absolute -right-[10%] top-[10%] h-[60vh] w-[60vh] rounded-full opacity-[0.30]',
          !shouldReduceMotion && 'animate-aurora-2',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(34,211,238,0.50) 0%, rgba(6,182,212,0.20) 45%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Aurora blob 3 — violet/indigo, bottom sweep */}
      <div
        className={cn(
          'aurora-blob absolute -bottom-[20%] left-[20%] h-[65vh] w-[80vh] rounded-full opacity-[0.28]',
          !shouldReduceMotion && 'animate-aurora-3',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(129,140,248,0.50) 0%, rgba(167,139,250,0.18) 45%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Aurora blob 4 — emerald accent, subtle */}
      <div
        className={cn(
          'aurora-blob absolute left-[40%] top-[30%] h-[50vh] w-[50vh] rounded-full opacity-[0.18]',
          !shouldReduceMotion && 'animate-aurora-4',
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(52,211,153,0.45) 0%, rgba(16,185,129,0.15) 50%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Grain overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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
            transform: translate(15%, 10%) scale(1.1);
          }
          50% {
            transform: translate(5%, 20%) scale(0.95);
          }
          75% {
            transform: translate(-10%, 8%) scale(1.05);
          }
        }

        @keyframes aurora-drift-2 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          25% {
            transform: translate(-12%, 15%) scale(1.08);
          }
          50% {
            transform: translate(-20%, 5%) scale(0.92);
          }
          75% {
            transform: translate(-5%, -10%) scale(1.12);
          }
        }

        @keyframes aurora-drift-3 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          30% {
            transform: translate(18%, -10%) scale(1.15);
          }
          60% {
            transform: translate(-8%, -5%) scale(0.9);
          }
          85% {
            transform: translate(10%, 5%) scale(1.05);
          }
        }

        @keyframes aurora-drift-4 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          20% {
            transform: translate(-15%, 12%) scale(1.1);
          }
          55% {
            transform: translate(10%, -8%) scale(0.95);
          }
          80% {
            transform: translate(-5%, -15%) scale(1.08);
          }
        }

        .animate-aurora-1 {
          animation: aurora-drift-1 20s ease-in-out infinite;
        }
        .animate-aurora-2 {
          animation: aurora-drift-2 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        .animate-aurora-3 {
          animation: aurora-drift-3 22s ease-in-out infinite;
          animation-delay: -8s;
        }
        .animate-aurora-4 {
          animation: aurora-drift-4 28s ease-in-out infinite;
          animation-delay: -12s;
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
