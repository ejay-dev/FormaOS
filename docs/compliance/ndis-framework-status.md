# NDIS Framework — Phase 3 status (2026-05-27)

**Phase 3 status:** 25 controls registered. **22 with real predicates** —
14 of those map to statutory criteria from the NDIS Act 2013 + Rules
2018 + NDIS Commission published timeframes, 8 to published-guidance
thresholds. **3 stay manual** because the indicator is fundamentally
interview-driven and cannot be faithfully encoded against schema.

⚠️ **EXPERT REVIEW CAVEAT.** The Phase 3 predicate library
(`lib/compliance/evaluators/ndis/_predicates.ts`) cites the original
source documents — Quality Indicators Guidelines 2018 (F2018N00041),
Restrictive Practices Rules 2018 (F2018L00632), Reportable Incidents
guidance, Worker Screening rules. These are the SAME sources an
accredited NDIS Quality Auditor uses. Phase 3 reproduces the auditor's
documentation-review questions in code; it does NOT replace the Stage 2
on-site review.

## Per-control status

| Code | Source class | Predicate signal | Citation |
|---|---|---|---|
| NDIS-1.1 | GUIDANCE | `org_care_plans.updated_at` within 12 months | NDIS Practice Standards Nov 2021 v4 |
| NDIS-1.2 | INTERVIEW | manual-attest (participant values are interview-driven) | — |
| NDIS-1.3 | GUIDANCE | `org_policies` (`ndis_category='privacy'`) current within 12 months | NDIS Practice Standards Nov 2021 v4 |
| NDIS-1.4 | INTERVIEW | manual-attest (supported decision-making is interview-driven) | — |
| NDIS-1.5 | **STATUTORY** | `org_regulatory_notifications.submitted_at - created_at <= 5bd` + safeguarding policy current + open critical incidents check | NDIS Act + Commission portal (24h / 5bd) |
| NDIS-2.1 | GUIDANCE | governance policy current + `org_registers` (`type='conflict_of_interest'`) | NDIS Quality Indicators Guidelines 2018 |
| NDIS-2.2 | GUIDANCE | `org_risks` split by category: elevated ≤90d, routine ≤365d | NDIS Practice Standards (annual review minimum, more often for high-risk) |
| NDIS-2.3 | GUIDANCE | `org_capa_items` activity (6mo window) + overdue tracking | NDIS Quality Indicators Guidelines 2018 |
| NDIS-2.4 | GUIDANCE | 3-part: info-mgmt policy + `retention_policies` active + audit_log ≥30/90d | NDIS Quality Indicators Guidelines 2018 |
| NDIS-2.5 | GUIDANCE | `org_registers` (`type/category='complaint'`) + 30d resolution window | NDIS Quality Indicators Guidelines 2018 |
| NDIS-2.6 | **STATUTORY** | `org_regulatory_notifications.submitted_at - created_at <= 5bd` + incident-mgmt policy | NDIS Act s73Z + Commission portal |
| NDIS-2.7 | **STATUTORY** | `at_risk_credentials` count + expired check | NDIS Worker Screening Rules 2018 (5-year validity) |
| NDIS-2.8 | GUIDANCE | `org_registers` (`type='business_continuity_plan'`) + 12mo review | NDIS Practice Standards Nov 2021 v4 |
| NDIS-3.1 | GUIDANCE | `org_registers` (`type='intake'`) | NDIS Practice Standards Nov 2021 v4 |
| NDIS-3.2 | GUIDANCE | `org_care_plans` × `org_care_goals` coverage ≥90% | NDIS Practice Standards Nov 2021 v4 |
| NDIS-3.3 | GUIDANCE | `org_form_submissions.metadata.form_type='service_agreement'` OR `org_registers` (`type='service_agreement'`) | NDIS Practice Standards Nov 2021 v4 |
| NDIS-3.4 | GUIDANCE | `org_progress_notes` ≥30 in last 90d **plus** per-participant 30d cadence over `org_patients.care_status='active'` (audit 2026-05-27 Tier 3.5 refinement) | NDIS Practice Standards Nov 2021 v4 |
| NDIS-3.5 | GUIDANCE | `org_registers` (`type='transition'`) | NDIS Practice Standards Nov 2021 v4 |
| NDIS-4.1 | GUIDANCE | `org_registers` (`type='environment_assessment'`) + 12mo review | NDIS Practice Standards Nov 2021 v4 |
| NDIS-4.2 | GUIDANCE | `org_registers` (`type='financial_delegation'`) | NDIS Practice Standards Nov 2021 v4 |
| NDIS-V.1 | INTERVIEW | manual-attest (Specialist Behaviour Support Provider registration is external NDIS Commission registration status — verifier confirms separately) | — |
| NDIS-V.2 | **STATUTORY** | `org_behaviour_support_plans` × `org_registers` (`type='restrictive_practice_use'`): interim BSP within 1 month, comprehensive within 6 months, authorisation status check | F2018L00632 + Commission P28.1 |
| NDIS-M.1 | GUIDANCE | `org_medication_administrations` + critical-incident correlation | NDIS Practice Standards Nov 2021 v4 |
| NDIS-M.2 | **STATUTORY** | comprehensive BSPs authorised + signed consent forms tagged `form_type='restrictive_practice_consent'` | F2018L00632 |
| NDIS-W.1 | GUIDANCE | `org_registers` (`type='supervision'`) updated within 6 months | NDIS Practice Standards Nov 2021 v4 |

**Counts:**
- **STATUTORY** (legally-defined timeframes): 5 controls — auditor cannot meaningfully disagree about thresholds
- **GUIDANCE** (Practice Standards / Quality Indicators thresholds): 17 controls — sourced from published documents, all citations above
- **INTERVIEW** (fundamentally human-judgment-driven): 3 controls — NDIS-1.2, NDIS-1.4, NDIS-V.1

## Statutory timeframes encoded

These are LEGAL requirements, not interpretation. The Phase 3 predicates
flag breach as a `fail` (Major NC equivalent):

| Requirement | Source | Predicate |
|---|---|---|
| Reportable incident — 24-hour immediate notification | NDIS Act + Commission portal | NDIS-1.5, NDIS-2.6 |
| Reportable incident — 5-business-day detailed report | NDIS Act + Commission portal | NDIS-1.5, NDIS-2.6 (`submitted_at - created_at <= 5bd`) |
| Unauthorised restrictive practice — reportable within 5 business days | Commission guidance | NDIS-1.5, NDIS-V.2 |
| Worker Screening Check — 5-year validity | NDIS Worker Screening Rules 2018 | NDIS-2.7 (`at_risk_credentials` + expired check) |
| Interim BSP — within 1 month of first regulated RP use | F2018L00632 | NDIS-V.2 |
| Comprehensive BSP — within 6 months of first regulated RP use | F2018L00632 | NDIS-V.2 |
| Monthly RP reporting — within 5 business days of month end | Commission P28.1 | NDIS-V.2 (predicate counts use rows) |

## Auditor rating-scale mapping

Phase 3 evaluator outputs map cleanly to the NDIS audit rating scale
(per Commission published audit-process guidance):

| Evaluator status | NDIS rating | Meaning |
|---|---|---|
| `pass` | **2 (Conformity)** | Documented evidence satisfies the indicator |
| `partial` | **1 (Minor non-conformity)** | Evidence exists but with drift; 12-month cure window |
| `fail` | **0 (Major non-conformity)** | No documented process OR statutory breach; 3-month cure window blocks registration progression |
| `not_evaluated` | Stage 2 review required | Documentation alone is insufficient (e.g., interview-driven indicator) |

## Schema additions in Phase 3

Migration `20260624067`:

1. **`org_policies.ndis_category`** — text column with CHECK constraint
   limiting to 18 known categories (one per Practice Standard outcome).
   Customers tag policies via admin UI; predicates skip NULL rows.

2. **`org_behaviour_support_plans`** — new table tracking the BSP
   lifecycle (interim vs comprehensive, authorisation, expiry) required
   by F2018L00632. Drives NDIS-V.2 + NDIS-M.2 predicates.

3. **`org_registers` taxonomy** — no schema change, but the `type`
   column is now used by predicates for 9 known register types:
   `conflict_of_interest`, `business_continuity_plan`, `intake`,
   `service_agreement`, `transition`, `environment_assessment`,
   `financial_delegation`, `supervision`, `restrictive_practice_use`,
   plus the existing `complaint`.

## What still needs an accredited auditor

Phase 3 cannot substitute for the NDIS Commission's Stage 2 on-site audit:
- Interviews with participants + staff
- Site walk-through (NDIS-4.1 environment assessment in person)
- Verification that documented processes are actually followed in practice
- Final certification recommendation to the NDIS Commission

Phase 3 makes the Stage 1 desk audit (documentation review) much
shorter — the predicates produce exactly the evidence the desk auditor
catalogues — but the formal Stage 2 review still requires an approved
quality auditor.

## Source documents (canonical)

- [NDIS Quality Indicators Guidelines 2018 (F2018N00041)](https://www.legislation.gov.au/Details/F2018N00041)
- [NDIS Practice Standards and Quality Indicators Nov 2021 v4](https://www.ndiscommission.gov.au/sites/default/files/2024-10/ndis-practice-standards-and-quality-indicators.pdf)
- [Reportable Incidents | NDIS Commission](https://www.ndiscommission.gov.au/rules-and-standards/reportable-incidents-and-incident-management/reportable-incidents)
- [Worker Screening | NDIS Commission](https://www.ndiscommission.gov.au/workforce/worker-screening)
- [Restrictive Practices and Behaviour Support Rules 2018 (F2018L00632)](https://www.legislation.gov.au/Details/F2018L00632)
- [Monthly Reporting on Regulated Restrictive Practices — Commission Portal P28.1](https://www.ndiscommission.gov.au/sites/default/files/2025-12/P28.1-NDIS%20Commission%20Portal%20Quick%20Reference%20Guide%20-%20Monthly%20Reporting%20on%20the%20use%20of%20Regulated%20Restrictive%20Practices.pdf)
- [Quality Audit Process | NDIS Commission](https://www.ndiscommission.gov.au/provider-registration/apply-registration/types-audits)
- [NDIS Practice Standards Core Module Explained — NDISCompliant](https://ndiscompliant.com.au/blog/ndis-practice-standards-core-module-explained)

## Phase 4 backlog (deferred)

- Persistent per-org Merkle anchor of compliance evaluations (continuity across audits)
- ~~Per-participant cadence checks (NDIS-3.4 currently org-wide threshold; could refine)~~ — **landed audit 2026-05-27 Tier 3.5**.
- NDIS Commission registration-status API integration for NDIS-V.1 (currently external/manual)
- Specialist module: High Intensity Daily Personal Activities + Specialist Disability Accommodation indicators
