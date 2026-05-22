/**
 * SOC2-TSC CC6.5 — "Disposes of physical devices"
 *
 * No automated signal: secure-disposal certificates for laptops /
 * drives are not tracked in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC6.5';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC6.5 requires attestation by a compliance officer — secure device-disposal certificates are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
