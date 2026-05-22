/**
 * SOC2-TSC P4.1 — "Limits use of personal information"
 *
 * No automated signal: purpose-limitation policy enforcement and
 * PII-access logs are not modelled in the FormaOS schema (general
 * audit logs are not categorised by purpose). Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P4.1';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P4.1 requires attestation by a compliance officer — purpose-limited PII access logs are not categorised in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
