'use client';

import { MockMetricCards } from './MockMetricCards';
import { MockTable } from './MockTable';
import { Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const HEALTHCARE_METRICS = [
  { label: 'Total Obligations', value: 62, borderColor: 'border-l-cyan-500', icon: Shield, iconColor: 'text-cyan-400' },
  { label: 'Overdue', value: 1, borderColor: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  { label: 'Due This Week', value: 7, borderColor: 'border-l-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { label: 'Completed', value: 54, borderColor: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
];

const PRACTITIONER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'profession', label: 'Profession' },
  { key: 'ahpra', label: 'AHPRA', mono: true },
  { key: 'cpd', label: 'CPD Hours', mono: true },
  { key: 'status', label: 'Status' },
];

const PRACTITIONER_ROWS = [
  { id: 'p1', status: 'green' as const, cells: { name: 'Dr Sarah Mitchell', profession: 'General Practitioner', ahpra: 'MED0001842390', cpd: '48/50', status: 'Current' } },
  { id: 'p2', status: 'green' as const, cells: { name: 'James Nguyen', profession: 'Registered Nurse', ahpra: 'NUR0003912847', cpd: '32/30', status: 'Current' } },
  { id: 'p3', status: 'amber' as const, cells: { name: 'Dr Priya Sharma', profession: 'Psychiatrist', ahpra: 'MED0002391045', cpd: '22/50', status: 'Expiring' } },
  { id: 'p4', status: 'green' as const, cells: { name: 'Emily Watson', profession: 'Physiotherapist', ahpra: 'PHY0001293847', cpd: '28/30', status: 'Current' } },
  { id: 'p5', status: 'red' as const, cells: { name: 'Dr Michael Chen', profession: 'Dentist', ahpra: 'DEN0003847291', cpd: '12/50', status: 'Expired' } },
];

export function HealthcareMockContent() {
  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      {/* Metric cards */}
      <MockMetricCards cards={HEALTHCARE_METRICS} />

      {/* Practitioner Register */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">Practitioner Register</span>
        </div>
        <MockTable columns={PRACTITIONER_COLUMNS} rows={PRACTITIONER_ROWS} />
      </div>
    </div>
  );
}

export default HealthcareMockContent;
