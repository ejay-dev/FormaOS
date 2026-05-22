/**
 * SOC2-TSC P5.1 — "Provides access to personal information"
 *
 * No automated signal: DSAR (data-subject access request) logs are
 * not modelled in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P5.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P5.1 requires attestation by a compliance officer — DSAR (data-subject access request) logs are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
