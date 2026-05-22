/**
 * SOC2-TSC P4.3 — "Disposes of personal information"
 *
 * No automated signal: deletion attestations across primary stores,
 * replicas and backups are not tracked in the FormaOS schema. Manual
 * attestation. (A future `retention_executions` table would unlock
 * automation here — see C1.2 evaluator for the pattern.)
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'P4.3';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'P4.3 requires attestation by a compliance officer — deletion attestations across primary stores, replicas and backups are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
