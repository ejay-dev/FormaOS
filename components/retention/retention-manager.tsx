'use client';

import { Shield, Archive, Trash2, Eye, Lock, Unlock } from 'lucide-react';

interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  document_category: string;
  retention_period_days: number;
  action_on_expiry: string;
  is_active: boolean;
}

export function RetentionPolicyEditor({
  policies,
}: {
  policies: RetentionPolicy[];
}) {
  const categoryLabels: Record<string, string> = {
    evidence: 'Evidence Documents',
    policy: 'Policies',
    incident_report: 'Incident Reports',
    care_plan: 'Care Plans',
    audit_log: 'Audit Logs',
    general: 'General Documents',
  };

  const actionIcons: Record<string, React.ReactNode> = {
    archive: <Archive className="h-3 w-3" />,
    delete: <Trash2 className="h-3 w-3" />,
    review: <Eye className="h-3 w-3" />,
  };

  return (
    <div className="space-y-3">
      {policies.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">{p.name}</h4>
              {!p.is_active && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryLabels[p.document_category] || p.document_category} ·{' '}
              {p.retention_period_days} days ·{' '}
              <span className="inline-flex items-center gap-1">
                {actionIcons[p.action_on_expiry]} {p.action_on_expiry}
              </span>
            </p>
            {p.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {p.description}
              </p>
            )}
          </div>
          <button className="text-xs text-primary hover:underline">Edit</button>
        </div>
      ))}
      {policies.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No retention policies configured. Add one to automate document
          lifecycle.
        </div>
      )}
    </div>
  );
}

interface LegalHold {
  id: string;
  name: string;
  reason: string;
  status: string;
  created_at: string;
  released_at?: string;
  document_count: number;
}

export function LegalHoldManager({
  holds,
  onRelease,
}: {
  holds: LegalHold[];
  onRelease?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {holds.map((h) => (
        <div
          key={h.id}
          className={`rounded-lg border p-4 ${
            h.status === 'active'
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {h.status === 'active' ? (
                <Lock className="h-4 w-4 text-red-600" />
              ) : (
                <Unlock className="h-4 w-4 text-muted-foreground" />
              )}
              <h4 className="text-sm font-medium text-foreground">{h.name}</h4>
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  h.status === 'active'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {h.status}
              </span>
            </div>
            {h.status === 'active' && onRelease && (
              <button
                onClick={() => onRelease(h.id)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Release Hold
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{h.reason}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {h.document_count} document{h.document_count !== 1 ? 's' : ''} ·
            Created {new Date(h.created_at).toLocaleDateString()}
            {h.released_at &&
              ` · Released ${new Date(h.released_at).toLocaleDateString()}`}
          </p>
        </div>
      ))}
      {holds.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No legal holds active. Documents follow standard retention policies.
        </div>
      )}
    </div>
  );
}
