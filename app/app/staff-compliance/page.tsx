/**
 * Staff Compliance / Credentials Page
 * Track staff qualifications, checks, and expiry dates
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Shield,
  AlertTriangle,
  User,
  Calendar,
  Download,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import {
  RecordCard,
  RecordList,
} from '@/components/mobile/record-card';
import {
  StatusBadge,
  certificateExpiry,
} from '@/components/compliance/StatusBadge';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Rows within a month of lapsing (or already lapsed) are tinted. */
function needsAttention(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000,
  );
  return days <= 30;
}

function getCredentialLabel(industry: string | null): string {
  switch (industry) {
    case 'healthcare':
      return 'Staff Credentials';
    default:
      return 'Staff Compliance';
  }
}

const CREDENTIAL_TYPES = {
  wwcc: 'Working With Children Check',
  police_check: 'Police Check',
  ndis_screening: 'NDIS Worker Screening',
  first_aid: 'First Aid Certificate',
  cpr: 'CPR Certificate',
  manual_handling: 'Manual Handling',
  medication_cert: 'Medication Certificate',
  drivers_license: "Driver's License",
  vaccination: 'Vaccination Record',
  other: 'Other',
};

export default async function StaffCompliancePage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const { organization } = systemState;
  const label = getCredentialLabel(organization.industry);
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // Fetch staff credentials
  const { data: credentials, error } = await supabase
    .from('org_staff_credentials')
    .select(
      `
      id,
      user_id,
      credential_type,
      credential_name,
      credential_number,
      issuing_authority,
      issue_date,
      expiry_date,
      status,
      verified_at,
      created_at
    `,
    )
    .eq('organization_id', organization.id)
    .order('expiry_date', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[StaffCompliancePage] Error fetching credentials:', error);
  }

  // Calculate stats
  type CredentialRow = NonNullable<typeof credentials>[number];
  type Credential = CredentialRow & {
    staff: { displayName?: string | null } | null;
  };

  const credentialRows = (credentials ?? []) as CredentialRow[];
  const staffIds = Array.from(
    new Set(
      credentialRows
        .map((credential) => credential.user_id as string | null | undefined)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const { data: staffProfiles } = staffIds.length
    ? await admin
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', staffIds)
    : { data: [] as { user_id?: string | null; full_name?: string | null }[] };
  const staffDisplayNameById = new Map(
    (
      (staffProfiles as
        | { user_id?: string | null; full_name?: string | null }[]
        | null) ?? []
    ).map((profile) => [
      profile.user_id ?? '',
      profile.full_name?.trim() || null,
    ]),
  );
  const enrichedCredentials: Credential[] = credentialRows.map(
    (credential) => ({
      ...credential,
      staff: credential.user_id
        ? {
            displayName:
              staffDisplayNameById.get(credential.user_id as string) ?? null,
          }
        : null,
    }),
  );
  const credentialIds = enrichedCredentials.map((credential) => credential.id);
  const { data: evidenceRows } = credentialIds.length
    ? await admin
        .from('org_evidence')
        .select('entity_id')
        .eq('organization_id', organization.id)
        .eq('entity_type', 'staff_credential')
        .in('entity_id', credentialIds)
    : { data: [] as { entity_id?: string | null }[] };
  const evidenceCountByCredential = new Map<string, number>();
  for (const row of evidenceRows ?? []) {
    const entityId = row.entity_id as string | null | undefined;
    if (!entityId) continue;
    evidenceCountByCredential.set(
      entityId,
      (evidenceCountByCredential.get(entityId) ?? 0) + 1,
    );
  }
  const now = new Date();
  const stats = {
    total: enrichedCredentials.length,
    verified: enrichedCredentials.filter(
      (c: Credential) => c.status === 'verified',
    ).length,
    expiringSoon: enrichedCredentials.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      const daysUntil = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntil > 0 && daysUntil <= 30;
    }).length,
    expired: enrichedCredentials.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      return new Date(c.expiry_date) < now;
    }).length,
  };

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: stats.total, sub: 'credentials' },
    {
      label: 'Verified',
      value: stats.verified,
      sub: stats.verified > 0 ? 'confirmed' : 'none yet',
      tone: 'success',
    },
    {
      label: 'Expiring',
      value: stats.expiringSoon,
      sub: stats.expiringSoon > 0 ? 'within 30 days' : 'none soon',
      tone: stats.expiringSoon > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Expired',
      value: stats.expired,
      sub: stats.expired > 0 ? 'past due' : 'none expired',
      tone: stats.expired > 0 ? 'danger' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow={`Workforce · ${label}`}
        title={label}
        titleTestId="staff-compliance-title"
        subtitle="Track staff qualifications, checks, and expiry dates."
        metrics={heroMetrics}
        actions={
          <>
            <Link
              href="/api/staff-credentials/export"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Link>
            <Link
              href="/app/staff-compliance/new"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
              data-testid="add-credential-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Link>
          </>
        }
      />

      <div className="page-content space-y-4">
        {/* Says which surface owns the record, so the renewals view is not
            mistaken for a second register. */}
        <p className="text-sm text-muted-foreground">
          Every staff qualification, check and certificate is recorded here.{' '}
          <Link
            href="/app/certificates"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Certificate renewals
          </Link>{' '}
          lists only the ones lapsing in the next 90 days.
        </p>

        {/* Alert for expiring/expired */}
        {(stats.expiringSoon > 0 || stats.expired > 0) && (
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {stats.expired > 0 && `${stats.expired} expired. `}
              {stats.expiringSoon > 0 && `${stats.expiringSoon} expiring soon.`}
            </span>
          </div>
        )}

        {/* Mobile cards */}
        <div className="md:hidden">
          <RecordList>
            {enrichedCredentials.map((credential: Credential) => {
              const evidenceCount =
                evidenceCountByCredential.get(credential.id) ?? 0;
              const staffName =
                (credential.staff as { displayName?: string } | null)
                  ?.displayName || '—';
              const credentialTitle =
                CREDENTIAL_TYPES[
                  credential.credential_type as keyof typeof CREDENTIAL_TYPES
                ] || credential.credential_name;
              return (
                <RecordCard
                  key={credential.id}
                  href={`/app/staff-compliance/${credential.id}`}
                  title={credentialTitle}
                  subtitle={staffName}
                  status={
                    <StatusBadge {...certificateExpiry(credential.expiry_date)} />
                  }
                  meta={[
                    {
                      label: 'Expires',
                      value: formatDate(credential.expiry_date),
                    },
                    ...(credential.credential_number
                      ? [
                          {
                            label: 'No.',
                            value: (
                              <span className="font-mono">
                                {credential.credential_number}
                              </span>
                            ),
                          },
                        ]
                      : []),
                    {
                      label: 'Evidence',
                      value: (
                        <span
                          className={
                            evidenceCount > 0
                              ? 'text-success'
                              : 'text-warning'
                          }
                        >
                          {evidenceCount} file{evidenceCount === 1 ? '' : 's'}
                        </span>
                      ),
                    },
                  ]}
                />
              );
            })}
          </RecordList>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table
                className="min-w-[700px] w-full"
                data-testid="staff-credentials-table"
              >
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Staff Member
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Credential
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                      Number
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                      Issued
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Expiry
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Evidence
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrichedCredentials.map((credential: Credential) => {
                    const evidenceCount =
                      evidenceCountByCredential.get(credential.id) ?? 0;
                    return (
                      <tr
                        key={credential.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          needsAttention(credential.expiry_date)
                            ? 'bg-destructive/5'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {(
                                credential.staff as {
                                  displayName?: string;
                                } | null
                              )?.displayName || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {CREDENTIAL_TYPES[
                              credential.credential_type as keyof typeof CREDENTIAL_TYPES
                            ] || credential.credential_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm font-mono text-muted-foreground">
                            {credential.credential_number || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm">
                            {formatDate(credential.issue_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(credential.expiry_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            {...certificateExpiry(credential.expiry_date)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              evidenceCount > 0
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            }`}
                          >
                            {evidenceCount} file{evidenceCount === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/app/staff-compliance/${credential.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedCredentials.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No credentials tracked yet</p>
                        <Link
                          href="/app/staff-compliance/new"
                          className="text-primary hover:underline mt-2 inline-block"
                        >
                          Add your first credential
                        </Link>
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
