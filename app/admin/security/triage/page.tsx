import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
  target_type?: string;
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

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

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

function triageRoute(event: SecurityEvent): string {
  const type = (event.event_type || '').toLowerCase();
  if (
    type.includes('billing') ||
    type.includes('payment') ||
    type.includes('subscription')
  ) {
    return '/admin/billing';
  }
  if (type.includes('trial')) {
    return '/admin/trials';
  }
  if (type.includes('user') || type.includes('auth')) {
    return '/admin/users';
  }
  if (type.includes('org') || type.includes('tenant')) {
    return '/admin/orgs';
  }
  return '/admin/security';
}

function normalizeSeverityFilter(value?: string): SeverityFilter {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'all';
}

function routeLabel(route: string): string {
  switch (route) {
    case '/admin/billing':
      return 'Billing Operations';
    case '/admin/trials':
      return 'Trial Operations';
    case '/admin/users':
      return 'Identity Operations';
    case '/admin/orgs':
      return 'Tenant Operations';
    default:
      return 'Security Operations';
  }
}

const playbook = [
  {
    title: 'Acknowledge and classify',
    detail:
      'Confirm severity and assign an owner within SLA. High-severity items should be triaged immediately.',
  },
  {
    title: 'Contain and route',
    detail:
      'Route incident to billing, trials, users, or org operations based on impact surface and event type.',
  },
  {
    title: 'Resolve and record',
    detail:
      'Complete mitigation action, then log resolution context in audit/admin streams for defensibility.',
  },
] as const;

export default async function AdminSecurityTriagePage({
  searchParams,
}: {
  searchParams?: Promise<{ severity?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await fetchSecurity();
  const events = data?.events ?? [];
  const activeFilter = normalizeSeverityFilter(resolvedSearchParams?.severity);
  const filteredEvents =
    activeFilter === 'all'
      ? events
      : events.filter((event) => event.severity === activeFilter);
  const high = events.filter((e) => e.severity === 'high');
  const medium = events.filter((e) => e.severity === 'medium');
  const routeTargets = [
    '/admin/billing',
    '/admin/trials',
    '/admin/users',
    '/admin/orgs',
    '/admin/security',
  ] as const;
  const routingMatrix = routeTargets.map((route) => ({
    route,
    label: routeLabel(route),
    count: filteredEvents.filter((event) => triageRoute(event) === route).length,
  }));
  const remediationShortcuts = routingMatrix
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Security Triage Queue
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Prioritized workflow for incident and risk response operations.
          </p>
        </div>
        <Link
          href="/admin/security"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700/60"
        >
          Security Event Stream
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-rose-800/30 bg-rose-900/10 p-4">
          <p className="text-sm text-rose-200/80">Critical Queue</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">{high.length}</p>
          <p className="mt-1 text-xs text-rose-200/70">Target SLA: 1 hour</p>
        </div>
        <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-4">
          <p className="text-sm text-amber-200/80">High Attention Queue</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">
            {medium.length}
          </p>
          <p className="mt-1 text-xs text-amber-200/70">Target SLA: same day</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Playbook Steps</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {playbook.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Standardized response</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Incident-to-Remediation Shortcuts
        </h2>
        {remediationShortcuts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {remediationShortcuts.map((shortcut) => (
              <Link
                key={shortcut.route}
                href={shortcut.route}
                className="group rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:bg-slate-800/70"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {shortcut.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-100">
                  {shortcut.count}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  open routed items
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200">
                  Open remediation queue
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
            No routed incidents for the selected filter. Adjust severity to
            inspect additional queues.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Response Playbook
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {playbook.map((step, idx) => (
            <div
              key={step.title}
              className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-4"
            >
              <div className="mb-2 inline-flex items-center gap-2 rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                <CheckCircle2 className="h-3 w-3" />
                Step {idx + 1}
              </div>
              <p className="text-sm font-semibold text-slate-100">{step.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-slate-100">
              Active Triage Items
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <Link
                key={filter}
                href={
                  filter === 'all'
                    ? '/admin/security/triage'
                    : `/admin/security/triage?severity=${filter}`
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  activeFilter === filter
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                    : 'border-slate-600/40 bg-slate-800/40 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {filter}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={triageRoute(event)}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:bg-slate-800/70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {event.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.event_type}
                    {event.target_type ? ` · ${event.target_type}` : ''}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      event.severity === 'high'
                        ? 'bg-rose-500/15 text-rose-300'
                        : event.severity === 'medium'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-slate-500/15 text-slate-300'
                    }`}
                  >
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="hidden text-xs text-slate-500 sm:inline">
                    {formatDate(event.timestamp)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-8 text-center text-slate-500">
              <Clock className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No {activeFilter === 'all' ? '' : `${activeFilter} `}triage items
              in the last 7 days.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Routing Matrix
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {routingMatrix.map((item) => (
            <Link
              key={item.route}
              href={item.route}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:bg-slate-800/70"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{item.count}</p>
              <p className="text-xs text-slate-500">items routed</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-blue-800/30 bg-blue-900/10 p-4 text-xs text-blue-100/80">
        Triage routing is based on admin event type metadata. For ambiguous
        events, route manually via Security Event Stream and record final owner.
      </div>
    </div>
  );
}
