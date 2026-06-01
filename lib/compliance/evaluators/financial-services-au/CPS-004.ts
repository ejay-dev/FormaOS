/**
 * CPS-004 — Information Security Management (APRA CPS 234).
 *
 * DB-signal: current infosec policy + current incident-response policy
 * (org_policies title match, active/published, <=365d) + audit-log
 * activity (org_audit_logs >=30 rows in 90d).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateInfoSecManagement } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateInfoSecManagement({
    controlCode: 'CPS-004',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'CPS-004',
  evaluator: evaluate,
};

export { evaluate };
