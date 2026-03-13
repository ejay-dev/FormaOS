'use client';

import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  ArrowRight,
  ClipboardCheck,
  FileLock2,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const trustedBy = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services teams',
  'Education & research',
  'Government programs',
  'Community services',
  'Enterprise compliance',
  'Multi-site operators',
] as const;

function AnimatedCounter({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;

        if (shouldReduceMotion) {
          setCount(value);
          return;
        }

        const dur = 1200;
        const start = performance.now();
        const step = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const trustSignals = [
  {
    value: 9,
    suffix: '',
    unit: 'packs',
    label: 'Framework mappings available',
  },
  { value: 100, suffix: '%', unit: '', label: 'Immutable audit event history' },
  {
    value: 4,
    suffix: '',
    unit: 'roles',
    label: 'Least-privilege access control',
  },
  { value: 14, suffix: '', unit: 'day', label: 'Free trial — no credit card' },
] as const;

export function TrustSection() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp" className="text-center mb-10">
          <p className="mk-badge mk-badge--meta mb-3">
            Built for regulated teams and enterprise buyers
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Trust architecture that holds up under review
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            Move from first conversation to procurement confidence with
            structure, evidence traceability, and review-ready context.
          </p>
        </ScrollReveal>

        {/* Tier 1 — Trust metrics (dominant) */}
        <ScrollReveal variant="fadeUp" className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustSignals.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl border border-white/[0.08] bg-slate-900/60 text-center"
              >
                <div className="text-3xl sm:text-4xl font-semibold text-white mb-1.5 tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  {stat.unit && (
                    <span className="text-base text-teal-400 ml-1 font-medium">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Tier 3 — Trusted-by chips (supporting) */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {trustedBy.map((sector) => (
            <span
              key={sector}
              className="px-3 py-1.5 rounded-full text-xs text-slate-500 bg-slate-900/30 border border-white/[0.04]"
            >
              {sector}
            </span>
          ))}
        </div>

        {/* CTA links */}
        <ScrollReveal variant="fadeUp" className="mt-8">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/trust/packet"
              className="mk-btn mk-btn-primary group flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <FileLock2 className="h-4 w-4" />
                Security Review Packet
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/frameworks"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Framework Coverage
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/customer-stories"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <ClipboardCheck className="h-4 w-4" />
                Outcome Stories
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
