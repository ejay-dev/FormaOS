# NDIS Framework — Phase 1 status (2026-05-27, audit R10)

**Phase 1 (shipped, 2026-05-27):** the NDIS framework is now a real entry
in the FormaOS framework registry rather than a marketing label aliased
to SOC 2. Eight representative controls drawn from Standards 1–4 of the
NDIS Quality and Safeguards Commission Practice Standards Core Module
are installed and selectable. All eight evaluators return
`not_evaluated` with a `manual_attestation_required` gap message —
matching the pattern used by the existing GDPR and HIPAA manual
controls — so the compliance score reflects the actual reality: an
NDIS auditor must attest the supporting artefacts exist.

**Why manual-attestation now, automated later:** writing the real
predicate logic for NDIS controls requires NDIS-audit domain expertise
to map each Practice Standards indicator to the correct FormaOS data
signal (incident table cadence, staff worker-screening expirations,
service-agreement coverage by participant, etc.). Best-guess predicates
without that expertise risk false positives that customers and auditors
would rely on — worse than the previous "thin marketing" state.

## Phase 2 punch list

A future cycle, ideally with an NDIS-audit practitioner in the room,
should:

### 1. Expand the Core Module coverage

The Practice Standards Core Module has ~25-30 quality indicators across
four standards. Phase 1 covers 8. The remaining indicators to add:

**Standard 1 — Rights of Participants and Responsibilities of Providers**

- NDIS-1.2 Individual values and beliefs
- NDIS-1.4 Independence and informed choice

**Standard 2 — Provider Governance and Operational Management**

- NDIS-2.1 Governance and operational management
- NDIS-2.3 Quality management
- NDIS-2.4 Information management
- NDIS-2.5 Feedback and complaints management
- NDIS-2.8 Continuity of supports

**Standard 3 — Provision of Supports**

- NDIS-3.1 Access to supports
- NDIS-3.2 Support planning
- NDIS-3.4 Responsive support provision
- NDIS-3.5 Transitions to or from a provider

**Standard 4 — Provision of Supports Environment**

- NDIS-4.2 Participant money and property

### 2. Add the Verification Module (optional, depending on provider profile)

Where a provider delivers Specialist Behaviour Support, add:

- NDIS-V.1 Specialist Behaviour Support — registration requirements
- NDIS-V.2 Implementing Behaviour Support — restrictive practices oversight

### 3. Replace manual-attestation stubs with predicate logic

For the 8 Phase 1 controls and the ~17 added in step 1, the FormaOS
schema signals that map to each indicator (approximate, expert review
required):

| Control | Candidate signal |
|---|---|
| NDIS-1.1 Person-centred supports | care plan review cadence (`care_plans.last_reviewed_at`) + participant goal-field completion |
| NDIS-1.3 Privacy and dignity | privacy policy published + recent staff training completion |
| NDIS-1.5 Violence/abuse safeguarding | incident_register has rows; reportable_incidents filing timeliness vs. NDIS Commission deadline |
| NDIS-2.6 Incident management | quarterly incident-register review cadence |
| NDIS-2.7 HR management | NDIS Worker Screening Check expiry > N days for all staff (`lib/care-scorecard/credential-monitor.ts` already tracks adjacent signal) |
| NDIS-2.2 Risk management | risk register `last_reviewed_at` within last 90 days |
| NDIS-3.3 Service agreements | every active participant has a signed service-agreement document on file |
| NDIS-4.1 Safe environment | requires new `org_locations` + `site_inspection` schema first |

Each row above is a best-guess starting point. An NDIS auditor should
confirm the predicate semantics, the freshness thresholds, and which
edge cases count as `partial` vs. `fail`.

### 4. Update industry pack + onboarding

`lib/industry-packs.ts` currently exposes an `ndis` industry pack as a
static template. After Phase 2 it should:

- Auto-install the NDIS framework when an org selects the NDIS industry
  pack during onboarding.
- Surface NDIS-specific task templates and evidence types.

## What Phase 1 does NOT change

- `lib/care/ndis-claiming.ts` (NDIS claims / billing): unrelated to the
  Practice Standards framework. Left in place.
- The `lib/industry-packs.ts` NDIS pack: unchanged for now.
- Existing customers' compliance posture: NDIS appears in the framework
  selector as a new option. Existing scores against other frameworks
  are unaffected.

## Why this matters

Before Phase 1, FormaOS marketing positioned NDIS as a supported
compliance framework but the platform ran the SOC 2 evaluator pack
under the hood — a real audit-exposure risk if a customer or regulator
probed the claim. Phase 1 makes the surface honest: NDIS is registered,
controls are visible, but the platform tells the truth that those
controls currently require a human attestation. Phase 2 will replace
the manual attestations with automated signal once the domain mapping
is validated by an expert.

## References

- NDIS Quality and Safeguards Commission, *NDIS Practice Standards and
  Quality Indicators* (publicly published, current version).
- Audit cycle commits 2026-05-27 (R10 Phase 1): see git log
  `audit-2026-05-27.*R10`.
- Migration `supabase/migrations/20260624056_audit_2026_05_27_ndis_framework_phase_1.sql`.
- Pack file `framework-packs/ndis.json`.
- Evaluator stubs `lib/compliance/evaluators/ndis/`.
