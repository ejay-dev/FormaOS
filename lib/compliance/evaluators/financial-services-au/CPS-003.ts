/**
 * CPS-003 — Material Service Provider Management (APRA CPS 230).
 *
 * Manual attestation: a service-provider register with due-diligence
 * records and performance reviews (including fourth-party dependencies)
 * is not modelled with finance semantics in FormaOS.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'CPS-003',
  'Material-service-provider register with due-diligence records, performance reviews, and fourth-party dependency mapping (APRA CPS 230) — manual attestation.',
);

export { evaluate, meta };
