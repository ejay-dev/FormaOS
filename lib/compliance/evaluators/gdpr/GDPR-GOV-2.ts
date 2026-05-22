/**
 * GDPR-GOV-2 — Privacy governance roles.
 *
 * Role descriptions and DPO assignment are signed artefacts not
 * modelled in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-GOV-2',
  'GDPR-GOV-2 requires named privacy roles (DPO, controllers, processors) — FormaOS does not model these assignments, so a compliance officer must attest the roles are filled.',
);

export { meta, evaluate };
