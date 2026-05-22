/**
 * ISO/IEC 27001:2022 A.7.5 — "Protecting against physical and environmental threats"
 *
 * A.7.5 requires environmental-controls evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.5',
  'A.7.5 requires environmental-controls evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
