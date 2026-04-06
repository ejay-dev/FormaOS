import Link from 'next/link';
import { ShieldCheck, Database, LockKeyhole, MapPinned, FileClock } from 'lucide-react';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateClassificationReport } from '@/lib/data-governance/classification';
import { generateIsolationReport } from '@/lib/data-governance/isolation-verifier';
import { listResidencyViolations } from '@/lib/data-governance/residency-enforcement';
import {
  listRetentionExecutions,
  listRetentionPolicies,
} from '@/lib/data-governance/retention';
import { getOrgDataRegion } from '@/lib/data-residency';
import { RetentionPolicies } from '@/components/governance/retention-policies';
import { PiiDashboard } from '@/components/governance/pii-dashboard';
import { IsolationStatus } from '@/components/governance/isolation-status';
import { IdentityAuditLog } from '@/components/identity/identity-audit-log';

export const dynamic = 'force-dynamic';

export default async function GovernancePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = membership?.organization_id as string | undefined;
  const role = membership?.role as string | undefined;
  if (!orgId || !role) return null;

  const isAdmin = role === 'owner' || role === 'admin';
  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <div className="page-header">
          <div>
            <h1 className="page-title">Data Governance</h1>
            <p className="page-description">Admin access required</p>
          </div>
        </div>
        <div className="page-content">
          <p className="text-sm text-muted-foreground">
            Admin access is required to manage retention, classification, residency, and identity audit controls.
          </p>
          <Link href="/app" className="text-sm text-primary hover:underline mt-2 inline-block">
            ← Back to app
          </Link>
        </div>
      </div>
    );
  }

  const admin = createSupabaseAdminClient();
  const [policies, executions, classificationReport, isolationReport, region, violations, piiResults] =
    await Promise.all([
      listRetentionPolicies(orgId),
      listRetentionExecutions(orgId),
      generateClassificationReport(orgId),
      generateIsolationReport(orgId),
      getOrgDataRegion(orgId),
      listResidencyViolations(orgId),
      admin
        .from('pii_scan_results')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then((result: { data: unknown[] | null }) => result.data ?? []),
    ]);

  const cards = [
    {
      title: 'Retention Policies',
      value: policies.length,
      description: 'Active lifecycle rules',
      icon: FileClock,
    },
    {
      title: 'PII Scan Runs',
      value: piiResults.length,
      description: 'Recent inventory snapshots',
      icon: Database,
    },
    {
      title: 'Isolation Checks',
      value: (isolationReport.results?.[0] as { summary?: { passed?: number } } | undefined)?.summary?.passed ?? 0,
      description: 'Latest checks passing',
      icon: LockKeyhole,
    },
    {
      title: 'Residency Region',
      value: region.toUpperCase(),
      description: `${violations.length} recorded violations`,
      icon: MapPinned,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Governance</h1>
          <p className="page-description">Retention, classification, isolation, residency, and audit controls</p>
        </div>
      </div>

      <div className="page-content space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="metric-card metric-card-neutral">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.title}</p>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground">{card.description}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RetentionPolicies
            orgId={orgId}
            initialPolicies={policies as Array<Record<string, any>>}
            initialExecutions={executions as Array<Record<string, any>>}
          />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Residency Compliance</h2>
              <p className="text-xs text-muted-foreground">
                Region: <span className="font-medium text-foreground">{region.toUpperCase()}</span>
              </p>
            </div>
            <div className="space-y-2">
              {violations.length === 0 ? (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600">
                  No residency violations recorded.
                </div>
              ) : (
                violations.slice(0, 5).map((violation: any) => (
                  <div key={violation.id} className="rounded-md border border-border p-3">
                    <div className="text-sm font-medium">{violation.operation}</div>
                    <div className="text-xs text-muted-foreground">
                      {violation.source_region ?? region} → {violation.destination_region ?? region}
                    </div>
                    <div className="mt-1 text-xs text-destructive">{violation.reason}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Classification Breakdown</h2>
            <div className="grid gap-2 grid-cols-2">
              {Object.entries(classificationReport.breakdown ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">{key}</div>
                  <div className="text-lg font-bold">{String(value)}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <PiiDashboard
        orgId={orgId}
        initialScans={piiResults as Array<Record<string, any>>}
        initialClassificationReport={{
          totalFields: classificationReport.totalFields,
          breakdown: classificationReport.breakdown as Record<string, number>,
        }}
      />

      <IsolationStatus
        orgId={orgId}
        initialReport={{
          results: isolationReport.results as Array<Record<string, any>>,
        }}
      />

      <IdentityAuditLog orgId={orgId} />
      </div>
    </div>
  );
}
