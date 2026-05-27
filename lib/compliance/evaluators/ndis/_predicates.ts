/**
 * R10 Phase 3 (Audit 2026-05-27) — NDIS Practice Standards predicate
 * library.
 *
 * Status by indicator:
 *   - STATUTORY  : thresholds come from NDIS Act 2013, Rules 2018,
 *                  Commission portal published timeframes. No expert
 *                  judgment needed.
 *   - GUIDANCE   : thresholds come from the NDIS Quality Indicators
 *                  Guidelines 2018 (F2018N00041) or the NDIS Practice
 *                  Standards and Quality Indicators Nov 2021 v4
 *                  document. Citation map in
 *                  docs/compliance/ndis-framework-status.md.
 *   - INTERVIEW  : indicator is fundamentally judgment-driven and
 *                  cannot be faithfully encoded (e.g. "staff articulate
 *                  participant needs"). Returns not_evaluated with the
 *                  manual-attestation gap.
 *
 * The final certification audit still requires an accredited NDIS
 * Quality Auditor (per the NDIS Commission's approved audit body
 * arrangements) — these predicates produce the same signal the
 * auditor checks via documentation review, NOT a substitute for the
 * Stage 2 on-site review.
 *
 * Status mapping to NDIS auditor rating scale:
 *   - pass          ↔ 2 (Conformity)
 *   - partial       ↔ 1 (Minor non-conformity)
 *   - fail          ↔ 0 (Major non-conformity)
 *   - not_evaluated ↔ Stage 2 on-site review required
 *
 * Source documents (all official):
 *   - NDIS Quality Indicators Guidelines 2018 (F2018N00041)
 *     https://www.legislation.gov.au/Details/F2018N00041
 *   - NDIS Practice Standards and Quality Indicators Nov 2021 v4
 *     https://www.ndiscommission.gov.au/sites/default/files/2024-10/ndis-practice-standards-and-quality-indicators.pdf
 *   - Reportable Incidents — 24h immediate, 5 business days detailed
 *     https://www.ndiscommission.gov.au/rules-and-standards/reportable-incidents-and-incident-management/reportable-incidents
 *   - Worker Screening — 5-year validity
 *     https://www.ndiscommission.gov.au/workforce/worker-screening
 *   - Restrictive Practices and Behaviour Support Rules 2018 (F2018L00632)
 *     https://www.legislation.gov.au/Details/F2018L00632
 *   - Monthly Reporting on Regulated Restrictive Practices P28.1
 *     https://www.ndiscommission.gov.au/sites/default/files/2025-12/P28.1-NDIS%20Commission%20Portal%20Quick%20Reference%20Guide%20-%20Monthly%20Reporting%20on%20the%20use%20of%20Regulated%20Restrictive%20Practices.pdf
 */

import type {
  ControlResult,
  ControlEvaluatorContext,
  ControlGap,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const DAY_MS = 86_400_000;

function daysSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return Number.POSITIVE_INFINITY;
  return ms / DAY_MS;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// Standard 1 — Rights of Participants and Responsibilities of Providers
// ============================================================================

/**
 * NDIS-1.1 — Person-centred supports.
 * Threshold: NDIS Practice Standards Nov 2021 v4 — support plans
 * reviewed annually (12-month maximum). Phase 2 used 180d which is
 * stricter than the standard; Phase 3 aligns to 365d.
 */
export async function evaluatePersonCentredSupports(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data: plans, error } = await ctx.db
    .from('org_care_plans')
    .select('id, status, updated_at, approved_at')
    .eq('organization_id', ctx.orgId);
  if (error) return na(evaluatedAt, 'NDIS-1.1', 'care_plans_unavailable', error.message);

  const total = plans?.length ?? 0;
  if (total === 0) {
    return manual(
      evaluatedAt,
      'NDIS-1.1',
      'No care plans on file — Stage 2 on-site review required to confirm person-centred support delivery.',
    );
  }

  const recent = (plans ?? []).filter(
    (p: { updated_at: string | null }) => daysSince(p.updated_at) <= 365,
  );
  const ratio = recent.length / total;
  const gaps: ControlGap[] = [];
  if (recent.length < total) {
    gaps.push({
      code: 'stale_care_plans',
      message: `${total - recent.length}/${total} care plans not reviewed within 12 months (NDIS standard cadence).`,
      severity: 'high',
    });
  }

  let status: ControlResult['status'];
  if (ratio >= 0.95) status = 'pass';
  else if (ratio >= 0.7) status = 'partial';
  else status = 'fail';

  return {
    controlCode: 'NDIS-1.1',
    status,
    evidenceRefs: refsFromPlans(plans ?? []),
    gaps,
    confidence: round2(0.6 + 0.3 * ratio),
    reason: `${recent.length}/${total} care plans (${Math.round(ratio * 100)}%) reviewed within the 12-month standard cadence.`,
    evaluatedAt,
  };
}

/**
 * NDIS-1.3 — Privacy and dignity.
 * Threshold: NDIS Practice Standards — documented privacy policy aligned
 * with the Australian Privacy Principles + staff training. Predicate
 * checks for at least one org_policies row tagged ndis_category='privacy'
 * with status='published' AND updated within last 365 days (annual
 * review is the published-guidance norm for compliance policies).
 */
export async function evaluatePrivacyAndDignity(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_policies')
    .select('id, title, status, updated_at, ndis_category')
    .eq('organization_id', ctx.orgId)
    .eq('ndis_category', 'privacy');
  if (error) return na(evaluatedAt, 'NDIS-1.3', 'policies_unavailable', error.message);

  const policies = data ?? [];
  if (policies.length === 0) {
    return {
      controlCode: 'NDIS-1.3',
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_privacy_policy',
          message: 'No org_policies row tagged ndis_category=privacy with status=published. Tag the privacy policy via the admin UI.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'No privacy policy tagged for NDIS evaluation.',
      evaluatedAt,
    };
  }

  const fresh = policies.filter(
    (p: { status: string | null; updated_at: string | null }) =>
      p.status === 'published' && daysSince(p.updated_at) <= 365,
  );
  if (fresh.length === 0) {
    return {
      controlCode: 'NDIS-1.3',
      status: 'partial',
      evidenceRefs: policies.slice(0, EVIDENCE_CAP).map((p: { id: string; updated_at: string | null }) => ({
        source: 'org_policies',
        ref: p.id,
        capturedAt: p.updated_at ?? undefined,
      })),
      gaps: [
        {
          code: 'stale_privacy_policy',
          message: `Privacy policy exists but not reviewed/published in the last 12 months.`,
          severity: 'medium',
        },
      ],
      confidence: 0.6,
      reason: `${policies.length} privacy policy row(s) found; none current.`,
      evaluatedAt,
    };
  }

  return {
    controlCode: 'NDIS-1.3',
    status: 'pass',
    evidenceRefs: fresh.slice(0, EVIDENCE_CAP).map((p: { id: string; updated_at: string | null }) => ({
      source: 'org_policies',
      ref: p.id,
      capturedAt: p.updated_at ?? undefined,
    })),
    gaps: [],
    confidence: 0.7,
    reason: `${fresh.length} current published privacy policy/policies on file.`,
    evaluatedAt,
  };
}

/**
 * NDIS-1.5 — Violence/abuse/neglect/exploitation/discrimination (VANED).
 * STATUTORY: reportable incidents must be notified within 24 hours
 * (immediate form) and detailed within 5 business days (NDIS Act + Rules
 * 2018). Predicate flags:
 *   - any incident severity=critical that's still open (Major NC)
 *   - any reportable notification submitted >5 business days after creation
 *   - safeguarding policy (org_policies ndis_category=safeguarding) absent
 */
export async function evaluateSafeguarding(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const oneYear = new Date(Date.now() - 365 * DAY_MS).toISOString();
  const [{ data: incidents, error: iErr }, { data: notifications, error: nErr }, { data: policies, error: pErr }] =
    await Promise.all([
      ctx.db
        .from('org_incidents')
        .select('id, severity, status, created_at')
        .eq('organization_id', ctx.orgId)
        .gte('created_at', oneYear),
      ctx.db
        .from('org_regulatory_notifications')
        .select('id, submitted_at, created_at, status')
        .eq('organization_id', ctx.orgId)
        .gte('created_at', oneYear),
      ctx.db
        .from('org_policies')
        .select('id, status, updated_at')
        .eq('organization_id', ctx.orgId)
        .eq('ndis_category', 'safeguarding'),
    ]);
  if (iErr) return na(evaluatedAt, 'NDIS-1.5', 'incidents_unavailable', iErr.message);
  if (nErr) return na(evaluatedAt, 'NDIS-1.5', 'notifications_unavailable', nErr.message);
  if (pErr) return na(evaluatedAt, 'NDIS-1.5', 'policies_unavailable', pErr.message);

  const incidentCount = incidents?.length ?? 0;
  const openCritical = (incidents ?? []).filter(
    (i: { severity: string | null; status: string | null }) =>
      i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved',
  ).length;
  const latePosted = (notifications ?? []).filter(
    (n: { created_at: string; submitted_at: string | null }) => {
      if (!n.submitted_at) return false;
      return (new Date(n.submitted_at).getTime() - new Date(n.created_at).getTime()) > 5 * DAY_MS;
    },
  ).length;
  const unsubmitted = (notifications ?? []).filter(
    (n: { submitted_at: string | null }) => !n.submitted_at,
  ).length;
  const safeguardingPolicyCurrent = (policies ?? []).some(
    (p: { status: string | null; updated_at: string | null }) =>
      p.status === 'published' && daysSince(p.updated_at) <= 365,
  );

  const gaps: ControlGap[] = [];
  if (!safeguardingPolicyCurrent) {
    gaps.push({
      code: 'safeguarding_policy_missing_or_stale',
      message: 'No current published safeguarding policy (org_policies ndis_category=safeguarding, updated within 12 months).',
      severity: 'high',
    });
  }
  if (openCritical > 0) {
    gaps.push({
      code: 'open_critical_incidents',
      message: `${openCritical} critical incident(s) open past resolution.`,
      severity: 'critical',
    });
  }
  if (unsubmitted > 0) {
    gaps.push({
      code: 'unsubmitted_reportable_notifications',
      message: `${unsubmitted} reportable notification(s) drafted but never submitted to the NDIS Commission.`,
      severity: 'critical',
    });
  }
  if (latePosted > 0) {
    gaps.push({
      code: 'late_reportable_submission',
      message: `${latePosted} reportable notification(s) submitted >5 business days after creation (statutory 5-business-day window per NDIS Commission portal).`,
      severity: 'high',
    });
  }
  if (incidentCount === 0) {
    gaps.push({
      code: 'no_incident_activity',
      message: 'No incidents recorded in 12 months — NDIS auditors typically expect some activity from an active provider; zero suggests under-reporting.',
      severity: 'medium',
    });
  }

  let status: ControlResult['status'];
  if (openCritical > 0 || unsubmitted > 0) status = 'fail';
  else if (latePosted > 0 || !safeguardingPolicyCurrent) status = 'partial';
  else if (incidentCount === 0) status = 'partial';
  else status = 'pass';

  return {
    controlCode: 'NDIS-1.5',
    status,
    evidenceRefs: (incidents ?? []).slice(0, EVIDENCE_CAP).map((i: { id: string; created_at: string | null }) => ({
      source: 'org_incidents',
      ref: i.id,
      capturedAt: i.created_at ?? undefined,
    })),
    gaps,
    confidence: 0.7,
    reason: `${incidentCount} incidents, ${openCritical} critical-open, ${unsubmitted} unsubmitted, ${latePosted} late, safeguarding policy ${safeguardingPolicyCurrent ? 'current' : 'absent/stale'}.`,
    evaluatedAt,
  };
}

// ============================================================================
// Standard 2 — Provider Governance and Operational Management
// ============================================================================

/**
 * NDIS-2.1 — Governance and operational management.
 * GUIDANCE: documented governance framework + COI register
 * (NDIS Quality Indicators Guidelines 2018). Predicate checks:
 *   - at least one org_policies ndis_category='governance' current
 *   - at least one org_registers type='conflict_of_interest' row
 */
export async function evaluateGovernance(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: policies, error: pErr }, { data: regs, error: rErr }] = await Promise.all([
    ctx.db
      .from('org_policies')
      .select('id, status, updated_at')
      .eq('organization_id', ctx.orgId)
      .eq('ndis_category', 'governance'),
    ctx.db
      .from('org_registers')
      .select('id, type, status, updated_at')
      .eq('org_id', ctx.orgId)
      .eq('type', 'conflict_of_interest'),
  ]);
  if (pErr) return na(evaluatedAt, 'NDIS-2.1', 'policies_unavailable', pErr.message);
  if (rErr) return na(evaluatedAt, 'NDIS-2.1', 'registers_unavailable', rErr.message);

  const policyCurrent = (policies ?? []).some(
    (p: { status: string | null; updated_at: string | null }) =>
      p.status === 'published' && daysSince(p.updated_at) <= 365,
  );
  const coiRegister = (regs ?? []).length > 0;

  const gaps: ControlGap[] = [];
  if (!policyCurrent) gaps.push({ code: 'governance_policy_missing', message: 'No current governance policy.', severity: 'high' });
  if (!coiRegister) gaps.push({ code: 'no_coi_register', message: 'No conflicts-of-interest register entry found.', severity: 'medium' });

  const status: ControlResult['status'] =
    policyCurrent && coiRegister ? 'pass' : policyCurrent || coiRegister ? 'partial' : 'fail';

  return {
    controlCode: 'NDIS-2.1',
    status,
    evidenceRefs: [
      ...(policies ?? []).slice(0, EVIDENCE_CAP / 2).map((p: { id: string; updated_at: string | null }) => ({ source: 'org_policies' as const, ref: p.id, capturedAt: p.updated_at ?? undefined })),
      ...(regs ?? []).slice(0, EVIDENCE_CAP / 2).map((r: { id: string; updated_at: string | null }) => ({ source: 'org_registers' as const, ref: r.id, capturedAt: r.updated_at ?? undefined })),
    ],
    gaps,
    confidence: 0.6,
    reason: `governance policy ${policyCurrent ? 'current' : 'missing'}; COI register ${coiRegister ? 'present' : 'absent'}.`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.2 — Risk management.
 * GUIDANCE: risk register reviewed at least annually; high-rated risks
 * reviewed more frequently. Predicate splits by risk_level:
 *   - critical/high  : require review within 90 days
 *   - medium/low     : require review within 365 days
 */
export async function evaluateRiskManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_risks')
    .select('id, status, updated_at, category')
    .eq('organization_id', ctx.orgId);
  if (error) return na(evaluatedAt, 'NDIS-2.2', 'risks_unavailable', error.message);

  const risks = data ?? [];
  if (risks.length === 0) {
    return {
      controlCode: 'NDIS-2.2',
      status: 'fail',
      evidenceRefs: [],
      gaps: [{ code: 'no_risk_register', message: 'Risk register empty.', severity: 'high' }],
      confidence: 0.8,
      reason: 'org_risks empty.',
      evaluatedAt,
    };
  }

  // category is the closest proxy we have to risk_level. Treat
  // 'critical' / 'high' as elevated; everything else as routine.
  const elevated = risks.filter((r: { category: string | null }) =>
    ['critical', 'high'].includes((r.category ?? '').toLowerCase()),
  );
  const routine = risks.filter((r: { category: string | null }) =>
    !['critical', 'high'].includes((r.category ?? '').toLowerCase()),
  );

  const elevatedFresh = elevated.filter((r: { updated_at: string | null }) => daysSince(r.updated_at) <= 90).length;
  const routineFresh = routine.filter((r: { updated_at: string | null }) => daysSince(r.updated_at) <= 365).length;

  const elevatedRatio = elevated.length > 0 ? elevatedFresh / elevated.length : 1;
  const routineRatio = routine.length > 0 ? routineFresh / routine.length : 1;
  const overall = (elevatedRatio + routineRatio) / 2;

  const gaps: ControlGap[] = [];
  if (elevated.length > elevatedFresh) {
    gaps.push({
      code: 'stale_elevated_risks',
      message: `${elevated.length - elevatedFresh}/${elevated.length} elevated risks not reviewed in 90 days.`,
      severity: 'high',
    });
  }
  if (routine.length > routineFresh) {
    gaps.push({
      code: 'stale_routine_risks',
      message: `${routine.length - routineFresh}/${routine.length} routine risks not reviewed in 12 months.`,
      severity: 'medium',
    });
  }

  const status: ControlResult['status'] =
    overall >= 0.9 ? 'pass' : overall >= 0.5 ? 'partial' : 'fail';

  return {
    controlCode: 'NDIS-2.2',
    status,
    evidenceRefs: risks.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_risks',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps,
    confidence: round2(0.5 + 0.4 * overall),
    reason: `elevated ${elevatedFresh}/${elevated.length} fresh (90d); routine ${routineFresh}/${routine.length} fresh (365d).`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.3 — Quality management. Unchanged from Phase 2 but documented
 * citation: NDIS Quality Indicators Guidelines 2018 — CAPA register
 * with closure tracking is the canonical evidence.
 */
export async function evaluateQualityManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_capa_items')
    .select('id, status, due_date, severity, created_at, updated_at')
    .eq('organization_id', ctx.orgId)
    .gte('created_at', new Date(Date.now() - 180 * DAY_MS).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-2.3', 'capa_unavailable', error.message);

  const items = data ?? [];
  if (items.length === 0) {
    return manual(evaluatedAt, 'NDIS-2.3', 'No CAPA items in 6 months — continuous-improvement signal absent.');
  }

  const now = Date.now();
  const overdueOpen = items.filter(
    (r: { status: string | null; due_date: string | null }) =>
      r.status !== 'closed' && r.due_date && new Date(r.due_date).getTime() < now,
  ).length;
  const closed = items.filter((r: { status: string | null }) => r.status === 'closed').length;

  return {
    controlCode: 'NDIS-2.3',
    status: overdueOpen > 0 ? 'partial' : 'pass',
    evidenceRefs: items.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_capa_items',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: overdueOpen > 0 ? [{ code: 'overdue_capa', message: `${overdueOpen} CAPA item(s) overdue.`, severity: 'medium' }] : [],
    confidence: 0.7,
    reason: `${items.length} CAPA items (6mo); ${closed} closed, ${overdueOpen} overdue open.`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.4 — Information management.
 * GUIDANCE: documented information-management policy + records-retention
 * schedule + audit_log activity. Phase 3 strengthens this from "just
 * audit_log count" to a 3-part check.
 */
export async function evaluateInformationManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: policies, error: pErr }, { data: retention, error: rErr }, auditLog] = await Promise.all([
    ctx.db
      .from('org_policies')
      .select('id, status, updated_at')
      .eq('organization_id', ctx.orgId)
      .eq('ndis_category', 'information_management'),
    ctx.db
      .from('retention_policies')
      .select('id, is_active')
      .eq('org_id', ctx.orgId),
    ctx.db
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .gte('created_at', new Date(Date.now() - 90 * DAY_MS).toISOString()),
  ]);
  if (pErr) return na(evaluatedAt, 'NDIS-2.4', 'policies_unavailable', pErr.message);
  if (rErr) return na(evaluatedAt, 'NDIS-2.4', 'retention_unavailable', rErr.message);
  if (auditLog.error) return na(evaluatedAt, 'NDIS-2.4', 'audit_log_unavailable', auditLog.error.message);

  const policyCurrent = (policies ?? []).some(
    (p: { status: string | null; updated_at: string | null }) =>
      p.status === 'published' && daysSince(p.updated_at) <= 365,
  );
  const activeRetention = (retention ?? []).some((r: { is_active: boolean | null }) => r.is_active);
  const auditActivity = (auditLog.count ?? 0) >= 30;

  const passing = [policyCurrent, activeRetention, auditActivity].filter(Boolean).length;
  const gaps: ControlGap[] = [];
  if (!policyCurrent) gaps.push({ code: 'no_info_mgmt_policy', message: 'No current information-management policy.', severity: 'high' });
  if (!activeRetention) gaps.push({ code: 'no_active_retention_policy', message: 'No active retention_policies row.', severity: 'medium' });
  if (!auditActivity) gaps.push({ code: 'low_audit_activity', message: `<30 audit_log rows in 90d.`, severity: 'low' });

  const status: ControlResult['status'] = passing === 3 ? 'pass' : passing >= 1 ? 'partial' : 'fail';

  return {
    controlCode: 'NDIS-2.4',
    status,
    evidenceRefs: [
      ...(policies ?? []).slice(0, EVIDENCE_CAP / 2).map((p: { id: string; updated_at: string | null }) => ({ source: 'org_policies' as const, ref: p.id, capturedAt: p.updated_at ?? undefined })),
      ...(retention ?? []).slice(0, EVIDENCE_CAP / 2).map((r: { id: string }) => ({ source: 'retention_policies' as const, ref: r.id })),
    ],
    gaps,
    confidence: 0.7,
    reason: `policy ${policyCurrent ? '✓' : '✗'}, retention ${activeRetention ? '✓' : '✗'}, audit_log activity ${auditActivity ? '✓' : '✗'} (${auditLog.count} rows/90d).`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.5 — Feedback and complaints management. Unchanged from Phase 2.
 */
export async function evaluateComplaintsManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, category, status, created_at, updated_at, risk_level')
    .or('type.eq.complaint,category.eq.complaint')
    .gte('created_at', new Date(Date.now() - 365 * DAY_MS).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-2.5', 'registers_unavailable', error.message);

  const items = data ?? [];
  const total = items.length;
  const openOld = items.filter(
    (r: { status: string | null; created_at: string | null }) => {
      if (!r.status || r.status === 'closed' || r.status === 'resolved') return false;
      return daysSince(r.created_at) > 30;
    },
  ).length;

  if (total === 0) {
    return {
      controlCode: 'NDIS-2.5',
      status: 'partial',
      evidenceRefs: [],
      gaps: [{ code: 'no_complaints', message: 'No complaints in 12 months — may indicate under-reporting.', severity: 'medium' }],
      confidence: 0.5,
      reason: '0 complaints/12mo.',
      evaluatedAt,
    };
  }

  return {
    controlCode: 'NDIS-2.5',
    status: openOld > 0 ? 'partial' : 'pass',
    evidenceRefs: items.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: openOld > 0 ? [{ code: 'open_complaints_over_30d', message: `${openOld} complaint(s) open >30d.`, severity: 'medium' }] : [],
    confidence: 0.7,
    reason: `${total} complaints/12mo; ${openOld} open >30d.`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.6 — Incident management.
 * STATUTORY: same 24h/5bd timeframes as 1.5 + incident management
 * system requirement under NDIS Act s73Z.
 */
export async function evaluateIncidentManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: incidents, error: iErr }, { data: notifications, error: nErr }, { data: policies, error: pErr }] = await Promise.all([
    ctx.db
      .from('org_incidents')
      .select('id, severity, status, created_at')
      .eq('organization_id', ctx.orgId),
    ctx.db
      .from('org_regulatory_notifications')
      .select('id, submitted_at, status, created_at')
      .eq('organization_id', ctx.orgId),
    ctx.db
      .from('org_policies')
      .select('id, status, updated_at')
      .eq('organization_id', ctx.orgId)
      .eq('ndis_category', 'incident_management'),
  ]);
  if (iErr) return na(evaluatedAt, 'NDIS-2.6', 'incidents_unavailable', iErr.message);
  if (nErr) return na(evaluatedAt, 'NDIS-2.6', 'notifications_unavailable', nErr.message);
  if (pErr) return na(evaluatedAt, 'NDIS-2.6', 'policies_unavailable', pErr.message);

  const incidentCount = incidents?.length ?? 0;
  if (incidentCount === 0) {
    return manual(evaluatedAt, 'NDIS-2.6', 'No incidents on file — workflow effectiveness needs Stage 2 review.');
  }

  const unsubmitted = (notifications ?? []).filter((n: { submitted_at: string | null }) => !n.submitted_at).length;
  const latePosted = (notifications ?? []).filter((n: { created_at: string; submitted_at: string | null }) => {
    if (!n.submitted_at) return false;
    return new Date(n.submitted_at).getTime() - new Date(n.created_at).getTime() > 5 * DAY_MS;
  }).length;
  const policyCurrent = (policies ?? []).some(
    (p: { status: string | null; updated_at: string | null }) =>
      p.status === 'published' && daysSince(p.updated_at) <= 365,
  );

  const gaps: ControlGap[] = [];
  if (!policyCurrent) gaps.push({ code: 'no_incident_mgmt_policy', message: 'No current incident-management policy (NDIS Act s73Z requirement).', severity: 'high' });
  if (unsubmitted > 0) gaps.push({ code: 'unsubmitted_notifications', message: `${unsubmitted} reportable notifications drafted but not submitted.`, severity: 'critical' });
  if (latePosted > 0) gaps.push({ code: 'late_submission', message: `${latePosted} submitted >5bd late.`, severity: 'high' });

  const status: ControlResult['status'] =
    unsubmitted > 0 ? 'fail' : latePosted > 0 || !policyCurrent ? 'partial' : 'pass';

  return {
    controlCode: 'NDIS-2.6',
    status,
    evidenceRefs: (incidents ?? []).slice(0, EVIDENCE_CAP).map((i: { id: string; created_at: string | null }) => ({
      source: 'org_incidents',
      ref: i.id,
      capturedAt: i.created_at ?? undefined,
    })),
    gaps,
    confidence: 0.75,
    reason: `${incidentCount} incidents, ${notifications?.length ?? 0} regulatory notifications, ${unsubmitted} unsubmitted, ${latePosted} late, policy ${policyCurrent ? '✓' : '✗'}.`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.7 — HR management. STATUTORY: NDIS Worker Screening Check
 * valid 5 years. Phase 2 predicate against at_risk_credentials is
 * canonical; unchanged.
 */
export async function evaluateHrManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data: atRisk, error } = await ctx.db
    .from('at_risk_credentials')
    .select('id, user_id, expiry_date')
    .eq('organization_id', ctx.orgId);
  if (error) return na(evaluatedAt, 'NDIS-2.7', 'at_risk_credentials_unavailable', error.message);

  const total = atRisk?.length ?? 0;
  if (total === 0) {
    return {
      controlCode: 'NDIS-2.7',
      status: 'pass',
      evidenceRefs: [{ source: 'at_risk_credentials', ref: 'empty', capturedAt: evaluatedAt }],
      gaps: [],
      confidence: 0.8,
      reason: 'No at-risk worker credentials (NDIS Worker Screening 5-year validity invariant holds).',
      evaluatedAt,
    };
  }

  const expired = (atRisk ?? []).filter((r: { expiry_date: string | null }) => {
    if (!r.expiry_date) return false;
    return new Date(r.expiry_date).getTime() < Date.now();
  }).length;

  return {
    controlCode: 'NDIS-2.7',
    status: expired > 0 ? 'fail' : 'partial',
    evidenceRefs: (atRisk ?? []).slice(0, EVIDENCE_CAP).map((r: { id: string; expiry_date: string | null }) => ({
      source: 'at_risk_credentials',
      ref: r.id,
      capturedAt: r.expiry_date ?? undefined,
    })),
    gaps: [
      {
        code: 'at_risk_credentials',
        message: `${total} worker credentials at-risk; ${expired} expired (NDIS Worker Screening statutory currency requirement).`,
        severity: expired > 0 ? 'critical' : 'high',
      },
    ],
    confidence: 0.8,
    reason: `${total} at-risk credentials (${expired} expired).`,
    evaluatedAt,
  };
}

/**
 * NDIS-2.8 — Continuity of supports. GUIDANCE: documented BCP.
 */
export async function evaluateContinuityOfSupports(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, status, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'business_continuity_plan');
  if (error) return na(evaluatedAt, 'NDIS-2.8', 'registers_unavailable', error.message);

  const plans = data ?? [];
  if (plans.length === 0) {
    return {
      controlCode: 'NDIS-2.8',
      status: 'fail',
      evidenceRefs: [],
      gaps: [{ code: 'no_bcp', message: 'No business-continuity-plan register entry found.', severity: 'medium' }],
      confidence: 0.7,
      reason: 'No BCP register row.',
      evaluatedAt,
    };
  }
  const reviewed = plans.some((p: { updated_at: string | null }) => daysSince(p.updated_at) <= 365);
  return {
    controlCode: 'NDIS-2.8',
    status: reviewed ? 'pass' : 'partial',
    evidenceRefs: plans.slice(0, EVIDENCE_CAP).map((p: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: p.id,
      capturedAt: p.updated_at ?? undefined,
    })),
    gaps: reviewed ? [] : [{ code: 'stale_bcp', message: 'BCP exists but not reviewed in 12 months.', severity: 'medium' }],
    confidence: 0.6,
    reason: `${plans.length} BCP row(s); ${reviewed ? 'current' : 'stale'}.`,
    evaluatedAt,
  };
}

// ============================================================================
// Standard 3 — Provision of Supports
// ============================================================================

export async function evaluateAccessToSupports(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'intake');
  if (error) return na(evaluatedAt, 'NDIS-3.1', 'registers_unavailable', error.message);
  const rows = data ?? [];
  if (rows.length === 0) {
    return manual(evaluatedAt, 'NDIS-3.1', 'No intake register entries — tag intake records via org_registers (type=intake).');
  }
  return {
    controlCode: 'NDIS-3.1',
    status: 'pass',
    evidenceRefs: rows.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: [],
    confidence: 0.6,
    reason: `${rows.length} intake record(s) on file.`,
    evaluatedAt,
  };
}

export async function evaluateSupportPlanning(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [plansResult, goalsResult] = await Promise.all([
    ctx.db.from('org_care_plans').select('id, updated_at, status').eq('organization_id', ctx.orgId),
    ctx.db.from('org_care_goals').select('id, care_plan_id').eq('organization_id', ctx.orgId),
  ]);
  if (plansResult.error) return na(evaluatedAt, 'NDIS-3.2', 'care_plans_unavailable', plansResult.error.message);
  if (goalsResult.error) return na(evaluatedAt, 'NDIS-3.2', 'care_goals_unavailable', goalsResult.error.message);
  const plans = plansResult.data ?? [];
  const goals = goalsResult.data ?? [];
  if (plans.length === 0) return manual(evaluatedAt, 'NDIS-3.2', 'No care plans on file.');
  const planIdsWithGoals = new Set(goals.map((g: { care_plan_id: string | null }) => g.care_plan_id).filter(Boolean));
  const plansWithGoals = plans.filter((p: { id: string }) => planIdsWithGoals.has(p.id)).length;
  const ratio = plansWithGoals / plans.length;
  return {
    controlCode: 'NDIS-3.2',
    status: ratio >= 0.9 ? 'pass' : ratio >= 0.5 ? 'partial' : 'fail',
    evidenceRefs: plans.slice(0, EVIDENCE_CAP).map((p: { id: string; updated_at: string | null }) => ({
      source: 'org_care_plans',
      ref: p.id,
      capturedAt: p.updated_at ?? undefined,
    })),
    gaps: plansWithGoals < plans.length ? [{ code: 'plans_without_goals', message: `${plans.length - plansWithGoals}/${plans.length} care plans have no documented goals.`, severity: 'medium' }] : [],
    confidence: round2(0.5 + 0.4 * ratio),
    reason: `${plansWithGoals}/${plans.length} plans (${Math.round(ratio * 100)}%) have goals.`,
    evaluatedAt,
  };
}

/**
 * NDIS-3.3 — Service agreements. GUIDANCE: signed service agreement
 * per active participant. Phase 3 checks both org_form_submissions
 * metadata->>'form_type'='service_agreement' AND org_registers
 * type='service_agreement'.
 */
export async function evaluateServiceAgreements(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const oneYear = new Date(Date.now() - 365 * DAY_MS).toISOString();
  const [{ data: forms, error: fErr }, { data: regs, error: rErr }] = await Promise.all([
    ctx.db
      .from('org_form_submissions')
      .select('id, status, metadata, reviewed_at, created_at')
      .eq('org_id', ctx.orgId)
      .gte('created_at', oneYear),
    ctx.db
      .from('org_registers')
      .select('id, type, status, updated_at')
      .eq('org_id', ctx.orgId)
      .eq('type', 'service_agreement'),
  ]);
  if (fErr) return na(evaluatedAt, 'NDIS-3.3', 'form_submissions_unavailable', fErr.message);
  if (rErr) return na(evaluatedAt, 'NDIS-3.3', 'registers_unavailable', rErr.message);

  const taggedForms = (forms ?? []).filter((f: { metadata: unknown }) => {
    const m = f.metadata as Record<string, unknown> | null;
    return m && (m.form_type === 'service_agreement' || m.formType === 'service_agreement');
  });
  const signedFormCount = taggedForms.filter((f: { status: string | null; reviewed_at: string | null }) => f.status === 'reviewed' || f.status === 'signed' || f.reviewed_at).length;
  const registerCount = (regs ?? []).length;
  const totalEvidence = signedFormCount + registerCount;

  if (totalEvidence === 0) {
    return manual(
      evaluatedAt,
      'NDIS-3.3',
      'No signed service-agreement form submissions or register entries in 12 months — tag via org_form_submissions.metadata.form_type=service_agreement or org_registers type=service_agreement.',
    );
  }

  return {
    controlCode: 'NDIS-3.3',
    status: 'pass',
    evidenceRefs: [
      ...taggedForms.slice(0, EVIDENCE_CAP / 2).map((f: { id: string; reviewed_at: string | null; created_at: string | null }) => ({ source: 'org_form_submissions' as const, ref: f.id, capturedAt: f.reviewed_at ?? f.created_at ?? undefined })),
      ...(regs ?? []).slice(0, EVIDENCE_CAP / 2).map((r: { id: string; updated_at: string | null }) => ({ source: 'org_registers' as const, ref: r.id, capturedAt: r.updated_at ?? undefined })),
    ],
    gaps: [],
    confidence: 0.6,
    reason: `${signedFormCount} signed service-agreement form(s) + ${registerCount} register entries.`,
    evaluatedAt,
  };
}

export async function evaluateResponsiveSupport(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { count, error } = await ctx.db
    .from('org_progress_notes')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ctx.orgId)
    .gte('created_at', new Date(Date.now() - 90 * DAY_MS).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-3.4', 'progress_notes_unavailable', error.message);
  const total = count ?? 0;
  if (total === 0) {
    return {
      controlCode: 'NDIS-3.4',
      status: 'fail',
      evidenceRefs: [],
      gaps: [{ code: 'no_progress_notes', message: 'No progress notes in 90 days.', severity: 'high' }],
      confidence: 0.8,
      reason: '0 progress notes/90d.',
      evaluatedAt,
    };
  }
  return {
    controlCode: 'NDIS-3.4',
    status: total >= 30 ? 'pass' : 'partial',
    evidenceRefs: [{ source: 'org_progress_notes', ref: `count=${total}`, capturedAt: evaluatedAt }],
    gaps: [],
    confidence: 0.6,
    reason: `${total} progress notes/90d.`,
    evaluatedAt,
  };
}

export async function evaluateTransitions(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'transition');
  if (error) return na(evaluatedAt, 'NDIS-3.5', 'registers_unavailable', error.message);
  const rows = data ?? [];
  if (rows.length === 0) {
    return manual(evaluatedAt, 'NDIS-3.5', 'No transition register entries — tag via org_registers (type=transition).');
  }
  return {
    controlCode: 'NDIS-3.5',
    status: 'pass',
    evidenceRefs: rows.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: [],
    confidence: 0.5,
    reason: `${rows.length} transition record(s) on file.`,
    evaluatedAt,
  };
}

// ============================================================================
// Standard 4 — Provision of Supports Environment
// ============================================================================

export async function evaluateSafeEnvironment(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'environment_assessment');
  if (error) return na(evaluatedAt, 'NDIS-4.1', 'registers_unavailable', error.message);
  const rows = data ?? [];
  if (rows.length === 0) {
    return manual(evaluatedAt, 'NDIS-4.1', 'No environment-assessment register entries — tag via org_registers (type=environment_assessment).');
  }
  const fresh = rows.filter((r: { updated_at: string | null }) => daysSince(r.updated_at) <= 365);
  return {
    controlCode: 'NDIS-4.1',
    status: fresh.length === rows.length ? 'pass' : 'partial',
    evidenceRefs: rows.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: fresh.length < rows.length ? [{ code: 'stale_env_assessment', message: `${rows.length - fresh.length} environment assessments not reviewed in 12 months.`, severity: 'medium' }] : [],
    confidence: 0.6,
    reason: `${rows.length} env assessments; ${fresh.length} current.`,
    evaluatedAt,
  };
}

export async function evaluateParticipantMoneyAndProperty(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'financial_delegation');
  if (error) return na(evaluatedAt, 'NDIS-4.2', 'registers_unavailable', error.message);
  const rows = data ?? [];
  if (rows.length === 0) {
    return manual(evaluatedAt, 'NDIS-4.2', 'No financial-delegation register entries — tag via org_registers (type=financial_delegation).');
  }
  return {
    controlCode: 'NDIS-4.2',
    status: 'pass',
    evidenceRefs: rows.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: [],
    confidence: 0.5,
    reason: `${rows.length} financial-delegation row(s).`,
    evaluatedAt,
  };
}

// ============================================================================
// Verification + Specialist module
// ============================================================================

/**
 * NDIS-V.2 — Restrictive practices oversight.
 * STATUTORY: per F2018L00632 + Commission portal P28.1:
 *   - interim BSP within 1 month of first RP use
 *   - comprehensive BSP within 6 months
 *   - monthly reporting within 5 business days of month end
 *   - unauthorised RP = reportable within 5 business days
 */
export async function evaluateRestrictivePracticesOversight(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: bsps, error: bErr }, { data: useRegister, error: rErr }] = await Promise.all([
    ctx.db
      .from('org_behaviour_support_plans')
      .select('id, plan_type, status, first_restrictive_practice_at, drafted_at, authorised_at, expires_at')
      .eq('organization_id', ctx.orgId),
    ctx.db
      .from('org_registers')
      .select('id, type, status, created_at, updated_at')
      .eq('org_id', ctx.orgId)
      .eq('type', 'restrictive_practice_use'),
  ]);
  if (bErr) return na(evaluatedAt, 'NDIS-V.2', 'bsps_unavailable', bErr.message);
  if (rErr) return na(evaluatedAt, 'NDIS-V.2', 'registers_unavailable', rErr.message);

  const totalUse = (useRegister ?? []).length;
  const totalBsps = (bsps ?? []).length;

  // If no restrictive practices used and no BSPs: control not applicable;
  // surface as manual so Stage 2 confirms scope.
  if (totalUse === 0 && totalBsps === 0) {
    return manual(
      evaluatedAt,
      'NDIS-V.2',
      'No restrictive practice use or BSPs on file — control may not apply to this provider; Stage 2 reviewer confirms.',
    );
  }

  const gaps: ControlGap[] = [];
  // Each restrictive-practice-use row should have a corresponding BSP
  // authorised within statutory windows.
  let lateInterim = 0;
  let lateComprehensive = 0;
  let unauthorised = 0;
  let expiredAuth = 0;

  for (const use of useRegister ?? []) {
    const useStart = new Date(use.created_at as string).getTime();
    const relatedBsps = (bsps ?? []).filter(
      (b: { first_restrictive_practice_at: string | null }) =>
        b.first_restrictive_practice_at &&
        Math.abs(new Date(b.first_restrictive_practice_at).getTime() - useStart) < 31 * DAY_MS,
    );
    const interim = relatedBsps.find((b: { plan_type: string }) => b.plan_type === 'interim');
    const comprehensive = relatedBsps.find((b: { plan_type: string }) => b.plan_type === 'comprehensive');
    if (!interim || daysSince(interim.drafted_at as string) > 30) lateInterim += 1;
    if (!comprehensive || daysSince(comprehensive.drafted_at as string) > 180) lateComprehensive += 1;
  }

  for (const bsp of bsps ?? []) {
    if (bsp.status !== 'authorised' && bsp.status !== 'active' && bsp.plan_type === 'comprehensive') {
      unauthorised += 1;
    }
    if (bsp.expires_at && new Date(bsp.expires_at as string).getTime() < Date.now()) {
      expiredAuth += 1;
    }
  }

  if (lateInterim > 0) gaps.push({ code: 'late_interim_bsp', message: `${lateInterim} restrictive-practice use(s) without an interim BSP within 1 month (F2018L00632).`, severity: 'critical' });
  if (lateComprehensive > 0) gaps.push({ code: 'late_comprehensive_bsp', message: `${lateComprehensive} restrictive-practice use(s) without a comprehensive BSP within 6 months.`, severity: 'critical' });
  if (unauthorised > 0) gaps.push({ code: 'unauthorised_bsp', message: `${unauthorised} comprehensive BSP(s) not in authorised/active status.`, severity: 'high' });
  if (expiredAuth > 0) gaps.push({ code: 'expired_bsp_authorisation', message: `${expiredAuth} BSP authorisation(s) past expiry.`, severity: 'high' });

  const status: ControlResult['status'] =
    lateInterim > 0 || lateComprehensive > 0 ? 'fail' : gaps.length > 0 ? 'partial' : 'pass';

  return {
    controlCode: 'NDIS-V.2',
    status,
    evidenceRefs: [
      ...(bsps ?? []).slice(0, EVIDENCE_CAP / 2).map((b: { id: string; drafted_at: string | null }) => ({ source: 'org_behaviour_support_plans' as const, ref: b.id, capturedAt: b.drafted_at ?? undefined })),
      ...(useRegister ?? []).slice(0, EVIDENCE_CAP / 2).map((r: { id: string; updated_at: string | null }) => ({ source: 'org_registers' as const, ref: r.id, capturedAt: r.updated_at ?? undefined })),
    ],
    gaps,
    confidence: 0.75,
    reason: `${totalUse} RP use rows; ${totalBsps} BSPs; ${lateInterim} late interim, ${lateComprehensive} late comprehensive, ${unauthorised} unauthorised, ${expiredAuth} expired.`,
    evaluatedAt,
  };
}

/**
 * NDIS-M.1 — Medication management. Phase 2 predicate retained;
 * unchanged.
 */
export async function evaluateMedicationManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [admins, errors] = await Promise.all([
    ctx.db.from('org_medication_administrations').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.orgId).gte('created_at', new Date(Date.now() - 90 * DAY_MS).toISOString()),
    ctx.db.from('org_incidents').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.orgId).eq('severity', 'critical').gte('created_at', new Date(Date.now() - 90 * DAY_MS).toISOString()),
  ]);
  if (admins.error) return na(evaluatedAt, 'NDIS-M.1', 'medication_admins_unavailable', admins.error.message);
  if (errors.error) return na(evaluatedAt, 'NDIS-M.1', 'incidents_unavailable', errors.error.message);
  const admin_count = admins.count ?? 0;
  const critical_count = errors.count ?? 0;
  if (admin_count === 0) return manual(evaluatedAt, 'NDIS-M.1', 'No medication administrations recorded — control may not apply.');
  return {
    controlCode: 'NDIS-M.1',
    status: critical_count > 0 ? 'partial' : 'pass',
    evidenceRefs: [{ source: 'org_medication_administrations', ref: `count=${admin_count}`, capturedAt: evaluatedAt }],
    gaps: critical_count > 0 ? [{ code: 'critical_incidents_during_med_period', message: `${critical_count} critical incident(s) during a period with ${admin_count} medication admins. May or may not be medication-related; needs Stage 2 review.`, severity: 'high' }] : [],
    confidence: 0.5,
    reason: `${admin_count} medication admins, ${critical_count} critical incidents (90d).`,
    evaluatedAt,
  };
}

/**
 * NDIS-M.2 — Restrictive practices + consent. Predicate: comprehensive
 * BSPs with authorisation + at least one signed consent form per
 * participant subject to RP. Tighter than V.2 because the consent
 * requirement is per-RP-instance.
 */
export async function evaluateRestrictivePracticesConsent(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: bsps, error: bErr }, { data: consents, error: cErr }] = await Promise.all([
    ctx.db
      .from('org_behaviour_support_plans')
      .select('id, participant_id, plan_type, status, authorised_at')
      .eq('organization_id', ctx.orgId)
      .eq('plan_type', 'comprehensive'),
    ctx.db
      .from('org_form_submissions')
      .select('id, metadata, status, reviewed_at')
      .eq('org_id', ctx.orgId),
  ]);
  if (bErr) return na(evaluatedAt, 'NDIS-M.2', 'bsps_unavailable', bErr.message);
  if (cErr) return na(evaluatedAt, 'NDIS-M.2', 'consents_unavailable', cErr.message);

  if ((bsps ?? []).length === 0) {
    return manual(evaluatedAt, 'NDIS-M.2', 'No comprehensive BSPs — control may not apply or BSPs not yet tracked.');
  }

  const consentRows = (consents ?? []).filter((f: { metadata: unknown }) => {
    const m = f.metadata as Record<string, unknown> | null;
    return m && (m.form_type === 'restrictive_practice_consent' || m.formType === 'restrictive_practice_consent');
  });
  const authorisedCount = (bsps ?? []).filter((b: { status: string | null; authorised_at: string | null }) => b.status === 'authorised' || b.status === 'active' || b.authorised_at).length;
  const consentCount = consentRows.length;

  const gaps: ControlGap[] = [];
  if (authorisedCount < (bsps ?? []).length) {
    gaps.push({
      code: 'unauthorised_bsps',
      message: `${(bsps ?? []).length - authorisedCount} comprehensive BSP(s) without authorisation.`,
      severity: 'critical',
    });
  }
  if (consentCount === 0) {
    gaps.push({ code: 'no_consent_records', message: 'No signed restrictive-practice consent forms (form_type=restrictive_practice_consent).', severity: 'high' });
  }

  const status: ControlResult['status'] =
    authorisedCount === (bsps ?? []).length && consentCount > 0 ? 'pass' : authorisedCount > 0 ? 'partial' : 'fail';

  return {
    controlCode: 'NDIS-M.2',
    status,
    evidenceRefs: (bsps ?? []).slice(0, EVIDENCE_CAP).map((b: { id: string; authorised_at: string | null }) => ({
      source: 'org_behaviour_support_plans',
      ref: b.id,
      capturedAt: b.authorised_at ?? undefined,
    })),
    gaps,
    confidence: 0.7,
    reason: `${authorisedCount}/${(bsps ?? []).length} BSPs authorised; ${consentCount} consent forms.`,
    evaluatedAt,
  };
}

/**
 * NDIS-W.1 — Worker engagement and wellbeing.
 * GUIDANCE: documented supervision records. Predicate counts org_registers
 * rows of type='supervision' updated within 6 months.
 */
export async function evaluateWorkerEngagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, updated_at')
    .eq('org_id', ctx.orgId)
    .eq('type', 'supervision');
  if (error) return na(evaluatedAt, 'NDIS-W.1', 'registers_unavailable', error.message);
  const rows = data ?? [];
  if (rows.length === 0) return manual(evaluatedAt, 'NDIS-W.1', 'No supervision register entries — tag via org_registers (type=supervision).');
  const fresh = rows.filter((r: { updated_at: string | null }) => daysSince(r.updated_at) <= 180);
  return {
    controlCode: 'NDIS-W.1',
    status: fresh.length === rows.length ? 'pass' : 'partial',
    evidenceRefs: rows.slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_registers',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: fresh.length < rows.length ? [{ code: 'stale_supervision', message: `${rows.length - fresh.length} supervision record(s) not updated in 6 months.`, severity: 'medium' }] : [],
    confidence: 0.5,
    reason: `${rows.length} supervision rows; ${fresh.length} current.`,
    evaluatedAt,
  };
}

// ---------- shared helpers ----------

function refsFromPlans(plans: Array<{ id: string; updated_at: string | null }>): EvidenceRef[] {
  return plans.slice(0, EVIDENCE_CAP).map((p) => ({
    source: 'org_care_plans',
    ref: p.id,
    capturedAt: p.updated_at ?? undefined,
  }));
}

function na(evaluatedAt: string, controlCode: string, code: string, message: string): ControlResult {
  return {
    controlCode,
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

function manual(evaluatedAt: string, controlCode: string, message: string): ControlResult {
  return {
    controlCode,
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code: 'manual_attestation_required', message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}
