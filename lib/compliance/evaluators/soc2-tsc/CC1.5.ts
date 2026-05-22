/**
 * SOC2-TSC CC1.5 — "Enforces accountability"
 *
 * No automated signal: performance-review tie-in and disciplinary
 * records live outside the application database. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC1.5';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC1.5 requires attestation by a compliance officer — performance-review and disciplinary records are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
