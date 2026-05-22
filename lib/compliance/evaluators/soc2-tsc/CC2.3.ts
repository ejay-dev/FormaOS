/**
 * SOC2-TSC CC2.3 — "Communicates externally"
 *
 * No automated signal: status-page postings, customer comms templates
 * and external-party comms records live outside the FormaOS schema.
 * Manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC2.3';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC2.3 requires attestation by a compliance officer — external comms templates and status-page activity are not tracked in an automated source.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
