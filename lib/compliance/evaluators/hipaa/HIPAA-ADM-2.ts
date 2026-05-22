/**
 * HIPAA-ADM-2 — Security management process.
 *
 * Security policies and sanction policy are documents — FormaOS
 * does record org_policies, but the HIPAA-specific framing
 * (sanctions, workforce clearance) is not separable as a row.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-ADM-2',
  'HIPAA-ADM-2 requires HIPAA-specific security and sanction policies — FormaOS records org_policies broadly but cannot distinguish HIPAA-scope policies, so a compliance officer must attest the policy set covers the Security Rule.',
);

export { meta, evaluate };
