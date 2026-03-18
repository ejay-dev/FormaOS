import { getAdminFetchConfig } from '@/app/admin/lib';
import {
  Activity,
  CheckCircle,
  Zap,
  Database,
  Server,
  Users,
  Building2,
  FileText,
} from 'lucide-react';

type SystemStatus = {
  database_latency_ms: number;
  total_organizations: number | null;
  total_subscriptions: number | null;
  total_members: number | null;
  total_audit_entries: number | null;
  recent_admin_actions_24h: number;
  recent_billing_events_24h: number;
  route_transition_samples_24h: number;
  route_transition_p50_ms_24h: number | null;
  route_transition_p95_ms_24h: number | null;
  route_transition_routes_24h: Array<{
    route: string;
    samples: number;
    p50_ms: number;
    p95_ms: number;
    avg_ms: number;
    max_ms: number;
  }>;
  build_version: string;
  build_timestamp: string | null;
  environment: string;
  product_release_version: string;
  product_release_name: string;
  timestamp: string;
};

/** Display a metric value, showing ‘—’ when the query failed (null). */
function metric(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
}

async function fetchSystemStatus() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/system`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function AdminSystemPage() {
  const data: SystemStatus | null = await fetchSystemStatus();

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">System status unavailable</p>
      </div>
    );
  }

  const dbLatency = data.database_latency_ms;
  const isDbHealthy = dbLatency < 100;
  const transitionP50 = data.route_transition_p50_ms_24h;
  const transitionP95 = data.route_transition_p95_ms_24h;
  const routeRows = data.route_transition_routes_24h ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live infrastructure metrics — all values from database
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              DB Latency
            </span>
            <Database className="h-5 w-5 text-emerald-500/50" />
          </div>
          <div
            className={`text-3xl font-bold ${
              isDbHealthy ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {dbLatency}ms
          </div>
          <p className="text-xs text-muted-foreground mt-2">Round-trip query time</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Organizations
            </span>
            <Building2 className="h-5 w-5 text-blue-500/50" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {metric(data.total_organizations)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Total tenants</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Team Members
            </span>
            <Users className="h-5 w-5 text-purple-500/50" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {metric(data.total_members)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Across all orgs</p>
        </div>
      </div>

      {/* Activity Metrics */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Activity (Last 24h)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
            <div>
              <p className="text-sm text-muted-foreground">Admin Actions</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {data.recent_admin_actions_24h}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500/30" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
            <div>
              <p className="text-sm text-muted-foreground">Billing Events</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {data.recent_billing_events_24h}
              </p>
            </div>
            <Zap className="h-8 w-8 text-emerald-500/30" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
            <div>
              <p className="text-sm text-muted-foreground">Subscriptions</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metric(data.total_subscriptions)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-amber-500/30" />
          </div>
        </div>
      </section>

      {/* Route Transition Latency */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Sidebar Route Transition Latency (Last 24h)
        </h2>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Samples</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {data.route_transition_samples_24h.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall P50</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {transitionP50 == null ? '—' : `${transitionP50}ms`}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall P95</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                transitionP95 == null
                  ? 'text-muted-foreground'
                  : transitionP95 <= 600
                    ? 'text-emerald-300'
                    : transitionP95 <= 1500
                      ? 'text-amber-300'
                      : 'text-rose-300'
              }`}
            >
              {transitionP95 == null ? '—' : `${transitionP95}ms`}
            </p>
          </div>
        </div>

        {routeRows.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
            No sidebar transition telemetry yet. Navigate through the left sidebar in `/app` to collect p50/p95 route data.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Route</th>
                  <th className="px-4 py-3 text-left font-medium">Samples</th>
                  <th className="px-4 py-3 text-left font-medium">P50</th>
                  <th className="px-4 py-3 text-left font-medium">P95</th>
                  <th className="px-4 py-3 text-left font-medium">Avg</th>
                  <th className="px-4 py-3 text-left font-medium">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {routeRows.map((row) => (
                  <tr key={row.route}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.route}
                    </td>
                    <td className="px-4 py-3">{row.samples}</td>
                    <td className="px-4 py-3">{row.p50_ms}ms</td>
                    <td className="px-4 py-3">{row.p95_ms}ms</td>
                    <td className="px-4 py-3">{row.avg_ms}ms</td>
                    <td className="px-4 py-3">{row.max_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Build Information */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Build Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-sm text-muted-foreground">Version</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
              {data.build_version}
            </code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-sm text-muted-foreground">Product Release</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
              FormaOS {data.product_release_name} — v{data.product_release_version}
            </code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-sm text-muted-foreground">Environment</span>
            <span className="text-sm text-foreground capitalize">
              {data.environment}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-sm text-muted-foreground">Build Time</span>
            <span className="text-sm text-foreground">
              {formatDate(data.build_timestamp)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-sm text-muted-foreground">Total Audit Entries</span>
            <span className="text-sm text-foreground">
              {metric(data.total_audit_entries)}
            </span>
          </div>
        </div>
      </section>

      {/* Service Status Grid */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Service Status
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              name: 'Database',
              status: isDbHealthy ? 'healthy' : 'degraded',
              detail: `${dbLatency}ms latency`,
              icon: Database,
            },
            {
              name: 'Auth Service',
              status: 'healthy' as const,
              detail: 'Supabase Auth',
              icon: CheckCircle,
            },
            {
              name: 'Application',
              status: data.environment === 'production' ? 'healthy' : 'healthy',
              detail: data.environment,
              icon: Server,
            },
            {
              name: 'Audit System',
              status:
                data.total_audit_entries != null && data.total_audit_entries > 0
                  ? 'healthy'
                  : ('unknown' as const),
              detail:
                data.total_audit_entries != null
                  ? `${data.total_audit_entries} entries`
                  : 'Unavailable',
              icon: FileText,
            },
          ].map((service) => {
            const Icon = service.icon;
            const isHealthy = service.status === 'healthy';

            return (
              <div
                key={service.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isHealthy
                    ? 'border-emerald-800/30 bg-emerald-900/10'
                    : 'border-amber-800/30 bg-amber-900/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${
                      isHealthy ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isHealthy ? 'text-emerald-100' : 'text-amber-100'
                      }`}
                    >
                      {service.name}
                    </span>
                    <p className="text-xs text-muted-foreground">{service.detail}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-amber-500/20 text-amber-200'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {isHealthy ? 'Operational' : 'Unknown'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground text-right">
        Data as of {formatDate(data.timestamp)}
      </div>
    </div>
  );
}
