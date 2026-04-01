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
      <div className="space-y-4 pb-24">
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          Data Governance
        </h1>
        <p className="text-sm text-muted-foreground">
          Admin access is required to manage retention, classification, residency, and identity audit controls.
        </p>
        <Link href="/app" className="text-sm text-cyan-300 hover:underline">
          ← Back to app
        </Link>
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
    <div className="space-y-8 pb-24 max-w-7xl animate-in fade-in duration-500">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Data Governance
            </h1>
            <p className="text-sm text-muted-foreground">
              Retention, classification, tenant isolation, residency, and identity-aware audit evidence.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground/60">{card.title}</div>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 text-3xl font-black text-foreground">{card.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{card.description}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <RetentionPolicies
          orgId={orgId}
          initialPolicies={policies as Array<Record<string, any>>}
          initialExecutions={executions as Array<Record<string, any>>}
        />
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div>
              <h2 className="text-xl font-black text-foreground">Residency Compliance</h2>
              <p className="text-sm text-muted-foreground">
                Current org region is <span className="font-semibold text-foreground/90">{region.toUpperCase()}</span>.
              </p>
            </div>
            <div className="space-y-3">
              {violations.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  No residency violations have been recorded.
                </div>
              ) : (
                violations.slice(0, 5).map((violation: any) => (
                  <div key={violation.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="text-sm font-semibold text-foreground">{violation.operation}</div>
                    <div className="text-xs text-muted-foreground">
                      {violation.source_region ?? region} → {violation.destination_region ?? region}
                    </div>
                    <div className="mt-2 text-xs text-rose-300">{violation.reason}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xl font-black text-foreground">Classification Breakdown</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(classificationReport.breakdown ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60">{key}</div>
                  <div className="mt-2 text-2xl font-black text-foreground">{String(value)}</div>
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
  );
}
