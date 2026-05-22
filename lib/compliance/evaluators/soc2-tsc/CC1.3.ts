/**
 * SOC2-TSC CC1.3 — "Establishes structure, authority, and
 * responsibility"
 *
 * Partial signal: `org_members` carries `role` + `department` which
 * can prove an org structure exists, but reporting-line clarity
 * (org chart, role descriptions) is an attested artefact. We
 * surface the active-member count as supporting context but defer to
 * manual attestation for the criterion itself.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlResult,
} from '../types';
import { manualAttestation, notEvaluated } from './_shared';

const CODE = 'CC1.3';

type MemberRow = { id: string; role: string | null; department: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_members')
    .select('id, role, department')
    .eq('organization_id', orgId)
    .limit(500);

  if (error) {
    // Fall back to attestation — the missing query shouldn't fail the
    // control, the criterion is governance-attested anyway.
    return manualAttestation(
      CODE,
      evaluatedAt,
      `CC1.3 requires attestation by a compliance officer — could not probe org_members for supporting context (${error.message}).`,
    );
  }

  const rows = (data ?? []) as MemberRow[];
  const withRole = rows.filter((m) => !!m.role && m.role.trim().length > 0);

  if (rows.length === 0) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'no_org_members',
      'Organization has no members; cannot evidence an org structure.',
    );
  }

  const result: ControlResult = manualAttestation(
    CODE,
    evaluatedAt,
    `CC1.3 requires attestation by a compliance officer — ${withRole.length}/${rows.length} members carry a role assignment, but reporting-line clarity must be human-attested.`,
  );
  return result;
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
