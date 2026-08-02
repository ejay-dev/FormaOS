import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  queryAuditLog,
  getAuditStats,
  getExportJobs,
} from '@/lib/audit/audit-engine';
import { verifyChainIntegrity } from '@/lib/audit/hash-utils';
import { ChainIntegrityBadge } from '@/components/audit/audit-trail-enhanced';
import {
  FilterableAuditTrail,
  RequestableAuditExports,
} from './AuditTrailPanels';
import { EmptyState } from '@/components/empty-states';
import { Shield, Activity, Download, Hash } from 'lucide-react';

export const metadata = { title: 'Audit Trail | FormaOS' };

function firstValue(input: string | string[] | undefined): string | undefined {
  const value = Array.isArray(input) ? input[0] : input;
  return value?.trim() || undefined;
}

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const params = (await searchParams) ?? {};
  const actionFilter = firstValue(params.action);
  const resourceFilter = firstValue(params.resource_type);
  const hasFilter = Boolean(actionFilter || resourceFilter);

  const db = await createSupabaseServerClient();

  const [{ entries, total }, stats, exportJobs] = await Promise.all([
    queryAuditLog(state.organization.id, {
      limit: 100,
      action: actionFilter,
      resourceType: resourceFilter,
    }),
    getAuditStats(state.organization.id),
    getExportJobs(state.organization.id),
  ]);

  // Verify chain integrity on last 500 entries
  const { data: chainEntries } = await db
    .from('audit_log')
    .select(
      'id, org_id, user_id, action, resource_type, resource_id, details, created_at, entry_hash, prev_hash, sequence_number, hash_algo',
    )
    .eq('org_id', state.organization.id)
    .order('sequence_number', { ascending: true })
    .limit(500);

  const integrity =
    chainEntries && chainEntries.length > 0
      ? {
          ...verifyChainIntegrity(chainEntries),
          lastVerified: new Date().toISOString(),
        }
      : {
          valid: true,
          totalChecked: 0,
          lastVerified: new Date().toISOString(),
        };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="h-4 w-4" /> Audit trail
          </h1>
          <p className="page-description">
            Tamper-proof activity log with hash chain verification
          </p>
        </div>
      </div>

      <div className="page-content space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />{' '}
            <span className="text-xs">Total entries</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />{' '}
            <span className="text-xs">Last 7 days</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.last7d.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />{' '}
            <span className="text-xs">Last 30 days</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.last30d.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Hash className="h-4 w-4" />{' '}
            <span className="text-xs">Chain status</span>
          </div>
          <p
            className={`text-2xl font-bold ${integrity.valid ? 'text-success' : 'text-destructive'}`}
          >
            {integrity.valid ? 'Verified' : 'Broken'}
          </p>
        </div>
      </div>

      <ChainIntegrityBadge integrity={integrity} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Activity log
          </h2>
          {entries.length === 0 && !hasFilter ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState
                module="audit"
                icon={Shield}
                title="No audit entries yet"
                description="The audit log records every change to compliance, care, and security data with tamper-evident hash chaining. Entries appear here as your team works."
              />
            </div>
          ) : (
            <FilterableAuditTrail entries={entries} total={total} />
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Download className="h-4 w-4" /> Exports
          </h2>
          <RequestableAuditExports jobs={exportJobs} />
        </div>
      </div>
      </div>
    </div>
  );
}
