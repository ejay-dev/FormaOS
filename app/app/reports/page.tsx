import { 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { runGapAnalysis } from "@/app/app/actions/compliance";
import { BundleGenerator } from "@/components/reports/bundle-generator";
import { CertificationReportCard } from "@/components/reports/certification-report-card";
import ComplianceGateBanner from "@/components/compliance/ComplianceGateBanner";
import { getOrgIdForUser, getComplianceBlocks } from "@/app/app/actions/enforcement";
import {
  evaluateOrgCompliance,
  fetchComplianceSummary,
} from "@/app/app/actions/control-evaluations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EntitlementRow = {
  feature_key: string;
  enabled: boolean;
};

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let hasSubscription = false;
  let hasAuditExport = false;
  let hasFrameworkEval = false;

  if (user) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.organization_id) {
      const orgId = membership.organization_id;
      const [subscriptionResult, entitlementsResult] = await Promise.all([
        supabase
          .from("org_subscriptions")
          .select("status")
          .eq("organization_id", orgId)
          .maybeSingle(),
        supabase
          .from("org_entitlements")
          .select("feature_key, enabled")
          .eq("organization_id", orgId),
      ]);

      const subscription = subscriptionResult.data;
      hasSubscription =
        subscription?.status === "active" || subscription?.status === "trialing";

      const entitlements = entitlementsResult.data;

      const entitlementRows: EntitlementRow[] = entitlements ?? [];
      const entitlementSet = new Set(
        entitlementRows.filter((e) => e.enabled).map((e) => e.feature_key)
      );
      hasAuditExport = entitlementSet.has("audit_export");
      hasFrameworkEval = entitlementSet.has("framework_evaluations");
    }
  }

  // 🔐 Phase 7: Run framework gap analysis (example: ISO 27001)
  const isoResult = hasSubscription && hasFrameworkEval ? await runGapAnalysis("ISO27001") : null;

  const complianceScore = isoResult?.score ?? 0;
  const missingCount = isoResult?.missing ?? 0;
  const totalControls = isoResult?.total ?? 0;
  const missingCodes = isoResult?.missingCodes || [];

  // Enforcement: fetch unresolved compliance blocks for AUDIT_EXPORT for this org (best-effort)
  let complianceBlocks: any[] = [];
  let requiredNonCompliantCount = 0;
  try {
    const { orgId } = await getOrgIdForUser();
    complianceBlocks = await getComplianceBlocks(orgId, "AUDIT_EXPORT");
    await evaluateOrgCompliance(orgId);
    const summary = await fetchComplianceSummary(orgId);
    requiredNonCompliantCount = summary.requiredNonCompliant;
  } catch {
    complianceBlocks = [];
    requiredNonCompliantCount = 0;
  }

  const isExportBlocked = (complianceBlocks && complianceBlocks.length > 0) || false;
  const isControlBlocked = requiredNonCompliantCount > 0;

  return (
    <div
      className="space-y-10 pb-12 animate-in fade-in duration-500"
      data-tour="reports-header"
    >

      {/* Enforcement banner (if blocked) */}
      {isExportBlocked ? (
        <div className="mb-4">
          <ComplianceGateBanner gateKey="AUDIT_EXPORT" blocks={complianceBlocks} />
        </div>
      ) : null}
      {isControlBlocked ? (
        <div className="mb-4 rounded-xl border border-rose-700 bg-rose-950/40 px-6 py-4">
          <div className="flex items-center gap-3 text-rose-200">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Export blocked by compliance gaps</div>
              <div className="text-xs text-rose-300">
                {requiredNonCompliantCount} required control(s) are non-compliant. Resolve them before export.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Billing gate */}
      {!hasSubscription ? (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4">
          <div className="flex items-center gap-3 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Subscription required</div>
              <div className="text-xs text-amber-300">
                Activate your plan to unlock report exports and compliance evaluations.
              </div>
            </div>
          </div>
          <Link href="/app/billing" className="mt-3 inline-flex text-xs font-semibold text-amber-100 underline">
            Go to billing
          </Link>
        </div>
      ) : null}
      {hasSubscription && !hasAuditExport ? (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4">
          <div className="flex items-center gap-3 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Upgrade required</div>
              <div className="text-xs text-amber-300">
                Your current plan does not include audit bundle exports.
              </div>
            </div>
          </div>
          <Link href="/app/billing" className="mt-3 inline-flex text-xs font-semibold text-amber-100 underline">
            Review plans
          </Link>
        </div>
      ) : null}
      {hasSubscription && !hasFrameworkEval ? (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4">
          <div className="flex items-center gap-3 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Framework evaluations locked</div>
              <div className="text-xs text-amber-300">
                Upgrade to enable continuous framework scoring and gap analysis.
              </div>
            </div>
          </div>
          <Link href="/app/billing" className="mt-3 inline-flex text-xs font-semibold text-amber-100 underline">
            Review plans
          </Link>
        </div>
      ) : null}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Reports Center</h1>
        <p className="text-slate-400 mt-1">
          Generate audit-ready compliance artifacts and regulatory assessments.
        </p>
      </div>

      {/* =========================
          REGULATORY SUMMARY PANEL
         ========================= */}
      <div className="bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32 -z-10 opacity-60" />

        <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">

          {/* Left: Framework Summary */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sky-300 mb-4">
              <div className="p-1.5 bg-white/10 rounded-md shadow-[0_0_18px_rgba(14,165,233,0.2)]">
                 <ShieldCheck className="h-5 w-5 text-sky-300" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Active Framework</span>
            </div>
            <h2 className="text-3xl font-black text-slate-100 mb-2">ISO 27001 Compliance</h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Automated control-to-evidence validation. This score reflects verified evidence linked to mandatory controls.
            </p>
            
            {/* Status Badge */}
            <div className="mt-6 inline-flex">
               {missingCount > 0 ? (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-400/30 text-rose-200 px-5 py-3 rounded-xl text-sm font-medium">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-200" />
                  <div>
                    <span className="block font-bold text-rose-200">Action Required</span>
                    <span className="text-xs opacity-90 text-rose-200/80">{missingCount} controls missing evidence.</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/30 text-emerald-200 px-5 py-3 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                   <div>
                    <span className="block font-bold text-emerald-200">Audit Ready</span>
                    <span className="text-xs opacity-90 text-emerald-200/80">All controls satisfied.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Score Block */}
          <div className="flex items-center gap-4 lg:gap-12 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compliance Score</p>
              <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * complianceScore) / 100} className={complianceScore === 100 ? "text-emerald-300" : "text-sky-300"} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-3xl font-black text-slate-100">{complianceScore}%</span>
              </div>
            </div>

            <div className="space-y-6">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missing Items</p>
                  <p className={`text-3xl font-black ${missingCount > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                    {missingCount}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Controls</p>
                  <p className="text-3xl font-black text-slate-100">
                    {totalControls}
                  </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          GAP ANALYSIS BREAKDOWN
         ========================= */}
      {missingCount > 0 && (
         <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Priority Gaps
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    {missingCodes?.slice(0, 5).map((code: string) => (
                        <div key={code} className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-300">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-100 text-sm">Control {code} Missing</p>
                                    <p className="text-xs text-slate-400">No approved evidence linked to this mandatory control.</p>
                                </div>
                            </div>
                            <Link href="/app/evidence" className="text-[10px] font-bold uppercase tracking-widest bg-white/10 text-slate-100 px-3 py-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                Upload Evidence
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}

      {/* =========================
          PRIMARY ACTION
         ========================= */}
      <div className="bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] rounded-[2rem] p-8 text-slate-100 relative overflow-hidden group border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-all" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 text-sky-300 mb-4">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Auditor Ready</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Generate Full Audit Bundle</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Compiles policies, tasks, evidence, control mappings, and compliance snapshots into a structured audit package.
          </p>

          {/* Phase 8: Real Audit Engine */}
          <BundleGenerator disabled={isExportBlocked || isControlBlocked || !hasSubscription || !hasAuditExport} />
        </div>
      </div>

      {/* =========================
          CERTIFICATION REPORTS
         ========================= */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Certification Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SOC 2 Report */}
          <CertificationReportCard
            title="SOC 2"
            description="Service Organization Control Type II readiness assessment"
            icon={ShieldCheck}
            reportType="soc2"
            color="sky"
            disabled={!hasSubscription || !hasAuditExport}
          />
          {/* ISO 27001 Report */}
          <CertificationReportCard
            title="ISO 27001"
            description="Statement of Applicability with control implementation status"
            icon={ShieldCheck}
            reportType="iso27001"
            color="indigo"
            disabled={!hasSubscription || !hasAuditExport}
          />
          {/* NDIS Report */}
          <CertificationReportCard
            title="NDIS"
            description="Practice Standards compliance with staff credentials summary"
            icon={ShieldCheck}
            reportType="ndis"
            color="pink"
            disabled={!hasSubscription || !hasAuditExport}
          />
          {/* HIPAA Report */}
          <CertificationReportCard
            title="HIPAA"
            description="Privacy, Security, and Breach Notification rule compliance"
            icon={ShieldCheck}
            reportType="hipaa"
            color="emerald"
            disabled={!hasSubscription || !hasAuditExport}
          />
        </div>
      </div>
    </div>
  );
}

// CertificationReportCard moved to client component for async export polling.
