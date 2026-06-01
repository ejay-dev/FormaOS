/**
 * CPS-005 — Governance and Accountability (APRA CPS 510).
 *
 * Manual attestation: fit-and-proper assessments for responsible
 * persons, the board skills matrix, and the governance framework are
 * board/governance documents held outside FormaOS.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'CPS-005',
  'Fit-and-proper assessments for responsible persons, board skills matrix, and governance framework (APRA CPS 510) — manual attestation.',
);

export { evaluate, meta };
