# FormaOS Deep Codebase Audit

Audit date: 2026-04-30
Auditor mode: independent rewrite. The prior `deep-codebase-audit.md` (committed `230e2eaf`) was retained as orientation only; every finding here was re-verified against the current source. Specific file paths and line numbers are cited; nothing is asserted on the strength of an internal doc alone.

Scope (in): production web app under `app/`, `components/`, `lib/`, `supabase/migrations/`, root config, middleware (`proxy.ts`), behavior-relevant docs.
Scope (out): `__tests__/`, `e2e/`, `tests/`, `selenium-tests/`, `mobile/`, `coverage/`, `output/`, `playwright-report/`, `test-reports/`, `test-results/`, `qa/`, `screenshots/`, `artifacts/`, generated reports.

Inventory measured:
- Production `.ts/.tsx` under `app/`, `components/`, `lib/` (tests/mobile excluded): **1,776 files**.
- App routes discovered by the link-integrity audit at [APP_LINK_INTEGRITY_REPORT.md](APP_LINK_INTEGRITY_REPORT.md): **215 routes / 306 internal links validated, 0 broken**.
- Supabase migrations: **116** (`supabase/migrations/`), plus 2 legacy (`migrations/005_phase5_upgrades.sql`, `006_phase6_upgrades.sql`).
- API routes (counted by directory): **~140**, of which ~50 are under `/api/v1/*`.

Methodology:
1. Survey via `find`/`ls`/`grep` to map the route tree, lib tree, and migration tree.
2. Six parallel Explore agents bucketed across (a) middleware/auth/app-shell, (b) marketing/billing/entitlements, (c) compliance/policies/evidence/audit, (d) care/CAPA/forms/staff, (e) reports/executive/workflows/AI/admin/RBAC, (f) Supabase migrations/RLS/storage.
3. Direct re-reads of every file flagged P0/P1 to confirm the line numbers before writing.

---

## 1. Executive Summary

FormaOS is a multi-tenant, Next.js 16 / React 19 / Supabase / Stripe SaaS that pitches itself as a "compliance operating system" for regulated workforces (NDIS providers, healthcare, financial services, childcare, construction). It is a real product with broad surface area, not a shell.

What it actually has, in code:
- A server-rendered authenticated app shell at `app/app/layout.tsx` that hydrates `lib/system-state/server.ts` for every page.
- 215 internal app routes; 306 internal links validated as resolving.
- 116 Supabase migrations spanning compliance frameworks, controls, evidence, policies, care operations, forms, CAPA, audit logging, billing, SSO/SCIM, AI, retention, and admin control plane.
- Real persistence and lifecycle code in CAPA, evidence, billing, team invitations, policies (CRUD only), incidents (CRUD + resolve), staff credentials, care plans (the page-level path), reports/exports, AI chat, and audit events.
- Operational scaffolding: Sentry, OpenTelemetry, PostHog, Trigger.dev hooks, Resend, Upstash Redis (where configured), private Supabase Storage buckets, signed URLs, structured logging.

Maturity is genuinely uneven. The app shell, evidence model, CAPA lifecycle, audit-trail mechanics, and Stripe wiring are real. Around them sit several material liabilities the product cannot ship-to-enterprise with as-is:
- A **Postgres tenancy regression**: migration `20260122_add_default_rls_policies.sql` opens broad SELECT to any authenticated user across ~30 tables (P0).
- A **Stripe webhook idempotency race** that can permanently drop subscription provisioning side effects (P0).
- **One care module (`care-plans.ts`) is wired to a column that doesn't exist** (P1, latent dead path).
- A **public forms route** that bypasses the entire forms platform and uses legacy tables (P1).
- **Multiple permission models** in active use that disagree about who can do what (P1).
- A **Stripe price-ID hardcoded fallback to live test prices** that activates if env vars are missing (P0).
- An **OAuth state validation gate** that only fires when `provider=google` is in the URL (P1).
- A **client-side founder hint** in localStorage that feature flags read back without re-validation (P1).

Biggest strengths:
- App-shell architecture and centralized system-state hydration are clean.
- CAPA, evidence (vault path), and audit-bundle storage have meaningful integrity.
- Recent custom-reports entitlement gate (`app/api/v1/reports/custom/_entitlement.ts`) shows the team is actively closing entitlement gaps.
- Internal link integrity is 100% (per the bundled crawler report).
- Webhook signature verification, API-key hashing, SCIM token timing-safe compare, evidence magic-byte sniffing, evidence bucket path scoping, and CSP/security headers are present.

Biggest weaknesses:
- Tenancy is not consistently enforced at the database layer; several tables are protected only by `auth.uid() IS NOT NULL`.
- Two competing tenancy column names (`organization_id` vs `org_id`) coexist and code disagrees with schema in at least one module.
- Three competing permission systems (`app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, `lib/authz/permission-engine.ts`) disagree on role hierarchies and aren't reconciled.
- Entitlement registry has 14 keys, only ~3 are actually enforced anywhere.
- Many "compliance" surfaces silently fall back to empty arrays on schema/RLS errors and continue to compute precise-looking scores.
- Forms platform is split-brain (public submit on legacy tables, app shell on new tables).
- Trial logic and plan-name vocabulary are legacies from an earlier commercial model.

**Production confidence: 6.0 / 10** for controlled, hand-held customer pilots.
**Production confidence: 4.5 / 10** for low-touch enterprise self-onboarding.

The first-order risk is not feature absence; it is that several modules look complete and ship official-looking artifacts while drawing from sparse, mis-tenanted, or schema-mismatched data.

---

## 2. System Mental Model

Two product surfaces:
- **Public marketing** under `app/(marketing)/...`, `app/(standalone)/...`, and `app/api/...` for unauthenticated entry points.
- **Authenticated app** under `app/app/...`, **admin console** under `app/admin/...` and `app/app/admin/...`, **standalone flows** (invites, accept-organization-invite) under `app/(standalone)/...`, **submitter flows** under `app/submit/...` and `app/audit-portal/...`, and **API surface** under `app/api/...` (legacy) + `app/api/v1/...` (versioned).

How a request flows:
1. Hits Next.js middleware in [proxy.ts](proxy.ts) (752 lines). Middleware enforces:
   - host pinning between marketing and app domains;
   - founder bypass for `/admin/*` ([proxy.ts:618-647](proxy.ts#L618));
   - signed-in-only gating for `/app/*` ([proxy.ts:670-682](proxy.ts#L670));
   - in-memory sliding-window rate limit for `/api/*` ([proxy.ts:14-61](proxy.ts#L14));
   - a CSP nonce per response ([proxy.ts:81-95](proxy.ts#L81));
   - global security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`).
2. Authenticated app pages call `fetchSystemState()` in [lib/system-state/server.ts](lib/system-state/server.ts), which hydrates user/org/role/subscription/entitlements with cache TTLs and self-repair side effects (`ensureUserProvisioning`, `ensureOrgProvisioning`).
3. Module pages call server actions in `app/app/actions/*` or fetch from `app/api/v1/*` route handlers, which open Supabase clients via `lib/supabase/server.ts` (RLS) or `lib/supabase/admin.ts` (service role).
4. Mutations write to Postgres, sometimes write to `org_audit_logs` (pattern is `entityType:entityId` target), and sometimes write to per-domain event tables (e.g., `org_capa_events`).
5. Stripe webhooks land at `app/api/billing/webhook/route.ts`, idempotency-stamp `billing_events`, then upsert `org_subscriptions`, `organizations.plan_key`, and call `syncEntitlementsForPlan`.

Tenancy column convention drifted:
- Old pattern: `organization_id` (org_members, org_subscriptions, org_evidence, org_policies, org_audit_logs, org_tasks, org_assets, org_risks, org_certifications, org_patients, org_visits, org_care_plans, org_staff_credentials).
- New pattern: `org_id` (org_forms, org_form_submissions, org_care_goals, org_medications, org_ndis_line_items, api_keys, scim_*).
- `org_frameworks` started on `org_id`, was renamed in `20260302_rename_org_frameworks_org_id.sql:8`.

Plan name vocabulary drifted three ways:
- **Marketing-facing**: Foundation / Growth / Enterprise (`lib/marketing/pricing.ts`).
- **`PlanKey` enum**: `basic | pro | enterprise` (`lib/plans.ts`).
- **Legacy `plan_code`**: `starter | pro | enterprise` (e.g., `lib/billing/plans.ts`, `lib/billing/subscriptions.ts`, and bootstrap writes both columns: `lib/supabase/transaction.ts:139-140` writes `plan_key: 'basic'` and `plan_code: 'starter'`).

---

## 3. Architecture Overview

Stack:
- Next.js `^16.1.6`, React `19.2.3`, TypeScript `5.9.3`.
- Tailwind `3.4.17` with `components/ui/*` primitives, `lucide-react`, `framer-motion`.
- Supabase Auth + Postgres + Storage (`@supabase/ssr 0.8.0`, `@supabase/supabase-js 2.98.0`).
- Stripe `^15.11.0`, Resend `^6.6.0`, Upstash Redis `^1.36.1`.
- Sentry `^10.40.0`, OpenTelemetry, PostHog, Langfuse hooks.
- Trigger.dev `4.4.3` for queue/cron.
- AI: `@ai-sdk/openai`, `openai 6.33.0`, `ai 6.0.116`, plus internal `lib/ai/*` for compliance context.
- Auth secondary: `@node-saml/passport-saml` (SSO), `speakeasy` (TOTP), `web-push`.
- Sanitization: `isomorphic-dompurify`, `sanitize-html`.
- Validation: `zod 4.3.6`.

Patterns:
- Server actions live in `app/app/actions/*.ts` and inline in some pages.
- API routes split between `app/api/*` (legacy, mostly internal) and `app/api/v1/*` (public/contracted).
- The `app/api/v1/*` layer uses an API-key middleware (`lib/api-keys/middleware.ts`) that produces `V1AuthContext { db, orgId, ... }`. The new `requireCustomReportsEntitlement(context)` helper plugs into this contract.
- Some legacy actions use service-role clients with a hand-rolled membership check; some use server clients and trust RLS.
- Component patterns are mixed. Server components dominate pages; client components handle interactivity. Inline `'use server'` actions appear inside large pages (forms, settings, several care surfaces).

Strengths:
- The `proxy.ts` -> `app/app/layout.tsx` -> `fetchSystemState` -> page action axis is coherent.
- Most pages are server-rendered with explicit auth gates.
- Storage paths are org-scoped on the evidence bucket (`20260425_evidence_workflow_integrity.sql`).

Weaknesses:
- Three competing permission models. Documented below in §6.
- Two tenancy column conventions that the schema and code do not consistently agree about. Documented below in §7.
- Repair-style migrations (`IF NOT EXISTS`, "ensure_*") are used as a substitute for migration discipline, masking drift.
- Server actions rarely share one canonical `requireOrgPermission(...)` guard; each module re-implements the membership/role check.
- `proxy.ts` mixes domain pinning, founder allowlist, CSP, rate limit, and cookie session propagation in a single 752-line file.
- `app/auth/callback/route.ts` is 725 lines and combines OAuth exchange, OAuth state validation, founder routing, invitation acceptance, atomic org bootstrap, and welcome-email side effects.

---

## 4. Public Website Assessment

### 4.1 Homepage / product / features

Routes: `/`, `/product`, `/features`, `/features/pillars`, `/operate`, `/govern`, `/prove`, `/evaluate`.
Files: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`, `components/marketing/*`, `components/hero/*`, `lib/marketing/cta.ts`, `lib/seo.ts`.

Solid:
- Static rendering, JSON-LD schemas (`pricingSchema`, `softwareApplicationSchema`), comprehensive Open Graph.
- CTA helpers centralized; the marketing copy now reflects the no-trial commercial posture (verified against `lib/plans.ts:3` → `TRIAL_ELIGIBLE_PLANS` empty).

Weak:
- Inline scroll script in marketing layout = one CSP exception point.
- Industry pages and "compliance OS" framing are deeper in copy than the underlying entitlement registry actually gates (see §8).

Risk: **Medium**.

### 4.2 Pricing

Routes: `/pricing`. Files: `app/(marketing)/pricing/page.tsx`, `app/(marketing)/pricing/PricingPageContent.tsx`, `lib/marketing/pricing.ts`, `lib/plans.ts`.

CTA flow:
- Foundation → `/auth/signup?plan=basic&intent=checkout&source=pricing` (self-serve only).
- Growth → `/contact?plan=pro...` (sales-led).
- Enterprise → `/contact?plan=enterprise...` (sales-led).

Weak:
- Plan vocabulary is split three ways (Foundation/Growth/Enterprise on the page, basic/pro/enterprise in the enum, starter/pro/enterprise in `plan_code`). Bootstrap writes both at [lib/supabase/transaction.ts:139-140](lib/supabase/transaction.ts#L139).
- `lib/billing/stripe.ts:7-11` carries hardcoded fallback price IDs (`price_1TOdz1AHrAKKo3OlfYxjk9WL`, etc.). If `STRIPE_PRICE_FOUNDATION/GROWTH/ENTERPRISE` are unset in production, checkout falls back to whatever those IDs are in the live Stripe account.
- Pricing copy advertises capabilities (custom reports, SSO, workflow automation, executive rollup, retention governance) where server-side enforcement is largely absent (see §8).

Risk: **High** — pricing is a trust and revenue path.

### 4.3 Contact

Routes: `/contact`. Files: `app/(marketing)/contact/page.tsx`, `app/(marketing)/contact/actions.ts`, `lib/marketing/contact/*`.

Solid:
- Server action implements honeypot, IP rate limit, length caps, email regex, source context. Persists to `marketing_leads`.

Weak:
- Validation is hand-rolled rather than `zod`. Plan/source/context flatten into a single message string instead of typed columns. No outbound notification path was found that fires on insert (Resend is wired, but not from the action).
- IP-based rate limit means same IP can spam different emails (low risk).

Risk: **Low**.

### 4.4 Trust / Security / Enterprise

Routes: `/security`, `/security-review`, `/trust/*`, `/enterprise`, `/enterprise-proof`.
Files: `app/(marketing)/security/*`, `app/(marketing)/trust/*`, `app/(marketing)/enterprise/*`.

Solid:
- Backed by real operational primitives: CSP nonces, Sentry, RLS (where actually enforced), private storage, security-monitoring tables.

Weak:
- Some assurances need legal/security ownership before being made externally. Enterprise SSO/SCIM/Retention claims are larger than what is server-side enforced (see §8).
- Production rate limiting depends on Upstash being configured; `proxy.ts` in-memory limit is per-instance.

Risk: **Medium-High**.

### 4.5 Industries / Use cases / Compare

Real routes for NDIS, healthcare, financial-services, childcare, construction; comparison pages; FAQ; roadmap.

Solid: industry sidebar adapter (`lib/navigation/industry-sidebar.ts`) does adapt left-nav surfaces.
Weak: industry-specific report packs and proof exports are not equally deep across industries; care-plan reporting is shallow (see §5.6).

Risk: **Medium**.

### 4.6 Changelog / Roadmap / Stories

Solid: `[CHANGELOG.md](CHANGELOG.md)` is real and recent.
Weak: roadmap copy must be kept in sync with disabled product surfaces (see §11).

Risk: **Medium**.

---

## 5. Authenticated App Assessment

For each module: route(s), purpose, mechanics, important files, tables, cross-module links, what is solid, what is incomplete, risk rating.

### 5.1 App shell, dashboard, navigation, onboarding

Routes: `/app`, `/app/dashboard`, `/app/dashboard/builder`, `/app/onboarding-roadmap`, `/onboarding/*`.
Files: [app/app/layout.tsx](app/app/layout.tsx), [components/app-providers.tsx](components/app-providers.tsx), [components/app-hydrator.tsx](components/app-hydrator.tsx), [components/sidebar.tsx](components/sidebar.tsx), [components/topbar.tsx](components/topbar.tsx), [lib/system-state/server.ts](lib/system-state/server.ts), [lib/system-state/types.ts](lib/system-state/types.ts), [lib/navigation/industry-sidebar.ts](lib/navigation/industry-sidebar.ts).
Tables: `organizations`, `org_members`, `org_subscriptions`, `org_entitlements`, `org_first_session_progress`, `org_tasks`.

Solid:
- One coherent system-state contract used by every authenticated page.
- First-session progress persistence is a real table.
- Sidebar adapts to industry and role.

Risky/incomplete:
- [components/app-hydrator.tsx:104-106](components/app-hydrator.tsx#L104) writes `formaos_is_founder` to `localStorage`; [lib/feature-flags.tsx:147](lib/feature-flags.tsx#L147) reads it back without re-validating against the server. Any client can `localStorage.setItem('formaos_is_founder','true')` to flip founder-gated UI flags. Server-side admin gating still holds (proxy.ts checks server-side `isFounder`), but UI surfaces gated only by the flag are spoofable.
- `lib/system-state/server.ts` runs `ensureOrgProvisioning()` on cache miss as a side effect. Cache miss every TTL means provisioning rewrites can re-create state the user/admin recently changed (e.g., entitlements, subscription rows). Self-repair masks real failures.
- `lib/system-state/types.ts` module definitions do not match the real left-nav and several modules (e.g., billing) are described with odd plan requirements.
- "Switch organization" surface in `/app/settings` is a link, not a real org switcher.

Risk: **High**.

### 5.2 Compliance / obligations / controls / tasks

Routes: `/app/compliance`, `/app/compliance/frameworks`, `/app/compliance/cross-map`, `/app/compliance/soc2`, `/app/controls*`, `/app/tasks`.
Files: [app/app/actions/compliance-engine.ts](app/app/actions/compliance-engine.ts), [app/app/actions/control-evaluations.ts](app/app/actions/control-evaluations.ts), [app/app/actions/tasks.ts](app/app/actions/tasks.ts), `lib/audit/readiness-calculator.ts`, `lib/audit-reports/report-builder.ts`.
Tables: `compliance_frameworks`, `compliance_controls`, `org_frameworks`, `org_control_evaluations`, `org_tasks`, `org_evidence`, `control_evidence`, `control_tasks`.

Solid:
- A real evaluation/scoring path; tasks and evidence flow into score calculation; some actions enforce `requirePermission`/`requireEntitlement`.

Risky:
- [app/app/actions/compliance-engine.ts](app/app/actions/compliance-engine.ts) defines six `safeSelect*` helpers that catch errors and `return []` (see lines 254, 288, 306, 311, 347, 357, 377, 386). If a table or column is missing, RLS returns 0 rows, or any read fails, the engine reports clean and moves on. Compliance scores can compute precisely from sparse or empty inputs.
- `org_control_evaluations` has **no RLS policy at all**. Migration [supabase/migrations/20250308_create_org_control_evaluations.sql](supabase/migrations/20250308_create_org_control_evaluations.sql) creates the table with `organization_id` but never enables RLS or adds a policy. Of the 7 follow-up migrations referencing the table, none of them addresses this. This is a tenancy hole.
- Task completion does not consistently require approved evidence as a prerequisite — score moves without verification.

Risk: **High**.

### 5.3 Policies

Routes: `/app/policies*`.
Files: [app/app/actions/policies.ts](app/app/actions/policies.ts).
Tables: `org_policies`, `org_policy_versions`, `policy_versions`, `policy_approvals`, `policy_acknowledgments`, `policy_review_schedules`, `org_evidence`, `org_audit_logs`.

Solid:
- CRUD, evidence linking, `requirePermission("EDIT_CONTROLS")`.
- Migration [supabase/migrations/20260403_policy_lifecycle.sql](supabase/migrations/20260403_policy_lifecycle.sql) builds full versioning + approval + acknowledgment + review-schedule schema.

Risky:
- The action layer **does not write to** `policy_versions`, `policy_approvals`, or `policy_acknowledgments`. The lifecycle schema exists in migrations but no server-side code uses it. UI/action flow is just a `status` field on `org_policies`. The product promise of governed policy lifecycle is unimplemented.
- Status strings are accepted from form data without an enum/`zod`.

Risk: **High** for compliance credibility.

### 5.4 Evidence vault

Routes: `/app/vault`, `/app/vault/review`, `/app/evidence`, `/app/evidence/gaps`.
Files: [app/app/actions/evidence.ts](app/app/actions/evidence.ts), [app/api/v1/evidence/upload/route.ts](app/api/v1/evidence/upload/route.ts), [app/app/actions/vault.ts](app/app/actions/vault.ts), [components/compliance/EntityEvidencePanel.tsx](components/compliance/EntityEvidencePanel.tsx).
Tables / storage: `org_evidence`, `control_evidence`, `evidence` bucket.

Solid:
- Private bucket; storage policies path-scoped by `organization_id::text = split_part(storage.objects.name,'/',1)` ([20260425_evidence_workflow_integrity.sql](supabase/migrations/20260425_evidence_workflow_integrity.sql)).
- Server action upload enforces MIME allowlist + magic-byte sniffing (PDF/PNG/JPEG/WebP/ZIP) + 20 MB cap.
- Review flow blocks self-approval and writes `org_audit_logs` events.
- Polymorphic evidence support via `entity_type` (`20260425_evidence_entity_polymorphism.sql`).

Risky:
- API upload at [app/api/v1/evidence/upload/route.ts](app/api/v1/evidence/upload/route.ts) accepts up to 10 files at 10 MB each but **performs no magic-byte sniffing** — it trusts `file.type`. This is weaker than the server action.
- Supported `entity_type` whitelist is `incident | staff_credential | capa | obligation/task`. `care_plan` is mentioned in the polymorphism migration but the API refuses it. Care-plan evidence is therefore not directly supported by the upload API.
- Legacy upload action comment `// TODO: cleanup storage on insert failure` left orphaned-storage compensation incomplete.
- `evidence_checksum` column was added by `20260311_evidence_checksum.sql` but no code computes or verifies the value. Dead column or pending feature.

Risk: **Medium-High**.

### 5.5 Participants / patients / people

Routes: `/app/participants*`, `/app/patients*`, `/app/people*`.
Files: [app/app/actions/care-operations.ts](app/app/actions/care-operations.ts), `app/app/participants/page.tsx`.
Tables: `org_patients`.

Risky:
- Page-level search uses raw user-supplied strings inside PostgREST `.or(...)` filter. Specials like `,` `(` `)` break the query string, surfacing as empty results.
- Validation is `FormData.get(...) as string`, no `zod`.

Risk: **Medium**.

### 5.6 Care plans

Routes: `/app/care-plans*`. Pages, actions: [app/app/actions/care-operations.ts](app/app/actions/care-operations.ts), [app/app/actions/care-plans.ts](app/app/actions/care-plans.ts).
Tables: `org_care_plans`, `org_patients`, `org_care_goals`, `org_medications`.

Critical finding (verified directly):
- The migration that creates `org_care_plans` (`supabase/migrations/20260208_care_operations_modules.sql:147`) declares the tenancy column as `organization_id`. The RLS policy at lines 188-193 also uses `organization_id`. Indexes use `organization_id`.
- The action file [app/app/actions/care-plans.ts](app/app/actions/care-plans.ts) queries `.eq('org_id', orgId)` on lines **16, 25, 46, 71, 97, 121, 196, 248, 301, 351, 371** and inserts `{ org_id: orgId, ... }` on lines **170, 224, 281, 329**. These calls cannot succeed against the actual `org_care_plans` schema.
- Page-level CRUD goes through `app/app/actions/care-operations.ts` (which uses `organization_id`), so the UI continues to work; but `care-plans.ts` is dead-on-arrival as currently written.
- Schema drift extends to sibling tables (`org_care_goals`, `org_medications`, `org_ndis_line_items`) that genuinely use `org_id` (`20260402_care_goals.sql:11, 52, 89`). This is the right place — the wrong place is `care-plans.ts` calling `org_id` against `org_care_plans`.

Other risky patterns:
- Care plan goals/supports/progress are JSONB sub-collections inside the plan row. Reporting, audit, and per-item permissions become hard.
- Status taxonomy is inconsistent: code references `'review'` (action line 62) where the schema has nothing called that.

Risk: **High** for the dead module path; otherwise Medium.

### 5.7 CAPA

Routes: `/app/capa`, `/app/capa/new`, `/app/capa/[id]`.
Files: [app/app/capa/actions.ts](app/app/capa/actions.ts), `supabase/migrations/20260618_capa_lifecycle_workflow.sql`.
Tables: `org_capa_items`, `org_capa_events`, `org_evidence`, `org_audit_logs`.

Solid:
- One of the strongest modules. Lifecycle states (`draft|open|investigating|action_assigned|verification|closed|archived`) and transition matrix are encoded in [actions.ts:21-28](app/app/capa/actions.ts#L21).
- Source validation against `org_incidents`, `org_tasks`, `org_policies` (lines ~85-121).
- Entitlement gate at [actions.ts:74](app/app/capa/actions.ts#L74) — `requireEntitlement(state.organization.id, 'capa_management')`. **This was newly added** post the previous audit.
- Owner/admin role enforcement; `org_capa_events` and `org_audit_logs` writes.

Risky:
- [app/app/capa/actions.ts:67](app/app/capa/actions.ts#L67) — `if (!state) redirect('/signin');`. The real auth route is `/auth/signin`. `/signin` is a separate page (`app/signin/page.tsx`) that itself only redirects; it works, but it's not the canonical path. Other actions (progress-notes, care-operations) use `/auth/signin` correctly.
- CAPA metrics and cross-module reporting are still thin compared to the lifecycle code.

Risk: **Medium**.

### 5.8 Visits / service logs

Routes: `/app/visits*`. Action: [app/app/actions/care-operations.ts](app/app/actions/care-operations.ts). Table: `org_visits`.

Risky:
- `staff_id` from FormData isn't clearly validated as belonging to the same org.
- Role checks weaker than expected for clinical/care actions.

Risk: **Medium**.

### 5.9 Progress notes

Routes: `/app/progress-notes`. Files: `app/app/actions/progress-notes.ts`.
Table: `org_progress_notes`.

Solid:
- Role-based gating with `NOTE_WRITE_ROLES` / `NOTE_SIGNOFF_ROLES`.
- Audit events on create and sign-off.

Risky:
- No amendment/version history (no prior_text, amended_by, version_number columns surfaced in code). For regulated clinical/care notes this is a credibility issue.
- Retention semantics not enforced beyond generic CRUD.

Risk: **Medium**.

### 5.10 Incidents

Routes: `/app/incidents*`, `/app/incidents/new`. Files: [app/app/actions/care-operations.ts](app/app/actions/care-operations.ts), `app/api/incidents/export/*`.
Tables: `org_incidents`, `org_evidence`, `org_tasks`, `org_capa_items`, `org_audit_logs`.

Solid:
- `resolveIncident` writes `org_audit_logs` (line ~331) and creates follow-up tasks.
- Incident export endpoint is rate-limited and role-gated.

Risky:
- `createIncident` (`app/app/actions/care-operations.ts:234`) does not write an `org_audit_logs` row. Resolution is logged; creation isn't. For a regulated incident workflow this asymmetry is material.
- Search uses `.or(...)` with raw user input.
- Investigation→CAPA→evidence handoff is real but lighter than marketing copy implies.

Risk: **Medium**.

### 5.11 Staff compliance / certificates

Routes: `/app/staff-compliance*`, `/app/certificates`. Files: `app/app/actions/care-operations.ts`, `app/api/v1/evidence/upload/route.ts`.
Tables: `org_staff_credentials`, `org_evidence`, `user_profiles`.

Solid:
- Schema has unique-ness on `(organization_id, user_id, credential_type, credential_number)`.
- Evidence API supports `staff_credential` entity type.

Risky:
- `createStaffCredential` accepts `user_id` from FormData (`care-operations.ts:380`) without proving the supplied user is a member of the actor's org. Any org member can register a credential for any user_id they know.
- `verifyStaffCredential` does not enforce a verifier role boundary in the reviewed action; any org member can flip a credential to verified.
- No `org_audit_logs` write on `createStaffCredential`.

Risk: **High** for regulated workforce proof.

### 5.12 Team

Routes: `/app/team`, `/app/team/org-chart`. Action: [app/app/actions/team.ts](app/app/actions/team.ts).
Tables: `org_members`, `invitations`, `org_entitlements`.

Solid:
- Permission check, duplicate-membership check, pending-invitation check, `team_limit` entitlement enforcement, audit log.

Risky:
- `removeTeamMember` needs a verified last-owner / self-removal guard (not visibly enforced beyond role check).
- Team permissions live in this action's role list; permission engine and `lib/roles.ts` differ — see §6.

Risk: **Medium**.

### 5.13 Registers

Routes: `/app/registers`, `/app/registers/training`. Action: `app/app/actions/registers.ts`.
Tables: `org_assets`, `org_risks`, `org_training_records`, `registers`, `org_registers`.

Risky:
- Schema-tolerant. Two parallel table names (`registers` from defaults migration vs `org_registers`/`org_assets`). Status columns lack CHECK constraints.
- Ownership/review/export semantics shallow.

Risk: **Medium**.

### 5.14 Forms / public submit

Routes: `/app/forms`, `/app/forms/builder/*`, `/submit/[formId]`. Files: [lib/forms/form-store.ts](lib/forms/form-store.ts), [lib/forms/submission-engine.ts](lib/forms/submission-engine.ts), [app/submit/[formId]/page.tsx](app/submit/[formId]/page.tsx).
Tables: `org_forms`, `org_form_submissions` (new), `forms`, `form_responses` (legacy).

Critical finding (verified directly):
- The public submit page at [app/submit/[formId]/page.tsx](app/submit/[formId]/page.tsx) reads `from('forms')` (line 21), inserts to `from('form_responses')` (line 39), and then `redirect('/submit/<id>?success=true')`. The whole page bypasses the new `org_forms`/`org_form_submissions` schema, the `submission-engine` validation pipeline, rate limiting, captcha, max-submission caps, and audit logging.
- The forms platform RLS at [supabase/migrations/20260426_001_ensure_forms_platform_schema.sql:133](supabase/migrations/20260426_001_ensure_forms_platform_schema.sql#L133) reads `(f.settings->>'requires_auth')::boolean is not true` to allow anon insert into `org_form_submissions`. The application code in `lib/forms/form-store.ts` writes `requireAuthentication: true` (camelCase). Because the SQL JSON path looks for snake_case `requires_auth` and never finds it, **the OR clause defaults to `not true` → permits anon insert**. Combined with the legacy public submit page, the practical result is that public form submission is not actually gated by the authoring tool's "require auth" toggle.

Risk: **High** — both schema-split and policy-key mismatch.

### 5.15 Reports

Routes: `/app/reports*`, `/app/reports/custom*`, `/api/reports/export`, `/api/v1/reports/custom/*`.
Files: [app/app/actions/reports.ts](app/app/actions/reports.ts), [app/api/reports/export/route.ts](app/api/reports/export/route.ts), [app/api/v1/reports/custom/_entitlement.ts](app/api/v1/reports/custom/_entitlement.ts), `lib/audit-reports/report-builder.ts`, `lib/audit-reports/pdf-generator.ts`, `lib/reports/export-jobs.ts`.

Solid:
- Async report job model with inline processing, queue fallback, signed URL output, status route.
- Recently added [app/api/v1/reports/custom/_entitlement.ts](app/api/v1/reports/custom/_entitlement.ts) gates custom reports behind `custom_reports`. The 4 modified custom-report routes (per `git status`) wire this in.

Risky:
- [app/api/reports/export/route.ts](app/api/reports/export/route.ts) only checks role (owner/admin), not entitlements. The `audit_export` and `reports` entitlement keys exist in `lib/billing/entitlements.ts` but no `requireEntitlement` call exists in this file (verified by grep: 0 hits).
- Report builder uses service role and can produce polished PDFs from sparse data via the `safeSelect*` fallback chain.
- Signed URLs (1-hour TTL) are stored in `report_export_jobs.file_url`. Status route doesn't always regenerate a fresh URL.

Risk: **Medium-High**.

### 5.16 Executive view

Routes: `/app/executive`, `/app/executive/group`, `/api/executive/*`. Files: `lib/executive/*`, [app/api/executive/posture/route.ts](app/api/executive/posture/route.ts).

Risky:
- [app/api/executive/posture/route.ts:111-127](app/api/executive/posture/route.ts#L111) catches calculation errors and returns `emptyExecutivePosture()` (zeros across the board) with `degraded: true`. There is no alerting hook on this branch. A schema-regression turns "did 0% compliance show up?" into a UI question, not an ops question.
- No entitlement gate for executive rollup.

Risk: **High**.

### 5.17 Settings

Routes: `/app/settings*`, `/app/profile/*`. Files: [app/app/settings/actions.ts](app/app/settings/actions.ts), [app/app/settings/security/sso-actions.ts](app/app/settings/security/sso-actions.ts).
Tables: `organizations`, `organization_sso`, retention/notification/security tables.

Solid:
- `updateOrgName` permission-checked + audited.
- SSO action enforces `requireEntitlement('sso_saml')` ([sso-actions.ts:27](app/app/settings/security/sso-actions.ts#L27)). One of the few entitlements that actually fires.

Risky:
- Many settings panels look complete and are disabled/no-op (retention dry-run/execute, directory sync save, AI usage controls).
- `parseIdpMetadataXml` errors not validated downstream — bad XML can leave a partially-upserted SSO row.

Risk: **Medium-High**.

### 5.18 Roles

Routes: `/app/settings/roles*`. Files: [app/app/settings/roles/page.tsx](app/app/settings/roles/page.tsx), [lib/authz/permission-engine.ts](lib/authz/permission-engine.ts), [app/app/actions/rbac.ts](app/app/actions/rbac.ts).

Risky:
- Role detail page declares "Editing not available yet."
- Custom-role create action only checks `fetchSystemState` succeeded; no explicit owner/admin/`MANAGE_USERS` guard.
- Custom roles assignment goes through `team_members`, not `org_members`. Permission engine query on `team_members` does not always scope by org.
- No DELETE path for custom roles.

Risk: **High**.

### 5.19 Workflows / automation

Routes: `/app/workflows*`, `/api/workflows`, `/api/automation/*`. Files: [app/api/workflows/route.ts](app/api/workflows/route.ts), [lib/automation/workflow-store.ts](lib/automation/workflow-store.ts).

Risky:
- No `workflow_automation` entitlement enforcement at the route handler.
- `workflow-store.ts` uses the admin client. Functions that take only a workflow ID (e.g., `getWorkflowDefinition(id)` line 212, `getWorkflowExecutionHistory(workflowId)` line 291, `getExecutionDetail(executionId)` line 344) **do not enforce org scope** internally; they trust callers. Those that do (e.g., `deleteWorkflow`, `listExecutions`) do, but the inconsistency is a footgun.
- UI for creating workflows is degraded/plan-gated.

Risk: **High**.

### 5.20 Audit trail / activity

Routes: `/app/audit-trail`, `/app/audit`, `/app/activity`, `/api/v1/audit-trail`. Files: [app/api/v1/audit-trail/route.ts](app/api/v1/audit-trail/route.ts), `lib/audit/org-audit-log.ts`, `app/app/actions/audit-events.ts`.
Tables: `org_audit_logs`, `org_capa_events`. Also `audit_log` (created by `20260403_audit_trail_enhanced.sql` with hash chain — never written to by app code).

Solid:
- Authenticated, rate-limited, org-scoped route.
- CAPA dual-stream events.

Risky:
- Filter relies on `target` shaped as `entityType:entityId` (or `like '%:entityId'`). Older rows with bare entity IDs do not appear. There is no backfill migration.
- `audit_log` hash chain table is unused dead infrastructure (the column `prev_hash`/`entry_hash`/`sequence_number` are populated by no code path).
- `audit_retention_config` is defined in the same migration, never read.

Risk: **Medium**.

### 5.21 AI assistant

Routes: `/api/v1/ai/chat`, `/api/v1/ai/conversations*`, `/api/v1/ai/usage`. Files: [app/api/v1/ai/chat/route.ts](app/api/v1/ai/chat/route.ts), `lib/ai/usage-meter.ts`, `lib/ai/compliance-context.ts`.
Tables: `ai_chat_conversations`, `ai_chat_messages`, `ai_usage_log`.

Solid:
- Rate-limited, auth/membership/conversation-ownership checks; org-aware compliance context.

Risky:
- `lib/ai/usage-meter.ts` exposes `checkUsageLimit`/`trackUsage`; **the chat route never calls them**. Verified by grep: `checkUsageLimit` appears only in `lib/ai/usage-meter.ts` and `lib/billing.ts`; the streaming chat route doesn't import or call it. Plan budgets are advisory only.
- Plan keys in the meter use `starter|pro|enterprise`; the rest of the app uses `basic|pro|enterprise`. The meter would mis-classify `basic` orgs.
- AI context queries evidence using `status` field while other code uses `verification_status`; the two don't always agree.

Risk: **High** because of cost exposure and plan-name drift.

### 5.22 Theme

Files: `app/app/actions/theme.ts`, `supabase/migrations/20260610_update_theme_preference_values.sql` (future-dated).
Risk: **Low**.

---

## 6. Auth, Org, Tenancy, and Security Assessment

### 6.1 Auth surface

Production paths:
- Sign-up: [app/auth/signup/page.tsx](app/auth/signup/page.tsx) → posts to `/api/auth/email-signup`.
- Alternative signup: [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts).
- OAuth callback: [app/auth/callback/route.ts](app/auth/callback/route.ts) (725 lines).
- Auth bootstrap: [app/api/auth/bootstrap/route.ts](app/api/auth/bootstrap/route.ts).
- Org provisioning: [lib/supabase/transaction.ts](lib/supabase/transaction.ts), `bootstrapOrganizationAtomic`.

Multiple competing implementations exist:
- `bootstrapOrganizationAtomic` (canonical).
- `lib/bootstrap/ensure-organization.ts` (older, not on hot paths) — dead-code candidate.
- `lib/auth/callback.ts:selectPrimaryMembership` and `lib/system-state/server.ts:pickPrimaryMembership` are near-duplicates of the same role-weighting logic.

### 6.2 OAuth state validation

[app/auth/callback/route.ts:132-153](app/auth/callback/route.ts#L132) gates the state check on `provider === 'google'`. If a callback arrives without `?provider=google` (e.g., a future provider, or any URL where the parameter is absent), the state validation block is skipped entirely. Downstream org provisioning runs regardless. CSRF guarantee weaker than intended.

### 6.3 Bootstrap creates a "trial" subscription though no plan is trial-eligible

[lib/supabase/transaction.ts:139-147](lib/supabase/transaction.ts#L139) inserts an `org_subscriptions` row with `status: 'trialing'`, `trial_started_at: now`, `trial_expires_at: trialEnd`. Meanwhile [lib/plans.ts:3](lib/plans.ts#L3) sets `TRIAL_ELIGIBLE_PLANS: readonly PlanKey[] = []`. The product positions itself as no-trial; the bootstrap path still mints a 14-day trial subscription for every new org. This creates entitlement-state-meaning drift: `status='trialing'` doesn't actually mean the customer is trialing anything, and downstream gating that reads `trial_expires_at` will trip on it.

### 6.4 Tenancy enforcement

Server-side membership check pattern is per-action, not via a shared guard. Approximate inventory:
- Strong: `app/app/actions/evidence.ts`, `app/app/actions/team.ts`, `app/app/capa/actions.ts` — explicit org match + role + entitlement.
- Medium: `app/app/actions/care-operations.ts` — org match, weaker role/permission check, mixed audit logging.
- Weak: ad-hoc page-level inline `'use server'` actions that derive `organizationId` from system state without guarding role.

Service-role usage is appropriate where evidently needed (Stripe webhook, admin console, report jobs, storage metadata after parent validation, cross-table reads), but boundary checks are not standardized. Risky service-role paths:
- `lib/automation/workflow-store.ts` getters that take only an ID.
- `lib/authz/permission-engine.ts` collecting `team_members.custom_role_id` without an org-scope on the team_members read.
- `app/api/reports/export/route.ts` using service-role builders without an entitlement gate.

### 6.5 Founder boundary

[proxy.ts:618-647](proxy.ts#L618) short-circuits `/admin/*` for founders and explicitly redirects non-founders to `/unauthorized`. Server-side admin functionality (`lib/admin/rbac.ts`, `app/app/admin/access.ts`) supports a delegated platform-admin model with an active assignment + permission set. **The middleware blocks delegated admins before any server-side check fires.** Either the delegated admin model is unreachable, or the middleware needs to consult `getPlatformAdminAssignment()` before rejecting non-founders. As written, founders are the only people who can hit `/admin`.

Founder user-id/email allowlist is read via `lib/utils/founder.ts`. The `FOUNDER_EMAILS` and `FOUNDER_USER_IDS` env vars are the single trust root.

### 6.6 Client-side founder hint

[components/app-hydrator.tsx:104-106](components/app-hydrator.tsx#L104) writes `localStorage.setItem('formaos_is_founder', ...)`. [lib/feature-flags.tsx:147](lib/feature-flags.tsx#L147) reads it back to drive `enableFounderIsolation` and similar UI flags. `localStorage` is fully client-controlled. It is not an auth boundary, but it leaks a privileged hint and lets a curious user toggle founder-only UI surfaces. Server-side admin gating still holds.

### 6.7 Storage and rate limiting

- Evidence bucket: private, path-scoped by `organization_id::text` (`20260425_evidence_workflow_integrity.sql:50,63,76,89`). Path scoping is good but relies on UUID-text formatting consistency.
- Audit/compliance/report/enterprise export buckets are private with admin/membership policies. Signed URL expiry stored in DB risks staleness (see §10).
- Rate limiting: `proxy.ts` in-memory per-instance limiter; module routes use `rateLimitApi` / `checkRateLimit` which need Upstash. SCIM `lib/scim/scim-auth.ts` rate-limit fail-closes when its check returns 429 but does not have a tested fallback if Redis is wholly unreachable.

---

## 7. Supabase / Database / Storage Assessment

### 7.1 Migration discipline

- 116 files in `supabase/migrations/`, plus 2 legacy `migrations/*.sql`.
- 11 migrations are dated **after today (2026-04-30)**: `20260601...20260618`. They sit in source control while the head date is 2026-04-30. Unclear which subset of these has been applied to production. This makes "is the remote schema what the repo says it is?" unanswerable from filenames alone.
- A large fraction (~58 migrations) are repair-style (`IF NOT EXISTS`, `ensure_*`, `fix_*`, `safe_*`). Idempotent migrations are a useful tool, but here they're load-bearing — the base schema migration (`20250101_000_base_schema.sql`) explicitly notes that core tables were created outside the migration system. The migrations are not, as a set, a replayable source of truth.
- `20260114_fix_founder_account.sql` hardcodes `ejazhussaini313@gmail.com` and rewrites that user's role/plan/entitlements. This is prod data, not schema.
- `20260319_cleanup_founder_account.sql` does similar cleanup. These should not be in the migration trail.

### 7.2 Tenancy column inventory

Tables on `organization_id`:
- organizations (PK), org_members, org_subscriptions, org_entitlements, billing_events
- org_evidence, control_evidence, org_policies, org_policy_versions
- org_tasks, org_assets, org_risks, org_training_records, org_certifications
- org_patients, org_care_plans, org_visits, org_progress_notes, org_incidents, org_staff_credentials
- org_capa_items, org_capa_events, org_audit_logs, org_frameworks (renamed in 20260302)

Tables on `org_id`:
- org_forms, org_form_submissions
- org_care_goals, org_medications, org_ndis_line_items, org_goal_progress_entries
- api_keys, scim_tokens, scim_groups, scim_group_members
- workflow_definitions, workflow_executions

Drift consequence: the action file `app/app/actions/care-plans.ts` queries `org_id` against `org_care_plans` (an `organization_id` table). Latent bug. The right fix is to delete or rewrite that file; the canonical care path goes through `app/app/actions/care-operations.ts`.

### 7.3 RLS — major issue

[supabase/migrations/20260122_add_default_rls_policies.sql](supabase/migrations/20260122_add_default_rls_policies.sql) adds SELECT policies of the form `USING (auth.uid() IS NOT NULL)` to ~30 public tables. The migration's stated intent is "Adds a default SELECT RLS policy for all tables with RLS enabled but no policies." The effect is that any authenticated user (including a user from any other tenant) can SELECT rows from these tables. Notable tables in the list:
- `control_evidence`
- `control_tasks`
- `org_audit_log` (note: singular — this is a separate table from the canonical `org_audit_logs`)
- `org_certifications`
- `org_entities`, `org_entity_members`, `org_files`, `org_industries`, `org_memberships`, `org_registers`
- `policies`, `tasks`, `registers`
- `webhook_deliveries`, `report_generations`, `integration_events`, `compliance_playbooks`, `compliance_playbook_controls`
- `app_modules`, `billing_plans`, `care_industries`, `care_policy_templates`, `care_register_templates`, `care_service_types`, `care_task_templates`

For shared template/reference tables (`care_*`, `app_modules`, `billing_plans`), this is fine. For the org-data tables on the list (`control_evidence`, `control_tasks`, `org_audit_log`, `org_certifications`, `org_entities`, `org_files`, `policies`, `tasks`, `registers`, `webhook_deliveries`, `report_generations`), this is a tenancy hole.

[supabase/migrations/20260405_fix_rls_organization_isolation.sql](supabase/migrations/20260405_fix_rls_organization_isolation.sql) attempts to repair this for several of those tables by adding `FOR ALL USING (organization_id IN (SELECT ... FROM org_members ...))`. The repair pattern uses a single `FOR ALL` policy per table, which collapses SELECT/INSERT/UPDATE/DELETE into one rule and removes any chance of tighter role-based constraints on writes.

However:
- The repair migration does not cover every table the default migration opened.
- Postgres RLS is a UNION of policies, not an intersection. The permissive `..._select USING (auth.uid() IS NOT NULL)` policy from the earlier migration **co-exists** with the repair policy unless the older policy was explicitly dropped. A grep through the repair migration shows it only adds `FOR ALL` policies; it does not `DROP POLICY` the earlier weak SELECT policies.

This is a P0 finding. It should be verified directly in Postgres via `SELECT * FROM pg_policies WHERE schemaname='public'` and then tested with a JWT from a different org.

### 7.4 RLS — secondary issues

- [supabase/migrations/20250308_create_org_control_evaluations.sql](supabase/migrations/20250308_create_org_control_evaluations.sql) creates `org_control_evaluations` with no RLS at all. None of the 7 follow-up migrations referencing the table addresses this.
- [supabase/migrations/20260311_scim_provisioning.sql:44-46](supabase/migrations/20260311_scim_provisioning.sql#L44) defines `scim_tokens`, `scim_groups`, `scim_group_members` with policies `FOR ALL USING (true) WITH CHECK (true)`. Comment says "service-role-only" but the policy is open to any role.
- [supabase/migrations/20260315_api_keys.sql](supabase/migrations/20260315_api_keys.sql) `api_key_usage_log` INSERT policy uses `WITH CHECK (true)` — anyone can write into the audit log of API key usage.
- `20260402_care_goals.sql` policies depend on `current_setting('app.current_org_id', true)` instead of joining `org_members`. If the application doesn't set the GUC, the policy compares against NULL and the row is hidden but writes are similarly affected. The pattern is fragile relative to the rest of the codebase.

### 7.5 Storage buckets

- `evidence` (private): path `${organization_id}/...`, membership-checked policies. Solid.
- `audit-bundles` (private): same path scheme.
- `report-exports`, `compliance-exports`, `enterprise-exports`: private with org/admin policies; signed URLs.
- `user-avatars`: private; profile-owner.

All buckets rely on `split_part(name, '/', 1)` matching `organization_id::text`. Path discipline is the trust root. If any code uploads a file using a different first segment, the bucket policy fails open or closed depending on direction.

### 7.6 Indexes / constraints

Status columns lacking CHECK constraints (where they should have them) include `org_tasks.status`, `org_policies.status`, `org_assets.status`, `org_risks.status`, `org_incidents.status`. CAPA, forms, care goals, and medications all have CHECK constraints — those are good models to copy.

`org_subscriptions.plan_key` got a CHECK in `20260616_org_subscriptions_plan_key_check.sql` — good. `plan_code` (legacy) has no constraint and bootstrap still writes `'starter'` into it.

---

## 8. Billing / Stripe / Entitlements Assessment

### 8.1 Plan vocabulary (re-stated from §2)

Three vocabularies in active use. Bootstrap writes both `plan_key` and `plan_code` to keep the legacy column populated ([lib/supabase/transaction.ts:139-140](lib/supabase/transaction.ts#L139)).

### 8.2 Stripe webhook idempotency — P0

[app/api/billing/webhook/route.ts:50-69](app/api/billing/webhook/route.ts#L50) inserts `event.id` into `billing_events` **before** any side effect runs. If the insert succeeds and processing later throws (e.g., `org_subscriptions` upsert fails, `syncEntitlementsForPlan` throws), the route returns 500 to Stripe. Stripe retries. The retry's INSERT into `billing_events` returns `23505` (unique violation). The handler short-circuits with `{ received: true }`. The original side effects never run. Subscription provisioning is permanently lost for that event.

Fix shape: track event lifecycle (`pending|succeeded|failed`) and only treat as duplicate-no-op when the prior attempt succeeded.

### 8.3 Stripe price hardcoded fallbacks — P0

[lib/billing/stripe.ts:7-11](lib/billing/stripe.ts#L7) hardcodes:
```
basic: 'price_1TOdz1AHrAKKo3OlfYxjk9WL'
pro: 'price_1TOe05AHrAKKo3OliCrZNnkx'
enterprise: 'price_1T9cPKAHrAKKo3OliQN78Q83'
```

Used as fallbacks when `STRIPE_PRICE_FOUNDATION/GROWTH/ENTERPRISE` are unset. In production, missing env should fail closed, not fall back to identifiers that may belong to a wrong account/test mode.

### 8.4 Entitlement registry coverage

`lib/billing/entitlements.ts` defines keys: `audit_export`, `reports`, `framework_evaluations`, `team_limit`, `ai_assistant`, `soc2_certification`, `capa_management`, `custom_reports`, `form_analytics`, `workflow_automation`, `sso_saml`, `directory_sync`. Pulling enforcement points by grep:

| Key | Plan availability | Where enforced |
|-----|-------------------|----------------|
| `audit_export` | basic+ | `requireEntitlement` calls in vault/audit actions |
| `reports` | basic+ | declared but no `requireEntitlement` in `app/api/reports/export/route.ts` |
| `framework_evaluations` | basic+ | declared, no server-side gate located |
| `team_limit` | tiered | enforced in `app/app/actions/team.ts` |
| `ai_assistant` | pro+ | enforced via auth+conversation, but no entitlement check |
| `soc2_certification` | pro+ | declared, no server-side gate located |
| `capa_management` | pro+ | enforced at [app/app/capa/actions.ts:74](app/app/capa/actions.ts#L74) |
| `custom_reports` | pro+ | enforced via [app/api/v1/reports/custom/_entitlement.ts](app/api/v1/reports/custom/_entitlement.ts) (newly added) |
| `form_analytics` | pro+ | enforced at form analytics route |
| `workflow_automation` | enterprise | declared, no enforcement in `app/api/workflows/route.ts` |
| `sso_saml` | enterprise | enforced at [app/app/settings/security/sso-actions.ts:27](app/app/settings/security/sso-actions.ts#L27) |
| `directory_sync` | enterprise | declared, SCIM routes don't enforce |

So 6 of 12 keys are server-side enforced; 6 are advertised by plan but unguarded. The "registered but not enforced" set is the worst-case for revenue leakage and trust risk, because the marketing site sells features that any plan can use.

Missing entirely from the registry but advertised in copy or implicit in product surfaces: `retention_governance`, `executive_rollup`, `industry_report_packs`, `care_operations`, `staff_compliance`.

### 8.5 Webhook coverage gaps

- Subscription `incomplete` status (initial payment failure) isn't handled.
- `invoice.paid` recovery does not call `syncEntitlementsForPlan`. If features were degraded during `past_due`, they remain degraded after payment succeeds.
- `upsertFromSubscription` fallback path that finds a row by `stripe_customer_id` does not assign that row's `organization_id` back into the local `targetOrgId` variable in every branch.

### 8.6 Drift detector

[lib/billing/entitlement-drift-detector.ts](lib/billing/entitlement-drift-detector.ts) (recently modified) detects divergence between expected and actual entitlements. The `disabled` correction case marks `corrected: false` and relies on a subsequent `syncEntitlementsForPlan` upsert to fix it. If the sync upsert doesn't explicitly set `enabled=true` for an already-existing row, the disabled state persists.

### 8.7 Marketing pricing-vs-reality gap

Pricing page advertises capabilities (custom reports, SSO, workflow automation, retention, executive rollup) that are server-side enforced for ~half of those. The `Stripe Payment Link` for Growth referenced in `lib/marketing/pricing.ts` (env `STRIPE_PAYMENT_LINK_GROWTH`) is not surfaced anywhere in code. Likely a manual sales process; documenting that explicitly would reduce confusion.

---

## 9. Evidence and Audit Trail Assessment

Supported evidence entity types (API): `incident`, `staff_credential`, `capa`, plus task evidence via the server action.

Supported by storage path discipline: `${organization_id}/...` first segment.

Audit events:
- `org_audit_logs` — main stream, written by ~30 server actions but inconsistently. CAPA also writes `org_capa_events`.
- `audit_log` (separate table from `20260403_audit_trail_enhanced.sql`) defines a hash chain (`prev_hash`, `entry_hash`, `sequence_number`, `entry_data`). **Never written to by app code.** Dead infrastructure.
- `audit_retention_config` table declared, never read.

Audit panel filters:
- [app/api/v1/audit-trail/route.ts](app/api/v1/audit-trail/route.ts) requires `target` to match `entityType:entityId` exactly or as suffix. Older rows that don't follow that format are silently invisible. There is no backfill migration for older targets.

Gaps:
- No universal entity evidence contract — care plans cannot have evidence attached via the upload API; the polymorphism migration anticipates `care_plan` but the API rejects it.
- No universal audit event contract — some creates log, some don't (incident creation doesn't, incident resolution does).
- API upload and server action upload have different validation (magic bytes only on the server action; size cap differs).

---

## 10. Workflow Integrity Assessment

Per requested flow:

**Public CTA → signup/contact/billing/app**: Real but fragile. OAuth state validation is provider-conditional. Bootstrap creates a "trialing" subscription contradicting `TRIAL_ELIGIBLE_PLANS=[]`.

**First-session onboarding**: Real. Persistence in `org_first_session_progress`. System-state self-repair can mask issues.

**Billing checkout intent**: Real. Two implementations (route handler + server action). Webhook idempotency P0 outstanding.

**Care plan lifecycle**: Page-level path real (`care-operations.ts`). Action file `care-plans.ts` is broken on column name. Goals/supports JSONB will hurt audit/reporting.

**CAPA lifecycle**: Strongest module. Lifecycle states, transitions, source validation, entitlement gate, audit events, owner/admin checks. Minor: `/signin` redirect is non-canonical.

**Incident → investigation → evidence → resolve**: Mostly real. Creation lacks an audit log. Resolution writes one. Investigation handoff to CAPA is real but light.

**Obligation → evidence → vault → audit trail**: Real. Audit panel filtering is target-format-fragile.

**Policy create/edit/version**: Shallow. Lifecycle schema exists; action layer doesn't use it.

**Forms builder/submission/export**: Split-brain. Public submit on legacy tables. RLS settings-key mismatch broadens public insert.

**Evidence upload/download/source link**: Useful, not universal. Care plan not supported. API and action have different validation.

**Staff credential verification**: Insufficient governance. user_id from FormData unvalidated; verifier not role-restricted; create lacks audit log.

**Dashboard task completion**: Real. Score integrity depends on evidence verification — and verification isn't required.

**Audit trail filtering**: Useful, format-fragile.

**Report/export flows**: Real plumbing. `/api/reports/export` not entitlement-gated. Custom reports newly gated. Reports can look polished from sparse data.

**Settings save flows**: Partially real. Several panels disabled.

**Role/permissions detail**: Shallow. Editing disabled. Creation under-guarded. Engine inconsistent.

**Workflow creation/run/toggle**: Disabled in most surfaces; store functions trust callers for org scope.

---

## 11. Product Integrity Assessment

Real:
- Authenticated app shell, navigation, dashboard.
- Org membership and storage path tenancy.
- Foundation pricing → signup → checkout intent.
- Stripe webhook (notwithstanding §8.2), portal redirect, subscription persistence, plan↔org sync.
- Evidence upload, vault, signed download, review approval/rejection.
- CAPA lifecycle (one of the strongest modules).
- Care participants, plans (page-level), visits, progress notes, incidents, staff credentials (CRUD).
- Team invitations + permission/limits.
- Report export jobs (asynchronous + signed URLs).
- AI chat (with the caveats on usage limits and plan keys).
- Marketing site, contact lead capture.
- Auditor portal token-based access.

Shallow:
- Policy approval/version governance.
- Custom roles editing/enforcement.
- Workflow automation UI.
- Custom reports beyond entitlement gate (depth).
- Executive rollup metrics (depends on still-maturing scoring).
- Form analytics depth.
- AI usage limits and plan controls.
- Industry-specific report packs.
- Retention/data-residency operations.

Disabled / degraded:
- Workflow definition creation UI.
- Custom report builder fields.
- Form analytics in-app (entitlement gated, but the implementation is light).
- SSO save/test/sync (gated; XML parsing not validated downstream).
- Directory sync.
- Retention dry-run/execute.

Misleading surfaces:
- Public form submit looks like a published form, but writes to legacy `forms`/`form_responses` and bypasses validation.
- Role pages imply custom permissions but editing is unavailable and enforcement is inconsistent.
- Reports can render official-looking PDFs from `safeSelect`-fallback empty arrays.
- Executive view returns `degraded:true; overallScore:0` on schema errors with no alerting hook.
- Bootstrap "trialing" subscriptions don't mean the customer is actually trialing.

What should be removed, gated, or built before serious onboarding:
- Build or hide public form submission until it uses `org_forms`/`org_form_submissions`.
- Server-side gate `workflow_automation`, `executive_rollup`, `directory_sync`, `framework_evaluations`, `soc2_certification`, `reports` (export route), and `ai_assistant`.
- Build the policy approval workflow that the schema already provides for.
- Replace the trialing bootstrap with an explicit `pending_checkout` / `free` state.
- Hide custom-role editing or actually wire it to `permission-engine.ts`.

---

## 12. Code Quality Findings

Duplicated logic:
- Billing checkout: route handler [app/api/billing/checkout/route.ts](app/api/billing/checkout/route.ts) and server action [app/app/actions/billing.ts](app/app/actions/billing.ts).
- Auth signup/bootstrap: signup page, `/api/auth/email-signup`, `/api/auth/signup`, OAuth callback, `lib/bootstrap/ensure-organization.ts`, `lib/supabase/transaction.ts:bootstrapOrganizationAtomic`.
- Membership selection: `lib/auth/callback.ts:selectPrimaryMembership`, `lib/system-state/server.ts:pickPrimaryMembership`.
- Permission models: [app/app/actions/rbac.ts](app/app/actions/rbac.ts), [lib/api-permission-guards.ts](lib/api-permission-guards.ts), [lib/authz/permission-engine.ts](lib/authz/permission-engine.ts), [lib/roles.ts](lib/roles.ts) (4-way, not 3-way).
- Rate limiting: proxy in-memory, `rateLimitApi`, `checkRateLimit`, scim-specific limiter.
- Care: `app/app/actions/care-plans.ts` (broken) vs `app/app/actions/care-operations.ts`.

Dead/stale candidates:
- `app/app/actions/care-plans.ts` (column-mismatched).
- `lib/bootstrap/ensure-organization.ts`.
- `app/api/auth/signup/route.ts` if `/api/auth/email-signup` is canonical.
- Public submit flow's use of `forms`/`form_responses` if `org_forms` is canonical.
- `audit_log` hash-chain table, `audit_retention_config` table.
- Hardcoded founder cleanup migrations (`20260114_fix_founder_account.sql`, `20260319_cleanup_founder_account.sql`) — these are ops scripts in disguise.

Naming inconsistencies:
- `basic` vs `starter` (plan vocabulary).
- Foundation/Growth/Enterprise vs basic/pro/enterprise.
- `organization_id` vs `org_id`.
- `profiles` (queried by topbar) vs `user_profiles` (canonical).
- `status` vs `verification_status` for evidence.
- Care plan statuses `'review'` vs `'under_review'`.
- `/signin` (catch-all) vs `/auth/signin` (canonical).

Brittle files:
- [proxy.ts](proxy.ts) — 752 lines mixing 6+ responsibilities.
- [lib/system-state/server.ts](lib/system-state/server.ts) — large, side-effectful, cache-heavy, repair-heavy.
- [app/auth/callback/route.ts](app/auth/callback/route.ts) — 725 lines combining OAuth code exchange, state validation, founder routing, invitation acceptance, atomic org bootstrap, welcome email.
- [app/api/billing/webhook/route.ts](app/api/billing/webhook/route.ts) — high-stakes, premature idempotency.
- [app/app/actions/care-operations.ts](app/app/actions/care-operations.ts) — many domains in one file with hand-rolled validation.
- [lib/automation/workflow-store.ts](lib/automation/workflow-store.ts) — service-role store with weak internal scoping.

Risky patterns:
- Service-role functions accepting raw IDs without an org-scope predicate.
- Schema-tolerant fallbacks (`safeSelect*` → `[]`).
- Raw `.or(...)` PostgREST search interpolation.
- Inline `'use server'` actions inside large pages (forms, care, settings).
- JSONB child collections where reporting/audit needs are real.
- `current_setting('app.current_org_id', true)` based RLS in care-goals migrations.

Refactor opportunities:
- One `requireOrgContext` / `requireOrgPermission` / `requireOrgEntitlement` shared guard.
- One permission engine.
- One entitlement registry with a single enforce-call helper.
- One checkout orchestrator.
- One evidence upload service used by all paths.
- One typed audit-event writer.
- One forms submission engine used by both public and app routes.

---

## 13. Security and Compliance Findings

Highest-risk:
1. **Default RLS policies open SELECT to any authenticated user across ~30 tables (`20260122_add_default_rls_policies.sql`).** Even where `20260405_fix_rls_organization_isolation.sql` adds an isolation policy, the earlier permissive policy is not dropped; Postgres unions them. P0.
2. **`org_control_evaluations` has no RLS.** P0.
3. **Stripe webhook idempotency loses failed side effects.** P0.
4. **Hardcoded Stripe price-ID fallbacks ship in production.** P0.
5. **Forms public submit uses legacy schema and bypasses validation engine.** P1.
6. **Forms RLS settings-key mismatch (`requires_auth` vs `requireAuthentication`).** P1.
7. **OAuth state validation conditional on `provider=google`.** P1.
8. **Founder localStorage hint readable client-side and used by feature flags.** P1.
9. **Three-way (or four-way) competing permission models.** P1.
10. **Workflow store getters take raw IDs without org scope.** P1.
11. **Staff credential verification under-governed (any member can verify; user_id from FormData unvalidated).** P1.
12. **Reports export route lacks entitlement enforcement.** P1.
13. **AI chat does not invoke usage meter; plan keys drift `starter` vs `basic`.** P1.
14. **Trialing subscription bootstrap with no trial-eligible plan.** P1.
15. **Admin middleware blocks delegated admins.** P1.
16. **Schema-tolerant `safeSelect*` returns empty arrays on errors and produces precise-looking compliance scores.** P1.
17. **Bootstrap is not a true transaction; `bootstrapOrganizationAtomic` rolls back via sequential deletes.** P2.

Compliance credibility issues:
- Policy lifecycle schema unused.
- Audit chain table unused.
- Retention/residency/SSO/directory features partly visible, partly enforced.
- Reports can be polished but thin.
- Staff credential proof flow not fully governed.

Auditability gaps:
- Some create actions don't log (incidents, staff credentials).
- Audit target convention not universally enforced; older rows orphaned.
- JSONB goals/supports lack per-item audit trail.
- Public form submissions not part of the canonical engine.

---

## 14. Performance and Reliability Findings

Slow / fragile:
- App shell hydrates substantial system state on every authenticated route; cache miss triggers writes (provisioning).
- Compliance scoring/report builders run multiple broad queries and aggregate in memory.
- Participants/incidents pages fetch a fixed page and filter in-memory.
- AI compliance context queries multiple tables per chat turn.
- Report exports fall back to inline processing if queue/Trigger.dev isn't configured.

Query risks:
- Missing pagination on several list views (vault, audit, participants, incidents).
- Raw `.or(...)` interpolation can break with special characters.
- Service-role report builders can pull all evidence/tasks for large orgs.
- Audit-trail `target like '%:id'` filter without a supporting index can be expensive.

Caching/revalidation:
- Subscription/entitlements cache TTL can outlive a webhook update without explicit revalidation.
- Report job rows store 1-hour signed URLs; status route doesn't always regenerate.
- `safeSelect` empty arrays cache as "everything is fine."

Monitoring:
- Sentry source map upload requires `SENTRY_AUTH_TOKEN` etc.
- Production rate limiting requires `UPSTASH_REDIS_*`.
- Lighthouse, k6, ZAP exist as scripts but aren't proven always-on.

---

## 15. Top 25 Issues

| # | Sev | Area | Issue | Why it matters | Suggested fix | Files |
|---|-----|------|-------|----------------|---------------|-------|
| 1 | P0 | RLS | `20260122_add_default_rls_policies.sql` adds permissive `auth.uid() IS NOT NULL` SELECT policies to ~30 tables; not dropped by 20260405 repair | Cross-tenant SELECT for control_evidence, org_certifications, org_files, policies, tasks, registers, webhook_deliveries | Drop the permissive policies; replace with org-membership predicate; verify in pg_policies | `supabase/migrations/20260122_*`, `20260405_*` |
| 2 | P0 | RLS | `org_control_evaluations` has no RLS policy | Compliance scoring data is cross-tenant readable | Add `FOR SELECT/INSERT/UPDATE/DELETE` policies based on `org_members` | `supabase/migrations/20250308_*` |
| 3 | P0 | Billing | Webhook inserts `billing_events` before side effects; failed side effects become permanent no-ops on retry | Subscription provisioning silently lost | Track event lifecycle (`pending|succeeded|failed`); only treat completed events as duplicates | `app/api/billing/webhook/route.ts:50-69` |
| 4 | P0 | Billing | Hardcoded Stripe price IDs as production fallbacks | Wrong prices charged if env missing | Fail closed in production; only allow fallback in dev | `lib/billing/stripe.ts:7-11` |
| 5 | P1 | Forms | Public submit uses legacy `forms`/`form_responses` and skips validation engine | Public submissions bypass controls advertised as "validated" | Rebuild `app/submit/[formId]/page.tsx` on `org_forms`/`org_form_submissions` + `submission-engine` | `app/submit/[formId]/page.tsx` |
| 6 | P1 | Forms RLS | Policy reads `requires_auth`, code writes `requireAuthentication` | Public insert RLS effectively never enforces auth requirement | Normalize the JSON key end-to-end; add migration to backfill | `supabase/migrations/20260426_001_*`, `lib/forms/form-store.ts` |
| 7 | P1 | Auth | OAuth state validation gated on `provider=google` | Non-Google or absent-provider callbacks skip CSRF check | Validate state whenever the cookie/param exists | `app/auth/callback/route.ts:132-153` |
| 8 | P1 | Auth | Bootstrap mints a trialing subscription though `TRIAL_ELIGIBLE_PLANS` is empty | Plan/state semantics drift; downstream gating misbehaves | Use `pending_checkout`/`free` for self-serve; only trial when eligible | `lib/supabase/transaction.ts:139-147`, `lib/plans.ts:3` |
| 9 | P1 | Authz | Three+ permission models disagree | Inconsistent access decisions; impossible to security-review | Consolidate to one engine and one matrix; move `rbac.ts` and `roles.ts` to the engine | `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, `lib/authz/permission-engine.ts`, `lib/roles.ts` |
| 10 | P1 | Workflows | `workflow-store.ts` getters take only IDs and use admin client | Cross-org leak via caller mistakes | Require orgId in every getter and assert on read | `lib/automation/workflow-store.ts:212,291,344` |
| 11 | P1 | Care | `app/app/actions/care-plans.ts` queries `org_id` against an `organization_id` table | Latent broken module | Delete the file or rewrite to canonical care path | `app/app/actions/care-plans.ts` |
| 12 | P1 | Staff | `createStaffCredential` accepts user_id without org-membership check; no audit | Credentials attach to wrong users; no record of who registered | Validate target user; restrict verifier to admin/compliance; log audit event | `app/app/actions/care-operations.ts:361-399` |
| 13 | P1 | Compliance | `safeSelect*` helpers return `[]` on error | False compliance confidence from sparse/missing data | Fail loudly in production; structured error in API; stop scoring on partial data | `app/app/actions/compliance-engine.ts:243-410` |
| 14 | P1 | Reports | `/api/reports/export` lacks entitlement enforcement | Report export bypasses paid-plan gates | Call `requireEntitlement(orgId, 'reports' / 'audit_export')` | `app/api/reports/export/route.ts` |
| 15 | P1 | Admin | Middleware blocks `/admin` for non-founders, but server supports delegated admins | Delegated admin model unreachable | Consult `getPlatformAdminAssignment` in middleware before rejecting | `proxy.ts:618-647`, `app/app/admin/access.ts` |
| 16 | P1 | RLS | `scim_*` policies use `USING (true) WITH CHECK (true)` | Open data plane on SCIM tables | Replace with role/jwt scope checks | `supabase/migrations/20260311_scim_provisioning.sql:44-46` |
| 17 | P1 | RLS | `api_key_usage_log` INSERT `WITH CHECK (true)` | Anyone can poison usage log | Restrict to service role | `supabase/migrations/20260315_api_keys.sql:86-90` |
| 18 | P1 | AI | Usage limits not enforced in chat route; plan-key drift | Cost exposure; advertised plan limits don't bind | Call `checkUsageLimit/trackUsage` in stream completion; align plan keys | `app/api/v1/ai/chat/route.ts`, `lib/ai/usage-meter.ts` |
| 19 | P1 | Policies | Lifecycle schema (versions/approvals/acks/reviews) exists but unused | Governance promise unfulfilled | Wire `policies.ts` actions to write `policy_versions`/`policy_approvals` | `app/app/actions/policies.ts`, `supabase/migrations/20260403_policy_lifecycle.sql` |
| 20 | P1 | Audit | Entity audit panel relies on `target` format `entityType:entityId` | Older rows invisible | Typed columns or backfill | `app/api/v1/audit-trail/route.ts`, `org_audit_logs` rows |
| 21 | P1 | App shell | Founder hint persisted to localStorage; read by feature flags | Spoofable UI surface | Drop the localStorage write; re-validate via system state | `components/app-hydrator.tsx:104-106`, `lib/feature-flags.tsx:147` |
| 22 | P2 | Reports | 1-hour signed URLs stored in `report_export_jobs.file_url` | Completed exports rot | Store path; regenerate signed URL on download | `lib/reports/export-jobs.ts` |
| 23 | P2 | Care | Goals/supports JSONB inside care plans | Reporting/audit/per-item permissions weak | Move to relational child tables | `org_care_plans`, care actions |
| 24 | P2 | Search | Raw `.or(...)` interpolation in participant/forms search | Special characters break queries | Sanitize or use server-side RPC | `app/app/participants/page.tsx`, `lib/forms/form-store.ts` |
| 25 | P2 | Migrations | 11 future-dated and many repair-style migrations | Remote/source-of-truth drift | Freeze naming, verify remote state, snapshot baseline | `supabase/migrations/20260601...20260618` |

---

## 16. Top 25 Suggested Upgrades

| # | Pri | Upgrade | Why | Files |
|---|-----|---------|-----|-------|
| 1 | P0 | Drop legacy permissive SELECT policies and verify policy state via pg_policies | Closes the cross-tenant SELECT regression | RLS migrations |
| 2 | P0 | Convert webhook idempotency to a state machine | Stops permanent loss of failed side effects | `app/api/billing/webhook/route.ts` |
| 3 | P0 | Fail closed in production on missing Stripe price envs | Prevents wrong charges | `lib/billing/stripe.ts` |
| 4 | P1 | Single shared `requireOrgContext`/`requireOrgPermission`/`requireOrgEntitlement` guard | Makes security review and refactors possible | `lib/authz/*`, every action/route |
| 5 | P1 | Expand entitlement registry and enforce server-side | Aligns commercial promise with code | `lib/billing/entitlements.ts`, route handlers |
| 6 | P1 | Rebuild public form submission on the canonical platform | Removes the split-brain | `app/submit/[formId]/page.tsx`, `lib/forms/*` |
| 7 | P1 | Wire policy lifecycle actions to existing schema | Fills a core governance gap | `app/app/actions/policies.ts` |
| 8 | P1 | Normalize tenancy column convention | Reduces the schema/code drift class of bug | `supabase/migrations/*`, action files |
| 9 | P1 | Standardize audit event schema and backfill targets | Reliable entity-scoped audit panels | `org_audit_logs`, audit helpers |
| 10 | P1 | Harden staff credential verification (role + member check + audit) | Regulated workforce trust | `app/app/actions/care-operations.ts` |
| 11 | P1 | Collapse duplicate checkout implementations | Reduces billing drift | `app/api/billing/checkout/route.ts`, `app/app/actions/billing.ts` |
| 12 | P1 | Replace trialing bootstrap with explicit checkout/free state | Aligns billing semantics | `lib/supabase/transaction.ts`, `lib/plans.ts` |
| 13 | P1 | Align middleware admin guard with delegated admin model | Makes platform admin model coherent | `proxy.ts`, `app/app/admin/access.ts` |
| 14 | P1 | Drop or repurpose `safeSelect` fallbacks in compliance engine | Stops false compliance confidence | `app/app/actions/compliance-engine.ts` |
| 15 | P1 | Drop or repurpose unused audit infrastructure | Cleaner code, accurate compliance posture | `audit_log`, `audit_retention_config` |
| 16 | P2 | Delete or rewrite `app/app/actions/care-plans.ts` | Removes a broken latent path | `app/app/actions/care-plans.ts` |
| 17 | P2 | Move care-plan goals/supports to relational tables | Real reporting/audit | care migrations + actions |
| 18 | P2 | Centralize evidence upload into one validated service | Consistent file safety | evidence route + action |
| 19 | P2 | Store storage paths, regenerate signed URLs on demand | Reliable downloads after expiry | report jobs |
| 20 | P2 | Add pagination + server-side filtering to large lists | Scale + correctness | participants/incidents/audit/vault |
| 21 | P2 | Sanitize all PostgREST `.or(...)` search inputs | Query safety | list/search code |
| 22 | P2 | Enforce AI usage limits and align plan keys | Cost control + product packaging | AI route + meter |
| 23 | P2 | Replace fallback-heavy schema code with explicit migration checks | Surfaces real drift | compliance/reports/forms |
| 24 | P2 | Add CHECK constraints on all status columns | Prevent taxonomy drift | migrations |
| 25 | P3 | Document service-role boundaries and hold a service-role audit | Reduce silent privilege | API routes + lib helpers |

---

## 17. Recommended Engineering Roadmap

### Next 7 days
1. Run `SELECT * FROM pg_policies WHERE schemaname='public'` against production and verify which permissive `auth.uid() IS NOT NULL` policies are still live. Drop them.
2. Add RLS to `org_control_evaluations`.
3. Replace Stripe webhook idempotency with a state machine.
4. Remove production fallbacks from `lib/billing/stripe.ts`.
5. Decide canonical signup path (`email-signup` vs `signup`); delete the loser.
6. Disable or rebuild `app/submit/[formId]/page.tsx` on the canonical forms platform; or, at minimum, plug the `requires_auth` JSON-key mismatch in the RLS policy.
7. Make `proxy.ts` consult delegated-admin assignments before rejecting non-founders.
8. Gate `/api/reports/export`, `/api/workflows`, `/api/sso/*`, and AI chat behind their declared entitlements.

### Next 30 days
1. Consolidate `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, `lib/authz/permission-engine.ts`, `lib/roles.ts` into one engine and one role/permission matrix. Migrate callers.
2. Wire `app/app/actions/policies.ts` to `policy_versions` / `policy_approvals` / `policy_acknowledgments`.
3. Standardize `org_audit_logs.target` format; backfill historical rows.
4. Replace bootstrap trialing subscription with explicit `pending_checkout`/`free`.
5. Rewrite or delete `app/app/actions/care-plans.ts`.
6. Harden staff credential creation/verification (role gate, member check, audit).
7. Convert webhook handling to use `entitlement-drift-detector` proactively (sync entitlements on every successful subscription event, not only nightly).
8. Snapshot a baseline schema dump (Supabase CLI) and document repair migrations as one-shots.

### Next 90 days
1. Build the migration to move JSONB goals/supports/progress to relational child tables.
2. Build a real custom report engine (the gate is in; depth isn't).
3. Make workflow automation a first-class, gated, audited, org-scoped module — or remove it from marketing.
4. Build executive metrics on top of verified CAPA/evidence/reporting; add alerts on `degraded:true`.
5. Automate Sentry source maps in CI; make Upstash and Sentry configuration part of `predeploy` checks.
6. Reduce `safeSelect` fallback paths after two clean deploys.
7. Run a service-role boundary audit across every API/action and document each justification.

---

## 18. Brutal Final Verdict

What is genuinely strong:
- The **app shell, system-state hydration, evidence storage, CAPA lifecycle, audit-bundle storage, Stripe webhook signature verification, API key hashing, SCIM token compare, and CSP/headers**. These are not vaporware.
- The **internal link graph is intact** (306/306 valid per the bundled audit). The product surface is real, not a stub.
- The team is **actively closing audit findings**: post-prior-audit work on the entitlement drift detector, custom-report entitlement gating, CAPA entitlement, governance retention, and SSO actions is visible in the diff.

What is overbuilt:
- The product has more modules than its **authz/entitlements/schema** governance can carry.
- Marketing surface is broader than the **deepest verified workflow set**.
- There are **multiple permission models, multiple bootstrap paths, multiple checkout paths, and two tenancy column conventions** where one boring standard would be safer.

What is shallow:
- Policy approval, custom roles, public forms, custom reports (depth, not gating), workflow automation, executive rollup, enterprise SSO/directory/retention actions, AI plan/usage controls, industry report packs.

What could break in production:
- **Tenancy** because of the `20260122` permissive RLS regression.
- **Billing provisioning** after a webhook side-effect failure.
- **Stripe charges** if env vars drop and fallback price IDs activate.
- **Public form submissions** because they live on a different schema branch and a JSON-key-mismatched RLS.
- **Compliance scores** that look precise from sparse data because of `safeSelect` fallbacks.
- **Custom-role expectations** because creation/display exists but editing/enforcement does not.
- **Workflow data isolation** if future callers continue to use ID-only store getters.
- **Staff-credential trust** if verification stays open to any member.

What must be fixed before serious customer onboarding:
1. The RLS regression in `20260122_add_default_rls_policies.sql`.
2. `org_control_evaluations` RLS.
3. Stripe webhook idempotency.
4. Stripe env fail-closed.
5. Public-forms split-brain (or disable the public submit until it's rebuilt).
6. Permission model consolidation.
7. Policy approval lifecycle wiring.
8. Staff credential governance.
9. A verified Supabase remote schema baseline.
10. Production monitoring (Sentry + Upstash) configuration discipline.

The honest read: FormaOS is a serious early product, broader and deeper than the surface area makes it look, but it is carrying the weight of several merged eras (multiple plan vocabularies, multiple permission engines, multiple bootstrap paths, two tenancy column conventions, two forms backends, an unused audit hash chain). The gap between **"works in normal conditions"** and **"survives an enterprise security review"** is the gap a 30-60 day stabilization sprint can close. That sprint should not add modules. It should make the existing modules boringly correct: one authz model, one entitlement model, one evidence contract, one audit contract, one billing path, one canonical schema baseline, and a smaller number of features that are **unquestionably real, end-to-end gated, and auditable**.

Final production confidence: **6.0 / 10** for hand-held early customers. **4.5 / 10** for low-touch enterprise self-onboarding.
