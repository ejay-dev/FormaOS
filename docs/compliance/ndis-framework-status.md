# NDIS Framework — Phase 2 status (2026-05-27, audit R10 Phase 2)

**Phase 2 status (this commit):** NDIS framework covers 25 controls — 11
with real predicate logic against the FormaOS schema, 14 manual-attestation
pending Phase 3 schema work or domain-expert review.

⚠️ **EXPERT REVIEW REQUIRED.** Predicate semantics + thresholds were chosen
against the publicly-published NDIS Practice Standards Quality Indicators
but have NOT been validated by a registered NDIS-audit practitioner.
Customers should treat any `pass` verdict as "preliminary signal — confirm
with your NDIS auditor before relying on this for certification" until
expert sign-off lands.

## Coverage breakdown

| Code | Title | Mode | Signal source |
|---|---|---|---|
| NDIS-1.1 | Person-centred supports | auto | `org_care_plans` review cadence (180d) |
| NDIS-1.2 | Individual values and beliefs | manual | (Phase 3: participant-profile schema) |
| NDIS-1.3 | Privacy and dignity | manual | (Phase 3: policy taxonomy) |
| NDIS-1.4 | Independence and informed choice | manual | (Phase 3: consent records) |
| NDIS-1.5 | Violence/abuse safeguarding | auto | `org_incidents` + `org_investigations` activity |
| NDIS-2.1 | Governance and operational management | manual | (Phase 3: policy category taxonomy) |
| NDIS-2.2 | Risk management | auto | `org_risks` review cadence (90d) |
| NDIS-2.3 | Quality management | auto | `org_capa_items` activity + overdue count |
| NDIS-2.4 | Information management | auto | `audit_log` activity (90d) |
| NDIS-2.5 | Feedback and complaints management | auto | `org_registers` type=complaint resolution |
| NDIS-2.6 | Incident management | auto | `org_incidents` + `org_regulatory_notifications` submission |
| NDIS-2.7 | Human resource management | auto | `at_risk_credentials` |
| NDIS-2.8 | Continuity of supports | manual | (Phase 3: BCP schema) |
| NDIS-3.1 | Access to supports | manual | (Phase 3: intake schema) |
| NDIS-3.2 | Support planning | auto | `org_care_plans` × `org_care_goals` coverage |
| NDIS-3.3 | Service agreements | semi_auto | `org_form_submissions` proxy (taxonomy work needed) |
| NDIS-3.4 | Responsive support provision | auto | `org_progress_notes` cadence (90d) |
| NDIS-3.5 | Transitions | manual | (Phase 3: transition schema) |
| NDIS-4.1 | Safe environment | manual | (Phase 3: env-inspection schema) |
| NDIS-4.2 | Participant money and property | manual | (Phase 3: financial-record schema) |
| NDIS-V.1 | Specialist Behaviour Support — registration | manual | NDIS Commission registration (external) |
| NDIS-V.2 | Restrictive practices oversight | manual | (Phase 3: restrictive-practice schema) |
| NDIS-M.1 | Medication management | auto | `org_medication_administrations` + critical incidents |
| NDIS-M.2 | Restrictive practices and consent | manual | (Phase 3: behaviour-support-plan schema) |
| NDIS-W.1 | Worker engagement and wellbeing | manual | (Phase 3: supervision-records schema) |

**Real-predicate count:** 11 of 25 (44%). All real-predicate evaluators
carry an "EXPERT REVIEW REQUIRED" comment in their file header and their
predicate body in `lib/compliance/evaluators/ndis/_predicates.ts`.

## Phase 3 backlog (schema work + expert sign-off)

Each "manual" row above flips to "auto" when its schema gap is closed:

1. **Participant profile fields** — culture, beliefs, supported-decision-making.
2. **Policy taxonomy** — categorise org_policies by NDIS-standard mapping (governance, privacy, safeguarding, etc.) so a predicate can find the right policy for the right control.
3. **Service agreement form_type** — distinguish service-agreement form_submissions from other forms.
4. **Restrictive practice register** — dedicated table for authorisations + monthly reportable use.
5. **Behaviour support plan + consent linkage** — for NDIS-M.2.
6. **Financial-record schema** — for NDIS-4.2 participant money/property.
7. **Env-inspection schema** — for NDIS-4.1.
8. **Supervision records** — for NDIS-W.1.
9. **Transition checklist + handover schema** — for NDIS-3.5.
10. **BCP schema** — for NDIS-2.8 continuity of supports.

## Expert-review checklist

Before treating any predicate as production-grade, an NDIS-audit
practitioner should validate:

- [ ] **Cadence thresholds** — 180-day care-plan review, 90-day risk review,
      30-day complaints resolution. Are these the right NDIS-audit
      expectations?
- [ ] **"Zero is suspicious" calls** — NDIS-1.5 + NDIS-2.5 flag empty
      incident/complaints histories as `partial`. Is that the right
      direction, or should empty = `pass` for a small provider?
- [ ] **Reportable incident submission timeliness** — NDIS-2.6 currently
      flags any unsubmitted notification as `fail`. NDIS Commission
      timeframes vary by incident severity; should we differentiate?
- [ ] **Medication-error proxy** — NDIS-M.1 uses critical-severity
      incidents as a proxy for medication errors. Coarse — should we
      add an `org_incidents.category='medication_error'` taxonomy?
- [ ] **Worker screening expiry windows** — NDIS-2.7 calls `fail` on any
      expired credential. Real NDIS audits may allow a grace window if
      the worker is suspended.

## How to bring in an expert

1. Share this document + the prediate file at
   `lib/compliance/evaluators/ndis/_predicates.ts`.
2. Review the expert-review checklist together.
3. Adjust thresholds + add tests in
   `__tests__/lib/compliance/evaluators/ndis-phase-2.test.ts`.
4. Once expert signs off on a predicate, change the "⚠️ EXPERT REVIEW
   REQUIRED" comment to "✓ Expert-reviewed YYYY-MM-DD by <name>".

## References

- NDIS Quality and Safeguards Commission, *NDIS Practice Standards and
  Quality Indicators* (publicly published, current version).
- Migration `supabase/migrations/20260624056_audit_2026_05_27_ndis_framework_phase_1.sql` (Phase 1).
- Migration `supabase/migrations/20260624059_audit_2026_05_27_r10_phase_2_ndis_controls.sql` (Phase 2).
- Evaluator source: `lib/compliance/evaluators/ndis/`.
- Predicate library: `lib/compliance/evaluators/ndis/_predicates.ts`.
- Tests: `__tests__/lib/compliance/evaluators/ndis-phase-2.test.ts` + register test.
