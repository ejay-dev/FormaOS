'use client';

import { MockMetricCards } from './MockMetricCards';
import { MockTable } from './MockTable';
import { Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const CONSTRUCTION_METRICS = [
  { label: 'Active Sites', value: 12, borderColor: 'border-l-cyan-500', icon: Shield, iconColor: 'text-cyan-400' },
  { label: 'WHS Incidents', value: 3, borderColor: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  { label: 'Expiring SWMS', value: 7, borderColor: 'border-l-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { label: 'Compliant Sites', value: 9, borderColor: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
];

const SITE_COLUMNS = [
  { key: 'site', label: 'Site' },
  { key: 'contractor', label: 'Contractor Status' },
  { key: 'whs', label: 'WHS' },
  { key: 'incidents', label: 'Incidents', mono: true },
  { key: 'status', label: 'RAG' },
];

const SITE_ROWS = [
  { id: 's1', status: 'green' as const, cells: { site: 'CBD Tower - Level 14', contractor: '24/24 Verified', whs: 'Current', incidents: '0', status: 'Green' } },
  { id: 's2', status: 'amber' as const, cells: { site: 'Westfield Extension', contractor: '18/21 Verified', whs: 'Expiring', incidents: '1', status: 'Amber' } },
  { id: 's3', status: 'red' as const, cells: { site: 'Harbour Bridge Maint.', contractor: '9/15 Verified', whs: 'Overdue', incidents: '2', status: 'Red' } },
];

export function ConstructionMockContent() {
  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      <MockMetricCards cards={CONSTRUCTION_METRICS} />

      {/* Multi-site table */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">Multi-Site Overview</span>
          <span className="text-[7px] text-cyan-400/50">SWMS Register &rsaquo;</span>
        </div>
        <MockTable columns={SITE_COLUMNS} rows={SITE_ROWS} />
      </div>
    </div>
  );
}

export default ConstructionMockContent;
