import { getAdminFetchConfig } from '@/app/admin/lib';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

async function fetchHealth() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/health`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function isFailureEvent(value?: string | null) {
  if (!value) return false;
  return value.includes('error') || value.includes('failed');
}

function getEventIcon(eventType: string) {
  if (isFailureEvent(eventType)) {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  if (eventType?.includes('success') || eventType?.includes('completed')) {
    return <CheckCircle className="h-4 w-4 text-success" />;
  }
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

export default async function AdminHealthPage() {
  const data = await fetchHealth();

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Health checks unavailable</p>
      </div>
    );
  }

  const billingEvents = data.billingEvents ?? [];
  const adminAudit = data.adminAudit ?? [];

  const failedBillingEvents = billingEvents.filter((event: any) =>
    isFailureEvent(event.event_type),
  ).length;
  const latestEventAt =
    [billingEvents[0]?.processed_at, adminAudit[0]?.created_at]
      .filter(Boolean)
      .sort()
      .pop() ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">System health</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          What the platform has recorded recently. This page reports the last 20
          billing and admin events — it is not an uptime probe.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div
          className={`rounded-lg border p-4 ${
            failedBillingEvents > 0
              ? 'border-destructive/20 bg-destructive/10'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center gap-3">
            {failedBillingEvents > 0 ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                Billing events
              </p>
              <p className="text-xs text-muted-foreground">
                {failedBillingEvents > 0
                  ? `${failedBillingEvents} of the last ${billingEvents.length} events failed`
                  : billingEvents.length > 0
                    ? `No failures in the last ${billingEvents.length} events`
                    : 'No events recorded yet'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Most recent event
              </p>
              <p className="text-xs text-muted-foreground">
                {latestEventAt ? formatDate(latestEventAt) : 'No events yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Events */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Billing events
        </h2>
        <div className="space-y-2">
          {billingEvents.length > 0 ? (
            billingEvents.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-1 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getEventIcon(event.event_type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">
                      {event.event_type}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                  {formatDate(event.processed_at)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p className="text-sm">No recent billing events</p>
            </div>
          )}
        </div>
      </section>

      {/* Admin Activity */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Admin activity
        </h2>
        <div className="space-y-2">
          {adminAudit.length > 0 ? (
            adminAudit.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-1 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getEventIcon(event.action)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">
                      {event.action} ·{' '}
                      <span className="text-muted-foreground">
                        {event.target_type}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                  {formatDate(event.created_at)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p className="text-sm">No admin events yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
