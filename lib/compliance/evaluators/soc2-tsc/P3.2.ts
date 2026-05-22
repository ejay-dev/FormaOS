/**
 * SOC2-TSC P3.2 — "Collects with consent"
 *
 * No automated signal: explicit-consent records are not tracked in
 * the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P3.2';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P3.2 requires attestation by a compliance officer — explicit-consent records are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
