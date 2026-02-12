/**
 * Audit Report Builder
 * Builds report payloads for various compliance frameworks
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator';
import type {
  BaseReportPayload,
  Iso27001ReportPayload,
  NdisReportPayload,
  HipaaReportPayload,
  ReportType,
  CriticalGap,
  SoaEntry,
  NdisPracticeStandard,
} from './types';

/**
 * Build a report for any supported framework
 */
export async function buildReport(
  orgId: string,
  reportType: ReportType,
): Promise<
  | BaseReportPayload
  | Iso27001ReportPayload
  | NdisReportPayload
  | HipaaReportPayload
> {
  switch (reportType) {
    case 'trust':
      return buildTrustPacketReport(orgId);
    case 'iso27001':
      return buildIso27001Report(orgId);
    case 'ndis':
      return buildNdisReport(orgId);
    case 'hipaa':
      return buildHipaaReport(orgId);
    case 'soc2':
    default:
      return buildBaseReport(orgId, 'SOC2', 'SOC 2 Type II');
  }
}

async function buildTrustPacketReport(orgId: string): Promise<BaseReportPayload> {
  const admin = createSupabaseAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const readinessData = await calculateFrameworkReadiness(orgId);
  const readinessScore = readinessData.length
    ? Math.round(
        readinessData.reduce((sum, fw) => sum + (fw.readinessScore ?? 0), 0) /
          readinessData.length,
      )
    : 0;

  const controlSummary = readinessData.reduce(
    (acc, fw) => {
      acc.total += Number(fw.totalControls ?? 0);
      acc.satisfied += Number(fw.satisfiedControls ?? 0);
      acc.missing += Number(fw.missingControls ?? 0);
      acc.partial += Number(fw.partialControls ?? 0);
      return acc;
    },
    { total: 0, satisfied: 0, missing: 0, partial: 0 },
  );

  const { data: evidence } = await admin
    .from('org_evidence')
    .select('verification_status')
    .eq('organization_id', orgId);

  const evidenceSummary = {
    total: evidence?.length || 0,
    verified:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          e.verification_status === 'verified',
      ).length || 0,
    pending:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          !e.verification_status || e.verification_status === 'pending',
      ).length || 0,
    rejected:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          e.verification_status === 'rejected',
      ).length || 0,
  };

  const now = new Date();
  const { data: tasks } = await admin
    .from('org_tasks')
    .select('status, due_date')
    .eq('organization_id', orgId);

  const taskSummary = {
    total: tasks?.length || 0,
    completed:
      tasks?.filter((t: { status: string }) => t.status === 'completed')
        .length || 0,
    overdue:
      tasks?.filter(
        (t: { status: string; due_date?: string }) =>
          t.status !== 'completed' && t.due_date && new Date(t.due_date) < now,
      ).length || 0,
  };

  const criticalGaps = await getCriticalGaps(orgId, admin, 'TRUST');

  return {
    generatedAt: new Date().toISOString(),
    organizationName: org?.name || 'Organization',
    organizationId: orgId,
    frameworkCode: 'TRUST',
    frameworkName: 'Buyer Trust Packet',
    readinessScore,
    controlSummary,
    evidenceSummary,
    taskSummary,
    gaps: {
      missingControls: controlSummary.missing,
      partialControls: controlSummary.partial,
      criticalGaps,
    },
  };
}

/**
 * Build base report with common data
 */
async function buildBaseReport(
  orgId: string,
  frameworkCode: string,
  frameworkName: string,
): Promise<BaseReportPayload> {
  const admin = createSupabaseAdminClient();

  // Get organization details
  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  // Get framework readiness
  const readinessData = await calculateFrameworkReadiness(orgId);
  const frameworkReadiness = readinessData.find(
    (r) => r.frameworkCode === frameworkCode,
  );

  // Get evidence summary
  const { data: evidence } = await admin
    .from('org_evidence')
    .select('verification_status')
    .eq('organization_id', orgId);

  const evidenceSummary = {
    total: evidence?.length || 0,
    verified:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          e.verification_status === 'verified',
      ).length || 0,
    pending:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          !e.verification_status || e.verification_status === 'pending',
      ).length || 0,
    rejected:
      evidence?.filter(
        (e: { verification_status?: string }) =>
          e.verification_status === 'rejected',
      ).length || 0,
  };

  // Get task summary
  const now = new Date();
  const { data: tasks } = await admin
    .from('org_tasks')
    .select('status, due_date')
    .eq('organization_id', orgId);

  const taskSummary = {
    total: tasks?.length || 0,
    completed:
      tasks?.filter((t: { status: string }) => t.status === 'completed')
        .length || 0,
    overdue:
      tasks?.filter(
        (t: { status: string; due_date?: string }) =>
          t.status !== 'completed' && t.due_date && new Date(t.due_date) < now,
      ).length || 0,
  };

  // Get critical gaps
  const criticalGaps = await getCriticalGaps(orgId, admin, frameworkCode);

  return {
    generatedAt: new Date().toISOString(),
    organizationName: org?.name || 'Organization',
    organizationId: orgId,
    frameworkCode,
    frameworkName,
    readinessScore: frameworkReadiness?.readinessScore || 0,
    controlSummary: {
      total: frameworkReadiness?.totalControls || 0,
      satisfied: frameworkReadiness?.satisfiedControls || 0,
      missing: frameworkReadiness?.missingControls || 0,
      partial: frameworkReadiness?.partialControls || 0,
    },
    evidenceSummary,
    taskSummary,
    gaps: {
      missingControls: frameworkReadiness?.missingControls || 0,
      partialControls: frameworkReadiness?.partialControls || 0,
      criticalGaps,
    },
  };
}

/**
 * Build ISO 27001 report with Statement of Applicability
 */
async function buildIso27001Report(
  orgId: string,
): Promise<Iso27001ReportPayload> {
  const baseReport = await buildBaseReport(orgId, 'ISO27001', 'ISO 27001:2022');
  const admin = createSupabaseAdminClient();

  // Get control evaluations for SoA
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(
      `
      control_id,
      compliance_score,
      evidence_count,
      compliance_controls!inner(code, title)
    `,
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot');

  // Build SoA entries
  const statementOfApplicability: SoaEntry[] = (evaluations || []).map(
    (eval_: any) => {
      const score = eval_.compliance_score || 0;
      let status: SoaEntry['implementationStatus'] = 'not_implemented';
      if (score >= 80) status = 'implemented';
      else if (score >= 40) status = 'partial';

      return {
        clauseNumber: eval_.compliance_controls?.code || 'A.X.X',
        controlName: eval_.compliance_controls?.title || 'Unknown Control',
        applicable: true,
        justification:
          score >= 80
            ? 'Control fully implemented with evidence'
            : 'Control requires additional implementation',
        implementationStatus: status,
        evidenceCount: eval_.evidence_count || 0,
      };
    },
  );

  // Get risk assessment summary
  const { data: risks } = await admin
    .from('org_risk_register')
    .select('severity, status')
    .eq('organization_id', orgId);

  const riskAssessmentSummary = {
    totalRisks: risks?.length || 0,
    highRisks:
      risks?.filter(
        (r: { severity?: string }) =>
          r.severity === 'high' || r.severity === 'critical',
      ).length || 0,
    mediumRisks:
      risks?.filter((r: { severity?: string }) => r.severity === 'medium')
        .length || 0,
    lowRisks:
      risks?.filter((r: { severity?: string }) => r.severity === 'low')
        .length || 0,
    mitigated:
      risks?.filter((r: { status?: string }) => r.status === 'mitigated')
        .length || 0,
  };

  return {
    ...baseReport,
    frameworkCode: 'ISO27001',
    statementOfApplicability,
    riskAssessmentSummary,
  };
}

/**
 * Build NDIS compliance report
 */
async function buildNdisReport(orgId: string): Promise<NdisReportPayload> {
  const baseReport = await buildBaseReport(
    orgId,
    'NDIS',
    'NDIS Practice Standards',
  );
  const admin = createSupabaseAdminClient();

  // Get NDIS practice standards evaluations
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(
      `
      control_id,
      compliance_score,
      evidence_count,
      last_evaluated_at,
      compliance_controls!inner(code, title, category)
    `,
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot');

  const practiceStandards: NdisPracticeStandard[] = (evaluations || []).map(
    (eval_: any) => {
      const score = eval_.compliance_score || 0;
      let status: NdisPracticeStandard['complianceStatus'] = 'non_compliant';
      if (score >= 80) status = 'compliant';
      else if (score >= 40) status = 'partial';

      return {
        standardCode: eval_.compliance_controls?.code || 'PS.X',
        standardName: eval_.compliance_controls?.title || 'Unknown Standard',
        category: eval_.compliance_controls?.category || 'Core',
        complianceStatus: status,
        evidenceCount: eval_.evidence_count || 0,
        lastReviewDate: eval_.last_evaluated_at,
      };
    },
  );

  // Get incident metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: incidents } = await admin
    .from('org_incidents')
    .select('status, severity, resolved_at, is_reportable, created_at')
    .eq('organization_id', orgId);

  // Calculate actual average resolution time (in days)
  const resolvedIncidents =
    incidents?.filter(
      (i: { status?: string; resolved_at?: string; created_at?: string }) =>
        i.status === 'resolved' && i.resolved_at && i.created_at,
    ) || [];

  let avgResolutionTime: number | null = null;
  if (resolvedIncidents.length > 0) {
    const totalDays = resolvedIncidents.reduce((sum: number, i: any) => {
      const created = new Date(i.created_at).getTime();
      const resolved = new Date(i.resolved_at).getTime();
      return sum + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgResolutionTime =
      Math.round((totalDays / resolvedIncidents.length) * 10) / 10;
  }

  const participantSafetyMetrics = {
    openIncidents:
      incidents?.filter((i: { status?: string }) => i.status === 'open')
        .length || 0,
    resolvedLast30Days:
      incidents?.filter(
        (i: { status?: string; resolved_at?: string }) =>
          i.status === 'resolved' &&
          i.resolved_at &&
          new Date(i.resolved_at) >= thirtyDaysAgo,
      ).length || 0,
    averageResolutionTime: avgResolutionTime ?? 0, // Real calculation
    reportableIncidents:
      incidents?.filter((i: { is_reportable?: boolean }) => i.is_reportable)
        .length || 0,
  };

  // Get staff credentials
  const { count: totalStaff } = await admin
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { data: credentials } = await admin
    .from('org_staff_credentials')
    .select('status, expires_at')
    .eq('organization_id', orgId);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Calculate actual compliant staff count from credentials
  const validCredentials =
    credentials?.filter(
      (c: { status?: string; expires_at?: string }) =>
        c.status === 'active' ||
        c.status === 'verified' ||
        (c.expires_at && new Date(c.expires_at) > now),
    ) || [];
  const compliantStaffCount = Math.min(
    validCredentials.length,
    totalStaff || 0,
  );

  const staffCredentialsSummary = {
    totalStaff: totalStaff || 0,
    compliantStaff: compliantStaffCount, // Real calculation
    expiringCredentials:
      credentials?.filter(
        (c: { expires_at?: string }) =>
          c.expires_at &&
          new Date(c.expires_at) > now &&
          new Date(c.expires_at) <= thirtyDaysFromNow,
      ).length || 0,
    expiredCredentials:
      credentials?.filter(
        (c: { status?: string; expires_at?: string }) =>
          c.status === 'expired' ||
          (c.expires_at && new Date(c.expires_at) < now),
      ).length || 0,
  };

  return {
    ...baseReport,
    frameworkCode: 'NDIS',
    practiceStandards,
    participantSafetyMetrics,
    staffCredentialsSummary,
  };
}

/**
 * Build HIPAA compliance report
 */
async function buildHipaaReport(orgId: string): Promise<HipaaReportPayload> {
  const baseReport = await buildBaseReport(orgId, 'HIPAA', 'HIPAA Compliance');
  const admin = createSupabaseAdminClient();

  // Get control evaluations grouped by category
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(
      `
      control_id,
      compliance_score,
      compliance_controls!inner(category)
    `,
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot');

  // Calculate rule compliance
  const calculateRuleCompliance = (category: string) => {
    const ruleEvals = (evaluations || []).filter((e: any) =>
      e.compliance_controls?.category
        ?.toLowerCase()
        .includes(category.toLowerCase()),
    );
    const totalReqs = ruleEvals.length || 1;
    const satisfiedReqs = ruleEvals.filter(
      (e: any) => (e.compliance_score || 0) >= 80,
    ).length;
    const avgScore = ruleEvals.length
      ? Math.round(
          ruleEvals.reduce(
            (sum: number, e: any) => sum + (e.compliance_score || 0),
            0,
          ) / ruleEvals.length,
        )
      : 0;
    const criticalGaps = ruleEvals.filter(
      (e: any) => (e.compliance_score || 0) < 40,
    ).length;

    return {
      complianceScore: avgScore,
      satisfiedRequirements: satisfiedReqs,
      totalRequirements: totalReqs,
      criticalGaps,
    };
  };

  const privacyRuleCompliance = {
    ruleName: 'Privacy Rule',
    ...calculateRuleCompliance('privacy'),
  };

  const securityRuleCompliance = {
    ruleName: 'Security Rule',
    ...calculateRuleCompliance('security'),
  };

  const breachNotificationCompliance = {
    ruleName: 'Breach Notification',
    ...calculateRuleCompliance('breach'),
  };

  const phiInventorySummary = await getPhiInventorySummary(orgId, admin);

  return {
    ...baseReport,
    frameworkCode: 'HIPAA',
    privacyRuleCompliance,
    securityRuleCompliance,
    breachNotificationCompliance,
    phiInventorySummary,
  };
}

async function getPhiInventorySummary(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<HipaaReportPayload['phiInventorySummary']> {
  try {
    const [totalRes, phiRes, restRes, transitRes] = await Promise.all([
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('contains_phi', true),
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('contains_phi', true)
        .eq('encrypted_at_rest', true),
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('contains_phi', true)
        .eq('encrypted_in_transit', true),
    ]);

    if (totalRes.error || phiRes.error || restRes.error || transitRes.error) {
      throw totalRes.error || phiRes.error || restRes.error || transitRes.error;
    }

    return {
      totalSystems: totalRes.count ?? 0,
      systemsWithPhi: phiRes.count ?? 0,
      encryptedAtRest: restRes.count ?? 0,
      encryptedInTransit: transitRes.count ?? 0,
    };
  } catch (err) {
    console.warn('[report-builder] PHI inventory lookup failed:', err);
    return {
      totalSystems: 0,
      systemsWithPhi: 0,
      encryptedAtRest: 0,
      encryptedInTransit: 0,
    };
  }
}

/**
 * Get critical gaps for a framework
 */
async function getCriticalGaps(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  frameworkCode: string,
): Promise<CriticalGap[]> {
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(
      `
      control_id,
      compliance_score,
      gap_description,
      compliance_controls!inner(code, title)
    `,
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot')
    .lt('compliance_score', 50)
    .order('compliance_score', { ascending: true })
    .limit(10);

  return (evaluations || []).map((eval_: any) => {
    const score = eval_.compliance_score || 0;
    return {
      controlCode: eval_.compliance_controls?.code || 'UNKNOWN',
      controlTitle: eval_.compliance_controls?.title || 'Unknown Control',
      reason:
        eval_.gap_description || 'Evidence gap or control not implemented',
      priority: score < 25 ? 'critical' : score < 40 ? 'high' : 'medium',
    } as CriticalGap;
  });
}
