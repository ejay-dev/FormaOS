/**
 * MHS-9 — Integration (NSMHS 2010 Standard 9).
 *
 * Manual attestation: partnership agreements, referral pathways and
 * shared-care/information-sharing protocols are documents not modelled
 * as structured rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-9',
  'Documented partnership agreements, referral pathways and shared-care arrangements with primary care, hospitals, community services and NGOs, plus consented information-sharing protocols and transfer-of-care processes — manual attestation.',
);

export { evaluate, meta };
