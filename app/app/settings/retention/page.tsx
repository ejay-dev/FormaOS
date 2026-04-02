import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  RetentionPolicyEditor,
  LegalHoldManager,
} from '@/components/retention/retention-manager';
import { Shield, Lock, FileText, Clock } from 'lucide-react';

export const metadata = { title: 'Document Retention | FormaOS' };

export default async function RetentionPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const [{ data: policies }, { data: holds }, { data: lifecycle }] =
    await Promise.all([
      db
        .from('retention_policies')
        .select('*')
        .eq('org_id', state.organization.id)
        .order('document_category'),
      db
        .from('legal_holds')
        .select('*')
        .eq('org_id', state.organization.id)
        .order('created_at', { ascending: false }),
      db
        .from('document_lifecycle_log')
        .select('*')
        .eq('org_id', state.organization.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  // Count docs per hold
  const { data: holdDocs } = await db
    .from('legal_hold_documents')
    .select('legal_hold_id')
    .eq('org_id', state.organization.id);

  const holdDocCounts: Record<string, number> = {};
  for (const d of holdDocs || []) {
    holdDocCounts[d.legal_hold_id] = (holdDocCounts[d.legal_hold_id] || 0) + 1;
  }

  const holdsWithCounts = (holds || []).map((h) => ({
    ...h,
    document_count: holdDocCounts[h.id] || 0,
  }));

  const activeHolds = holdsWithCounts.filter(
    (h) => h.status === 'active',
  ).length;
  const totalPolicies = (policies || []).filter(
    (p: { is_active: boolean }) => p.is_active,
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Document Retention
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage retention policies, legal holds, and document lifecycle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Shield className="h-4 w-4" />{' '}
            <span className="text-xs">Active Policies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPolicies}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Lock className="h-4 w-4" />{' '}
            <span className="text-xs">Active Holds</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{activeHolds}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />{' '}
            <span className="text-xs">Documents Held</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {Object.values(holdDocCounts).reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />{' '}
            <span className="text-xs">Recent Actions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {(lifecycle || []).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Retention Policies
          </h2>
          <RetentionPolicyEditor policies={policies || []} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Legal Holds
          </h2>
          <LegalHoldManager holds={holdsWithCounts} />
        </div>
      </div>

      {/* Recent Lifecycle Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Recent Document Actions
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  Action
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  Document Type
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  Document ID
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {(lifecycle || [])
                .slice(0, 20)
                .map(
                  (log: {
                    id: string;
                    action: string;
                    document_type: string;
                    document_id: string;
                    created_at: string;
                  }) => (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            log.action === 'deleted'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : log.action === 'archived'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : log.action.includes('hold')
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {log.document_type}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground font-mono">
                        {log.document_id.slice(0, 8)}…
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ),
                )}
              {(!lifecycle || lifecycle.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-xs text-muted-foreground"
                  >
                    No lifecycle actions recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
