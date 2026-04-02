'use client';

import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Wrench,
  Eye,
  XCircle,
} from 'lucide-react';

interface CAPAItem {
  id: string;
  type: 'corrective' | 'preventive';
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'implemented' | 'verified' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigned_to?: string;
  due_date?: string;
  effectiveness_status:
    | 'pending'
    | 'effective'
    | 'ineffective'
    | 'needs_revision';
  verified_at?: string;
}

const STEPS = [
  'open',
  'in_progress',
  'implemented',
  'verified',
  'closed',
] as const;
const STEP_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  verified: 'Verified',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function StepIcon({ step, current }: { step: string; current: string }) {
  const stepIdx = STEPS.indexOf(step as (typeof STEPS)[number]);
  const currentIdx = STEPS.indexOf(current as (typeof STEPS)[number]);

  if (stepIdx < currentIdx)
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (stepIdx === currentIdx)
    return <Wrench className="h-5 w-5 text-primary" />;
  return <Clock className="h-5 w-5 text-muted-foreground" />;
}

export function CAPATracker({ item }: { item: CAPAItem }) {
  const isOverdue =
    item.due_date &&
    new Date(item.due_date) < new Date() &&
    item.status !== 'closed';

  return (
    <div
      className="border border-border rounded-lg p-5 bg-card"
      data-testid="capa-tracker"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                item.type === 'corrective'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {item.type === 'corrective' ? 'Corrective' : 'Preventive'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}
            >
              {item.priority}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </span>
            )}
          </div>
          <h3 className="font-medium">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Step Progression */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <StepIcon step={step} current={item.status} />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Effectiveness Verification */}
      {(item.status === 'verified' || item.status === 'closed') && (
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Effectiveness:</span>
            {item.effectiveness_status === 'effective' && (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Effective
              </span>
            )}
            {item.effectiveness_status === 'ineffective' && (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-4 w-4" /> Ineffective
              </span>
            )}
            {item.effectiveness_status === 'needs_revision' && (
              <span className="text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Needs Revision
              </span>
            )}
            {item.effectiveness_status === 'pending' && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> Pending
              </span>
            )}
          </div>
          {item.verified_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Verified: {new Date(item.verified_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        {item.assigned_to && <span>Assigned: {item.assigned_to}</span>}
        {item.due_date && (
          <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
