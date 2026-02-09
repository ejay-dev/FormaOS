import { getAdminFetchConfig } from '@/app/admin/lib';
import { AlertTriangle, Shield, Lock, Activity } from 'lucide-react';

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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-300">
          <AlertTriangle className="h-3 w-3" />
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-300">
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-600/10 text-slate-300">
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
        <h1 className="text-3xl font-bold text-slate-100">Security</h1>
        <p className="mt-2 text-sm text-slate-400">
          Admin audit trail — actions taken through the platform console (last 7
          days)
        </p>
      </div>

      {/* Alert Banner */}
      {highEvents.length > 0 && (
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-200">
                {highEvents.length} High-Severity Event
                {highEvents.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-200/70">
                Includes account locks, org blocks, trial resets
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Total Events</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {summary.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Last {summary.period}</p>
        </div>
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4">
          <p className="text-sm text-red-300/70">High Severity</p>
          <p className="text-2xl font-bold text-red-300 mt-1">{summary.high}</p>
        </div>
        <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-4">
          <p className="text-sm text-amber-300/70">Medium</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">
            {summary.medium}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Low / Info</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {summary.low}
          </p>
        </div>
      </div>

      {/* OAuth Providers */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          OAuth Providers
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-100">Google</p>
                <p className="text-xs text-slate-500">OAuth 2.0 via Supabase</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </div>
      </section>

      {/* Recent Events */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Admin Actions
        </h2>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.target_type && `${event.target_type}`}
                        {event.actor_id &&
                          ` · actor: ${event.actor_id.slice(0, 8)}…`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {getSeverityBadge(event.severity)}
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Shield className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p>No admin actions in the last 7 days</p>
            </div>
          )}
        </div>
      </section>

      {/* Security Recommendations */}
      <div className="rounded-lg border border-blue-800/30 bg-blue-900/10 p-6">
        <h3 className="text-lg font-semibold text-blue-200 mb-4">
          Security Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-blue-100/80">
          <li>✓ Review admin audit log regularly for unusual actions</li>
          <li>✓ Ensure founder email matches expected account</li>
          <li>✓ Use VPN for platform administration</li>
          <li>✓ Monitor high-severity events immediately</li>
        </ul>
      </div>
    </div>
  );
}
