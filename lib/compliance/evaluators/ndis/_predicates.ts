/**
 * Shared predicate helpers for the NDIS Phase 2 evaluators.
 *
 * ⚠️  EXPERT REVIEW REQUIRED.
 *
 * These predicates map NDIS Practice Standards Quality Indicators to
 * FormaOS schema signals based on the publicly-published indicator
 * descriptions, NOT on the judgement of a registered NDIS-audit
 * practitioner. Thresholds (cadence days, "fresh" windows, "active"
 * activity counts) are engineering best-guesses and need calibration
 * by someone who runs the actual audits.
 *
 * Every predicate that returns `pass` SHOULD be treated by the
 * dashboard as "preliminary signal, customer to confirm with their
 * NDIS auditor before relying on it for certification" until an expert
 * sign-off lands. The `not_evaluated` / `partial` outcomes are
 * deliberately generous — when in doubt, flag for human review rather
 * than declare green.
 */

import type {
  ControlResult,
  ControlEvaluatorContext,
  ControlGap,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;

function daysSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return Number.POSITIVE_INFINITY;
  return ms / 86_400_000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Standard 1.1 — Person-centred supports.
 * Signal: care plans with recent reviews. NDIS audit expectation is
 * approximately 6-monthly review cadence per participant.
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
    return manual(evaluatedAt, 'NDIS-1.1', 'No care plans on file — person-centred support evidence cannot be evaluated automatically. Manual attestation required.');
  }

  const recent = (plans ?? []).filter(
    (p: { updated_at: string | null }) => daysSince(p.updated_at) <= 180,
  );
  const ratio = recent.length / total;
  const gaps: ControlGap[] = [];
  if (recent.length < total) {
    gaps.push({
      code: 'stale_care_plans',
      message: `${total - recent.length}/${total} care plans have no review in the last 180 days.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = (plans ?? [])
    .slice(0, EVIDENCE_CAP)
    .map((p: { id: string; updated_at: string | null }) => ({
      source: 'org_care_plans',
      ref: p.id,
      capturedAt: p.updated_at ?? undefined,
    }));

  let status: ControlResult['status'];
  if (ratio >= 0.9) status = 'pass';
  else if (ratio >= 0.5) status = 'partial';
  else status = 'fail';

  return {
    controlCode: 'NDIS-1.1',
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.5 + 0.4 * ratio),
    reason: `${recent.length}/${total} care plans (${Math.round(ratio * 100)}%) reviewed within the 180-day cadence target.`,
    evaluatedAt,
  };
}

/**
 * Standard 1.5 — Violence/abuse safeguarding.
 * Signal: incidents table activity (provider is recognising + recording
 * concerns) plus follow-through to investigations. Zero incidents over
 * a long period is suspicious — it suggests under-reporting rather than
 * a truly safe service.
 */
export async function evaluateSafeguarding(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: incidents, error: iErr }, { data: investigations, error: invErr }] =
    await Promise.all([
      ctx.db
        .from('org_incidents')
        .select('id, severity, status, created_at')
        .eq('organization_id', ctx.orgId)
        .gte(
          'created_at',
          new Date(Date.now() - 365 * 86_400_000).toISOString(),
        ),
      ctx.db
        .from('org_investigations')
        .select('id, status, created_at')
        .eq('organization_id', ctx.orgId)
        .gte(
          'created_at',
          new Date(Date.now() - 365 * 86_400_000).toISOString(),
        ),
    ]);
  if (iErr) return na(evaluatedAt, 'NDIS-1.5', 'incidents_unavailable', iErr.message);
  if (invErr) return na(evaluatedAt, 'NDIS-1.5', 'investigations_unavailable', invErr.message);

  const incidentCount = incidents?.length ?? 0;
  const investigationCount = investigations?.length ?? 0;
  const openCritical = (incidents ?? []).filter(
    (i: { severity: string | null; status: string | null }) =>
      i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved',
  ).length;

  const gaps: ControlGap[] = [];
  if (incidentCount === 0) {
    gaps.push({
      code: 'no_incidents_recorded',
      message: 'No incidents recorded in the past 12 months. NDIS auditors typically expect some incident activity from an actively-operating provider; zero suggests under-reporting.',
      severity: 'high',
    });
  }
  if (openCritical > 0) {
    gaps.push({
      code: 'open_critical_incidents',
      message: `${openCritical} critical incident(s) remain open past resolution. Safeguarding requires closure or escalation evidence.`,
      severity: 'critical',
    });
  }

  let status: ControlResult['status'];
  if (openCritical > 0) status = 'fail';
  else if (incidentCount === 0) status = 'partial';
  else status = 'pass';

  return {
    controlCode: 'NDIS-1.5',
    status,
    evidenceRefs: (incidents ?? []).slice(0, EVIDENCE_CAP).map(
      (i: { id: string; created_at: string | null }) => ({
        source: 'org_incidents',
        ref: i.id,
        capturedAt: i.created_at ?? undefined,
      }),
    ),
    gaps,
    confidence: 0.5,
    reason: `${incidentCount} incident(s), ${investigationCount} investigation(s), ${openCritical} critical-open over the past 12 months.`,
    evaluatedAt,
  };
}

/**
 * Standard 2.2 — Risk management.
 * Signal: org_risks register exists and most-recent update within 90 days.
 */
export async function evaluateRiskManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data: risks, error } = await ctx.db
    .from('org_risks')
    .select('id, status, updated_at')
    .eq('organization_id', ctx.orgId);
  if (error) return na(evaluatedAt, 'NDIS-2.2', 'risks_unavailable', error.message);

  const total = risks?.length ?? 0;
  if (total === 0) {
    return {
      controlCode: 'NDIS-2.2',
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_risk_register',
          message: 'Risk register is empty. NDIS-2.2 requires at least an active risk-management process.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'No rows in org_risks for this organisation.',
      evaluatedAt,
    };
  }

  const fresh = (risks ?? []).filter(
    (r: { updated_at: string | null }) => daysSince(r.updated_at) <= 90,
  ).length;
  const ratio = fresh / total;

  const status: ControlResult['status'] =
    ratio >= 0.8 ? 'pass' : ratio >= 0.4 ? 'partial' : 'fail';

  return {
    controlCode: 'NDIS-2.2',
    status,
    evidenceRefs: (risks ?? []).slice(0, EVIDENCE_CAP).map((r: { id: string; updated_at: string | null }) => ({
      source: 'org_risks',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    gaps: total > fresh
      ? [
          {
            code: 'stale_risks',
            message: `${total - fresh}/${total} risks not reviewed in the last 90 days.`,
            severity: 'medium',
          },
        ]
      : [],
    confidence: round2(0.5 + 0.4 * ratio),
    reason: `${fresh}/${total} risks reviewed within 90 days (${Math.round(ratio * 100)}%).`,
    evaluatedAt,
  };
}

/**
 * Standard 2.6 — Incident management.
 * Signal: incidents recorded AND reportable incidents have a matching
 * regulatory notification submitted (within ~5 business days per NDIS
 * Commission guidance for serious incidents).
 */
export async function evaluateIncidentManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [{ data: incidents, error: iErr }, { data: notifications, error: nErr }] =
    await Promise.all([
      ctx.db
        .from('org_incidents')
        .select('id, severity, status, created_at')
        .eq('organization_id', ctx.orgId),
      ctx.db
        .from('org_regulatory_notifications')
        .select('id, submitted_at, status, created_at')
        .eq('organization_id', ctx.orgId),
    ]);
  if (iErr) return na(evaluatedAt, 'NDIS-2.6', 'incidents_unavailable', iErr.message);
  if (nErr) return na(evaluatedAt, 'NDIS-2.6', 'notifications_unavailable', nErr.message);

  const incidentCount = incidents?.length ?? 0;
  const notificationCount = notifications?.length ?? 0;
  if (incidentCount === 0) {
    return manual(evaluatedAt, 'NDIS-2.6', 'No incidents recorded. Cannot evaluate workflow effectiveness without activity — manual attestation required.');
  }

  const unsubmitted = (notifications ?? []).filter(
    (n: { submitted_at: string | null }) => !n.submitted_at,
  ).length;

  const gaps: ControlGap[] = [];
  if (unsubmitted > 0) {
    gaps.push({
      code: 'unsubmitted_notifications',
      message: `${unsubmitted} regulatory notification(s) created but never submitted.`,
      severity: 'critical',
    });
  }

  const status: ControlResult['status'] =
    unsubmitted > 0 ? 'fail' : 'pass';

  return {
    controlCode: 'NDIS-2.6',
    status,
    evidenceRefs: (incidents ?? []).slice(0, EVIDENCE_CAP).map((i: { id: string; created_at: string | null }) => ({
      source: 'org_incidents',
      ref: i.id,
      capturedAt: i.created_at ?? undefined,
    })),
    gaps,
    confidence: 0.6,
    reason: `${incidentCount} incident(s), ${notificationCount} regulatory notification(s), ${unsubmitted} unsubmitted.`,
    evaluatedAt,
  };
}

/**
 * Standard 2.7 — Human resource management.
 * Signal: at_risk_credentials table — zero rows means all workers have
 * current screening + qualifications. Non-zero with active staff = fail.
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
      evidenceRefs: [
        { source: 'at_risk_credentials', ref: 'empty', capturedAt: evaluatedAt },
      ],
      gaps: [],
      confidence: 0.7,
      reason: 'No at-risk worker credentials flagged.',
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
        message: `${total} worker credential(s) flagged at-risk; ${expired} already expired.`,
        severity: expired > 0 ? 'critical' : 'high',
      },
    ],
    confidence: 0.7,
    reason: `${total} at-risk credentials (${expired} expired).`,
    evaluatedAt,
  };
}

/**
 * Standard 3.3 — Service agreements with participants.
 * Signal: form_submissions reviewed/signed entries (the closest schema
 * proxy we have for signed service agreements).
 */
export async function evaluateServiceAgreements(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data: submissions, error } = await ctx.db
    .from('org_form_submissions')
    .select('id, status, reviewed_at, created_at')
    .gte(
      'created_at',
      new Date(Date.now() - 365 * 86_400_000).toISOString(),
    );
  if (error)
    return na(evaluatedAt, 'NDIS-3.3', 'form_submissions_unavailable', error.message);

  const signed = (submissions ?? []).filter(
    (s: { status: string | null; reviewed_at: string | null }) =>
      s.status === 'reviewed' || s.status === 'signed' || s.reviewed_at,
  ).length;

  if (signed === 0) {
    return manual(
      evaluatedAt,
      'NDIS-3.3',
      'No signed/reviewed form submissions in the last 12 months. Cannot evaluate service-agreement coverage automatically.',
    );
  }

  return {
    controlCode: 'NDIS-3.3',
    status: 'partial',
    evidenceRefs: (submissions ?? [])
      .slice(0, EVIDENCE_CAP)
      .map((s: { id: string; reviewed_at: string | null; created_at: string | null }) => ({
        source: 'org_form_submissions',
        ref: s.id,
        capturedAt: s.reviewed_at ?? s.created_at ?? undefined,
      })),
    gaps: [
      {
        code: 'service_agreement_taxonomy',
        message:
          'Schema does not distinguish service-agreement form submissions from other forms. Mark partial pending an expert review of FormaOS form taxonomy.',
        severity: 'medium',
      },
    ],
    confidence: 0.4,
    reason: `${signed} signed/reviewed form submission(s) in the last 12 months. Awaiting form-taxonomy work to refine.`,
    evaluatedAt,
  };
}

/**
 * Standard 2.3 — Quality management.
 * Signal: CAPA items activity over the last 6 months. Closed CAPA items
 * are evidence of continuous improvement; open-and-overdue is the gap.
 */
export async function evaluateQualityManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_capa_items')
    .select('id, status, due_date, severity, created_at, updated_at')
    .eq('organization_id', ctx.orgId)
    .gte('created_at', new Date(Date.now() - 180 * 86_400_000).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-2.3', 'capa_unavailable', error.message);

  const items = data ?? [];
  if (items.length === 0) {
    return manual(evaluatedAt, 'NDIS-2.3', 'No CAPA items in the last 6 months — quality-improvement signal not present.');
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
    gaps:
      overdueOpen > 0
        ? [
            {
              code: 'overdue_capa',
              message: `${overdueOpen} CAPA item(s) overdue.`,
              severity: 'medium',
            },
          ]
        : [],
    confidence: 0.6,
    reason: `${items.length} CAPA item(s) (last 6 mo); ${closed} closed, ${overdueOpen} overdue open.`,
    evaluatedAt,
  };
}

/**
 * Standard 2.4 — Information management.
 * Signal: audit_log activity in the last 90 days indicates the provider
 * is actively recording info-access events (which underpins NDIS-2.4
 * "audit trail of access to participant info"). Zero = no signal.
 */
export async function evaluateInformationManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { count, error } = await ctx.db
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', ctx.orgId)
    .gte('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-2.4', 'audit_log_unavailable', error.message);

  const total = count ?? 0;
  if (total === 0) {
    return {
      controlCode: 'NDIS-2.4',
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_audit_activity',
          message: 'No audit_log activity in the last 90 days. Information-access trail is absent.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: '0 audit_log rows in the last 90 days.',
      evaluatedAt,
    };
  }

  return {
    controlCode: 'NDIS-2.4',
    status: total >= 30 ? 'pass' : 'partial',
    evidenceRefs: [
      {
        source: 'audit_log',
        ref: `count=${total}`,
        capturedAt: evaluatedAt,
      },
    ],
    gaps:
      total < 30
        ? [
            {
              code: 'low_audit_activity',
              message: `Only ${total} audit_log entries in the last 90 days — review threshold tuning with NDIS auditor.`,
              severity: 'low',
            },
          ]
        : [],
    confidence: 0.5,
    reason: `${total} audit_log rows over the last 90 days.`,
    evaluatedAt,
  };
}

/**
 * Standard 2.5 — Feedback and complaints management.
 * Signal: org_registers rows of type='complaint' OR category='complaint'
 * with status transitions through resolution. Zero complaints over a
 * long period is suspicious like Standard 1.5.
 */
export async function evaluateComplaintsManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { data, error } = await ctx.db
    .from('org_registers')
    .select('id, type, category, status, created_at, updated_at, risk_level')
    .or('type.eq.complaint,category.eq.complaint')
    .gte('created_at', new Date(Date.now() - 365 * 86_400_000).toISOString());
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
      gaps: [
        {
          code: 'no_complaints',
          message: 'No complaints recorded in the last 12 months. NDIS auditors expect some volume from an actively-operating provider.',
          severity: 'medium',
        },
      ],
      confidence: 0.5,
      reason: '0 complaints in the last 12 months.',
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
    gaps:
      openOld > 0
        ? [
            {
              code: 'open_complaints_over_30d',
              message: `${openOld} complaint(s) open for over 30 days.`,
              severity: 'medium',
            },
          ]
        : [],
    confidence: 0.6,
    reason: `${total} complaint(s) in the last 12 months; ${openOld} open >30d.`,
    evaluatedAt,
  };
}

/**
 * Standard 3.2 — Support planning.
 * Signal: care plans with at least one care goal and recent activity.
 */
export async function evaluateSupportPlanning(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [plansResult, goalsResult] = await Promise.all([
    ctx.db
      .from('org_care_plans')
      .select('id, updated_at, status')
      .eq('organization_id', ctx.orgId),
    ctx.db
      .from('org_care_goals')
      .select('id, care_plan_id')
      .eq('organization_id', ctx.orgId),
  ]);
  if (plansResult.error) return na(evaluatedAt, 'NDIS-3.2', 'care_plans_unavailable', plansResult.error.message);
  if (goalsResult.error) return na(evaluatedAt, 'NDIS-3.2', 'care_goals_unavailable', goalsResult.error.message);

  const plans = plansResult.data ?? [];
  const goals = goalsResult.data ?? [];
  if (plans.length === 0) {
    return manual(evaluatedAt, 'NDIS-3.2', 'No care plans on file.');
  }

  const planIdsWithGoals = new Set(
    goals.map((g: { care_plan_id: string | null }) => g.care_plan_id).filter(Boolean),
  );
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
    gaps:
      plansWithGoals < plans.length
        ? [
            {
              code: 'plans_without_goals',
              message: `${plans.length - plansWithGoals}/${plans.length} care plans have no documented goals.`,
              severity: 'medium',
            },
          ]
        : [],
    confidence: round2(0.5 + 0.4 * ratio),
    reason: `${plansWithGoals}/${plans.length} care plans (${Math.round(ratio * 100)}%) have documented goals.`,
    evaluatedAt,
  };
}

/**
 * Standard 3.4 — Responsive support provision.
 * Signal: progress notes cadence. Per-participant cadence is the gold
 * standard but for Phase 2 we check org-wide volume in the last 90 days.
 */
export async function evaluateResponsiveSupport(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const { count, error } = await ctx.db
    .from('org_progress_notes')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ctx.orgId)
    .gte('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString());
  if (error) return na(evaluatedAt, 'NDIS-3.4', 'progress_notes_unavailable', error.message);

  const total = count ?? 0;
  if (total === 0) {
    return {
      controlCode: 'NDIS-3.4',
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_progress_notes',
          message: 'No progress notes in the last 90 days.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: '0 org_progress_notes rows in the last 90 days.',
      evaluatedAt,
    };
  }

  return {
    controlCode: 'NDIS-3.4',
    status: total >= 30 ? 'pass' : 'partial',
    evidenceRefs: [
      {
        source: 'org_progress_notes',
        ref: `count=${total}`,
        capturedAt: evaluatedAt,
      },
    ],
    gaps: [],
    confidence: 0.5,
    reason: `${total} progress note(s) in the last 90 days.`,
    evaluatedAt,
  };
}

/**
 * Specialist NDIS-M.1 — Medication management.
 * Signal: medication administrations recorded + low medication-error
 * incident rate. Schema doesn't distinguish error type, so we use
 * incident severity as a proxy.
 */
export async function evaluateMedicationManagement(
  ctx: ControlEvaluatorContext,
  evaluatedAt: string,
): Promise<ControlResult> {
  const [admins, errors] = await Promise.all([
    ctx.db
      .from('org_medication_administrations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.orgId)
      .gte('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString()),
    ctx.db
      .from('org_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.orgId)
      .eq('severity', 'critical')
      .gte('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString()),
  ]);
  if (admins.error) return na(evaluatedAt, 'NDIS-M.1', 'medication_admins_unavailable', admins.error.message);
  if (errors.error) return na(evaluatedAt, 'NDIS-M.1', 'incidents_unavailable', errors.error.message);

  const admin_count = admins.count ?? 0;
  const critical_count = errors.count ?? 0;

  if (admin_count === 0) {
    return manual(evaluatedAt, 'NDIS-M.1', 'No medication administrations recorded — control not applicable OR data missing.');
  }

  return {
    controlCode: 'NDIS-M.1',
    status: critical_count > 0 ? 'partial' : 'pass',
    evidenceRefs: [
      { source: 'org_medication_administrations', ref: `count=${admin_count}`, capturedAt: evaluatedAt },
    ],
    gaps:
      critical_count > 0
        ? [
            {
              code: 'critical_incidents_during_med_period',
              message: `${critical_count} critical-severity incident(s) during a period with ${admin_count} medication administration(s). May or may not be medication-related; needs human review.`,
              severity: 'high',
            },
          ]
        : [],
    confidence: 0.4,
    reason: `${admin_count} medication administration(s) recorded, ${critical_count} critical incident(s) over 90 days.`,
    evaluatedAt,
  };
}

// ---------- shared helpers ----------

function na(
  evaluatedAt: string,
  controlCode: string,
  code: string,
  message: string,
): ControlResult {
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

function manual(
  evaluatedAt: string,
  controlCode: string,
  message: string,
): ControlResult {
  return {
    controlCode,
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [
      {
        code: 'manual_attestation_required',
        message,
        severity: 'medium',
      },
    ],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}
