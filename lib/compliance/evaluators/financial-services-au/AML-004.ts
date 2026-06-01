/**
 * AML-004 — AUSTRAC Compliance Reporting (AML/CTF Act 2006 s41-45).
 *
 * Planned as a DB-signal against org_regulatory_notifications (TTR/SMR
 * timeliness), but that table cannot represent AUSTRAC lodgements: its
 * `regulation` CHECK constraint only permits NDIS/health/aged-care/
 * workplace-safety values (no AUSTRAC option), `notification_type` is
 * NDIS-specific (immediate/5_day/final), and every row requires a
 * non-null `incident_id` FK to org_incidents. Reading it for finance
 * signals would surface unrelated NDIS data. Falls back to manual
 * attestation rather than risk a false pass/fail.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AML-004',
  'AUSTRAC lodgement records (TTRs, IFTIs, SMRs) with completeness checks and error reconciliation, lodged within prescribed timeframes (AML/CTF Act 2006 s41-45) — manual attestation; org_regulatory_notifications does not model AUSTRAC reports.',
);

export { evaluate, meta };
