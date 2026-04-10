import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function AuditPortalDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) redirect('/');

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_dashboard');

  // Fetch summary data
  const [controlsResult, evidenceResult, _tasksResult] = await Promise.all([
    db
      .from('org_controls')
      .select('id, status', { count: 'exact' })
      .eq('organization_id', orgId),
    db
      .from('org_evidence')
      .select('id, freshness_status', { count: 'exact' })
      .eq('organization_id', orgId),
    db
      .from('org_tasks')
      .select('id, status', { count: 'exact' })
      .eq('organization_id', orgId),
  ]);

  const controls = controlsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const satisfiedControls = controls.filter(
    (c) => c.status === 'satisfied' || c.status === 'implemented',
  ).length;
  const complianceScore =
    controls.length > 0
      ? Math.round((satisfiedControls / controls.length) * 100)
      : 0;
  const currentEvidence = evidence.filter(
    (e) => e.freshness_status === 'current' || !e.freshness_status,
  ).length;
  const expiredEvidence = evidence.filter(
    (e) => e.freshness_status === 'expired',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Overview</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of compliance posture and evidence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Compliance Score</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{complianceScore}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Controls</span>
          </div>
          <p className="mt-1 text-3xl font-bold">
            {satisfiedControls}/{controls.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Evidence Items</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{evidence.length}</p>
          <p className="text-xs text-muted-foreground">
            {currentEvidence} current
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Expired Evidence</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-red-500">
            {expiredEvidence}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">Access Scope</h2>
        <div className="space-y-2 text-sm">
          {tokenData.scopes &&
            (tokenData.scopes as Record<string, unknown>).frameworks && (
              <div>
                <span className="text-muted-foreground">Frameworks: </span>
                {(
                  (tokenData.scopes as Record<string, string[]>).frameworks ??
                  []
                ).join(', ')}
              </div>
            )}
          <div>
            <span className="text-muted-foreground">Access expires: </span>
            {new Date(tokenData.expires_at).toLocaleDateString()}
          </div>
          <div>
            <span className="text-muted-foreground">Access count: </span>
            {tokenData.access_count ?? 0} views
          </div>
        </div>
      </div>
    </div>
  );
}
