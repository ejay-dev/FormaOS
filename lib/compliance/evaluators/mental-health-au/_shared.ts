/**
 * Shared helpers for the National Standards for Mental Health Services
 * pack (`mental-health-au`, code MENTAL_HEALTH_AU).
 *
 * The pack covers the ten NSMHS 2010 standards (Standard 10 split into
 * its five delivery-of-care sub-areas) — 14 controls. Most standards
 * genuinely require human attestation (a displayed rights charter,
 * cultural-safety training, partnership agreements, discharge planning)
 * and we model that explicitly via `manualAttestation` rather than
 * inflating pass counts.
 *
 * Four controls map cleanly onto structured FormaOS rows:
 *   - MHS-2  (Safety)        → org_incidents
 *   - MHS-3  (Participation) → org_registers (complaint/feedback)
 *   - MHS-8  (Governance)    → org_policies cadence
 *   - MHS-10.4 (Treatment)   → org_risks freshness
 *
 * The lower-level primitives (`notEvaluated`, `manualAttestation`,
 * `daysSince`, `round2`, `EVIDENCE_CAP`) are re-exported from the
 * SOC2-TSC shared module so every pack stays aligned on shape and
 * error reporting.
 *
 * IMPORTANT — verified schema (no invented tables/columns):
 *   - org_policies(id, organization_id, title, status, updated_at,
 *     created_at) — no clinical/category tag, so mental-health policies
 *     are matched by title keyword only.
 *   - org_registers(id, org_id, type, category, status, updated_at,
 *     created_at) — keyed by org_id (NOT organization_id); `type` and
 *     `category` are free-form text.
 *   - org_risks(id, organization_id, category, status, updated_at,
 *     created_at).
 *   - org_incidents(id, organization_id, severity[low|medium|high|
 *     critical], status[open|resolved], occurred_at, resolved_at,
 *     created_at) — keyed by organization_id.
 * A DB-signal helper that finds no relevant rows returns
 * `manualAttestation` / `not_evaluated` / `fail` (per the standard's
 * intent), never a false `pass`.
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

export const FRAMEWORK: FrameworkSlug = 'mental-health-au';

const ACTIVE_POLICY_STATUSES = new Set([
  'approved',
  'active',
  'published',
  'in_force',
]);

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build a `manualAttestation` evaluator with one line per call. The
 * meaningful evidence is a displayed rights charter, cultural-safety
 * training, a partnership agreement, or a discharge plan that does not
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
 * `framework: 'mental-health-au'` already filled in.
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
 * MHS-8 — Governance, leadership and management. "Is there at least one
 * active/approved governance policy whose title matches a keyword set,
 * reviewed inside the cadence?"
 *
 * org_policies has no clinical/category column, so the match is on
 * `title` keywords only. Zero matches → fail with a clear gap (the
 * required governance artefact is simply absent), NOT a false pass.
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
  const matching = rows.filter((p) =>
    keywords.test((p.title || '').toLowerCase()),
  );

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
      reason: `0 org_policies titles matched the governance keyword set (${rows.length} polic(ies) in total).`,
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
      message: `${matching.length} matching governance polic(ies) exist but none are in an approved/active/published status.`,
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
      message: `Governance polic(ies) last reviewed ${since ?? '?'}d ago — exceeds the ${reviewWindowDays}-day review cadence.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = active
    .slice(0, EVIDENCE_CAP)
    .map((p) => ({
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
    reason: `${matching.length} matching governance polic(ies); ${active.length} active; ${fresh.length} reviewed within ${reviewWindowDays}d.`,
    evaluatedAt,
  };
}

type IncidentRow = {
  id: string;
  severity: string | null;
  status: string | null;
  occurred_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
};

/**
 * MHS-2 — Safety. Incident-management system signal: incidents in
 * org_incidents over the last 12 months, flagging high/critical
 * incidents that remain open and any open beyond a reasonable review
 * window. An empty register is treated as `manualAttestation` (a safe
 * environment may genuinely have had no incidents, but it could equally
 * mean incidents are tracked outside FormaOS) — never a false pass.
 */
export async function evaluateIncidentSafety(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();
  const oneYearAgo = new Date(Date.now() - 365 * DAY_MS).toISOString();

  const { data, error } = await db
    .from('org_incidents')
    .select('id, severity, status, occurred_at, resolved_at, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', oneYearAgo)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_incidents_unavailable',
      `Could not read org_incidents: ${error.message}`,
    );
  }

  const rows = (data ?? []) as IncidentRow[];
  if (rows.length === 0) {
    return manualAttestation(
      controlCode,
      evaluatedAt,
      'No incidents recorded in org_incidents in the last 12 months. Operate the incident-management system in FormaOS (self-harm, aggression, restraint/seclusion, medication events) or attest the safety incident register manually — absence of rows is not evidence of a safe environment.',
    );
  }

  const open = rows.filter((r) => (r.status || '').toLowerCase() === 'open');
  const openSevere = open.filter((r) =>
    ['high', 'critical'].includes((r.severity || '').toLowerCase()),
  );
  const openStale = open.filter((r) => {
    const since = daysSince(r.created_at ?? r.occurred_at);
    return since != null && since > 30;
  });

  const gaps: ControlGap[] = [];
  if (openSevere.length > 0) {
    gaps.push({
      code: 'open_severe_incidents',
      message: `${openSevere.length} high/critical safety incident(s) remain open — review and close per the incident-management procedure.`,
      severity: 'critical',
    });
  }
  if (openStale.length > 0) {
    gaps.push({
      code: 'incidents_open_over_30d',
      message: `${openStale.length} incident(s) open beyond 30 days without resolution.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows
    .slice(0, EVIDENCE_CAP)
    .map((r) => ({
      source: 'org_incidents',
      ref: r.id,
      capturedAt: r.created_at ?? r.occurred_at ?? undefined,
    }));

  const status: ControlResult['status'] =
    openSevere.length > 0
      ? 'fail'
      : openStale.length > 0
        ? 'partial'
        : 'pass';

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: 0.7,
    reason: `${rows.length} incident(s)/12mo; ${open.length} open (${openSevere.length} high/critical, ${openStale.length} open >30d).`,
    evaluatedAt,
  };
}

type RegisterRow = {
  id: string;
  type: string | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * MHS-3 — Consumer and carer participation. Feedback/complaint signal:
 * rows in org_registers (type/category = complaint OR feedback) within
 * 12 months, flagging any open beyond a 30-day acknowledgement window.
 * No feedback/complaint rows → manualAttestation (participation
 * mechanisms may be tracked outside FormaOS).
 */
export async function evaluateParticipationFeedback(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();
  const oneYearAgo = new Date(Date.now() - 365 * DAY_MS).toISOString();

  const { data, error } = await db
    .from('org_registers')
    .select('id, type, category, status, created_at, updated_at')
    .eq('org_id', orgId)
    .or(
      'type.eq.complaint,category.eq.complaint,type.eq.feedback,category.eq.feedback',
    )
    .gte('created_at', oneYearAgo);

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
    return manualAttestation(
      controlCode,
      evaluatedAt,
      'No consumer/carer feedback or complaint entries in org_registers in 12 months. Capture feedback/complaints (type=feedback or type=complaint) or attest the consumer- and carer-participation mechanisms (committee representation, feedback channels) manually.',
    );
  }

  const openOld = rows.filter((r) => {
    const s = (r.status || '').toLowerCase();
    if (!s || s === 'closed' || s === 'resolved') return false;
    const since = daysSince(r.created_at);
    return since != null && since > 30;
  });

  const evidenceRefs: EvidenceRef[] = rows
    .slice(0, EVIDENCE_CAP)
    .map((r) => ({
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
              code: 'feedback_open_over_30d',
              message: `${openOld.length} feedback/complaint item(s) open beyond 30 days without acknowledgement or resolution.`,
              severity: 'medium',
            },
          ]
        : [],
    confidence: 0.7,
    reason: `${rows.length} feedback/complaint item(s)/12mo; ${openOld.length} open >30d.`,
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
 * MHS-10.4 — Treatment and support. Risk-register freshness: elevated
 * (critical/high category) clinical/consumer risks reviewed within 90d,
 * routine within 365d. Empty register → fail (recovery-oriented
 * treatment matched to assessed risk requires a documented risk
 * register).
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
          message:
            'Risk register is empty — treatment matched to assessed clinical/consumer risk (suicide/self-harm, absconding, medication, aggression) requires a documented risk register.',
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

  const elevatedRatio =
    elevated.length > 0 ? elevatedFresh / elevated.length : 1;
  const routineRatio = routine.length > 0 ? routineFresh / routine.length : 1;
  const overall = (elevatedRatio + routineRatio) / 2;

  const gaps: ControlGap[] = [];
  if (elevated.length > elevatedFresh) {
    gaps.push({
      code: 'stale_elevated_risks',
      message: `${elevated.length - elevatedFresh}/${elevated.length} elevated clinical/consumer risks not reviewed within 90 days.`,
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
