import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import { ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { SecurityTabs } from '@/app/admin/components/security-tabs';

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
  return new Intl.DateTimeFormat('en-AU', {
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
      return 'Billing';
    case '/admin/trials':
      return 'Trials';
    case '/admin/users':
      return 'Users';
    case '/admin/orgs':
      return 'Organizations';
    default:
      return 'Security';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

const FILTERS: Array<{ value: SeverityFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const playbook = [
  {
    title: 'Acknowledge and classify',
    detail:
      'Confirm the severity is right. Anything marked high should be looked at before you close the console.',
  },
  {
    title: 'Contain and route',
    detail:
      'Open the destination the event routes to — billing, trials, users or organizations — and make the corrective change there.',
  },
  {
    title: 'Resolve and record',
    detail:
      'Finish the fix, then note what happened in the audit stream so the record stands up later.',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin events from the last 7 days, ordered so the urgent ones are
          dealt with first.
        </p>
      </div>

      <SecurityTabs />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">High severity</p>
          <p className="mt-1 text-2xl font-bold text-destructive">
            {high.length}
          </p>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm text-warning">Medium severity</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {medium.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">All events</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {events.length}
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Events to work through
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {FILTERS.map((filter) => (
              <Link
                key={filter.value}
                href={
                  filter.value === 'all'
                    ? '/admin/security/triage'
                    : `/admin/security/triage?severity=${filter.value}`
                }
                aria-current={
                  activeFilter === filter.value ? 'true' : undefined
                }
                className={`text-sm transition-colors ${
                  activeFilter === filter.value
                    ? 'font-medium text-foreground underline underline-offset-4'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter.label}
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
                className="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-4 py-3 transition-colors hover:bg-muted/70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {event.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.event_type}
                    {event.target_type ? ` · ${event.target_type}` : ''}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      event.severity === 'high'
                        ? 'bg-destructive/10 text-destructive'
                        : event.severity === 'medium'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {severityLabel(event.severity)}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {formatDate(event.timestamp)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-surface-1 px-4 py-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No {activeFilter === 'all' ? '' : `${activeFilter} `}triage items
              in the last 7 days.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Where these events route
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Routing is inferred from the event type. Ambiguous events land under
          Security — open them from the audit trail and act manually.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {routingMatrix.map((item) => (
            <Link
              key={item.route}
              href={item.route}
              className="rounded-lg border border-border bg-surface-1 px-4 py-3 transition-colors hover:bg-muted/70"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">events routed</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          How to work an incident
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {playbook.map((step) => (
            <div
              key={step.title}
              className="rounded-lg border border-border bg-surface-1 p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {step.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
