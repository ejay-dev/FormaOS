import { Suspense } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Users,
} from 'lucide-react';
import { runGapAnalysis } from '@/app/app/actions/compliance';
import { getComplianceBlocks } from '@/app/app/actions/enforcement';
import {
  evaluateOrgCompliance,
  fetchComplianceSummary,
} from '@/app/app/actions/control-evaluations';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { SkeletonCard } from '@/components/ui/skeleton';
import { IndustryReportTemplates } from '@/components/reports/IndustryReportTemplates';

type EntitlementRow = {
  feature_key: string;
  enabled: boolean;
};

type ExportCard = {
  title: string;
  description: string;
  type: 'soc2' | 'iso27001' | 'ndis' | 'hipaa';
  color: string;
};

const EXPORT_CARDS: ExportCard[] = [
  {
    title: 'SOC 2',
    description: 'Service Organization Control Type II readiness assessment',
    type: 'soc2',
    color: 'from-sky-500/20 to-sky-500/5 border-sky-400/20',
  },
  {
    title: 'ISO 27001',
    description: 'Statement of Applicability with implementation coverage',
    type: 'iso27001',
    color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/20',
  },
  {
    title: 'NDIS',
    description: 'Practice Standards posture with workforce evidence summary',
    type: 'ndis',
    color: 'from-pink-500/20 to-pink-500/5 border-pink-400/20',
  },
  {
    title: 'HIPAA',
    description: 'Privacy and Security rule coverage readiness package',
    type: 'hipaa',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20',
  },
];

/** Resolves org context — fast path, just auth + membership lookup */
async function resolveOrgContext() {
  const systemState = await fetchSystemState();
  if (!systemState) return null;

  const orgId = systemState.organization.id;
  const hasAdminAccess =
    systemState.role === 'owner' || systemState.role === 'admin';
  const hasSubscription =
    systemState.subscription?.status === 'active' ||
    systemState.subscription?.status === 'trialing';

  const supabase = await createSupabaseServerClient();

  const { data: entitlementRows } = await supabase
    .from('org_entitlements')
    .select('feature_key, enabled')
    .eq('organization_id', orgId);

  const safeRows: EntitlementRow[] = entitlementRows ?? [];
  const entitlementSet = new Set(
    safeRows.filter((entry) => entry.enabled).map((entry) => entry.feature_key),
  );

  return {
    orgId,
    hasAdminAccess,
    hasSubscription,
    hasAuditExport: entitlementSet.has('audit_export'),
    hasFrameworkEval: entitlementSet.has('framework_evaluations'),
  };
}

/** Streamed: ISO compliance score + gap analysis */
async function ComplianceScoreSection({
  orgId,
  hasSubscription,
  hasFrameworkEval,
}: {
  orgId: string;
  hasSubscription: boolean;
  hasFrameworkEval: boolean;
}) {
  const isoResult =
    hasSubscription && hasFrameworkEval
      ? await runGapAnalysis('ISO27001')
      : null;
  const complianceScore = isoResult?.score ?? 0;
  const missingCount = isoResult?.missing ?? 0;
  const totalControls = isoResult?.total ?? 0;
  const missingCodes = isoResult?.missingCodes || [];

  let complianceBlocks: any[] = [];
  let requiredNonCompliantCount = 0;
  try {
    complianceBlocks = await getComplianceBlocks(orgId, 'AUDIT_EXPORT');
    await evaluateOrgCompliance(orgId);
    const summary = await fetchComplianceSummary(orgId);
    requiredNonCompliantCount = summary.requiredNonCompliant;
  } catch {
    complianceBlocks = [];
    requiredNonCompliantCount = 0;
  }

  const isExportBlocked = Boolean(
    complianceBlocks && complianceBlocks.length > 0,
  );
  const isControlBlocked = requiredNonCompliantCount > 0;

  return (
    <>
      {(isExportBlocked || isControlBlocked) && (
        <div className="rounded-xl border border-rose-700 bg-rose-950/40 px-6 py-4">
          <div className="flex items-start gap-3 text-rose-200">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">
                Export blocked by compliance requirements
              </div>
              <div className="text-xs text-rose-300">
                Resolve unresolved controls before generating audit exports.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">ISO 27001 Compliance</h2>
            <p className="text-xs text-muted-foreground">
              Active framework snapshot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold">{complianceScore}%</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {missingCount} missing / {totalControls} total
            </p>
          </div>
        </div>
      </div>

      {missingCount > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" /> Priority Gaps
          </h3>
          <div className="rounded-lg border border-border bg-card">
            {missingCodes.slice(0, 5).map((code: string) => (
              <div
                key={code}
                className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <XCircle className="h-4 w-4 text-rose-300" />
                  Control {code} missing approved evidence
                </div>
                <Link
                  href="/app/evidence"
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Resolve
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** Streamed: Trust packet + export cards (depends on compliance state) */
function ExportSection({ disableExports }: { disableExports: boolean }) {
  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Buyer Trust Packet</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg">
              Shareable, procurement-ready snapshot — readiness, control
              coverage, evidence posture, and gaps.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/api/reports/export?type=trust&format=pdf&mode=sync"
              prefetch={false}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                disableExports
                  ? 'pointer-events-none border border-border text-muted-foreground/60'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              Generate
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/app/governance"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/30"
            >
              Governance
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/30"
            >
              <Users className="h-3 w-3" />
              Trust Center
            </Link>
          </div>
        </div>
        {disableExports ? (
          <p className="text-[10px] text-amber-500">
            Requires active subscription + admin access.
          </p>
        ) : (
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Export enabled
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Certification Reports
          </span>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {EXPORT_CARDS.map((card) => (
            <div
              key={card.title}
              className={`rounded-lg border p-3 ${card.color} ${disableExports ? 'opacity-50' : ''}`}
            >
              <h4 className="text-sm font-semibold text-foreground">
                {card.title}
              </h4>
              <p className="mt-1 text-[10px] text-foreground/70 line-clamp-2">
                {card.description}
              </p>
              <Link
                href={`/api/reports/export?type=${card.type}&format=pdf&mode=sync`}
                prefetch={false}
                className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium ${disableExports ? 'pointer-events-none text-muted-foreground/60' : 'text-primary hover:underline'}`}
              >
                Generate
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ComplianceScoreFallback() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-40" />
    </div>
  );
}

export default async function ReportsPage() {
  const ctx = await resolveOrgContext();

  const hasSubscription = ctx?.hasSubscription ?? false;
  const hasAuditExport = ctx?.hasAuditExport ?? false;
  const hasAdminAccess = ctx?.hasAdminAccess ?? false;
  const hasFrameworkEval = ctx?.hasFrameworkEval ?? false;
  const disableExports = !hasSubscription || !hasAuditExport || !hasAdminAccess;

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports Center</h1>
          <p className="page-description">
            Generate audit-ready compliance artifacts and regulatory
            assessments.
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md bg-accent/50 px-2.5 py-1 text-xs font-medium text-foreground">
            Standard
          </span>
          <Link
            href="/app/reports/custom"
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30 hover:text-foreground"
          >
            My Reports
          </Link>
          <Link
            href="/app/reports/trends"
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30 hover:text-foreground"
          >
            Trends
          </Link>
        </div>
      </div>
      <div className="page-content space-y-4">
        {!hasSubscription && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-amber-100">
            <div className="text-sm font-semibold">Subscription required</div>
            <div className="mt-1 text-xs text-amber-200">
              Activate your plan to unlock report exports and framework
              evaluations.
            </div>
            <Link
              href="/app/billing"
              className="mt-3 inline-flex text-xs font-semibold underline"
            >
              Go to billing
            </Link>
          </div>
        )}

        {!hasAdminAccess && (
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-6 py-4 text-sky-100">
            <div className="text-sm font-semibold">Admin access required</div>
            <div className="mt-1 text-xs text-sky-200">
              Reports and trust exports are restricted to organization owners
              and admins.
            </div>
            <Link
              href="/app/team"
              className="mt-3 inline-flex text-xs font-semibold underline"
            >
              Review team roles
            </Link>
          </div>
        )}

        {/* Compliance score — streams when gap analysis completes */}
        {ctx?.orgId && hasAdminAccess ? (
          <Suspense fallback={<ComplianceScoreFallback />}>
            <ComplianceScoreSection
              orgId={ctx.orgId}
              hasSubscription={hasSubscription}
              hasFrameworkEval={hasFrameworkEval}
            />
          </Suspense>
        ) : null}

        {/* Industry-specific report templates */}
        <IndustryReportTemplates />

        {/* Export section — renders with known permission state */}
        <ExportSection disableExports={disableExports} />
      </div>
    </div>
  );
}
