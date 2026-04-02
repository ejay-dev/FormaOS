import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { queryAuditLog, getAuditStats, getExportJobs } from '@/lib/audit/audit-engine';
import { verifyChainIntegrity } from '@/lib/audit/hash-utils';
import { AuditTrailViewer, ChainIntegrityBadge, AuditExportPanel } from '@/components/audit/audit-trail-enhanced';
import { Shield, Activity, Download, Hash } from 'lucide-react';

export const metadata = { title: 'Audit Trail | FormaOS' };

export default async function AuditTrailPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const [{ entries, total }, stats, exportJobs] = await Promise.all([
    queryAuditLog(state.organization.id, { limit: 100 }),
    getAuditStats(state.organization.id),
    getExportJobs(state.organization.id),
  ]);

  // Verify chain integrity on last 500 entries
  const { data: chainEntries } = await db
    .from('audit_log')
    .select('id, org_id, user_id, action, resource_type, resource_id, details, created_at, entry_hash, prev_hash')
    .eq('org_id', state.organization.id)
    .order('sequence_number', { ascending: true })
    .limit(500);

  const integrity = chainEntries && chainEntries.length > 0
    ? { ...verifyChainIntegrity(chainEntries), lastVerified: new Date().toISOString() }
    : { valid: true, totalChecked: 0, lastVerified: new Date().toISOString() };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5" /> Audit Trail
        </h1>
        <p className="text-sm text-muted-foreground">Tamper-proof activity log with hash chain verification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" /> <span className="text-xs">Total Entries</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" /> <span className="text-xs">Last 7 Days</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.last7d.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" /> <span className="text-xs">Last 30 Days</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.last30d.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Hash className="h-4 w-4" /> <span className="text-xs">Chain Status</span>
          </div>
          <p className={`text-2xl font-bold ${integrity.valid ? 'text-green-600' : 'text-red-600'}`}>
            {integrity.valid ? 'Verified' : 'Broken'}
          </p>
        </div>
      </div>

      <ChainIntegrityBadge integrity={integrity} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Activity Log</h2>
          <AuditTrailViewer entries={entries} total={total} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Download className="h-4 w-4" /> Exports
          </h2>
          <AuditExportPanel jobs={exportJobs} />
        </div>
      </div>
    </div>
  );
}
