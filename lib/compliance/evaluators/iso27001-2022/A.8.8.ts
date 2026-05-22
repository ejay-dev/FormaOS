/**
 * ISO/IEC 27001:2022 A.8.8 — "Management of technical vulnerabilities"
 *
 * Signal: compliance_scans of type vulnerability / dependency / SCA
 * completed inside the 90-day cadence the pack defines.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateScanCadence } from './_shared';

const CODE = 'A.8.8';
const SCAN_PATTERN = /vulnerab|dependency|sca|sast|dast|cve/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateScanCadence({
    controlCode: CODE,
    orgId,
    db,
    scanTypePattern: SCAN_PATTERN,
    reviewWindowDays: 90,
    staleWindowDays: 180,
    emptyMessage:
      'No vulnerability / dependency / SCA scans recorded — A.8.8 requires regular vulnerability assessment.',
    emptyGapCode: 'no_vulnerability_scans',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
