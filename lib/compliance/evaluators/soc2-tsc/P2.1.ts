/**
 * SOC2-TSC P2.1 — "Communicates choices and obtains consent"
 *
 * No automated signal: consent logs and preference centre exports
 * are not modelled in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P2.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P2.1 requires attestation by a compliance officer — consent logs and preference-centre choices are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
