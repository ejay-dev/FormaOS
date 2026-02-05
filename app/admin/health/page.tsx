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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getEventIcon(eventType: string) {
  if (eventType?.includes('error') || eventType?.includes('failed')) {
    return <AlertCircle className="h-4 w-4 text-red-400" />;
  }
  if (eventType?.includes('success') || eventType?.includes('completed')) {
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  }
  return <Activity className="h-4 w-4 text-slate-400" />;
}

export default async function AdminHealthPage() {
  const data = await fetchHealth();

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Health checks unavailable</p>
      </div>
    );
  }

  const billingEvents = data.billingEvents ?? [];
  const adminAudit = data.adminAudit ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">System Health</h1>
        <p className="mt-2 text-sm text-slate-400">
          Platform operational status and recent system events
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">All Systems</p>
              <p className="text-xs text-slate-500">Operational</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">Last Check</p>
              <p className="text-xs text-slate-500">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Events */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Billing Events
        </h2>
        <div className="space-y-2">
          {billingEvents.length > 0 ? (
            billingEvents.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getEventIcon(event.event_type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300 truncate">
                      {event.event_type}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 ml-4 whitespace-nowrap">
                  {formatDate(event.processed_at)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Activity className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p className="text-sm">No recent billing events</p>
            </div>
          )}
        </div>
      </section>

      {/* Admin Activity */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Admin Activity
        </h2>
        <div className="space-y-2">
          {adminAudit.length > 0 ? (
            adminAudit.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getEventIcon(event.action)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300 truncate">
                      {event.action} ·{' '}
                      <span className="text-slate-500">
                        {event.target_type}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 ml-4 whitespace-nowrap">
                  {formatDate(event.created_at)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Activity className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p className="text-sm">No admin events yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
