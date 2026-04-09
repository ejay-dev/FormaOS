'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';

export interface CompareRow {
  feature: string;
  spreadsheets: 'yes' | 'no' | 'partial' | string;
  genericGrc: 'yes' | 'no' | 'partial' | string;
  formaos: 'yes' | 'no' | 'partial' | string;
}

export interface CompareTableProps {
  headline: string;
  description: string;
  rows: CompareRow[];
}

function CellValue({ value }: { value: string }) {
  if (value === 'yes') {
    return <CheckCircle2 className="h-4 w-4 text-cyan-400 mx-auto" />;
  }
  if (value === 'no') {
    return <XCircle className="h-4 w-4 text-red-500/60 mx-auto" />;
  }
  if (value === 'partial') {
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500/80 mx-auto" />;
  }
  return (
    <span className="text-xs text-slate-300 text-center block">{value}</span>
  );
}

export function CompareTable({
  headline,
  description,
  rows,
}: CompareTableProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-400 mb-6">
            <BarChart3 className="h-3.5 w-3.5" />
            How We Compare
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4">
            {headline}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
        >
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-medium w-[40%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500 font-medium text-center w-[20%]">
                    Spreadsheets
                  </th>
                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500 font-medium text-center w-[20%]">
                    Generic GRC
                  </th>
                  <th className="px-4 py-4 text-xs uppercase tracking-wider text-cyan-500/80 font-semibold text-center w-[20%]">
                    FormaOS
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                      i === rows.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {row.feature}
                    </td>
                    <td className="px-4 py-4">
                      <CellValue value={row.spreadsheets} />
                    </td>
                    <td className="px-4 py-4">
                      <CellValue value={row.genericGrc} />
                    </td>
                    <td className="px-4 py-4 bg-cyan-500/[0.03]">
                      <CellValue value={row.formaos} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-white/[0.06]">
            {rows.map((row) => (
              <div key={row.feature} className="p-4 space-y-2">
                <div className="text-sm font-medium text-white">
                  {row.feature}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">
                      Sheets
                    </div>
                    <CellValue value={row.spreadsheets} />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">
                      GRC
                    </div>
                    <CellValue value={row.genericGrc} />
                  </div>
                  <div className="bg-cyan-500/[0.03] rounded-lg p-1">
                    <div className="text-[9px] uppercase tracking-wider text-cyan-600 mb-1">
                      FormaOS
                    </div>
                    <CellValue value={row.formaos} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
