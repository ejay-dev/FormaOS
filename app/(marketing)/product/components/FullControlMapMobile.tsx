'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { brand } from '@/config/brand';

/**
 * Mobile-native form of the FullControlMap node graph. The SVG galaxy is
 * unreadable on a phone (labels collide, and it renders blank under
 * prefers-reduced-motion), so below `sm` we replace it with a tap-to-trace
 * list of the same cross-framework story: one control, mapped once,
 * satisfies the obligation in every framework that shares it.
 *
 * The obligation→framework groupings mirror the real CROSS_EDGES dataset in
 * components/motion/FullControlMapViz.tsx — no invented coverage.
 */

const FRAMEWORK_LABELS: Record<string, string> = {
  iso: 'ISO 27001',
  soc: 'SOC 2',
  nist: 'NIST CSF',
  hipaa: 'HIPAA',
  gdpr: 'GDPR',
  pci: 'PCI DSS',
  cis: 'CIS Controls',
};

type SharedObligation = {
  id: string;
  label: string;
  desc: string;
  frameworks: string[];
};

// Derived from CROSS_EDGES (FullControlMapViz). Each entry = one control
// theme and the frameworks whose requirement it satisfies in common.
const SHARED_OBLIGATIONS: SharedObligation[] = [
  {
    id: 'access',
    label: 'Access control',
    desc: 'One IAM and user-lifecycle control answers the access requirement across six frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa', 'pci', 'cis'],
  },
  {
    id: 'encryption',
    label: 'Encryption',
    desc: 'Encryption in transit and at rest maps to five frameworks from a single evidence set.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa', 'pci'],
  },
  {
    id: 'incident',
    label: 'Incident response',
    desc: 'One incident-management process and runbook satisfies five frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa', 'cis'],
  },
  {
    id: 'monitoring',
    label: 'Monitoring & logging',
    desc: 'Continuous logging and monitoring evidence is shared across five frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'pci', 'cis'],
  },
  {
    id: 'training',
    label: 'Security training',
    desc: 'Awareness and training records cover the people requirement in five frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa', 'cis'],
  },
  {
    id: 'vendor',
    label: 'Vendor & supply chain',
    desc: 'Supplier and third-party risk maps to five frameworks at once.',
    frameworks: ['iso', 'soc', 'nist', 'gdpr', 'cis'],
  },
  {
    id: 'risk',
    label: 'Risk assessment',
    desc: 'A single risk-assessment programme satisfies four frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa'],
  },
  {
    id: 'continuity',
    label: 'Business continuity',
    desc: 'BCP and disaster-recovery evidence is shared across four frameworks.',
    frameworks: ['iso', 'soc', 'nist', 'hipaa'],
  },
  {
    id: 'privacy',
    label: 'Data protection & privacy',
    desc: 'Data-rights, retention, and breach handling map across four frameworks.',
    frameworks: ['gdpr', 'soc', 'nist', 'hipaa'],
  },
];

export function FullControlMapMobile() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(SHARED_OBLIGATIONS[0].id);

  return (
    <div className="sm:hidden">
      {/* Coverage summary */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-slate-950/60">
        {[
          { label: 'Frameworks', value: String(brand.frameworks.count) },
          { label: 'Controls', value: `${brand.frameworks.controlCount}+` },
          { label: 'Shared links', value: '42' },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3.5 text-center">
            <div className="font-display text-2xl font-bold tracking-tight text-white">
              {s.value}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
        Map a control once. It satisfies the obligation in every framework
        that shares it. Tap a shared control to trace its frameworks.
      </p>

      {/* Tap-to-trace list */}
      <ul className="mt-5 space-y-2">
        {SHARED_OBLIGATIONS.map((ob) => {
          const isOpen = open === ob.id;
          return (
            <li
              key={ob.id}
              className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`ob-${ob.id}`}
                onClick={() => setOpen(isOpen ? null : ob.id)}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-white/[0.03]"
              >
                <span className="flex items-baseline gap-2.5">
                  <span className="text-sm font-semibold text-white">
                    {ob.label}
                  </span>
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {ob.frameworks.length} frameworks
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={`ob-${ob.id}`}
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                      <p className="text-[13px] leading-relaxed text-slate-400">
                        {ob.desc}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ob.frameworks.map((fw) => (
                          <span
                            key={fw}
                            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                          >
                            {FRAMEWORK_LABELS[fw]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
