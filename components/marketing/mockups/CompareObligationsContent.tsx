'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MockTable } from './MockTable';
import { Search, Filter, ChevronDown } from 'lucide-react';

const OBLIGATION_COLUMNS = [
  { key: 'obligation', label: 'Obligation' },
  { key: 'framework', label: 'Framework' },
  { key: 'owner', label: 'Owner' },
  { key: 'due', label: 'Due', mono: true },
  { key: 'status', label: 'Status' },
];

const OBLIGATION_ROWS = [
  {
    id: 'o1',
    status: 'red' as const,
    cells: {
      obligation: 'NDIS Practice Standards Review',
      framework: 'NDIS',
      owner: 'S. Chen',
      due: '01 Apr 2026',
      status: 'Overdue',
    },
  },
  {
    id: 'o2',
    status: 'amber' as const,
    cells: {
      obligation: 'CPS 230 Risk Assessment',
      framework: 'APRA',
      owner: 'M. Wong',
      due: '18 Apr 2026',
      status: 'Due Soon',
    },
  },
  {
    id: 'o3',
    status: 'green' as const,
    cells: {
      obligation: 'AHPRA Registration Audit',
      framework: 'AHPRA',
      owner: 'Dr Mitchell',
      due: '30 Jun 2026',
      status: 'On Track',
    },
  },
  {
    id: 'o4',
    status: 'green' as const,
    cells: {
      obligation: 'NQF Quality Improvement',
      framework: 'ACECQA',
      owner: 'L. Kumar',
      due: '15 Jul 2026',
      status: 'On Track',
    },
  },
  {
    id: 'o5',
    status: 'amber' as const,
    cells: {
      obligation: 'WHS Act Compliance Check',
      framework: 'SafeWork',
      owner: 'R. Park',
      due: '22 Apr 2026',
      status: 'Due Soon',
    },
  },
  {
    id: 'o6',
    status: 'green' as const,
    cells: {
      obligation: 'AML/CTF Annual Report',
      framework: 'AUSTRAC',
      owner: 'D. Chen',
      due: '30 Sep 2026',
      status: 'On Track',
    },
  },
];

export function CompareObligationsContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 overflow-hidden p-3 space-y-2 bg-[#0a0f1e]">
      {/* Filter bar */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 flex-1 border border-white/[0.06]">
          <Search className="w-2.5 h-2.5 text-white/20" />
          <span className="text-[7px] text-white/20">
            Filter obligations...
          </span>
          {/* Blinking cursor */}
          <span
            className="w-[1px] h-2.5 bg-cyan-400/60 ml-0.5"
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : 'mockup-cursor-blink 1s step-end infinite',
            }}
          />
        </div>
        <div className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-1 border border-white/[0.06]">
          <Filter className="w-2.5 h-2.5 text-white/20" />
          <span className="text-[7px] text-white/20">All Frameworks</span>
          <ChevronDown className="w-2 h-2 text-white/15" />
        </div>
      </motion.div>

      {/* Obligations table */}
      <MockTable
        columns={OBLIGATION_COLUMNS}
        rows={OBLIGATION_ROWS}
        showEvidence
      />

      {/* Footer */}
      <div className="flex items-center justify-between text-[7px] text-white/20 px-1">
        <span>6 of 84 obligations</span>
        <span className="flex items-center gap-1">
          <span
            className="w-1 h-1 rounded-full bg-emerald-500"
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : 'mockup-pulse-dot 2s ease-in-out infinite',
            }}
          />
          Live
        </span>
      </div>
    </div>
  );
}

export default CompareObligationsContent;
