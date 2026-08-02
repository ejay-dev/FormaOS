import { getAdminFetchConfig } from '@/app/admin/lib';
import { AlertTriangle, Shield, Lock, Activity } from 'lucide-react';
import { SecurityTabs } from '@/app/admin/components/security-tabs';

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high';
  actor_id?: string;
  target_type?: string;
  target_id?: string;
  description: string;
  timestamp: string;
  meta?: Record<string, any>;
};

type SecurityData = {
  events: SecurityEvent[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    period: string;
  };
};

async function fetchSecurity(): Promise<SecurityData | null> {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/security`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-warning/10 text-warning">
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
          Info
        </span>
      );
  }
}

export default async function AdminSecurityPage() {
  const data = await fetchSecurity();
  const events = data?.events ?? [];
  const summary = data?.summary ?? {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    period: '7d',
  };

  const highEvents = events.filter((e) => e.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every action taken through the platform console in the last 7 days.
        </p>
      </div>

      <SecurityTabs />

      {/* Alert Banner */}
      {highEvents.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive">
                {highEvents.length} high-severity event
                {highEvents.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-destructive">
                Includes account locks, org blocks, trial resets
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total events</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {summary.total}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last {summary.period}</p>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">High severity</p>
          <p className="text-2xl font-bold text-destructive mt-1">{summary.high}</p>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm text-warning">Medium</p>
          <p className="text-2xl font-bold text-warning mt-1">
            {summary.medium}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Low and info</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {summary.low}
          </p>
        </div>
      </div>

      {/* OAuth Providers */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Sign-in providers
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">OAuth 2.0 via Supabase</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-success/10 text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Connected
            </span>
          </div>
        </div>
      </section>

      {/* Recent Events */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent admin actions
        </h2>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.target_type && `${event.target_type}`}
                        {event.actor_id &&
                          ` · actor: ${event.actor_id.slice(0, 8)}…`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {getSeverityBadge(event.severity)}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p>No admin actions in the last 7 days</p>
            </div>
          )}
        </div>
      </section>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Worth doing regularly
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Read this trail for actions you did not take.</li>
          <li>Check the founder email still matches the account you use.</li>
          <li>Administer the platform from a trusted network.</li>
          <li>Deal with high-severity events the day they appear.</li>
        </ul>
      </div>
    </div>
  );
}
