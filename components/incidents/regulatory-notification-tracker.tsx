'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface RegulatoryNotification {
  id: string;
  regulation: string;
  notification_type: string;
  due_date: string;
  status: string;
  submitted_at?: string;
  reference_number?: string;
  body_name?: string;
}

const REGULATION_LABELS: Record<string, string> = {
  ndis_sirs: 'NDIS SIRS',
  state_health: 'State Health',
  aged_care_quality: 'Aged Care Quality',
  workplace_safety: 'Workplace Safety',
  custom: 'Custom',
};

const TYPE_LABELS: Record<string, string> = {
  immediate: 'Immediate (24h)',
  '5_day': '5-Day Report',
  final: 'Final Report',
};

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; bg: string }
> = {
  required: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  draft: {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  submitted: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  acknowledged: {
    icon: CheckCircle2,
    color: 'text-green-700',
    bg: 'bg-green-200 dark:bg-green-900/40',
  },
  overdue: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
};

interface Props {
  notifications: RegulatoryNotification[];
  incidentId: string;
  onMarkSubmitted?: (id: string, referenceNumber: string) => void;
}

export function RegulatoryNotificationTracker({
  notifications,
  incidentId,
  onMarkSubmitted,
}: Props) {
  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState('');

  const handleSubmit = (notifId: string) => {
    if (!refNumber.trim()) return;
    onMarkSubmitted?.(notifId, refNumber.trim());
    setSubmitDialog(null);
    setRefNumber('');
  };

  if (!notifications.length) {
    return (
      <div
        className="border border-border rounded-lg p-6 bg-card text-center"
        data-testid="regulatory-tracker-empty"
      >
        <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No regulatory notifications required for this incident.
        </p>
      </div>
    );
  }

  const overdueCount = notifications.filter(
    (n) =>
      n.status !== 'submitted' &&
      n.status !== 'acknowledged' &&
      new Date(n.due_date) < new Date(),
  ).length;

  return (
    <div data-testid="regulatory-notification-tracker">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {overdueCount} notification{overdueCount > 1 ? 's' : ''} overdue —
          submit immediately to avoid regulatory penalties.
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => {
          const isOverdue =
            !['submitted', 'acknowledged'].includes(notif.status) &&
            new Date(notif.due_date) < new Date();
          const effectiveStatus = isOverdue ? 'overdue' : notif.status;
          const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.required;
          const Icon = cfg.icon;

          return (
            <div
              key={notif.id}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {REGULATION_LABELS[notif.regulation] ?? notif.regulation}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[notif.notification_type] ??
                        notif.notification_type}
                    </span>
                  </div>
                  {notif.body_name && (
                    <p className="text-xs text-muted-foreground">
                      {notif.body_name}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                >
                  <Icon className="h-3 w-3" /> {effectiveStatus}
                </span>
              </div>

              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>
                  Due: {new Date(notif.due_date).toLocaleDateString()}
                </span>
                {notif.submitted_at && (
                  <span>
                    Submitted:{' '}
                    {new Date(notif.submitted_at).toLocaleDateString()}
                  </span>
                )}
                {notif.reference_number && (
                  <span>Ref: {notif.reference_number}</span>
                )}
              </div>

              {!['submitted', 'acknowledged'].includes(notif.status) && (
                <div className="mt-3">
                  {submitDialog === notif.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                        placeholder="Reference number"
                        aria-label="Reference number"
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleSubmit(notif.id)}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSubmitDialog(null);
                          setRefNumber('');
                        }}
                        className="px-3 py-1 rounded-md text-xs text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubmitDialog(notif.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark as Submitted
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
