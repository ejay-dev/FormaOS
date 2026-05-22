/**
 * ISO/IEC 27001:2022 A.5.4 — "Management responsibilities"
 *
 * A.5.4 requires sampled evidence that management actively reinforces security expectations — captured via attestation, not telemetry.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.4',
  'A.5.4 requires sampled evidence that management actively reinforces security expectations — captured via attestation, not telemetry.',
);

export { evaluate, meta };
