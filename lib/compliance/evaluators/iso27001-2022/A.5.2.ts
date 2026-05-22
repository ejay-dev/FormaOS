/**
 * ISO/IEC 27001:2022 A.5.2 — "Information security roles and responsibilities"
 *
 * Requires a documented RACI / role-description artefact that is
 * inherently a human attestation — no structured row captures
 * organisational role allocation today. Flagged as manual until a
 * security_roles or raci_matrix table is introduced.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.2',
  'A.5.2 requires a documented RACI / role allocation signed off by management — no automated source.',
);

export { evaluate, meta };
