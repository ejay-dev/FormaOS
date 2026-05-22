/**
 * SOC2-TSC PI1.2 — "Defines inputs processing"
 *
 * No automated signal: API input-validation rules and rejection logs
 * are application concerns not surfaced in the schema. Manual
 * attestation; the criterion is typically evidenced via SDK / linter
 * configs reviewed during the audit.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { manualAttestation } from './_shared';

const CODE = 'PI1.2';

const evaluate: ControlEvaluator = async () => {
  return manualAttestation(
    CODE,
    new Date().toISOString(),
    'PI1.2 requires attestation by a compliance officer — input-validation rules and rejection logs are not centrally tracked in the FormaOS schema.',
  );
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
