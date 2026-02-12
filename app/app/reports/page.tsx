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
import { getOrgIdForUser, getComplianceBlocks } from '@/app/app/actions/enforcement';
import {
  evaluateOrgCompliance,
  fetchComplianceSummary,
} from '@/app/app/actions/control-evaluations';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasSubscription = false;
  let hasAuditExport = false;
  let hasFrameworkEval = false;
  let hasAdminAccess = false;

  if (user) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership?.organization_id) {
      const orgId = membership.organization_id;
      hasAdminAccess = membership.role === 'owner' || membership.role === 'admin';
      const [subscriptionResult, entitlementsResult] = await Promise.all([
        supabase
          .from('org_subscriptions')
          .select('status')
          .eq('organization_id', orgId)
          .maybeSingle(),
        supabase
          .from('org_entitlements')
          .select('feature_key, enabled')
          .eq('organization_id', orgId),
      ]);

      const subscription = subscriptionResult.data;
      hasSubscription =
        subscription?.status === 'active' || subscription?.status === 'trialing';

      const entitlementRows: EntitlementRow[] = entitlementsResult.data ?? [];
      const entitlementSet = new Set(
        entitlementRows.filter((entry) => entry.enabled).map((entry) => entry.feature_key),
      );
      hasAuditExport = entitlementSet.has('audit_export');
      hasFrameworkEval = entitlementSet.has('framework_evaluations');
    }
  }

  const isoResult =
    hasSubscription && hasFrameworkEval ? await runGapAnalysis('ISO27001') : null;
  const complianceScore = isoResult?.score ?? 0;
  const missingCount = isoResult?.missing ?? 0;
  const totalControls = isoResult?.total ?? 0;
  const missingCodes = isoResult?.missingCodes || [];

  let complianceBlocks: any[] = [];
  let requiredNonCompliantCount = 0;
  try {
    const { orgId } = await getOrgIdForUser();
    complianceBlocks = await getComplianceBlocks(orgId, 'AUDIT_EXPORT');
    await evaluateOrgCompliance(orgId);
    const summary = await fetchComplianceSummary(orgId);
    requiredNonCompliantCount = summary.requiredNonCompliant;
  } catch {
    complianceBlocks = [];
    requiredNonCompliantCount = 0;
  }

  const isExportBlocked = Boolean(complianceBlocks && complianceBlocks.length > 0);
  const isControlBlocked = requiredNonCompliantCount > 0;
  const disableExports =
    isExportBlocked ||
    isControlBlocked ||
    !hasSubscription ||
    !hasAuditExport ||
    !hasAdminAccess;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {(isExportBlocked || isControlBlocked) && (
        <div className="rounded-xl border border-rose-700 bg-rose-950/40 px-6 py-4">
          <div className="flex items-start gap-3 text-rose-200">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Export blocked by compliance requirements</div>
              <div className="text-xs text-rose-300">
                Resolve unresolved controls before generating audit exports.
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasSubscription && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-amber-100">
          <div className="text-sm font-semibold">Subscription required</div>
          <div className="mt-1 text-xs text-amber-200">
            Activate your plan to unlock report exports and framework evaluations.
          </div>
          <Link href="/app/billing" className="mt-3 inline-flex text-xs font-semibold underline">
            Go to billing
          </Link>
        </div>
      )}

      {!hasAdminAccess && (
        <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-6 py-4 text-sky-100">
          <div className="text-sm font-semibold">Admin access required</div>
          <div className="mt-1 text-xs text-sky-200">
            Reports and trust exports are restricted to organization owners and admins.
          </div>
          <Link href="/app/team" className="mt-3 inline-flex text-xs font-semibold underline">
            Review team roles
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Reports Center</h1>
        <p className="mt-1 text-slate-400">
          Generate audit-ready compliance artifacts and regulatory assessments.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active Framework Snapshot
            </div>
            <h2 className="text-2xl font-black text-slate-100">ISO 27001 Compliance</h2>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Continuous control-to-evidence validation for enterprise audit readiness.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance Score</p>
            <div className="mt-2 text-4xl font-black text-slate-100">{complianceScore}%</div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span>Missing: {missingCount}</span>
              <span>Total: {totalControls}</span>
            </div>
          </div>
        </div>
      </div>

      {missingCount > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
            <AlertCircle className="h-4 w-4" /> Priority Gaps
          </h3>
          <div className="rounded-2xl border border-white/10 bg-white/5">
            {missingCodes.slice(0, 5).map((code: string) => (
              <div
                key={code}
                className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3 text-sm text-slate-100">
                  <XCircle className="h-4 w-4 text-rose-300" />
                  Control {code} missing approved evidence
                </div>
                <Link href="/app/evidence" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  Resolve
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Trust Artifacts
            </div>
            <h2 className="text-2xl font-black text-slate-100">
              Buyer Trust Packet (PDF)
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              A shareable, procurement-ready snapshot that summarizes readiness,
              control coverage, evidence verification posture, and critical gaps.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Executive summary',
                'Control & evidence counts',
                'Critical gaps list',
                'Export timestamp',
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/api/reports/export?type=trust&format=pdf"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                disableExports
                  ? 'pointer-events-none border border-white/10 bg-white/5 text-slate-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
              }`}
            >
              Generate Trust Packet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app/governance"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Open Governance Packs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              <Users className="h-4 w-4" />
              Open Trust Center
            </Link>
          </div>
        </div>

        {disableExports ? (
          <div className="mt-4 text-xs text-amber-300">
            Trust exports require an active subscription, audit export entitlement,
            owner/admin access, and no unresolved compliance blocks.
          </div>
        ) : (
          <div className="mt-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Trust packet export enabled
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-8">
        <div className="mb-4 flex items-center gap-2 text-sky-300">
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Certification Reports</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {EXPORT_CARDS.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border bg-gradient-to-br p-5 ${card.color} ${disableExports ? 'opacity-50' : ''}`}
            >
              <h4 className="text-lg font-bold text-slate-100">{card.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{card.description}</p>
              <Link
                href={`/api/reports/export?type=${card.type}&format=pdf`}
                className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${disableExports ? 'pointer-events-none text-slate-500' : 'text-cyan-200 hover:text-cyan-100'}`}
              >
                Generate report
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
        {disableExports ? (
          <div className="mt-4 text-xs text-amber-300">
            Export actions are disabled until subscription, entitlement, and compliance requirements are satisfied.
          </div>
        ) : (
          <div className="mt-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Exports enabled
          </div>
        )}
      </div>
    </div>
  );
}
