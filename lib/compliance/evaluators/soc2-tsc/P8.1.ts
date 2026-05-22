/**
 * SOC2-TSC P8.1 — "Implements privacy compliance monitoring"
 *
 * No automated signal: privacy-inquiry intake log is not modelled in
 * the FormaOS schema (`support_requests` exists but is not segmented
 * by privacy purpose). Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P8.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P8.1 requires attestation by a compliance officer — privacy-inquiry intake log is not segmented in the FormaOS schema.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
