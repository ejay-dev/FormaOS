import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getPackShortName } from '@/lib/marketing/claims';
import { Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AccessUnavailable } from './AccessUnavailable';
import { controlStatusGroup } from './control-status';

export default async function AuditPortalDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) return <AccessUnavailable />;

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_dashboard');

  // Fetch summary data. org_controls also carries framework-level evaluation
  // runs, whose control_key resolves to a null code — counting those as
  // controls inflates every number on this page, so they are excluded.
  const [controlsResult, evidenceResult] = await Promise.all([
    db
      .from('org_controls')
      .select('id, status')
      .eq('organization_id', orgId)
      .not('code', 'is', null),
    db
      .from('org_evidence')
      .select('id, freshness_status')
      .eq('organization_id', orgId),
  ]);

  const controls = controlsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const metControls = controls.filter(
    (c) => controlStatusGroup(c.status) === 'met',
  ).length;
  const complianceScore =
    controls.length > 0
      ? Math.round((metControls / controls.length) * 100)
      : null;
  const currentEvidence = evidence.filter(
    (e) => e.freshness_status === 'current' || !e.freshness_status,
  ).length;
  const expiredEvidence = evidence.filter(
    (e) => e.freshness_status === 'expired',
  ).length;

  const scopes = (tokenData.scopes ?? {}) as { frameworks?: string[] };
  const scopedFrameworks = (scopes.frameworks ?? []).map(getPackShortName);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit overview</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of compliance posture and evidence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Controls met</span>
          </div>
          {complianceScore === null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Not assessed yet
            </p>
          ) : (
            <p className="mt-1 text-3xl font-bold">{complianceScore}%</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Controls tracked</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{controls.length}</p>
          <p className="text-xs text-muted-foreground">{metControls} met</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Evidence items</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{evidence.length}</p>
          <p className="text-xs text-muted-foreground">
            {currentEvidence} current
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Expired evidence</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-destructive">
            {expiredEvidence}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">Access scope</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Frameworks: </span>
            {scopedFrameworks.length > 0
              ? scopedFrameworks.join(', ')
              : 'Every framework this organisation has enabled'}
          </div>
          <div>
            <span className="text-muted-foreground">Access expires: </span>
            {new Date(tokenData.expires_at).toLocaleDateString()}
          </div>
          <p className="text-muted-foreground">
            Every page you open here is recorded in the organisation&apos;s
            auditor activity log.
          </p>
        </div>
      </div>
    </div>
  );
}
