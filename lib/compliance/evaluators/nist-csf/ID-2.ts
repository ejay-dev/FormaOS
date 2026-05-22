/**
 * NIST CSF ID-2 — Business environment understood.
 *
 * Business impact analysis and service dependency maps are not
 * modelled. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'ID-2',
  'ID-2 requires a business impact analysis and service dependency map — FormaOS does not model service dependencies as rows, so a compliance officer must attest the BIA exists.',
);

export { meta, evaluate };
