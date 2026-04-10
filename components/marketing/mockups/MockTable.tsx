'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Paperclip } from 'lucide-react';
import type { ReactNode } from 'react';

export interface MockTableColumn {
  key: string;
  label: string;
  mono?: boolean;
}

export interface MockTableRow {
  id: string;
  cells: Record<string, string | ReactNode>;
  status: 'green' | 'amber' | 'red';
}

interface MockTableProps {
  columns: MockTableColumn[];
  rows: MockTableRow[];
  showEvidence?: boolean;
}

const statusDot: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const statusText: Record<string, string> = {
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
};

export function MockTable({ columns, rows, showEvidence = false }: MockTableProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0d1428] overflow-hidden">
      {/* Table header */}
      <div className="grid border-b border-white/[0.06] bg-white/[0.02]" style={{
        gridTemplateColumns: `${columns.map((_, i) => i === 0 ? '2fr' : '1fr').join(' ')}${showEvidence ? ' 0.5fr' : ''}`,
      }}>
        {columns.map((col) => (
          <div key={col.key} className="px-2 py-1.5 text-[6px] uppercase tracking-wider font-bold text-white/20">
            {col.label}
          </div>
        ))}
        {showEvidence && (
          <div className="px-2 py-1.5 text-[6px] uppercase tracking-wider font-bold text-white/20">
            Evidence
          </div>
        )}
      </div>

      {/* Table rows */}
      {rows.map((row, idx) => (
        <motion.div
          key={row.id}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, delay: 0.4 + idx * 0.05 }}
          className="grid border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
          style={{
            gridTemplateColumns: `${columns.map((_, i) => i === 0 ? '2fr' : '1fr').join(' ')}${showEvidence ? ' 0.5fr' : ''}`,
            height: 28,
          }}
        >
          {columns.map((col) => (
            <div key={col.key} className="px-2 flex items-center overflow-hidden">
              {col.key === 'status' ? (
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[row.status]} flex-shrink-0`} />
                  <span className={`text-[8px] ${statusText[row.status]}`}>{row.cells[col.key]}</span>
                </span>
              ) : (
                <span className={`text-[8px] truncate ${
                  col.mono ? 'font-mono text-white/40' : 'text-white/60'
                } ${columns.indexOf(col) === 0 ? 'text-white font-medium' : ''}`}>
                  {row.cells[col.key]}
                </span>
              )}
            </div>
          ))}
          {showEvidence && (
            <div className="px-2 flex items-center">
              <Paperclip className="w-2 h-2 text-white/20" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default MockTable;
