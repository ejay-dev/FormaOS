/**
 * SOC2-TSC CC1.2 — "Exercises oversight responsibility"
 *
 * No automated signal: the criterion needs board minutes / audit
 * committee charters which live outside the application database.
 * Returns manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC1.2';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC1.2 requires attestation by a compliance officer — board oversight minutes are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
