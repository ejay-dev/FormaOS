'use client';

import {
  CreditCard,
  RefreshCw,
  Clock,
  DollarSign,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';

interface BillingEvent {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  admin_email?: string;
  created_at: string;
}

const ACTION_CONFIG: Record<
  string,
  { icon: typeof CreditCard; label: string; color: string }
> = {
  refund_issued: {
    icon: DollarSign,
    label: 'Refund Issued',
    color: 'text-red-500',
  },
  dunning_paused: {
    icon: Pause,
    label: 'Dunning Paused',
    color: 'text-yellow-500',
  },
  dunning_resumed: {
    icon: Play,
    label: 'Dunning Resumed',
    color: 'text-green-500',
  },
  invoice_rescued: {
    icon: RefreshCw,
    label: 'Invoice Rescued',
    color: 'text-blue-500',
  },
  credit_applied: {
    icon: CreditCard,
    label: 'Credit Applied',
    color: 'text-purple-500',
  },
  trial_extended: {
    icon: Clock,
    label: 'Trial Extended',
    color: 'text-cyan-500',
  },
};

export function BillingInterventionHistory({
  events,
}: {
  events: BillingEvent[];
}) {
  if (!events.length) {
    return (
      <div
        className="text-center py-8 text-muted-foreground text-sm"
        data-testid="billing-empty"
      >
        No billing interventions recorded.
      </div>
    );
  }

  return (
    <div className="space-y-0" data-testid="billing-intervention-history">
      {events.map((ev, i) => {
        const cfg = ACTION_CONFIG[ev.action] ?? {
          icon: AlertTriangle,
          label: ev.action,
          color: 'text-muted-foreground',
        };
        const Icon = cfg.icon;
        const isLast = i === events.length - 1;

        return (
          <div key={ev.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-1.5 ${cfg.color} bg-muted`}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p className="text-sm font-medium">{cfg.label}</p>
              {ev.metadata.amount_cents != null && (
                <p className="text-sm text-muted-foreground">
                  Amount: $
                  {((ev.metadata.amount_cents as number) / 100).toFixed(2)}
                </p>
              )}
              {ev.metadata.reason && (
                <p className="text-sm text-muted-foreground">
                  {ev.metadata.reason as string}
                </p>
              )}
              {ev.metadata.days && (
                <p className="text-sm text-muted-foreground">
                  {ev.metadata.days as number} days
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {ev.admin_email && <span>{ev.admin_email} · </span>}
                {new Date(ev.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
