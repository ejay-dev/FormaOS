'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRealtimeSecurity } from '@/lib/hooks/use-realtime-security';

type UserRef = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type OrgRef = {
  id: string;
  name: string;
};

type EventRecord = {
  id: string;
  type: string;
  severity: string;
  created_at: string;
  user_id: string | null;
  org_id: string | null;
  ip_address: string | null;
  geo_country: string | null;
  request_path: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  user: UserRef | null;
  organization: OrgRef | null;
};

type AlertRecord = {
  id: string;
  created_at: string;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  event: EventRecord;
};

type FilterOptions = {
  users: UserRef[];
  organizations: OrgRef[];
};

type Summary = {
  openAlerts: number;
  criticalEvents: number;
  totalEvents: number;
  timeRange: string;
};

const DEFAULT_SUMMARY: Summary = {
  openAlerts: 0,
  criticalEvents: 0,
  totalEvents: 0,
  timeRange: '24h',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All alerts' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False positive' },
] as const;

const SEVERITY_OPTIONS = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
] as const;

export default function SecurityLivePage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [summary, setSummary] = useState<Summary>(DEFAULT_SUMMARY);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    users: [],
    organizations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId],
  );
  const visibleAlerts = useMemo(() => alerts.slice(0, 100), [alerts]);
  const visibleEvents = useMemo(() => events.slice(0, 40), [events]);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        range: timeRange,
        status: statusFilter,
      });

      if (severityFilter) params.set('severity', severityFilter);
      if (orgFilter) params.set('orgId', orgFilter);
      if (userFilter) params.set('userId', userFilter);

      const res = await fetch(`/api/admin/security-live?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error ?? 'Failed to load security data');
      }

      setAlerts((data.alerts ?? []) as AlertRecord[]);
      setEvents((data.events ?? []) as EventRecord[]);
      setSummary((data.summary ?? DEFAULT_SUMMARY) as Summary);
      setFilterOptions((data.filterOptions ?? { users: [], organizations: [] }) as FilterOptions);
      setError(null);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, statusFilter, severityFilter, orgFilter, userFilter]);

  const { connected } = useRealtimeSecurity(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
    { minIntervalMs: 4000 },
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (connected) return;
    const interval = setInterval(() => {
      void fetchData();
    }, 90000);
    return () => clearInterval(interval);
  }, [connected, fetchData]);

  useEffect(() => {
    if (!selectedAlertId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedAlertId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAlertId]);

  const updateAlertStatus = useCallback(
    async (alertId: string, status: string, notes?: string) => {
      try {
        const res = await fetch('/api/admin/security-live', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, status, notes }),
        });
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error ?? 'Failed to update alert');
        }
        await fetchData();
      } catch (updateError) {
        const message =
          updateError instanceof Error ? updateError.message : 'Unknown error';
        setError(message);
      }
    },
    [fetchData],
  );

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-700 bg-red-900/20 text-red-200';
      case 'high':
        return 'border-red-800 bg-red-900/10 text-red-300';
      case 'medium':
        return 'border-amber-700 bg-amber-900/10 text-amber-300';
      case 'low':
        return 'border-blue-700 bg-blue-900/10 text-blue-300';
      default:
        return 'border-slate-700 bg-slate-800/20 text-slate-300';
    }
  };

  const relativeTime = (value: string) => {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-56 animate-pulse rounded-md bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
        </div>
        <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-900/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Security Live</h1>
          <p className="mt-1 text-sm text-slate-400">
            Founder monitoring for alerts, events, and live incident response.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              connected
                ? 'border-emerald-700 bg-emerald-900/20 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            {connected ? 'Realtime connected' : 'Realtime reconnecting'}
          </span>
          <Link
            href="/admin/sessions"
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
          >
            Sessions
          </Link>
          <Link
            href="/admin/activity"
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
          >
            Activity
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-red-800/40 bg-red-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-200/80">Open Alerts</p>
              <p className="text-3xl font-bold text-red-300">{summary.openAlerts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-200/80">
                High/Critical
              </p>
              <p className="text-3xl font-bold text-amber-300">
                {summary.criticalEvents}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-400">Total Events</p>
              <p className="text-3xl font-bold text-slate-200">{summary.totalEvents}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={orgFilter}
            onChange={(event) => setOrgFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All organizations</option>
            {filterOptions.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All users</option>
            {filterOptions.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email || user.id}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Alerts</h2>
        {alerts.length > visibleAlerts.length && (
          <p className="mb-3 text-xs text-slate-400">
            Showing {visibleAlerts.length} most recent alerts.
          </p>
        )}
        <div className="space-y-3">
          {visibleAlerts.length ? (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${getSeverityClass(alert.event.severity)}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold capitalize">
                        {alert.event.type.replaceAll('_', ' ')}
                      </span>
                      <span className="rounded bg-slate-900/40 px-2 py-0.5 text-xs font-medium capitalize">
                        {alert.event.severity}
                      </span>
                      <span className="rounded bg-slate-900/40 px-2 py-0.5 text-xs font-medium capitalize">
                        {alert.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">
                      {alert.event.user?.email ||
                        alert.event.user?.full_name ||
                        alert.event.user_id ||
                        'Unknown user'}
                      {alert.event.organization?.name
                        ? ` • ${alert.event.organization.name}`
                        : ''}
                    </p>
                    <p className="text-sm opacity-80">
                      IP: {alert.event.ip_address ?? 'n/a'}
                      {alert.event.geo_country ? ` (${alert.event.geo_country})` : ''}
                      {alert.event.request_path ? ` • ${alert.event.request_path}` : ''}
                    </p>
                    <p className="text-xs opacity-70">
                      Event: {relativeTime(alert.event.created_at)} • Alert:{' '}
                      {relativeTime(alert.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAlertId(alert.id)}
                      className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Details
                    </button>
                    {alert.status === 'open' && (
                      <button
                        onClick={() => void updateAlertStatus(alert.id, 'acknowledged')}
                        className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                      >
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Acknowledge
                        </span>
                      </button>
                    )}
                    {alert.status !== 'resolved' && alert.status !== 'false_positive' && (
                      <button
                        onClick={() => void updateAlertStatus(alert.id, 'resolved', 'Resolved in dashboard')}
                        className="rounded-lg border border-emerald-700 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/30"
                      >
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Resolve
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 py-12 text-center text-slate-400">
              No alerts found for current filters.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Recent Events</h2>
        {events.length > visibleEvents.length && (
          <p className="mb-3 text-xs text-slate-400">
            Showing {visibleEvents.length} most recent events.
          </p>
        )}
        <div className="space-y-2">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-800/70 bg-slate-900/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium capitalize text-slate-200">
                  {event.type.replaceAll('_', ' ')}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {event.user?.email || event.user?.full_name || event.user_id || 'Unknown user'}
                  {event.organization?.name ? ` • ${event.organization.name}` : ''}
                  {event.request_path ? ` • ${event.request_path}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${getSeverityClass(
                    event.severity,
                  )}`}
                >
                  {event.severity}
                </span>
                <span className="text-xs text-slate-500">
                  {relativeTime(event.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-alert-dialog-title"
            className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 id="security-alert-dialog-title" className="text-xl font-semibold text-slate-100">
                  Alert Details
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedAlert.event.type.replaceAll('_', ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedAlertId(null)}
                className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-400">Status</p>
                <p className="font-medium capitalize text-slate-100">
                  {selectedAlert.status.replaceAll('_', ' ')}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-400">Timeline</p>
                <p className="text-slate-200">
                  Event raised: {new Date(selectedAlert.event.created_at).toLocaleString()}
                </p>
                <p className="text-slate-200">
                  Alert created: {new Date(selectedAlert.created_at).toLocaleString()}
                </p>
                {selectedAlert.resolved_at && (
                  <p className="text-slate-200">
                    Resolved: {new Date(selectedAlert.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-400">Request Context</p>
                <p className="text-slate-200">
                  IP: {selectedAlert.event.ip_address ?? 'n/a'}
                </p>
                <p className="text-slate-200">
                  Geo: {selectedAlert.event.geo_country ?? 'n/a'}
                </p>
                <p className="text-slate-200">
                  Route: {selectedAlert.event.request_path ?? 'n/a'}
                </p>
                <p className="mt-2 break-all text-xs text-slate-500">
                  UA: {selectedAlert.event.user_agent ?? 'n/a'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-400">Metadata</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-slate-300">
                  {JSON.stringify(selectedAlert.event.metadata ?? {}, null, 2)}
                </pre>
              </div>
              {selectedAlert.notes && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400">Notes</p>
                  <p className="text-slate-200">{selectedAlert.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
