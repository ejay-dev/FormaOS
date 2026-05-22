/**
 * SOC2-TSC P6.4 — "Has agreements with third parties"
 *
 * No automated signal: DPA (Data Processing Agreement) tracker is not
 * modelled in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P6.4';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P6.4 requires attestation by a compliance officer — DPA expiry tracker is not modelled in the FormaOS schema.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
