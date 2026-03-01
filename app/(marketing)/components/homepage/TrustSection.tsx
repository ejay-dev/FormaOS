'use client';

import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ArrowRight, ClipboardCheck, FileLock2, ShieldCheck } from 'lucide-react';
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

/* ── Animated counter: counts up from 0 to target on scroll ── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
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

        const dur = 1600;
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

  return <span ref={ref}>{count}{suffix}</span>;
}

const trustSignals = [
  { value: 9, suffix: '', unit: 'packs', label: 'Framework mappings available' },
  { value: 100, suffix: '%', unit: '', label: 'Immutable audit event history' },
  { value: 4, suffix: '', unit: 'roles', label: 'Least-privilege access control' },
  { value: 14, suffix: '', unit: 'day', label: 'Free trial — no credit card' },
] as const;

export function TrustSection() {
  return (
    <section className="mk-section home-section home-section--trust relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">
            Built for regulated teams and enterprise buyers
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Trust architecture that holds up under review
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            Move from first conversation to procurement confidence with
            structure, evidence traceability, and review-ready context.
          </p>
        </ScrollReveal>

        {/* Trusted-by chips */}
        <SectionChoreography pattern="stagger-wave" stagger={0.05} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trustedBy.map((sector) => (
            <div
              key={sector}
              className="flex items-center justify-center p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
            >
              <span className="text-slate-500 hover:text-slate-300 transition-colors duration-200 text-sm font-medium text-center">
                {sector}
              </span>
            </div>
          ))}
        </SectionChoreography>

        {/* Trust metrics */}
        <ScrollReveal variant="slideUp" range={[0.05, 0.4]} className="mt-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustSignals.map((stat) => (
              <div
                key={stat.label}
                className="group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center overflow-hidden hover:border-teal-400/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/0 group-hover:via-teal-400/30 to-transparent transition-all duration-500" />

                <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  {stat.unit && (
                    <span className="text-base text-teal-400 ml-1 font-medium">{stat.unit}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA links */}
        <ScrollReveal variant="slideUp" range={[0.05, 0.35]} className="mt-8">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/trust/packet"
              className="mk-btn mk-btn-primary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-teal-100"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <FileLock2 className="h-4 w-4" />
                Security Review Packet
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/frameworks"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Framework Coverage
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/customer-stories"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
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
