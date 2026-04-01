'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ReadinessScoreRingProps {
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: '#34d399', text: 'text-emerald-400', label: 'text-emerald-300' };
  if (score >= 50) return { stroke: '#fbbf24', text: 'text-amber-400', label: 'text-amber-300' };
  return { stroke: '#fb7185', text: 'text-rose-400', label: 'text-rose-300' };
}

export function ReadinessScoreRing({ score }: ReadinessScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColor(clamped);

  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * (mounted ? clamped : 0)) / 100;

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg]"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black tabular-nums tracking-tight ${colors.text}`}>
            {clamped}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ShieldCheck className={`h-4 w-4 ${colors.label}`} />
        <span className="text-sm font-semibold text-foreground/70">Readiness Score</span>
      </div>
    </div>
  );
}
