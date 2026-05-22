/**
 * CIS-05 — Account management.
 *
 * Joiner/mover/leaver workflows are not modelled in FormaOS — we have
 * org_members but no lifecycle event history. Manual attestation
 * until an identity_lifecycle table is introduced.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-05',
  'CIS-05 requires joiner/mover/leaver evidence and privileged-access review records — FormaOS tracks org_members but not the lifecycle events themselves, so a compliance officer must attest the program is in place.',
);

export { meta, evaluate };
