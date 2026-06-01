/**
 * MHS-10.5 — Delivery of care: Exit and re-entry (NSMHS 2010 Standard
 * 10.5).
 *
 * Manual attestation: discharge/exit plans, relapse-prevention plans and
 * re-entry pathways are clinical-record artefacts not modelled as
 * structured org_* rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-10.5',
  'Planned, documented discharge/exit with relapse-prevention plans and follow-up arrangements, communication to the consumer/carers (with consent) and ongoing providers, and clear re-entry pathways — manual attestation.',
);

export { evaluate, meta };
