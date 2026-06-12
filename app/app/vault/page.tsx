import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ShieldCheck,
  FileText,
  Search,
  FileUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { verifyEvidence } from '@/app/app/actions/evidence';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';
import { EvidenceFileActions } from '@/components/vault/evidence-file-actions';
import Link from 'next/link';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { VaultPageHero } from '@/components/vault/VaultPageHero';
import {
  RecordCard,
  RecordList,
  EmptyRecordState,
} from '@/components/mobile/record-card';

type ArtifactRow = {
  id: string;
  title?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | string | null;
  name?: string | null;
  verification_status?: string | null;
  quality_score?: number | null;
  risk_flag?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  file_path?: string | null;
  task_id?: string | null;
  policy_id?: string | null;
  task?: { title?: string | null } | null;
  policy?: { title?: string | null } | null;
};

function getFileName(item: ArtifactRow) {
  return item?.file_name || item?.title || item?.name || 'Untitled';
}

function getFileType(item: ArtifactRow) {
  return item?.file_type || 'file';
}

function getFileSizeKB(item: ArtifactRow) {
  const bytes = Number(item?.file_size) || 0;
  return (bytes / 1024).toFixed(0);
}

function getVerificationStatus(item: ArtifactRow) {
  return item?.verification_status || 'pending';
}

type VaultPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

function parseSingleValue(input: string | string[] | undefined): string {
  return Array.isArray(input) ? (input[0] ?? '') : (input ?? '');
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQueryRaw = parseSingleValue(resolvedSearchParams.q).trim();
  const searchQuery = searchQueryRaw.toLowerCase();
  const statusFilterRaw = parseSingleValue(resolvedSearchParams.status)
    .trim()
    .toLowerCase();
  const statusFilter =
    statusFilterRaw === 'pending' || statusFilterRaw === 'verified'
      ? statusFilterRaw
      : 'all';
  const hasFilters = Boolean(searchQuery || statusFilter !== 'all');

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=vault-page');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;
  const isAuditor =
    systemState.role === 'owner' || systemState.role === 'admin';

  const { data: rawArtifacts } = await supabase
    .from('org_evidence')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100);

  const baseArtifacts = (rawArtifacts ?? []) as ArtifactRow[];
  const taskIds = Array.from(
    new Set(
      baseArtifacts
        .map((artifact) => artifact.task_id)
        .filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0,
        ),
    ),
  );
  const policyIds = Array.from(
    new Set(
      baseArtifacts
        .map((artifact) => artifact.policy_id)
        .filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0,
        ),
    ),
  );

  const [{ data: taskRows }, { data: policyRows }] = await Promise.all([
    taskIds.length
      ? supabase.from('org_tasks').select('id, title').in('id', taskIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; title: string | null }>,
        }),
    policyIds.length
      ? supabase.from('org_policies').select('id, title').in('id', policyIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; title: string | null }>,
        }),
  ]);

  const taskTitleById = new Map(
    (taskRows ?? []).map((row: { id: string; title: string | null }) => [
      row.id,
      row.title,
    ]),
  );
  const policyTitleById = new Map(
    (policyRows ?? []).map((row: { id: string; title: string | null }) => [
      row.id,
      row.title,
    ]),
  );

  const allArtifacts: ArtifactRow[] = baseArtifacts.map((artifact) => ({
    ...artifact,
    task:
      artifact.task_id && taskTitleById.has(artifact.task_id)
        ? { title: taskTitleById.get(artifact.task_id) ?? null }
        : null,
    policy:
      artifact.policy_id && policyTitleById.has(artifact.policy_id)
        ? { title: policyTitleById.get(artifact.policy_id) ?? null }
        : null,
  }));
  const filteredArtifacts = allArtifacts.filter((artifact: ArtifactRow) => {
    const statusMatches =
      statusFilter === 'all' ||
      getVerificationStatus(artifact) === statusFilter;
    if (!statusMatches) return false;

    if (!searchQuery) return true;

    const haystack = [
      getFileName(artifact),
      artifact.file_type ?? '',
      artifact.task?.title ?? '',
      artifact.policy?.title ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchQuery);
  });

  // Storage calc (current feature)
  const totalSize =
    allArtifacts.reduce(
      (acc: number, curr: ArtifactRow) => acc + (Number(curr.file_size) || 0),
      0,
    ) || 0;
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

  // Hero metrics use unfiltered totals (true posture, not search-affected).
  const heroPending = allArtifacts.filter(
    (a: ArtifactRow) => getVerificationStatus(a) !== 'verified',
  ).length;
  const heroVerified = allArtifacts.length - heroPending;

  // Split (upgrade feature)
  const pending = filteredArtifacts.filter(
    (a: ArtifactRow) => getVerificationStatus(a) !== 'verified',
  );
  const verified = filteredArtifacts.filter(
    (a: ArtifactRow) => getVerificationStatus(a) === 'verified',
  );

  return (
    <div className="flex flex-col h-full">
      <OnboardingBanner stepId="upload-evidence" />

      <VaultPageHero
        total={allArtifacts.length}
        pending={heroPending}
        verified={heroVerified}
        sizeMB={sizeInMB}
      />

      <div className="page-content space-y-4">
        {/* Search / Filter bar */}
        <form
          method="get"
          className="flex items-center gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-1"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={searchQueryRaw}
              placeholder="Search artifacts..."
              aria-label="Search artifacts"
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-border bg-background"
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
            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>
          <button
            type="submit"
            className="h-9 px-3 rounded-md border border-border text-xs font-medium hover:bg-accent/30 transition-colors"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/app/vault"
              className="h-9 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {/* PENDING REVIEW */}
        {pending.length > 0 && (
          <section className="space-y-2">
            <h2 className="section-label flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Pending Review ({pending.length})
            </h2>
            {/* Mobile cards */}
            <div className="md:hidden">
              <RecordList>
                {pending.map((item: ArtifactRow) => (
                  <RecordCard
                    key={item.id}
                    title={getFileName(item)}
                    subtitle={`${getFileType(item)} · ${getFileSizeKB(item)} KB`}
                    status={
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    }
                    meta={[
                      {
                        label: 'When',
                        value: item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : '-',
                      },
                      {
                        label: 'Context',
                        value:
                          item.task?.title ?? item.policy?.title ?? 'General',
                      },
                    ]}
                    actions={
                      <div className="flex w-full items-center justify-between gap-2">
                        <EvidenceFileActions
                          filePath={item.file_path ?? null}
                          variant="pending"
                          evidenceId={item.id}
                          canDelete={isAuditor}
                        />
                      </div>
                    }
                  />
                ))}
              </RecordList>
            </div>
            <div className="hidden md:block rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">File</th>
                    <th className="px-3 py-2 text-left font-medium">Context</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((item: ArtifactRow) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-warning shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">
                            {getFileName(item)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                        {item.task_id && item.task?.title ? (
                          <Link
                            href="/app/compliance"
                            className="hover:text-foreground hover:underline"
                          >
                            {item.task.title}
                          </Link>
                        ) : item.policy_id && item.policy?.title ? (
                          <Link
                            href={`/app/policies/${item.policy_id}`}
                            className="hover:text-foreground hover:underline"
                          >
                            {item.policy.title}
                          </Link>
                        ) : (
                          'General'
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                        {getFileType(item)} · {getFileSizeKB(item)}KB
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EvidenceFileActions
                            filePath={item.file_path ?? null}
                            variant="pending"
                            evidenceId={item.id}
                            canDelete={isAuditor}
                          />
                          {isAuditor && (
                            <form
                              action={async (formData) => {
                                'use server';
                                const reason =
                                  (formData.get('reason') as string) || '';
                                await verifyEvidence(
                                  item.id,
                                  'verified',
                                  reason,
                                );
                              }}
                              className="flex items-center gap-1"
                            >
                              <input
                                name="reason"
                                placeholder="Reason"
                                className="h-7 w-24 rounded border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                required
                              />
                              <button
                                type="submit"
                                className="h-7 px-2 rounded bg-success/10 text-success text-xs font-medium hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                Verify
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VERIFIED SECTION */}
        <section className="space-y-2">
          <h2 className="section-label flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified ({verified.length})
          </h2>

          {/* Mobile card list */}
          <div className="md:hidden">
            {verified.length === 0 ? (
              <EmptyRecordState
                title="No verified evidence yet"
                description="Once an admin verifies an artifact, it appears here."
              />
            ) : (
              <RecordList>
                {verified.map((item: ArtifactRow) => (
                  <RecordCard
                    key={item.id}
                    title={getFileName(item)}
                    subtitle={`${getFileType(item)} · ${getFileSizeKB(item)} KB`}
                    status={
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    }
                    meta={[
                      {
                        label: 'When',
                        value: item.verified_at
                          ? new Date(item.verified_at).toLocaleDateString()
                          : item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : 'N/A',
                      },
                      ...(item.quality_score != null
                        ? [
                            {
                              label: 'Quality',
                              value: `${item.quality_score}`,
                            },
                          ]
                        : []),
                    ]}
                    actions={
                      <EvidenceFileActions
                        filePath={item.file_path ?? null}
                        evidenceId={item.id}
                        canDelete={isAuditor}
                      />
                    }
                  />
                ))}
              </RecordList>
            )}
          </div>

          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            {verified.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No verified evidence yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="px-3 py-2 font-medium">Artifact</th>
                      <th className="px-3 py-2 font-medium">Context</th>
                      <th className="px-3 py-2 font-medium">AI Quality</th>
                      <th className="px-3 py-2 font-medium">Verification</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {verified.map((item: ArtifactRow) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-surface-1 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-success" />
                            <span className="text-xs font-bold text-foreground">
                              {getFileName(item)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight mt-1">
                            {getFileType(item)} • {getFileSizeKB(item)} KB
                          </p>
                        </td>

                        <td className="px-8 py-4 text-xs text-muted-foreground">
                          {item.task_id && item.task?.title ? (
                            <Link
                              href="/app/compliance"
                              className="hover:text-foreground hover:underline"
                            >
                              {item.task.title}
                            </Link>
                          ) : item.policy_id && item.policy?.title ? (
                            <Link
                              href={`/app/policies/${item.policy_id}`}
                              className="hover:text-foreground hover:underline"
                            >
                              {item.policy.title}
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </td>

                        <td className="px-8 py-4">
                          {item.quality_score != null ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                                  item.quality_score >= 70
                                    ? 'bg-success/10 text-success'
                                    : item.quality_score >= 50
                                      ? 'bg-warning/10 text-warning'
                                      : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {item.quality_score}
                              </div>
                              <span
                                className={`text-[9px] font-bold uppercase ${
                                  item.risk_flag === 'low'
                                    ? 'text-success'
                                    : item.risk_flag === 'medium'
                                      ? 'text-warning'
                                      : 'text-destructive'
                                }`}
                              >
                                {item.risk_flag || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              Not scored
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center text-success">
                              <ShieldCheck className="h-3 w-3" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">
                                Verified
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground">
                                {item.verified_at
                                  ? new Date(
                                      item.verified_at,
                                    ).toLocaleDateString()
                                  : item.created_at
                                    ? new Date(
                                        item.created_at,
                                      ).toLocaleDateString()
                                    : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-4 text-right">
                          <EvidenceFileActions
                            filePath={item.file_path ?? null}
                            evidenceId={item.id}
                            canDelete={isAuditor}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Empty state */}
        {filteredArtifacts.length === 0 && (
          <div className="py-8 border border-dashed border-border rounded-lg flex flex-col items-center justify-center max-h-32">
            <FileUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {allArtifacts.length === 0
                ? 'Vault is empty — upload your first artifact.'
                : 'No matching artifacts.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
