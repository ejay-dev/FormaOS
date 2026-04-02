'use client';

import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  title: string;
  change_summary?: string;
  status: string;
  created_by: string;
  published_at?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  draft: {
    icon: <FileText className="h-3 w-3" />,
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  pending_approval: {
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending Approval',
    color:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  approved: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Approved',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  published: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Published',
    color:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  archived: {
    icon: <XCircle className="h-3 w-3" />,
    label: 'Archived',
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  },
};

export function VersionTimeline({
  versions,
  onSelect,
}: {
  versions: Version[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {versions.map((v, i) => {
          const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.draft;
          return (
            <div key={v.id} className="relative flex gap-4 pl-4">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                v{v.version_number}
              </div>
              <div
                className="flex-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => onSelect(v.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground">
                    {v.title}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${cfg.color}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                {v.change_summary && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {v.change_summary}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString()}
                  {v.published_at &&
                    ` · Published ${new Date(v.published_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Approval {
  id: string;
  approver_id: string;
  approver_name?: string;
  decision: string;
  comment?: string;
  decided_at?: string;
}

export function ApprovalWorkflow({
  approvals,
  onDecide,
}: {
  approvals: Approval[];
  onDecide?: (id: string, decision: 'approved' | 'rejected') => void;
}) {
  return (
    <div className="space-y-2">
      {approvals.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {(a.approver_name || 'U').charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {a.approver_name || 'Approver'}
              </p>
              {a.comment && (
                <p className="text-xs text-muted-foreground">{a.comment}</p>
              )}
            </div>
          </div>
          {a.decision === 'pending' ? (
            onDecide ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onDecide(a.id, 'approved')}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onDecide(a.id, 'rejected')}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            ) : (
              <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Pending
              </span>
            )
          ) : (
            <span
              className={`px-2 py-0.5 text-xs rounded ${
                a.decision === 'approved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {a.decision === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function AcknowledgmentTracker({
  acknowledged,
  total,
  percentage,
}: {
  acknowledged: number;
  total: number;
  percentage: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> Acknowledgment Progress
        </h3>
        <span className="text-sm font-bold text-foreground">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${percentage >= 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {acknowledged} of {total} members acknowledged
      </p>
    </div>
  );
}
