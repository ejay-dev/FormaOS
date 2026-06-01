/**
 * AFS-006 — Breach Reporting to ASIC (s912D Corporations Act 2001).
 *
 * Planned as a DB-signal against org_regulatory_notifications, but that
 * table cannot represent ASIC breach reports: its `regulation` CHECK
 * constraint only permits NDIS/health/aged-care/workplace-safety values
 * (no ASIC option), `notification_type` is NDIS-specific
 * (immediate/5_day/final), and every row requires a non-null
 * `incident_id` FK to org_incidents. Reading it for finance signals
 * would surface unrelated NDIS data — a false signal. Falls back to
 * manual attestation (the honest, house-standard choice) rather than
 * risk a false pass/fail.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-006',
  'Breach register with significance assessments (within 30 days) and ASIC lodgement confirmations for significant breaches (s912D) — manual attestation; org_regulatory_notifications does not model ASIC reports.',
);

export { evaluate, meta };
