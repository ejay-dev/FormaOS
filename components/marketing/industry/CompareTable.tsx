'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

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
  /** Override the middle column label. Defaults to "Generic GRC". */
  col2Label?: string;
}

/* The icon is never the only signal: each one carries the word it stands
   for, so screen readers and printouts read the same as the grid. */
function CellValue({ value }: { value: string }) {
  if (value === 'yes') {
    return (
      <span className="flex items-center justify-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-xs text-slate-300">Yes</span>
      </span>
    );
  }
  if (value === 'no') {
    return (
      <span className="flex items-center justify-center gap-1.5">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-xs text-slate-500">No</span>
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className="flex items-center justify-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        <span className="text-xs text-slate-400">Partial</span>
      </span>
    );
  }
  return (
    <span className="text-xs text-slate-300 text-center block">{value}</span>
  );
}

export function CompareTable({
  headline,
  description,
  rows,
  col2Label = 'Generic GRC',
}: CompareTableProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-marketing-bg" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
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
                  <th className="text-left px-6 py-4 text-xs text-slate-500 font-medium w-[40%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-xs text-slate-500 font-medium text-center w-[20%]">
                    Spreadsheets
                  </th>
                  <th className="px-4 py-4 text-xs text-slate-500 font-medium text-center w-[20%]">
                    {col2Label}
                  </th>
                  <th className="px-4 py-4 text-xs text-white font-semibold text-center w-[20%]">
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
                    <td className="px-4 py-4 bg-white/[0.03]">
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
              <div key={row.feature} className="p-4">
                <div className="text-sm font-medium text-white mb-3">
                  {row.feature}
                </div>
                <dl className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-slate-500">Spreadsheets</dt>
                    <dd>
                      <CellValue value={row.spreadsheets} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-slate-500">{col2Label}</dt>
                    <dd>
                      <CellValue value={row.genericGrc} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-2 py-1 -mx-2">
                    <dt className="text-xs font-medium text-white">FormaOS</dt>
                    <dd>
                      <CellValue value={row.formaos} />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
