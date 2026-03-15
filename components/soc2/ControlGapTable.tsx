'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  CheckSquare,
} from 'lucide-react';
import type { Soc2ControlResult } from '@/lib/soc2/types';

interface ControlGapTableProps {
  controls: Soc2ControlResult[];
}

const STATUS_CONFIG = {
  satisfied: { label: 'Satisfied', color: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20', icon: ShieldCheck },
  partial: { label: 'Partial', color: 'bg-amber-400/15 text-amber-300 border-amber-400/20', icon: ShieldAlert },
  missing: { label: 'Missing', color: 'bg-rose-400/15 text-rose-300 border-rose-400/20', icon: ShieldX },
  not_applicable: { label: 'N/A', color: 'bg-slate-400/15 text-slate-400 border-slate-400/20', icon: ShieldCheck },
} as const;

const DOMAINS = ['Security', 'Availability', 'Confidentiality', 'Processing Integrity', 'Privacy'];
const STATUSES = ['all', 'missing', 'partial', 'satisfied'] as const;

export function ControlGapTable({ controls }: ControlGapTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = controls.filter((c) => {
    if (domainFilter !== 'all' && c.domain !== domainFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-100">Control Status</h3>
        <div className="flex gap-2">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left w-8" />
              <th className="px-3 py-2 text-left">Control</th>
              <th className="px-3 py-2 text-left">Domain</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-center">Score</th>
              <th className="px-3 py-2 text-center">Evidence</th>
              <th className="px-3 py-2 text-center">Tasks</th>
              <th className="px-3 py-2 text-center">Gaps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((control) => {
              const cfg = STATUS_CONFIG[control.status];
              const Icon = cfg.icon;
              const isExpanded = expandedRow === control.controlCode;
              return (
                <ControlRow
                  key={control.controlCode}
                  control={control}
                  cfg={cfg}
                  Icon={Icon}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedRow(isExpanded ? null : control.controlCode)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          No controls match the selected filters.
        </div>
      )}
    </div>
  );
}

function ControlRow({
  control,
  cfg,
  Icon,
  isExpanded,
  onToggle,
}: {
  control: Soc2ControlResult;
  cfg: { label: string; color: string };
  Icon: React.ComponentType<{ className?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </td>
        <td className="px-3 py-3">
          <div className="font-semibold text-slate-100">{control.controlCode}</div>
          <div className="text-xs text-slate-400 mt-0.5">{control.title}</div>
        </td>
        <td className="px-3 py-3 text-xs text-slate-400">{control.domain}</td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="text-sm font-semibold text-slate-200 tabular-nums">{Math.round(control.score)}%</span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <FileText className="h-3 w-3" />
            {control.evidenceCount}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <CheckSquare className="h-3 w-3" />
            {control.completedTaskCount}/{control.taskCount}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className={`text-xs font-semibold tabular-nums ${control.gaps.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {control.gaps.length}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-6 py-4 bg-white/[0.02]">
            <div className="grid gap-4 md:grid-cols-2">
              {control.gaps.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-2">Gaps</div>
                  <ul className="space-y-1">
                    {control.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">Implementation Guidance</div>
                <p className="text-xs text-slate-400 leading-relaxed">{control.implementationGuidance}</p>
              </div>
              {control.suggestedEvidenceTypes.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Suggested Evidence</div>
                  <div className="flex flex-wrap gap-2">
                    {control.suggestedEvidenceTypes.map((et) => (
                      <span key={et} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">{et}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
