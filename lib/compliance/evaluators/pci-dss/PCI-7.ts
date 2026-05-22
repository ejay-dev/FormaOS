/**
 * PCI-7 — Access control (need-to-know).
 *
 * Need-to-know access for cardholder data isn't expressible in
 * FormaOS without a CDE-system classifier on org_members. Manual
 * attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-7',
  'PCI-7 requires need-to-know access control for cardholder data — FormaOS does not classify members by CDE access scope, so a compliance officer must attest RBAC restricts access appropriately.',
);

export { meta, evaluate };
