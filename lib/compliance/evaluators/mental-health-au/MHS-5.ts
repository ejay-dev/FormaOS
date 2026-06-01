/**
 * MHS-5 — Promotion and prevention (NSMHS 2010 Standard 5).
 *
 * Manual attestation: promotion, prevention and early-intervention
 * plans and community-engagement activities are not modelled as rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-5',
  'Documented mental health promotion, prevention and early-intervention plan, records of community engagement / stigma-reduction activity, and an evaluation of reach and impact — manual attestation.',
);

export { evaluate, meta };
