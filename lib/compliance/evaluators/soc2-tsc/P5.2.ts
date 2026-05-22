/**
 * SOC2-TSC P5.2 — "Allows correction of personal information"
 *
 * No automated signal: correction-request log is not modelled in the
 * FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P5.2';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P5.2 requires attestation by a compliance officer — correction-request logs are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
