'use client';

import { MockMetricCards } from './MockMetricCards';
import { MockTable } from './MockTable';
import { Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const FINANCIAL_METRICS = [
  { label: 'Total Obligations', value: 84, borderColor: 'border-l-cyan-500', icon: Shield, iconColor: 'text-cyan-400' },
  { label: 'Overdue', value: 4, borderColor: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  { label: 'Due This Week', value: 12, borderColor: 'border-l-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { label: 'Completed', value: 68, borderColor: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
];

const OBLIGATION_COLUMNS = [
  { key: 'obligation', label: 'Obligation' },
  { key: 'framework', label: 'Framework' },
  { key: 'owner', label: 'Owner' },
  { key: 'due', label: 'Due', mono: true },
  { key: 'status', label: 'Status' },
];

const OBLIGATION_ROWS = [
  { id: 'o1', status: 'red' as const, cells: { obligation: 'AML/CTF Program Review', framework: 'AUSTRAC', owner: 'J. Santos', due: '01 Apr 2026', status: 'Overdue' } },
  { id: 'o2', status: 'amber' as const, cells: { obligation: 'CPS 230 Operational Risk', framework: 'APRA', owner: 'M. Wong', due: '18 Apr 2026', status: 'Due Soon' } },
  { id: 'o3', status: 'green' as const, cells: { obligation: 'Breach Register Update', framework: 'ASIC s912A', owner: 'L. Kumar', due: '30 Jun 2026', status: 'On Track' } },
  { id: 'o4', status: 'green' as const, cells: { obligation: 'Annual Compliance Plan', framework: 'ASIC', owner: 'R. Park', due: '15 Jul 2026', status: 'On Track' } },
  { id: 'o5', status: 'amber' as const, cells: { obligation: 'Client Money Reconciliation', framework: 'ASIC', owner: 'D. Chen', due: '22 Apr 2026', status: 'Due Soon' } },
];

export function FinancialMockContent() {
  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      <MockMetricCards cards={FINANCIAL_METRICS} />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">Obligations Register</span>
          <span className="text-[7px] text-cyan-400/50">Breach Register &rsaquo;</span>
        </div>
        <MockTable columns={OBLIGATION_COLUMNS} rows={OBLIGATION_ROWS} showEvidence />
      </div>
    </div>
  );
}

export default FinancialMockContent;
