/**
 * AFS-003 — Financial Product Disclosure (Part 7.9 Corporations Act 2001).
 *
 * DB-signal: org_policies whose title matches PDS / FSG / disclosure,
 * active/published and reviewed within 365 days. No matching policy →
 * fail (the required disclosure artefact is absent).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluatePolicyCadence({
    controlCode: 'AFS-003',
    orgId: ctx.orgId,
    db: ctx.db,
    keywords: /pds|product disclosure|\bfsg\b|financial services guide|disclosure/,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No org_policies titled as a PDS, FSG, or disclosure document. Maintain current Product Disclosure Statements and Financial Services Guides (Part 7.9 Corporations Act 2001).',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'AFS-003',
  evaluator: evaluate,
};

export { evaluate };
