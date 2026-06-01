/**
 * Shared helpers for the Australian Financial Services compliance pack
 * (`financial-services-au`, code FINANCIAL_SERVICES_AU).
 *
 * The pack covers ASIC AFS general obligations, APRA prudential
 * standards (CPS 230 / 234 / 510), AUSTRAC AML/CTF, and AFCA
 * membership — 20 controls. Most controls genuinely require human
 * attestation (a sighted AFS licence, RG 105 competency records, a
 * lodged annual compliance certificate, trust-account reconciliations)
 * and we model that explicitly via `manualAttestation` rather than
 * inflating pass counts.
 *
 * A subset of controls map cleanly onto structured FormaOS rows
 * (policy cadence, conflicts/BCP/complaint registers, risk-register
 * freshness, infosec policy + incident-response + audit activity).
 * For those we provide conservative DB-signal helpers below.
 *
 * The lower-level primitives (`notEvaluated`, `manualAttestation`,
 * `daysSince`, `round2`, `EVIDENCE_CAP`) are re-exported from the
 * SOC2-TSC shared module so every pack stays aligned on shape and
 * error reporting.
 *
 * IMPORTANT — verified schema (no invented tables/columns):
 *   - org_policies(id, organization_id, title, status, updated_at,
 *     created_at) — no finance/category tag, so finance policies are
 *     matched by title keyword only.
 *   - org_registers(id, org_id, type, category, status, updated_at,
 *     created_at) — keyed by org_id (NOT organization_id).
 *   - org_risks(id, organization_id, category, status, updated_at,
 *     created_at).
 *   - org_audit_logs(id, action, created_at, organization_id).
 * A DB-signal helper that finds no finance-tagged rows returns
 * `manualAttestation` / `not_evaluated`, never a false `pass`.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
  FrameworkSlug,
} from '../types';
import {
  EVIDENCE_CAP,
  daysSince,
  manualAttestation,
  notEvaluated,
  round2,
} from '../soc2-tsc/_shared';

export {
  EVIDENCE_CAP,
  daysSince,
  manualAttestation,
  notEvaluated,
  round2,
};

export const FRAMEWORK: FrameworkSlug = 'financial-services-au';

const ACTIVE_POLICY_STATUSES = new Set([
  'approved',
  'active',
  'published',
  'in_force',
]);

/**
 * Build a `manualAttestation` evaluator with one line per call. The
 * meaningful evidence is a sighted licence, a lodged regulator return,
 * a board sign-off, or a trust-account reconciliation that does not
 * exist as a structured row in FormaOS today.
 */
export function makeManualEvaluator(
  controlCode: string,
  message: string,
): { evaluator: ControlEvaluator; meta: ControlEvaluatorMeta } {
  const evaluator: ControlEvaluator = async () =>
    manualAttestation(controlCode, new Date().toISOString(), message);
  return {
    evaluator,
    meta: { framework: FRAMEWORK, controlCode, evaluator },
  };
}

/**
 * Wrap an automated builder into the `{ evaluator, meta }` shape with
 * `framework: 'financial-services-au'` already filled in.
 */
export function makeAutomatedEvaluator(
  controlCode: string,
  evaluator: ControlEvaluator,
): { evaluator: ControlEvaluator; meta: ControlEvaluatorMeta } {
  return {
    evaluator,
    meta: { framework: FRAMEWORK, controlCode, evaluator },
  };
}

type PolicyRow = {
  id: string;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

/**
 * "Is there at least one active/approved policy whose title matches a
 * keyword set, reviewed inside the cadence?" Used for AFS-003
 * (PDS/FSG/disclosure) and AML-001 (AML/CTF program).
 *
 * org_policies has no finance/category column, so the match is on
 * `title` keywords only. Zero matches → fail with a clear gap (the
 * required artefact is simply absent), NOT a false pass.
 */
export async function evaluatePolicyCadence(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  keywords: RegExp;
  reviewWindowDays: number;
  missingPolicyMessage: string;
}): Promise<ControlResult> {
  const { controlCode, orgId, db, keywords, reviewWindowDays } = args;
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_policies')
    .select('id, title, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_policies_unavailable',
      `Could not read org_policies: ${error.message}`,
    );
  }

  const rows = (data ?? []) as PolicyRow[];
  const matching = rows.filter((p) => keywords.test((p.title || '').toLowerCase()));

  if (matching.length === 0) {
    return {
      controlCode,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_matching_policy',
          message: args.missingPolicyMessage,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 org_policies titles matched keyword set (${rows.length} polic(ies) in total).`,
      evaluatedAt,
    };
  }

  const active = matching.filter((p) =>
    ACTIVE_POLICY_STATUSES.has((p.status || '').toLowerCase()),
  );
  const fresh = active.filter((p) => {
    const since = daysSince(p.updated_at ?? p.created_at);
    return since != null && since <= reviewWindowDays;
  });

  const gaps: ControlGap[] = [];
  if (active.length === 0) {
    gaps.push({
      code: 'matching_policy_not_active',
      message: `${matching.length} matching polic(ies) exist but none are in an approved/active/published status.`,
      severity: 'high',
    });
  }
  if (active.length > 0 && fresh.length === 0) {
    const newest = active
      .map((p) => p.updated_at ?? p.created_at)
      .filter((v): v is string => !!v)
      .sort()
      .reverse()[0];
    const since = daysSince(newest);
    gaps.push({
      code: 'matching_policy_stale',
      message: `Matching polic(ies) last reviewed ${since ?? '?'}d ago — exceeds the ${reviewWindowDays}-day cadence.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = active.slice(0, EVIDENCE_CAP).map((p) => ({
    source: 'org_policies',
    ref: p.id,
    capturedAt: p.updated_at ?? p.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (active.length === 0) status = 'fail';
  else if (fresh.length > 0) status = 'pass';
  else status = 'partial';

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, active.length / 3)),
    reason: `${matching.length} matching polic(ies); ${active.length} active; ${fresh.length} reviewed within ${reviewWindowDays}d.`,
    evaluatedAt,
  };
}

type RegisterRow = {
  id: string;
  type: string | null;
  category: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

/**
 * "Is there at least one org_registers row of a given type, reviewed
 * within the cadence?" Used for AFS-004 (conflict_of_interest, 90d) and
 * CPS-002 (business_continuity_plan, 365d).
 *
 * org_registers is keyed by `org_id`. No matching register row →
 * manualAttestation (the register may live outside FormaOS), never a
 * false pass.
 */
export async function evaluateRegisterCadence(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  registerType: string;
  reviewWindowDays: number;
  missingRegisterMessage: string;
}): Promise<ControlResult> {
  const { controlCode, orgId, db, registerType, reviewWindowDays } = args;
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_registers')
    .select('id, type, category, status, updated_at, created_at')
    .eq('org_id', orgId)
    .eq('type', registerType);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_registers_unavailable',
      `Could not read org_registers: ${error.message}`,
    );
  }

  const rows = (data ?? []) as RegisterRow[];
  if (rows.length === 0) {
    return manualAttestation(controlCode, evaluatedAt, args.missingRegisterMessage);
  }

  const newest = rows
    .map((r) => r.updated_at ?? r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const since = daysSince(newest);
  const fresh = since != null && since <= reviewWindowDays;

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_registers',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  return {
    controlCode,
    status: fresh ? 'pass' : 'partial',
    evidenceRefs,
    gaps: fresh
      ? []
      : [
          {
            code: 'register_stale',
            message: `Register exists but last reviewed ${since ?? '?'}d ago — exceeds the ${reviewWindowDays}-day cadence.`,
            severity: 'medium',
          },
        ],
    confidence: round2(0.6 + 0.3 * Math.min(1, rows.length / 2)),
    reason: `${rows.length} '${registerType}' register row(s); most recent review ${since ?? '?'}d ago.`,
    evaluatedAt,
  };
}

type ComplaintRow = {
  id: string;
  type: string | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * AFCA-002 — IDR / complaint handling. Mirrors NDIS-2.5: complaints in
 * org_registers (type=complaint OR category=complaint) within 12
 * months, flagging any open beyond 30 days. RG 271 sets a 30-calendar-
 * day standard IDR response window.
 */
export async function evaluateComplaintHandling(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();
  const oneYearAgo = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_registers')
    .select('id, type, category, status, created_at, updated_at')
    .eq('org_id', orgId)
    .or('type.eq.complaint,category.eq.complaint')
    .gte('created_at', oneYearAgo);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_registers_unavailable',
      `Could not read org_registers: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ComplaintRow[];
  if (rows.length === 0) {
    return manualAttestation(
      controlCode,
      evaluatedAt,
      'No complaint register entries in 12 months. Tag IDR complaints via org_registers (type=complaint) or attest the RG 271 complaint register manually.',
    );
  }

  const openOld = rows.filter((r) => {
    const s = (r.status || '').toLowerCase();
    if (!s || s === 'closed' || s === 'resolved') return false;
    const since = daysSince(r.created_at);
    return since != null && since > 30;
  });

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_registers',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  return {
    controlCode,
    status: openOld.length > 0 ? 'partial' : 'pass',
    evidenceRefs,
    gaps:
      openOld.length > 0
        ? [
            {
              code: 'complaints_open_over_30d',
              message: `${openOld.length} complaint(s) open beyond the RG 271 30-calendar-day IDR response window.`,
              severity: 'high',
            },
          ]
        : [],
    confidence: 0.7,
    reason: `${rows.length} complaint(s)/12mo; ${openOld.length} open >30d.`,
    evaluatedAt,
  };
}

type RiskRow = {
  id: string;
  category: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

/**
 * CPS-001 — Operational risk management (CPS 230). Risk-register
 * freshness: elevated (critical/high category) risks reviewed within
 * 90d, routine within 365d. Empty register → fail (CPS 230 mandates a
 * documented operational-risk register).
 */
export async function evaluateRiskFreshness(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, category, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .limit(500);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_risks_unavailable',
      `Could not read org_risks: ${error.message}`,
    );
  }

  const risks = (data ?? []) as RiskRow[];
  if (risks.length === 0) {
    return {
      controlCode,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_risk_register',
          message: 'Risk register is empty — CPS 230 requires a documented operational-risk register.',
          severity: 'high',
        },
      ],
      confidence: 0.75,
      reason: 'org_risks empty.',
      evaluatedAt,
    };
  }

  const elevated = risks.filter((r) =>
    ['critical', 'high'].includes((r.category ?? '').toLowerCase()),
  );
  const routine = risks.filter(
    (r) => !['critical', 'high'].includes((r.category ?? '').toLowerCase()),
  );
  const elevatedFresh = elevated.filter((r) => {
    const s = daysSince(r.updated_at ?? r.created_at);
    return s != null && s <= 90;
  }).length;
  const routineFresh = routine.filter((r) => {
    const s = daysSince(r.updated_at ?? r.created_at);
    return s != null && s <= 365;
  }).length;

  const elevatedRatio = elevated.length > 0 ? elevatedFresh / elevated.length : 1;
  const routineRatio = routine.length > 0 ? routineFresh / routine.length : 1;
  const overall = (elevatedRatio + routineRatio) / 2;

  const gaps: ControlGap[] = [];
  if (elevated.length > elevatedFresh) {
    gaps.push({
      code: 'stale_elevated_risks',
      message: `${elevated.length - elevatedFresh}/${elevated.length} elevated risks not reviewed within 90 days.`,
      severity: 'high',
    });
  }
  if (routine.length > routineFresh) {
    gaps.push({
      code: 'stale_routine_risks',
      message: `${routine.length - routineFresh}/${routine.length} routine risks not reviewed within 12 months.`,
      severity: 'medium',
    });
  }

  const status: ControlResult['status'] =
    overall >= 0.9 ? 'pass' : overall >= 0.5 ? 'partial' : 'fail';

  return {
    controlCode,
    status,
    evidenceRefs: risks.slice(0, EVIDENCE_CAP).map((r) => ({
      source: 'org_risks',
      ref: r.id,
      capturedAt: r.updated_at ?? r.created_at ?? undefined,
    })),
    gaps,
    confidence: round2(0.5 + 0.4 * overall),
    reason: `elevated ${elevatedFresh}/${elevated.length} fresh (90d); routine ${routineFresh}/${routine.length} fresh (365d).`,
    evaluatedAt,
  };
}

/**
 * CPS-004 — Information security management (CPS 234). Three-part
 * signal: (a) a current infosec/security policy in org_policies,
 * (b) a current incident-response policy in org_policies, (c) audit-log
 * activity in the last 90 days. No infosec policy and no audit activity
 * → fail.
 */
export async function evaluateInfoSecManagement(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [policiesResult, auditResult] = await Promise.all([
    db
      .from('org_policies')
      .select('id, title, status, updated_at, created_at')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(500),
    db
      .from('org_audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', ninetyDaysAgo),
  ]);

  if (policiesResult.error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_policies_unavailable',
      `Could not read org_policies: ${policiesResult.error.message}`,
    );
  }
  if (auditResult.error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${auditResult.error.message}`,
    );
  }

  const rows = (policiesResult.data ?? []) as PolicyRow[];
  const isCurrent = (p: PolicyRow) =>
    ACTIVE_POLICY_STATUSES.has((p.status || '').toLowerCase()) &&
    (() => {
      const s = daysSince(p.updated_at ?? p.created_at);
      return s != null && s <= 365;
    })();

  const securityPolicy = rows.some(
    (p) =>
      /info(rmation)?[-_ ]?sec(urity)?|cyber|security policy|cps[-_ ]?234/.test(
        (p.title || '').toLowerCase(),
      ) && isCurrent(p),
  );
  const incidentResponse = rows.some(
    (p) =>
      /incident[-_ ]?response|incident[-_ ]?management|ir plan/.test(
        (p.title || '').toLowerCase(),
      ) && isCurrent(p),
  );
  const auditActivity = (auditResult.count ?? 0) >= 30;

  const passing = [securityPolicy, incidentResponse, auditActivity].filter(
    Boolean,
  ).length;

  const gaps: ControlGap[] = [];
  if (!securityPolicy)
    gaps.push({
      code: 'no_infosec_policy',
      message: 'No current information-security policy in org_policies (CPS 234 requires a documented infosec policy framework).',
      severity: 'high',
    });
  if (!incidentResponse)
    gaps.push({
      code: 'no_incident_response_policy',
      message: 'No current incident-response policy in org_policies (CPS 234 requires incident-response capability).',
      severity: 'medium',
    });
  if (!auditActivity)
    gaps.push({
      code: 'low_audit_activity',
      message: 'Fewer than 30 org_audit_logs rows in the last 90 days — limited evidence of operational monitoring.',
      severity: 'low',
    });

  const evidenceRefs: EvidenceRef[] = rows
    .filter(isCurrent)
    .slice(0, EVIDENCE_CAP)
    .map((p) => ({
      source: 'org_policies',
      ref: p.id,
      capturedAt: p.updated_at ?? p.created_at ?? undefined,
    }));

  const status: ControlResult['status'] =
    passing === 3 ? 'pass' : passing >= 1 ? 'partial' : 'fail';

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: 0.65,
    reason: `security policy ${securityPolicy ? '✓' : '✗'}, incident-response policy ${incidentResponse ? '✓' : '✗'}, audit activity ${auditActivity ? '✓' : '✗'} (${auditResult.count ?? 0} rows/90d).`,
    evaluatedAt,
  };
}
