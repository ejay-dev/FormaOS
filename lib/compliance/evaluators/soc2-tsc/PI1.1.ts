/**
 * SOC2-TSC PI1.1 — "Defines data processing standards"
 *
 * No automated signal: data dictionaries and processing specs are
 * narrative artefacts kept outside the application database. Manual
 * attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'PI1.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'PI1.1 requires attestation by a compliance officer — data dictionaries and processing specs are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
