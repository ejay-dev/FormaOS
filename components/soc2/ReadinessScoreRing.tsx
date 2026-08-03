'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ReadinessScoreRingProps {
  score: number;
}

// Tokens, not hexes: the ring has to read on both the light and dark ramp.
function getScoreBand(score: number) {
  if (score >= 80)
    return { stroke: 'stroke-success', text: 'text-success', label: 'On track' };
  if (score >= 50)
    return { stroke: 'stroke-warning', text: 'text-warning', label: 'Partial' };
  return {
    stroke: 'stroke-destructive',
    text: 'text-destructive',
    label: 'At risk',
  };
}

export function ReadinessScoreRing({ score }: ReadinessScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = getScoreBand(clamped);

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
            strokeWidth={strokeWidth}
            className="stroke-border"
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={band.stroke}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-5xl font-bold tabular-nums tracking-tight ${band.text}`}
          >
            {clamped}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ShieldCheck className={`h-4 w-4 ${band.text}`} />
        <span className="text-sm font-medium text-muted-foreground">
          Readiness score · {band.label}
        </span>
      </div>
    </div>
  );
}
