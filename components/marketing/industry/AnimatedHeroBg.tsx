'use client';

import { useReducedMotion } from 'framer-motion';

export interface AnimatedHeroBgProps {
  /** Gradient accent: 'cyan-blue' | 'cyan-violet' | 'violet-cyan' | 'emerald-cyan' | 'amber-orange' */
  accent?: string;
}

const accentMap: Record<string, { primary: string; secondary: string }> = {
  'cyan-blue': { primary: 'rgba(0,212,251,0.08)', secondary: 'rgba(59,130,246,0.06)' },
  'cyan-violet': { primary: 'rgba(0,212,251,0.08)', secondary: 'rgba(160,131,255,0.06)' },
  'violet-cyan': { primary: 'rgba(160,131,255,0.08)', secondary: 'rgba(0,212,251,0.06)' },
  'emerald-cyan': { primary: 'rgba(52,211,153,0.08)', secondary: 'rgba(0,212,251,0.06)' },
  'amber-orange': { primary: 'rgba(251,191,36,0.08)', secondary: 'rgba(251,146,60,0.06)' },
};

export function AnimatedHeroBg({ accent = 'cyan-violet' }: AnimatedHeroBgProps) {
  const shouldReduceMotion = useReducedMotion();
  const colors = accentMap[accent] ?? accentMap['cyan-violet'];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060910] via-[#0a0e1a] to-[#0d1117]" />

      {/* Animated grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.025,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          animation: shouldReduceMotion ? 'none' : 'hero-grid-drift 30s linear infinite',
        }}
      />

      {/* Primary radial glow */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1400px] h-[700px] rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 65%)`,
          animation: shouldReduceMotion ? 'none' : 'hero-glow-pulse 8s ease-in-out infinite',
        }}
      />

      {/* Secondary glow */}
      <div
        className="absolute bottom-[-5%] left-[20%] w-[900px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.secondary} 0%, transparent 65%)`,
          animation: shouldReduceMotion ? 'none' : 'hero-glow-pulse 12s ease-in-out infinite reverse',
        }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes hero-grid-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(72px, 72px); }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, 0) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
