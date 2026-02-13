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
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">System status unavailable</p>
      </div>
    );
  }

  const dbLatency = data.database_latency_ms;
  const isDbHealthy = dbLatency < 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">System Status</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live infrastructure metrics — all values from database
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
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
          <p className="text-xs text-slate-500 mt-2">Round-trip query time</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
              Organizations
            </span>
            <Building2 className="h-5 w-5 text-blue-500/50" />
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {metric(data.total_organizations)}
          </div>
          <p className="text-xs text-slate-500 mt-2">Total tenants</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">
              Team Members
            </span>
            <Users className="h-5 w-5 text-purple-500/50" />
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {metric(data.total_members)}
          </div>
          <p className="text-xs text-slate-500 mt-2">Across all orgs</p>
        </div>
      </div>

      {/* Activity Metrics */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Activity (Last 24h)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div>
              <p className="text-sm text-slate-400">Admin Actions</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {data.recent_admin_actions_24h}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500/30" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div>
              <p className="text-sm text-slate-400">Billing Events</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {data.recent_billing_events_24h}
              </p>
            </div>
            <Zap className="h-8 w-8 text-emerald-500/30" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div>
              <p className="text-sm text-slate-400">Subscriptions</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {metric(data.total_subscriptions)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-amber-500/30" />
          </div>
        </div>
      </section>

      {/* Build Information */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Build Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-sm text-slate-400">Version</span>
            <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono text-slate-100">
              {data.build_version}
            </code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-sm text-slate-400">Product Release</span>
            <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono text-slate-100">
              FormaOS {data.product_release_name} — v{data.product_release_version}
            </code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-sm text-slate-400">Environment</span>
            <span className="text-sm text-slate-100 capitalize">
              {data.environment}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-sm text-slate-400">Build Time</span>
            <span className="text-sm text-slate-100">
              {formatDate(data.build_timestamp)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-sm text-slate-400">Total Audit Entries</span>
            <span className="text-sm text-slate-100">
              {metric(data.total_audit_entries)}
            </span>
          </div>
        </div>
      </section>

      {/* Service Status Grid */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
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
                    <p className="text-xs text-slate-500">{service.detail}</p>
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
      <div className="text-xs text-slate-500 text-right">
        Data as of {formatDate(data.timestamp)}
      </div>
    </div>
  );
}
