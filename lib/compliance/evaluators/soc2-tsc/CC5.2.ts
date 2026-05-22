/**
 * SOC2-TSC CC5.2 — "Selects and develops general controls over
 * technology"
 *
 * Signal: presence of CC5.1 controls plus the legacy evaluator family
 * (CC6.x logical access, CC7.x ops, CC8.1 change-management) implies
 * IT general controls are being exercised. Since each of those areas
 * already has its own evaluator we defer the matrix attestation to a
 * human reviewer rather than double-count.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC5.2';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC5.2 is covered by the individual ITGC evaluators (CC6.x access, CC7.x ops, CC8.1 change-mgmt); ITGC-matrix completeness must be human-attested to avoid double-counting.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
