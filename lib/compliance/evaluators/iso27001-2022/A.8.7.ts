/**
 * ISO/IEC 27001:2022 A.8.7 — "Protection against malware"
 *
 * Signal: compliance_scans of type malware / EDR / antivirus
 * completed within the 180-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateScanCadence } from './_shared';

const CODE = 'A.8.7';
const SCAN_PATTERN = /malware|edr|antivirus|endpoint/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateScanCadence({
    controlCode: CODE,
    orgId,
    db,
    scanTypePattern: SCAN_PATTERN,
    reviewWindowDays: 30,
    staleWindowDays: 180,
    emptyMessage:
      'No malware / EDR / antivirus scans recorded — A.8.7 requires active malware protection evidence.',
    emptyGapCode: 'no_malware_scans',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
