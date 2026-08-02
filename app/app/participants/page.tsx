/**
 * Participants/Clients/Patients Page
 * Industry-aware naming: NDIS=Participants, Healthcare=Patients, Aged Care=Residents
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { ParticipantsEmptyState } from '@/components/empty-states';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { buildOrSearch } from '@/lib/utils/postgrest-search';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import {
  SeverityBadge,
  severityLabel,
  severityTextClass,
} from '@/components/care/severity-badge';
import {
  RecordCard,
  RecordList,
} from '@/components/mobile/record-card';
import { logAuditEvent } from '@/app/app/actions/audit-events';

const PARTICIPANTS_PAGE_SIZE = 50;

// Get industry-appropriate label
function getEntityLabel(industry: string | null): {
  singular: string;
  plural: string;
} {
  switch (industry) {
    case 'ndis':
      return { singular: 'Participant', plural: 'Participants' };
    case 'healthcare':
      return { singular: 'Patient', plural: 'Patients' };
    case 'aged_care':
      return { singular: 'Resident', plural: 'Residents' };
    default:
      return { singular: 'Client', plural: 'Clients' };
  }
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    risk?: string;
    page?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? '').trim();
  const statusFilter = (params.status ?? '').trim();
  const riskFilter = (params.risk ?? '').trim();
  const pageParam = parseInt((params.page ?? '1').trim(), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (page - 1) * PARTICIPANTS_PAGE_SIZE;
  const hasFilters =
    q.length > 0 || statusFilter.length > 0 || riskFilter.length > 0;

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=participants-page');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;
  const industry = systemState.organization.industry;

  const labels = getEntityLabel(industry);

  // Fetch participants/patients
  let participants: any[] | null = null;
  try {
    let query = supabase
      .from('org_patients')
      .select(
        `
        id,
        full_name,
        preferred_name,
        external_id,
        date_of_birth,
        care_status,
        risk_level,
        emergency_flag,
        phone,
        email,
        ndis_number,
        funding_type,
        primary_diagnosis,
        created_at
      `,
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PARTICIPANTS_PAGE_SIZE - 1);

    const orPredicate = buildOrSearch(
      ['full_name', 'preferred_name', 'external_id', 'ndis_number'],
      q,
    );
    if (orPredicate) {
      query = query.or(orPredicate);
    }
    if (statusFilter) {
      query = query.eq('care_status', statusFilter);
    }
    if (riskFilter) {
      query = query.eq('risk_level', riskFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ParticipantsPage] Error fetching participants:', error);
    } else {
      participants = data;
    }
  } catch (err) {
    console.error('[ParticipantsPage] Error in query:', err);
  }

  // v4-027: HIPAA §164.312(b) read-event audit. The list selects DOB,
  // diagnosis, NDIS number, contact — every render is a PHI read.
  // Fire-and-forget so a slow audit insert never delays the page.
  // Records the count + filters, not the actual PHI rows.
  void logAuditEvent({
    organizationId: orgId,
    actorUserId: systemState.user.id,
    actorRole: systemState.role ?? null,
    entityType: 'patient',
    entityId: null,
    actionType: 'PATIENT_LIST_VIEWED',
    afterState: {
      view: 'list',
      participants_loaded: participants?.length ?? 0,
      filters: {
        q: q || null,
        status: statusFilter || null,
        risk: riskFilter || null,
      },
    },
    reason: 'phi_read',
  }).catch(() => {});

  type Participant = NonNullable<typeof participants>[number];

  // Hero metrics count the whole organisation, not the current page or the
  // active filters — otherwise 'Total' reports the page size.
  const orgParticipants = () =>
    supabase
      .from('org_patients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

  const [
    { count: totalCount },
    { count: activeCount },
    { count: highRiskCount },
    { count: emergencyCount },
  ] = await Promise.all([
    orgParticipants(),
    orgParticipants().eq('care_status', 'active'),
    orgParticipants().in('risk_level', ['high', 'critical']),
    orgParticipants().eq('emergency_flag', true),
  ]);

  const stats = {
    total: totalCount ?? 0,
    active: activeCount ?? 0,
    highRisk: highRiskCount ?? 0,
    emergency: emergencyCount ?? 0,
  };

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: stats.total, sub: labels.plural.toLowerCase() },
    {
      label: 'Active',
      value: stats.active,
      sub: stats.active > 0 ? 'in care' : 'none active',
      tone: 'success',
    },
    {
      label: 'High Risk',
      value: stats.highRisk,
      sub: stats.highRisk > 0 ? 'needs review' : 'all stable',
      tone: stats.highRisk > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Emergency',
      value: stats.emergency,
      sub: stats.emergency > 0 ? 'flagged' : 'none flagged',
      tone: stats.emergency > 0 ? 'danger' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <OnboardingBanner stepId="log-progress-note" />

      <PageHero
        eyebrow={`Care Operations · ${labels.plural}`}
        title={labels.plural}
        titleTestId="participants-title"
        subtitle={`Manage ${labels.plural.toLowerCase()} and their care records.`}
        metrics={heroMetrics}
        actions={
          <Link
            href="/app/participants/new"
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
            data-testid="add-participant-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {labels.singular}
          </Link>
        }
      />

      <div className="page-content space-y-4">
        {/* Search and Filter */}
        <form className="flex flex-col lg:flex-row gap-3" method="GET">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              placeholder={`Search ${labels.plural.toLowerCase()}...`}
              defaultValue={q}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
              data-testid="search-participants"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="discharged">Discharged</option>
          </select>
          <select
            name="risk"
            defaultValue={riskFilter}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            type="submit"
            className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/app/participants"
              className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center px-4 py-2 rounded-lg border border-transparent text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </Link>
          ) : null}
        </form>

        <p className="text-xs text-muted-foreground">
          Showing {participants?.length ?? 0} of {stats.total}{' '}
          {labels.plural.toLowerCase()}
          {page > 1 ? ` · page ${page}` : ''}.
        </p>

        {/* Mobile cards */}
        <div className="md:hidden">
          {participants && participants.length > 0 ? (
            <RecordList>
              {participants.map((participant: Participant) => {
                const idValue =
                  participant.external_id || participant.ndis_number || null;
                return (
                  <RecordCard
                    key={participant.id}
                    href={`/app/participants/${participant.id}`}
                    title={
                      <span className="flex items-center gap-2">
                        {participant.emergency_flag && (
                          <span
                            className="flex h-2 w-2 rounded-full bg-destructive"
                            aria-label="Emergency flag"
                          />
                        )}
                        {participant.full_name}
                      </span>
                    }
                    subtitle={
                      participant.preferred_name
                        ? `Prefers ${participant.preferred_name}`
                        : undefined
                    }
                    status={
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          participant.care_status === 'active'
                            ? 'bg-success/10 text-success'
                            : participant.care_status === 'paused'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {participant.care_status}
                      </span>
                    }
                    meta={[
                      {
                        label: 'Risk',
                        value: (
                          <span
                            className={severityTextClass(
                              participant.risk_level,
                            )}
                          >
                            {severityLabel(participant.risk_level)}
                          </span>
                        ),
                      },
                      ...(idValue
                        ? [
                            {
                              label: 'ID',
                              value: (
                                <span className="tabular-nums">{idValue}</span>
                              ),
                            },
                          ]
                        : []),
                      ...(participant.funding_type
                        ? [
                            {
                              label: 'Funding',
                              value: String(
                                participant.funding_type,
                              ).toUpperCase(),
                            },
                          ]
                        : []),
                    ]}
                  />
                );
              })}
            </RecordList>
          ) : (
            <ParticipantsEmptyState />
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table
                className="min-w-[480px] w-full"
                data-testid="participants-table"
              >
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                      Risk
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden xl:table-cell">
                      Funding
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants?.map((participant: Participant) => (
                    <tr
                      key={participant.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {participant.emergency_flag && (
                            <span
                              className="flex h-2 w-2 rounded-full bg-destructive"
                              title="Emergency flag"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {participant.full_name}
                            </p>
                            {participant.preferred_name && (
                              <p className="text-sm text-muted-foreground">
                                Prefers {participant.preferred_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {participant.external_id ||
                            participant.ndis_number ||
                            '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            participant.care_status === 'active'
                              ? 'bg-success/10 text-success'
                              : participant.care_status === 'paused'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {participant.care_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <SeverityBadge level={participant.risk_level} />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {participant.funding_type?.toUpperCase() || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/participants/${participant.id}`}
                          className="text-sm text-primary hover:underline"
                          data-testid={`view-participant-${participant.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!participants || participants.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <ParticipantsEmptyState
                          industry={industry as 'ndis' | 'healthcare' | 'aged_care' | 'childcare' | null}
                          filtered={hasFilters}
                        />
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
