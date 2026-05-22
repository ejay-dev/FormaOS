/**
 * NIST CSF GV-1 — Cybersecurity governance defined.
 *
 * Governance charters and leadership minutes are signed artefacts
 * not modelled in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GV-1',
  'GV-1 requires a governance charter and leadership accountability records — FormaOS does not model these artefacts, so a compliance officer must attest the program is governed.',
);

export { meta, evaluate };
