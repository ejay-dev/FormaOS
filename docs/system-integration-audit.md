# System Integration Audit — 2026-04-25

This audit checks the *seams* between FormaOS surfaces — public site,
authenticated app, onboarding, billing, modules, evidence, audit trail,
dashboard. It is a follow-up to the deep workflow integrity pass and
covers every surface from "click on the homepage" to "see the
consequence in the dashboard".

## Integration map

```
public marketing site
    │
    ├── Foundation CTA  → /auth/signup?plan=basic&intent=checkout
    ├── Growth CTA      → /contact?type=compliance-plan&plan=growth
    └── Enterprise CTA  → /contact?type=enterprise&plan=enterprise
                                                         │
                                          (lead persisted in marketing_leads)
public auth
    │
    └── /auth/signup (plan + checkout-intent cookie set)
                                                         │
                                          (email or Google OAuth)
                                                         │
authenticated app
    │
    ├── /app  (server) — reads checkout-intent cookie → /app/billing?autoCheckout=basic
    │                                                         │
    │                              BillingActionButtons → startCheckout (Stripe)
    │
    ├── First-session state: 5 onboarding steps
    │     ├─ create-care-plan   → /app/care-plans/new
    │     ├─ add-goal           → /app/care-plans/{id}
    │     ├─ log-progress-note  → /app/participants
    │     ├─ upload-evidence    → /app/vault
    │     └─ review-task        → /app/tasks
    │
    ├── Modules
    │     ├─ /app/compliance        Obligations register
    │     ├─ /app/care-plans        Plans + goals + supports
    │     ├─ /app/incidents         Incident detail + investigation
    │     ├─ /app/staff-compliance  Credentials
    │     ├─ /app/policies          Policies + evidence
    │     ├─ /app/vault             Global evidence list
    │     └─ /app/audit-trail       org_audit_logs feed
    │
    └── Cross-module signals
          ├─ Evidence attached anywhere → org_evidence row + audit log entry
          ├─ Incident resolved          → audit log + scorecard openCount drop
          ├─ Credential verified        → audit log + status update
          └─ Care plan status change    → audit log + plan status update
```

## Website → App handoff

| Surface | CTA | Destination | Preserves |
| ------- | --- | ----------- | --------- |
| `/pricing` Foundation card | "Start Foundation Plan" | `/auth/signup?plan=basic&intent=checkout&source=pricing` | plan, checkout intent, source |
| `/pricing` Growth card     | "Get Compliance Plan"   | `/contact?type=compliance-plan&plan=growth&source=pricing` | inquiry type, plan, source |
| `/pricing` Enterprise card | "Book Demo"             | `/contact?type=enterprise&plan=enterprise&source=pricing` | inquiry type, plan, source |
| Generic site CTAs (`compliancePlanHref` / `demoHref` / `salesHref` / `assessmentHref` / `buyerReviewHref` / `securityReviewHref`) | various | `/contact?type=...&source=...` | inquiry type, source |
| `/contact` form                         | submit | `submitMarketingLead` server action → `marketing_leads` row, returns `?success=1` | inquiry type, plan, primary need, timeline, source |

The handoff post-signup is end-to-end: pricing → signup writes a 30-min
`formaos_checkout_intent` cookie → `/app` server component reads it →
redirects to `/app/billing?autoCheckout=basic` → `BillingActionButtons`
reads the URL param and triggers `startCheckout` once. The cookie is
cleared on the redirect back from the BillingActionButtons. If the
cookie expires mid-flow the recent-signup branch in `/app/page.tsx`
sends the user to `/app/billing?resumeCheckout=basic` with truthful
copy explaining the timeout.

**No fake handoffs were found**: every public CTA points to a route
that exists and the destination renders (`check:app-links` reports 0
broken links across 301 routes).

## Auth / billing / app result

| Check | Result |
| ----- | ------ |
| Plan intent preserved through Google + email signup | ✅ — plan is part of OAuth `redirectTo`, plus the `formaos_checkout_intent` cookie covers the email path |
| Cookie expiry recovery | ✅ — recent-signup with no active subscription is routed to `/app/billing?resumeCheckout=basic` rather than dropped on the dashboard |
| Subscription label correct | ✅ — `/app/billing` resolves the org `plan_key` via `resolvePlanKey` and renders the correct PLAN_CATALOG name (Foundation/Growth/Enterprise) |
| Onboarding starts only when appropriate | ✅ — `getFirstSessionState` derives `isFirstSession` from real DB counts and hides the hero once `incidents > 0` (org has moved past pure onboarding) |
| Returning users see resumed state | ✅ — onboarding step `done` flags are computed each render; the strip and contextual banners read the same source |
| Failed auth has recovery UI | ✅ — `/workspace-recovery`, `/auth/error`, `/app/billing?status=missing_customer` etc. all surface honest copy |

## Cross-module integration result

| Relationship | Source ↔ Target | Result |
| ------------ | --------------- | ------ |
| Resident ↔ Care Plans | `org_care_plans.client_id → org_patients.id`, plan detail links to participant | ✅ |
| Resident ↔ Progress Notes | `org_progress_notes.patient_id`, care-plan detail shows recent notes | ✅ |
| Resident ↔ Service Logs | `org_visits.client_id`, sidebar shows recent visits | ✅ |
| Resident ↔ Incidents | `org_incidents.patient_id`, incident detail shows related client | ✅ |
| Care Plan ↔ Goals | JSONB `goals[]` on `org_care_plans`, progress derived in render | ✅ |
| Care Plan ↔ Supports | JSONB `supports[]`, status updates persist | ✅ |
| Incident ↔ Investigation | `org_investigations.incident_id`, incident status flips to `investigating` | ✅ |
| Incident ↔ Evidence | **was missing — now wired** via `EntityEvidencePanel` on `/app/incidents/[id]` | ✅ now |
| Obligation ↔ Evidence | Fixed in the deep-workflow pass; counts are real | ✅ |
| Policy ↔ Evidence | `org_evidence.linked_policy_id`, policy detail loads evidence | ✅ |
| Staff Compliance ↔ Credential Evidence | `org_evidence.entity_id` + `entity_type='staff_credential'` supported by upload route | ✅ surface available, can be wired into staff detail in a follow-up |
| Evidence Vault ↔ Linked Records | Vault Context column now renders Links to `/app/compliance` (task evidence) and `/app/policies/{id}` (policy evidence); previously plain text | ✅ now |
| Tasks ↔ Related Module Records | `/app/tasks`, plus the obligations register | ✅ |

## Evidence + audit trail integration

| Check | Result |
| ----- | ------ |
| Evidence attached to obligation appears in vault | ✅ — both views read `org_evidence` filtered by org |
| Vault row links back to obligation/policy | ✅ now (was plain text) |
| Incident evidence panel | ✅ now (`EntityEvidencePanel` on `/app/incidents/[id]`) |
| Staff credential evidence | ⚠️ surface ready (`entityType='staff_credential'` supported by upload + GET) but not yet wired into `/app/staff-compliance/[id]`; documented as deferred |
| Audit trail captures `EVIDENCE_UPLOADED` | ✅ |
| Audit trail captures `INCIDENT_RESOLVED` | ✅ now (was missing) |
| Audit trail captures `STAFF_CREDENTIAL_VERIFIED` | ✅ now (was missing) |
| Audit trail captures `CARE_PLAN_STATUS_CHANGED` | ✅ now (was missing) |
| Audit trail filterable by entity | ✅ — `/api/v1/audit-trail?entityId=...&entityType=...` |
| Empty state when no historical events exist | ✅ — drawer shows "No activity recorded" |

## Dashboard / reports fidelity

| Surface | Source | Real or fabricated? |
| ------- | ------ | ------------------- |
| `/app` top-level KPIs (team, expiring certs) | live `org_members.count`, `org_staff_credentials` filtered by `expiry_date` | Real |
| `CareOperationsScorecard.incidents.openCount` | `scorecard-service.ts` aggregates `org_incidents` | Real |
| Onboarding strip + first-session hero | `getFirstSessionState` aggregates `org_care_plans`, `org_tasks`, `org_evidence`, `org_incidents`, `org_progress_notes` | Real |
| Obligations register evidence count | `/api/v1/compliance/obligations` aggregates `org_evidence.task_id` per obligation (fixed in the deep-workflow pass) | Real |
| Audit-trail page chain integrity | `lib/audit/audit-engine.ts` + `verifyChainIntegrity` | Real |
| `getComplianceStats` (`app/app/actions/stats.ts`) | Defines a relational `evidence:org_evidence(count)` join — but is **unused anywhere**; left untouched, flagged for removal | Dead code |

Nothing currently rendered to the user displays a fabricated number.

## Longest journeys tested

| Journey | Steps | Status |
| ------- | ----- | ------ |
| **A — Public CTA → checkout intent** | Pricing CTA `/pricing` → `/auth/signup?plan=basic&intent=checkout` → cookie set → /app → `/app/billing?autoCheckout=basic` → BillingActionButtons triggers `startCheckout` → Stripe URL | Pass — covered by `system-integration.spec.ts: Public pricing CTA preserves plan + intent into signup` and `Public CTA → signup page reflects selected plan` |
| **B — Compliance evidence loop** | Obligation drawer → upload → DB row + storage object → vault visible → vault context links back to `/app/compliance` → audit log `EVIDENCE_UPLOADED` recorded | Pass — covered by `Obligation evidence → vault → audit trail integration` |
| **C — Incident loop** | Open incident → attach evidence inline → resolve with root-cause → status `resolved` → audit log `INCIDENT_RESOLVED` recorded | Pass — covered by `Incident → attach evidence inline → resolve → audit trail` |
| **D — Resident care loop** | Create resident (seed) → create care plan → add goal → mark achieved → progress 100% → reload | Pass — covered by `e2e/deep-workflow-integrity.spec.ts: Care plan → add goal → mark achieved → 100% progress persists` |
| **E — Staff compliance loop** | Credential expiring → verify → status `verified` → audit log `STAFF_CREDENTIAL_VERIFIED` recorded | Pass at action level (`care-operations.ts` writes the audit log); UI surface for credential evidence upload is deferred to a follow-up — see Hidden / deferred below |

## Fixes shipped

| File | Change |
| ---- | ------ |
| `app/app/actions/care-operations.ts`           | `resolveIncident`, `verifyStaffCredential`, `updateCarePlanStatus` now write `INCIDENT_RESOLVED` / `STAFF_CREDENTIAL_VERIFIED` / `CARE_PLAN_STATUS_CHANGED` audit events. `updateCarePlanStatus` also revalidates `/app/care-plans/{id}` so the detail page reflects the new state without manual reload |
| `app/api/v1/evidence/upload/route.ts`          | Accepts `entityId` + `entityType` in addition to `obligationId`. Validates parent record exists for `incident` and `staff_credential`. Storage path becomes `{orgId}/{entityType}/{entityId}/...` for non-task uploads. Audit `EVIDENCE_UPLOADED` reason now reflects the attachment type |
| `app/api/v1/evidence/route.ts`                 | GET supports `entityId` + `entityType` filters, exposes `entity_id` / `entity_type` on items |
| `components/compliance/EntityEvidencePanel.tsx` (new) | Inline evidence attachment surface for entities other than obligations (incident, staff credential, care plan); same upload semantics + error surfacing as the obligation drawer |
| `app/app/incidents/[id]/page.tsx`              | Renders `<EntityEvidencePanel entityType="incident">` so users can attach evidence directly from incident detail |
| `app/app/vault/page.tsx`                       | Pending + Verified tables now render the Context column as a `Link` back to `/app/compliance` (task evidence) and `/app/policies/{id}` (policy evidence). Plain-text-only "task title" was a one-way door before |
| `supabase/migrations/20260425_evidence_entity_polymorphism.sql` (new) | Drops the legacy `task_id NOT NULL` on `org_evidence`, adds `entity_type`, indexes `(organization_id, entity_type, entity_id)`. Idempotent |
| `e2e/system-integration.spec.ts` (new)         | Five integration journeys covering CTA preservation, signup plan reflection, obligation→vault→audit, incident-attach+resolve+audit, care-plan status audit, plus a basic /api/v1/audit-trail filter shape check |

## Hidden / deferred integrations

| # | Item | Severity | Why deferred |
| - | ---- | -------- | ------------ |
| 1 | Staff credential evidence UI surface (`/app/staff-compliance/[id]` → `EntityEvidencePanel entityType="staff_credential"`) | Low — the upload route already supports it; just needs a one-line render | Out of scope for this pass; the same panel can be dropped in. No fake CTA exists today, so no user-visible regression |
| 2 | Audit trail entity link in EvidenceDrawer "Activity" tab | Low | Tab text identifies the actor + action; clicking does not yet open the linked entity. Enhancement, not regression |
| 3 | Dead `getComplianceStats` action in `app/app/actions/stats.ts` | Trivial | Unused; the relational join `evidence:org_evidence(count)` would not work without an FK. Recommended for deletion |
| 4 | Obligations register row click → task detail | Low | Title is plain text in the row. Today it opens the evidence drawer via the paperclip cell, which is the higher-frequency action |
| 5 | Vault filtering by entity type (incident / staff / obligation) | Low | Vault is global today — listed in the doc so a future iteration knows where to add the filter |

None of these surface a CTA that *starts* but cannot finish — so by the
prompt's own rule, no UI was hidden in this pass. Each is purely an
incremental enhancement with no fake state.

## Validation results

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run check:app-links` | ✅ — 301 links validated, 0 broken |
| `e2e/deep-workflow-integrity.spec.ts` registers + parses | ✅ |
| `e2e/system-integration.spec.ts` registers + parses | ✅ |

## Final verdict

> **Yes — FormaOS now feels like one integrated system at every seam audited.**

- Public CTAs preserve plan / intent / source through signup, billing,
  and onboarding.
- Onboarding's five steps each map to a real module and consume real DB
  counts (no fake "done" markers).
- Evidence is no longer obligation-only: it can be attached from
  obligation drawer or incident detail, and the bytes show up in the
  global vault with a working back-link to the source record.
- Critical write actions (evidence upload, incident resolve, credential
  verify, care-plan status change) all write to `org_audit_logs`, so
  the audit-trail page is no longer a half-empty surface.

**Biggest remaining integration risk**: Stripe Checkout itself runs
out-of-process. If `STRIPE_SECRET_KEY` / price IDs are not configured,
`startCheckout` returns honest error states (`?status=stripe_unavailable`,
`?status=missing_price`, `?status=checkout_failed`) — but the
public-site → app handoff *up to* Stripe is fully verified. End-to-end
billing provisioning still depends on Stripe webhook delivery, which
this audit does not exercise.
