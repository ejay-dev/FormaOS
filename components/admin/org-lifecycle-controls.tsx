'use client';

import { useState } from 'react';
import {
  Shield,
  ShieldOff,
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
} from 'lucide-react';

type LifecycleStatus = 'active' | 'suspended' | 'retired';

interface OrgLifecycleControlsProps {
  orgId: string;
  orgName: string;
  status: LifecycleStatus;
  onStatusChange?: () => void;
}

export function OrgLifecycleControls({
  orgId,
  orgName,
  status,
  onStatusChange,
}: OrgLifecycleControlsProps) {
  const [activeDialog, setActiveDialog] = useState<
    'suspend' | 'restore' | 'retire' | null
  >(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'suspend' | 'restore' | 'retire') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error('Action failed');
      setActiveDialog(null);
      setReason('');
      onStatusChange?.();
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = {
    active: {
      label: 'Active',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: Shield,
    },
    suspended: {
      label: 'Suspended',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: ShieldOff,
    },
    retired: {
      label: 'Retired',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: Trash2,
    },
  }[status];

  const StatusIcon = statusBadge.icon;

  return (
    <div data-testid="org-lifecycle-controls">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {statusBadge.label}
        </span>
        <span className="text-sm text-muted-foreground">{orgName}</span>
      </div>

      <div className="flex gap-2">
        {status === 'active' && (
          <button
            onClick={() => setActiveDialog('suspend')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
            data-testid="btn-suspend"
          >
            <ShieldOff className="h-4 w-4" /> Suspend
          </button>
        )}
        {status === 'suspended' && (
          <button
            onClick={() => setActiveDialog('restore')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
            data-testid="btn-restore"
          >
            <RotateCcw className="h-4 w-4" /> Restore
          </button>
        )}
        {status !== 'retired' && (
          <button
            onClick={() => setActiveDialog('retire')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            data-testid="btn-retire"
          >
            <Trash2 className="h-4 w-4" /> Retire
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {activeDialog && (
        <div className="mt-4 p-4 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h4 className="font-medium">
              Confirm{' '}
              {activeDialog === 'suspend'
                ? 'Suspension'
                : activeDialog === 'restore'
                  ? 'Restoration'
                  : 'Retirement'}
            </h4>
          </div>
          {activeDialog === 'retire' && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              This action is permanent. All API keys will be revoked and users
              will lose access.
            </p>
          )}
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3"
            rows={2}
            placeholder="Required: explain the reason for this action"
            data-testid="reason-input"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(activeDialog)}
              disabled={!reason.trim() || loading}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              data-testid="btn-confirm"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={() => {
                setActiveDialog(null);
                setReason('');
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface LifecycleEvent {
  id: string;
  action: string;
  reason: string;
  admin_email: string;
  created_at: string;
}

export function LifecycleHistory({ events }: { events: LifecycleEvent[] }) {
  if (!events.length)
    return (
      <p className="text-sm text-muted-foreground">No lifecycle events.</p>
    );

  return (
    <div className="space-y-3" data-testid="lifecycle-history">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3 text-sm">
          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{ev.action}</p>
            <p className="text-muted-foreground">{ev.reason}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ev.admin_email} · {new Date(ev.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
