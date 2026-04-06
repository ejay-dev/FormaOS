import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ShieldCheck,
  FileText,
  Search,
  FileUp,
  HardDrive,
  Filter,
  CheckCircle2,
  Clock,
  ListFilter,
} from 'lucide-react';
import { verifyEvidence } from '@/app/app/actions/evidence';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';
import { VaultUploadButton } from '@/components/vault/vault-upload-button';
import { EvidenceFileActions } from '@/components/vault/evidence-file-actions';
import Link from 'next/link';

function getFileName(item: any) {
  return item?.file_name || item?.title || item?.name || 'Untitled';
}

function getFileType(item: any) {
  return item?.file_type || item?.mime_type || 'file';
}

function getFileSizeKB(item: any) {
  const bytes = Number(item?.file_size) || 0;
  return (bytes / 1024).toFixed(0);
}

function getVerificationStatus(item: any) {
  return item?.verification_status || 'pending';
}

type VaultPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

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
  const filteredArtifacts = allArtifacts.filter((artifact: any) => {
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
      (acc: number, curr: any) => acc + (Number(curr.file_size) || 0),
      0,
    ) || 0;
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

  // Split (upgrade feature)
  const pending = filteredArtifacts.filter(
    (a: any) => getVerificationStatus(a) !== 'verified',
  );
  const verified = filteredArtifacts.filter(
    (a: any) => getVerificationStatus(a) === 'verified',
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header" data-tour="vault-header">
        <div>
          <h1 className="page-title">Evidence Vault</h1>
          <p className="page-description">
            Encrypted repository for compliance artifacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {filteredArtifacts.length} items · {sizeInMB} MB
          </span>
          <VaultUploadButton />
        </div>
      </div>

      <div className="page-content space-y-4">
      {/* Search / Filter bar */}
      <form
        method="get"
        className="flex items-center gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-1"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="q"
            defaultValue={searchQueryRaw}
            placeholder="Search artifacts..."
            className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-border bg-background"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
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
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">File</th>
                  <th className="px-3 py-2 text-left font-medium">Context</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{getFileName(item)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                      {item.task?.title || item.policy?.title || 'General'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                      {getFileType(item)} · {getFileSizeKB(item)}KB
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EvidenceFileActions filePath={item.file_path ?? null} variant="pending" />
                        {isAuditor && (
                          <form
                            action={async (formData) => {
                              'use server';
                              const reason = (formData.get('reason') as string) || '';
                              await verifyEvidence(item.id, 'verified', reason);
                            }}
                            className="flex items-center gap-1"
                          >
                            <input name="reason" placeholder="Reason" className="h-7 w-24 rounded border border-border bg-background px-2 text-xs" required />
                            <button type="submit" className="h-7 px-2 rounded bg-emerald-500/20 text-emerald-500 text-xs font-medium hover:bg-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3 inline mr-1" />Verify
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

        <div className="rounded-lg border border-border overflow-hidden">
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
                    <th className="px-3 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {verified.map((item: any) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-emerald-300" />
                          <span className="text-xs font-bold text-foreground">
                            {getFileName(item)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight mt-1">
                          {getFileType(item)} • {getFileSizeKB(item)} KB
                        </p>
                      </td>

                      <td className="px-8 py-4 text-xs text-muted-foreground">
                        {item.task?.title || item.policy?.title || 'N/A'}
                      </td>

                      <td className="px-8 py-4">
                        {item.quality_score != null ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                item.quality_score >= 70
                                  ? 'bg-emerald-400/10 text-emerald-300'
                                  : item.quality_score >= 50
                                    ? 'bg-amber-400/10 text-amber-300'
                                    : 'bg-rose-400/10 text-rose-300'
                              }`}
                            >
                              {item.quality_score}
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase ${
                                item.risk_flag === 'low'
                                  ? 'text-emerald-400'
                                  : item.risk_flag === 'medium'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
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
                          <div className="h-6 w-6 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-300">
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
