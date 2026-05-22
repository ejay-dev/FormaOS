/**
 * SOC2-TSC CC6.4 — "Restricts physical access"
 *
 * No automated signal: FormaOS is a cloud-only SaaS — there is no
 * badge log / visitor register in the schema. For cloud-only entities
 * this control is typically marked Not Applicable; for hybrid
 * deployments compliance officers must attest physical controls
 * manually.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'CC6.4';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'CC6.4 requires attestation by a compliance officer — physical access controls (badge logs, visitor register) are not modelled in FormaOS; cloud-only entities typically mark this NA.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
