/**
 * SOC2-TSC PI1.3 — "Defines outputs processing"
 *
 * No automated signal: output reconciliation reports are produced
 * outside the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'PI1.3';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'PI1.3 requires attestation by a compliance officer — output reconciliation reports are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
