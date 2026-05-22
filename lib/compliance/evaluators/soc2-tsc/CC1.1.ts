/**
 * SOC2-TSC CC1.1 — "Demonstrates commitment to integrity and ethical
 * values"
 *
 * No automated signal: the control requires evidence of a code of
 * conduct, board-approved values, and disciplinary process — none of
 * which are tracked in the FormaOS schema. We could probe
 * `org_policies` for a "code of conduct" title but the criterion
 * really wants signed acknowledgements, which need a future
 * `policy_acknowledgments` audit step. For now, return manual
 * attestation so the UI prompts a compliance officer rather than
 * reporting an unjustified pass.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC1.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC1.1 requires attestation by a compliance officer — code-of-conduct acknowledgement evidence is not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
