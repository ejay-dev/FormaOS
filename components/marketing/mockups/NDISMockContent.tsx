'use client';

import { MockMetricCards } from './MockMetricCards';
import { MockTable } from './MockTable';
import { Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const NDIS_METRICS = [
  { label: 'Total Obligations', value: 47, borderColor: 'border-l-cyan-500', icon: Shield, iconColor: 'text-cyan-400' },
  { label: 'Overdue', value: 2, borderColor: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  { label: 'Due This Week', value: 5, borderColor: 'border-l-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { label: 'Completed', value: 40, borderColor: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
];

const WORKER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'ndisCheck', label: 'NDIS Check' },
  { key: 'expiry', label: 'Expiry', mono: true },
  { key: 'daysLeft', label: 'Days Left', mono: true },
  { key: 'status', label: 'Status' },
];

const WORKER_ROWS = [
  { id: 'w1', status: 'green' as const, cells: { name: 'Sarah Chen', ndisCheck: 'Worker Screening', expiry: '14 Mar 2027', daysLeft: '342', status: 'Current' } },
  { id: 'w2', status: 'green' as const, cells: { name: 'James Patel', ndisCheck: 'Worker Screening', expiry: '08 Nov 2026', daysLeft: '213', status: 'Current' } },
  { id: 'w3', status: 'amber' as const, cells: { name: 'Maria Lopez', ndisCheck: 'Worker Screening', expiry: '22 May 2026', daysLeft: '42', status: 'Expiring' } },
  { id: 'w4', status: 'red' as const, cells: { name: 'David Kim', ndisCheck: 'Worker Screening', expiry: '01 Mar 2026', daysLeft: '-40', status: 'Expired' } },
];

export function NDISMockContent() {
  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      {/* Metric cards */}
      <MockMetricCards cards={NDIS_METRICS} />

      {/* Worker Screening table */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">Worker Screening Register</span>
          <span className="text-[7px] text-cyan-400/50">SIRS Tracker &rsaquo;</span>
        </div>
        <MockTable columns={WORKER_COLUMNS} rows={WORKER_ROWS} />
      </div>
    </div>
  );
}

export default NDISMockContent;
