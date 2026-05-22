/**
 * SOC2-TSC P6.5 — "Obtains commitments from third parties"
 *
 * No automated signal: vendor contract terms (breach-notification
 * clauses) are not modelled in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P6.5';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P6.5 requires attestation by a compliance officer — vendor contract terms (breach-notification clauses) are not modelled in the FormaOS schema.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
