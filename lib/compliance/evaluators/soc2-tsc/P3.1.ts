/**
 * SOC2-TSC P3.1 — "Collects personal information for identified
 * purposes"
 *
 * No automated signal: PII inventory + purpose register are not
 * modelled in the FormaOS schema. Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P3.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P3.1 requires attestation by a compliance officer — PII inventory and purpose register are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
