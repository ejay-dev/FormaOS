/**
 * Shared helpers for ISO/IEC 27001:2022 Annex A evaluators.
 *
 * Audit compliance-004 (2026-05-22) — phase 3 of multi-PR rollout.
 * The full ISO 27001:2022 Annex A pack ships 93 controls across four
 * themes (Organizational / People / Physical / Technological). The
 * majority of controls in this framework genuinely require human
 * attestation (policy sign-off, screening, NDAs, physical-perimeter
 * verification) and we model that explicitly via `manualAttestation`
 * rather than inflating pass counts.
 *
 * Anything used by ≥2 evaluators lives here. The lower-level helpers
 * (`notEvaluated`, `manualAttestation`, `daysSince`, `round2`,
 * `EVIDENCE_CAP`) are re-exported from the SOC2-TSC shared module so
 * the two packs stay aligned on shape and error reporting.
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

export const FRAMEWORK: FrameworkSlug = 'iso27001-2022';

/**
 * Build a `manualAttestation` evaluator with one line per call. Most
 * ISO 27001 controls collapse to this — the meaningful evidence is a
 * signed-off policy, training record, NDA, or physical inspection
 * that does not exist as a structured row today.
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
 * Common signal: "is there at least one active/approved policy whose
 * title matches a keyword set, reviewed inside the cadence?"
 *
 * Used for A.5.1, A.5.10, A.5.15, A.5.24, A.5.29, A.5.31, A.5.34,
 * A.7.9 — controls that ISO 27001 satisfies through a signed policy
 * artefact.
 */
const ACTIVE_POLICY_STATUSES = new Set([
  'approved',
  'active',
  'published',
  'in_force',
]);

export type PolicySignalRow = {
  id: string;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export async function evaluatePolicyCadence(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  keywords: RegExp;
  reviewWindowDays: number;
  missingPolicyMessage: string;
  emptyConfidence?: number;
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

  const rows = (data ?? []) as PolicySignalRow[];
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
      confidence: args.emptyConfidence ?? 0.75,
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
      message: `${matching.length} matching polic(ies) exist but none are in an approved/active status.`,
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

/**
 * Common signal: audit-log activity matching a keyword window. Used
 * for change management, incident response, monitoring evaluators.
 */
export async function evaluateAuditActivity(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  actionPattern: RegExp;
  lookbackDays: number;
  emptyMessage: string;
  emptyGapCode: string;
  partialAfterDays?: number;
}): Promise<ControlResult> {
  const { controlCode, orgId, db, actionPattern, lookbackDays } = args;
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_audit_logs')
    .select('id, action, target, actor_email, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${error.message}`,
    );
  }

  const rows = (data ?? []) as Array<{
    id: string;
    action: string | null;
    target: string | null;
    actor_email: string | null;
    created_at: string | null;
  }>;
  const matching = rows.filter((r) => actionPattern.test(r.action ?? ''));

  if (matching.length === 0) {
    return {
      controlCode,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: args.emptyGapCode,
          message: args.emptyMessage,
          severity: 'high',
        },
      ],
      confidence: 0.65,
      reason: `${rows.length} audit row(s) in ${lookbackDays}d window but none matched action pattern.`,
      evaluatedAt,
    };
  }

  const newest = matching
    .map((r) => r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLatest = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (
    args.partialAfterDays != null &&
    sinceLatest != null &&
    sinceLatest > args.partialAfterDays
  ) {
    gaps.push({
      code: 'audit_activity_stale',
      message: `Most recent matching event was ${sinceLatest}d ago — exceeds the ${args.partialAfterDays}d cadence.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = matching
    .slice(0, EVIDENCE_CAP)
    .map((r) => ({
      source: 'org_audit_logs',
      ref: r.id,
      capturedAt: r.created_at ?? undefined,
    }));

  let status: ControlResult['status'];
  if (
    args.partialAfterDays != null &&
    sinceLatest != null &&
    sinceLatest > args.partialAfterDays
  ) {
    status = 'partial';
  } else {
    status = 'pass';
  }

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, matching.length / 5)),
    reason: `${matching.length} matching audit event(s) in ${lookbackDays}d window; latest ${sinceLatest ?? '?'}d ago.`,
    evaluatedAt,
  };
}

/**
 * Wrap a builder into the `{ evaluator, meta }` shape expected by the
 * register, with `framework: 'iso27001-2022'` already filled in.
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

/**
 * Common signal: MFA coverage across active members. Used by A.5.17
 * and A.8.5 (authentication-information / secure-authentication).
 */
type MemberRow = { id: string; user_id: string };
type SecurityRow = { user_id: string; two_factor_enabled: boolean | null };

export async function evaluateMfaCoverage(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
}): Promise<ControlResult> {
  const { controlCode, orgId, db } = args;
  const evaluatedAt = new Date().toISOString();

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id, user_id')
    .eq('organization_id', orgId)
    .eq('compliance_status', 'active');

  if (membersError) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${membersError.message}`,
    );
  }

  const members = (membersData ?? []) as MemberRow[];
  if (members.length === 0) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'no_active_members',
      'Organization has no active members; MFA coverage cannot be evaluated.',
    );
  }

  const userIds = members.map((m) => m.user_id);
  const { data: securityData, error: securityError } = await db
    .from('user_security')
    .select('user_id, two_factor_enabled')
    .in('user_id', userIds);

  if (securityError) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'user_security_unavailable',
      `Could not read user_security: ${securityError.message}`,
    );
  }

  const securityRows = (securityData ?? []) as SecurityRow[];
  const byUser = new Map(securityRows.map((row) => [row.user_id, row]));

  const total = members.length;
  const withRow = members.filter((m) => byUser.has(m.user_id));
  const withMfa = withRow.filter(
    (m) => byUser.get(m.user_id)?.two_factor_enabled === true,
  );

  const coverage = withMfa.length / total;
  const dataCompleteness = withRow.length / total;

  const gaps: ControlGap[] = [];
  const missingRow = total - withRow.length;
  if (missingRow > 0) {
    gaps.push({
      code: 'missing_user_security',
      message: `${missingRow} active member(s) have no user_security record — security onboarding is incomplete.`,
      severity: 'high',
    });
  }
  const disabled = withRow.length - withMfa.length;
  if (disabled > 0) {
    gaps.push({
      code: 'mfa_disabled',
      message: `${disabled} active member(s) have a user_security record but two_factor_enabled=false.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = securityRows
    .slice(0, EVIDENCE_CAP)
    .map((row) => ({ source: 'user_security', ref: row.user_id }));

  let status: ControlResult['status'];
  if (coverage >= 0.95) status = 'pass';
  else if (coverage >= 0.6) status = 'partial';
  else status = 'fail';

  if (dataCompleteness < 0.4) {
    return {
      controlCode,
      status: 'not_evaluated',
      evidenceRefs,
      gaps: [
        ...gaps,
        {
          code: 'insufficient_data',
          message:
            'Less than 40% of active members have a user_security row; cannot evaluate MFA coverage confidently.',
          severity: 'medium',
        },
      ],
      confidence: 0.3,
      reason: 'Primary data source (user_security) is too sparse to evaluate this control.',
      evaluatedAt,
    };
  }

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.5 + 0.5 * dataCompleteness),
    reason: `MFA enabled on ${withMfa.length}/${total} active members (${Math.round(coverage * 100)}%).`,
    evaluatedAt,
  };
}

/**
 * Common signal: vendor / supplier risk register cadence. Used by
 * A.5.19 (supplier security) and A.5.22 (supplier monitoring).
 */
type VendorRiskRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export async function evaluateSupplierRisks(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  reviewWindowDays: number;
  emptyMessage: string;
}): Promise<ControlResult> {
  const { controlCode, orgId, db, reviewWindowDays } = args;
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, title, category, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'org_risks_unavailable',
      `Could not read org_risks: ${error.message}`,
    );
  }

  const rows = (data ?? []) as VendorRiskRow[];
  const vendors = rows.filter((r) => {
    const haystack = `${r.title ?? ''} ${r.category ?? ''}`.toLowerCase();
    return /vendor|supplier|third[-_ ]?party|sub[-_ ]?processor|partner|outsource/.test(
      haystack,
    );
  });

  if (vendors.length === 0) {
    return {
      controlCode,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_vendor_risks',
          message: args.emptyMessage,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 vendor / supplier entries in ${rows.length} org_risks row(s).`,
      evaluatedAt,
    };
  }

  const newest = vendors
    .map((r) => r.updated_at ?? r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceReview = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceReview != null && sinceReview > reviewWindowDays) {
    gaps.push({
      code: 'vendor_review_stale',
      message: `Most recent vendor review was ${sinceReview}d ago — exceeds the ${reviewWindowDays}-day cadence.`,
      severity: sinceReview > reviewWindowDays * 2 ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = vendors.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_risks',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceReview == null || sinceReview <= reviewWindowDays) status = 'pass';
  else if (sinceReview <= reviewWindowDays * 2) status = 'partial';
  else status = 'fail';

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, vendors.length / 3)),
    reason: `${vendors.length} vendor risk(s); most recent review ${sinceReview ?? '?'}d ago.`,
    evaluatedAt,
  };
}

/**
 * Common signal: compliance_scans of a particular scan_type. Used by
 * A.8.7 (malware) and A.8.8 (vulnerability management).
 */
type ScanRow = {
  id: string;
  scan_type: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export async function evaluateScanCadence(args: {
  controlCode: string;
  orgId: string;
  db: ControlEvaluatorContext['db'];
  scanTypePattern: RegExp;
  reviewWindowDays: number;
  staleWindowDays: number;
  emptyMessage: string;
  emptyGapCode: string;
}): Promise<ControlResult> {
  const { controlCode, orgId, db, scanTypePattern, reviewWindowDays, staleWindowDays } =
    args;
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('compliance_scans')
    .select('id, scan_type, completed_at, created_at')
    .eq('organization_id', orgId)
    .order('completed_at', { ascending: false })
    .limit(200);

  if (error) {
    return notEvaluated(
      controlCode,
      evaluatedAt,
      'compliance_scans_unavailable',
      `Could not read compliance_scans: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ScanRow[];
  const matching = rows.filter((s) => scanTypePattern.test(s.scan_type ?? ''));

  if (matching.length === 0) {
    return {
      controlCode,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: args.emptyGapCode,
          message: args.emptyMessage,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 scans of matching type in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = matching
    .map((s) => s.completed_at ?? s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > reviewWindowDays) {
    gaps.push({
      code: 'scan_stale',
      message: `Most recent scan was ${sinceLast}d ago — exceeds the ${reviewWindowDays}-day cadence.`,
      severity: sinceLast > staleWindowDays ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = matching.slice(0, EVIDENCE_CAP).map((s) => ({
    source: 'compliance_scans',
    ref: s.id,
    capturedAt: s.completed_at ?? s.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceLast == null) status = 'partial';
  else if (sinceLast <= reviewWindowDays) status = 'pass';
  else if (sinceLast <= staleWindowDays) status = 'partial';
  else status = 'fail';

  return {
    controlCode,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, matching.length / 5)),
    reason: `${matching.length} scan(s) of matching type; last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
}
