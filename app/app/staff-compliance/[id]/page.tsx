import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { verifyStaffCredential } from '@/app/app/actions/care-operations';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  FileText,
  ShieldAlert,
  User,
} from 'lucide-react';
import { EntityEvidencePanel } from '@/components/compliance/EntityEvidencePanel';
import {
  StatusBadge,
  certificateExpiry,
  evidenceStatus,
} from '@/components/compliance/StatusBadge';
import {
  getOrgMemberIdentities,
  type MemberIdentityMap,
} from '@/lib/team/member-identity';

function formatDate(value: string | null | undefined): string {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

type CredentialRow = {
  id: string;
  credential_type: string;
  credential_name: string;
  credential_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  staff: { id: string; name: string | null } | null;
};

export default async function StaffCredentialDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const credentialId = resolvedParams?.id ?? '';
  if (!credentialId) redirect('/app/staff-compliance');

  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');
  const orgId = systemState.organization.id;

  const supabase = await createSupabaseServerClient();
  // Plain select — `staff:user_id(...)` would need an FK that the
  // production schema doesn't declare. Resolve the staff profile in a
  // separate query.
  const { data: credentialData } = await supabase
    .from('org_staff_credentials')
    .select(
      `
      id,
      credential_type,
      credential_name,
      credential_number,
      issuing_authority,
      issue_date,
      expiry_date,
      status,
      verified_at,
      verified_by,
      notes,
      created_at,
      user_id
    `,
    )
    .eq('organization_id', orgId)
    .eq('id', credentialId)
    .maybeSingle();

  if (!credentialData) notFound();

  const { data: staffRow } = credentialData.user_id
    ? await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('user_id', credentialData.user_id)
        .maybeSingle()
    : { data: null };

  const credential: CredentialRow = {
    ...(credentialData as Omit<CredentialRow, 'staff'>),
    staff: staffRow
      ? {
          id: staffRow.user_id as string,
          name: (staffRow.full_name as string | null) ?? null,
        }
      : null,
  };
  const { count: evidenceCount } = await supabase
    .from('org_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('entity_type', 'staff_credential')
    .eq('entity_id', credential.id);

  const verifyAction = async () => {
    'use server';
    await verifyStaffCredential(credential.id);
  };
  const actorRole = String(systemState.role);
  const isVerified = credential.status === 'verified';
  const hasVerifierRole =
    actorRole === 'owner' ||
    actorRole === 'admin' ||
    actorRole === 'compliance_officer';
  const canVerify = !isVerified && hasVerifierRole && (evidenceCount ?? 0) > 0;

  const identities: MemberIdentityMap = isVerified
    ? await getOrgMemberIdentities()
    : {};
  const verifierName = credential.verified_by
    ? (identities[credential.verified_by]?.name ?? 'a team member')
    : 'a team member';

  const blockedReason = !hasVerifierRole
    ? 'Only an owner, admin, or compliance officer can verify a credential.'
    : 'Attach at least one evidence file — the certificate or renewal proof — before this credential can be verified.';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/staff-compliance"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to staff compliance
        </Link>
        <h1 className="page-title">{credential.credential_name}</h1>
        <p className="text-sm text-muted-foreground">
          Credential record and verification controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Review status</p>
          <div className="mt-2">
            <StatusBadge {...evidenceStatus(credential.status)} size="md" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Staff member</p>
          <p className="mt-1 text-sm font-semibold">
            {credential.staff?.name || 'Not recorded'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Evidence</p>
          <p className="mt-1 text-sm font-semibold">
            {evidenceCount ?? 0} attached
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expiry</p>
          <p className="mt-1 text-sm font-semibold">
            {formatDate(credential.expiry_date)}
          </p>
          <div className="mt-2">
            <StatusBadge {...certificateExpiry(credential.expiry_date)} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            Credential details
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="capitalize">
                {credential.credential_type.replace('_', ' ')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Credential number</dt>
              <dd>{credential.credential_number || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Issuing authority</dt>
              <dd>{credential.issuing_authority || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Verified</dt>
              <dd>{formatDate(credential.verified_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(credential.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Notes
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
            {credential.notes || 'No additional notes were provided.'}
          </p>
        </section>
      </div>

      <EntityEvidencePanel
        entityId={credential.id}
        entityType="staff_credential"
        heading="Credential Evidence"
        emptyState="Attach the certificate, renewal proof, or background-check letter for this credential."
      />

      {isVerified ? (
        <section className="rounded-xl border border-success/30 bg-success/10 p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <BadgeCheck className="h-4 w-4" />
            Verified
          </h2>
          <p className="mt-2 text-sm text-foreground">
            Verified by {verifierName}
            {credential.verified_at
              ? ` on ${formatDate(credential.verified_at)}`
              : ''}
            .
          </p>
        </section>
      ) : canVerify ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
            Verification
          </h2>
          <p className="mt-2 text-sm text-foreground">
            Confirm this credential as verified after reviewing evidence and
            validity.
          </p>
          <form action={verifyAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex min-h-[44px] md:min-h-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <BadgeCheck className="h-4 w-4" />
              Mark verified
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-warning">
            <ShieldAlert className="h-4 w-4" />
            Not yet verifiable
          </div>
          <p className="mt-1 text-xs text-foreground">{blockedReason}</p>
        </section>
      )}

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="inline-flex flex-wrap items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          <span>
            Credentials lapsing in the next 90 days are listed under{' '}
            <Link
              href="/app/certificates"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Certificate renewals
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
