/**
 * SOC2-TSC CC2.1 — "Uses relevant information"
 *
 * No automated signal: there is no data-source / source-of-truth
 * registry in the FormaOS schema today. Compliance officers must
 * attest that the information used in security decisions is current
 * and relevant. We return `not_evaluated` with an explicit
 * `manual_attestation_required` gap so the UI can prompt for human
 * input rather than reporting an unjustified pass.
 *
 * Subsequent PRs that introduce a data-inventory table should
 * replace this with a real signal.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC2.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC2.1 requires attestation by a compliance officer — no automated data-source registry exists in FormaOS yet.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
