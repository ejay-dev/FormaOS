/**
 * Incidents Page
 * List and manage incidents with filtering and export
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  AlertTriangle,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import { SeverityBadge } from '@/components/care/severity-badge';
import {
  RecordCard,
  RecordList,
  EmptyRecordState,
} from '@/components/mobile/record-card';

const INCIDENTS_PAGE_SIZE = 100;

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    severity?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? '').trim();
  const qLower = q.toLowerCase();
  const statusFilter = (params.status ?? '').trim().toLowerCase();
  const severityFilter = (params.severity ?? '').trim().toLowerCase();
  const hasFilters =
    q.length > 0 || statusFilter.length > 0 || severityFilter.length > 0;

  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const { organization } = systemState;
  const supabase = await createSupabaseServerClient();

  // Hero metrics are org-wide counts, deliberately independent of the
  // filters and of the row window below.
  const orgIncidents = () =>
    supabase
      .from('org_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id);

  const [
    { data: incidents, error },
    { count: totalCount },
    { count: openCount },
    { count: resolvedCount },
    { count: criticalCount },
    { count: followUpCount },
  ] = await Promise.all([
    supabase
      .from('org_incidents')
      .select(
        `
      id,
      severity,
      status,
      incident_type,
      description,
      occurred_at,
      resolved_at,
      location,
      follow_up_required,
      follow_up_due_date,
      created_at,
      patient:patient_id (
        id,
        full_name
      )
    `,
      )
      .eq('organization_id', organization.id)
      .order('occurred_at', { ascending: false })
      .limit(INCIDENTS_PAGE_SIZE),
    orgIncidents(),
    orgIncidents().eq('status', 'open'),
    orgIncidents().eq('status', 'resolved'),
    orgIncidents().in('severity', ['critical', 'high']),
    orgIncidents().eq('follow_up_required', true).is('resolved_at', null),
  ]);

  if (error) {
    console.error('[IncidentsPage] Error fetching incidents:', error);
  }
  const fetchErrorMessage = error?.message ?? null;

  type Incident = NonNullable<typeof incidents>[number];
  const incidentRows = (incidents ?? []) as Incident[];
  const filteredIncidents = incidentRows.filter((incident: Incident) => {
    if (statusFilter && incident.status.toLowerCase() !== statusFilter)
      return false;
    if (severityFilter && incident.severity.toLowerCase() !== severityFilter)
      return false;
    if (!qLower) return true;

    const patientName = (
      (incident.patient as { full_name?: string } | null)?.full_name ?? ''
    ).toLowerCase();
    const description = (incident.description ?? '').toLowerCase();
    const incidentType = (incident.incident_type ?? '').toLowerCase();
    const location = (incident.location ?? '').toLowerCase();

    return (
      patientName.includes(qLower) ||
      description.includes(qLower) ||
      incidentType.includes(qLower) ||
      location.includes(qLower)
    );
  });

  const stats = {
    total: totalCount ?? 0,
    open: openCount ?? 0,
    resolved: resolvedCount ?? 0,
    critical: criticalCount ?? 0,
    pendingFollowUp: followUpCount ?? 0,
  };

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: stats.total, sub: 'incidents on record' },
    {
      label: 'Open',
      value: stats.open,
      sub: stats.open > 0 ? 'awaiting' : 'all closed',
      tone: stats.open > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      sub: stats.resolved > 0 ? 'closed' : 'none yet',
      tone: 'success',
    },
    {
      label: 'Critical or high',
      value: stats.critical,
      sub: stats.critical > 0 ? 'by severity' : 'none recorded',
      tone: stats.critical > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Follow-up',
      value: stats.pendingFollowUp,
      sub: stats.pendingFollowUp > 0 ? 'pending' : 'none pending',
      tone: stats.pendingFollowUp > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow="Governance · Incidents"
        title="Incidents"
        titleTestId="incidents-title"
        subtitle="Report, track, and manage incidents."
        metrics={heroMetrics}
        actions={
          <>
            <Link
              href="/api/incidents/export"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              data-testid="export-incidents-btn"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Link>
            <Link
              href="/app/incidents/new"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
              data-testid="report-incident-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              Report
            </Link>
          </>
        }
      />

      <div className="page-content space-y-4">
        {fetchErrorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Incident data could not be loaded. {fetchErrorMessage}
          </div>
        ) : null}

        {/* Search and Filter */}
        <form method="GET" className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search incidents..."
              aria-label="Search incidents"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            aria-label="Filter by status"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            name="severity"
            defaultValue={severityFilter}
            aria-label="Filter by severity"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            type="submit"
            className="inline-flex min-h-[44px] md:min-h-0 items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/app/incidents"
              className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center px-4 py-2 rounded-lg border border-transparent text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </Link>
          ) : null}
        </form>

        <p className="text-xs text-muted-foreground">
          Showing {filteredIncidents.length} of {stats.total} incidents
          {stats.total > INCIDENTS_PAGE_SIZE
            ? `, newest ${INCIDENTS_PAGE_SIZE} loaded`
            : ''}
          .
        </p>

        {/* Mobile cards */}
        <div className="md:hidden">
          {filteredIncidents.length === 0 ? (
            <EmptyRecordState
              title="No incidents reported"
              description="Reported incidents and follow-ups will surface here."
            />
          ) : (
            <RecordList>
              {filteredIncidents.map((incident: Incident) => {
                const clientName =
                  (incident.patient as { full_name?: string } | null)
                    ?.full_name || null;
                return (
                  <RecordCard
                    key={incident.id}
                    href={`/app/incidents/${incident.id}`}
                    title={
                      incident.incident_type?.replace('_', ' ') || 'General'
                    }
                    subtitle={clientName ?? formatDate(incident.occurred_at)}
                    status={
                      <SeverityBadge level={incident.severity} size="sm" />
                    }
                    meta={[
                      {
                        label: 'Status',
                        value: (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              incident.status === 'resolved'
                                ? 'text-success'
                                : 'text-warning'
                            }`}
                          >
                            {incident.status === 'resolved' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {incident.status}
                          </span>
                        ),
                      },
                      ...(clientName
                        ? [{ label: 'Client', value: clientName }]
                        : []),
                      {
                        label: 'When',
                        value: formatDate(incident.occurred_at),
                      },
                      ...(incident.follow_up_required
                        ? [
                            {
                              label: 'Follow-up',
                              value: (
                                <span className="text-warning">
                                  {incident.follow_up_due_date || 'TBD'}
                                </span>
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />
                );
              })}
            </RecordList>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table
                className="min-w-[480px] w-full"
                data-testid="incidents-table"
              >
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Severity
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                      Client
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                      Occurred
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden xl:table-cell">
                      Follow-up
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIncidents.map((incident: Incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <SeverityBadge level={incident.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">
                          {incident.incident_type?.replace('_', ' ') ||
                            'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-medium">
                          {(incident.patient as { full_name?: string } | null)
                            ?.full_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm">
                          {formatDate(incident.occurred_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            incident.status === 'resolved'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {incident.status === 'resolved' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {incident.follow_up_required ? (
                          <span className="text-sm text-warning">
                            Due: {incident.follow_up_due_date || 'TBD'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/incidents/${incident.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredIncidents.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        {hasFilters ? (
                          <>
                            <p>No incidents matched your filters</p>
                            <Link
                              href="/app/incidents"
                              className="text-primary hover:underline mt-2 inline-block"
                            >
                              Clear filters
                            </Link>
                          </>
                        ) : (
                          <>
                            <p>No incidents reported</p>
                            <p className="text-sm mt-1">
                              Incidents will appear here when reported
                            </p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
