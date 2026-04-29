# FormaOS Deep Codebase Audit

Audit date: 2026-04-30

Primary repo: `/Users/ejaz/FormaOS`

Scope: production web application code, marketing site code, authenticated app code, server actions, API routes, Supabase migrations/schema/storage, billing, auth, onboarding, and behavior-relevant docs.

Excluded deliberately: test folders/files, E2E specs, Playwright specs, Jest/Vitest tests, mobile/React Native code, generated reports/artifacts, and historical generated outputs except where package scripts or docs explain production behavior.

Review coverage note: the production web surface inventoried for this audit is approximately 1,948 non-test, non-mobile, non-generated files and 355,124 lines across `app`, `components`, `lib`, `supabase/migrations`, selected `scripts`, and behavior-relevant `docs`. This audit is based on direct code reading of root config, middleware, app shell, route groups, critical server actions/APIs, core libraries, and representative migrations, plus static inventory over the production corpus. It does not treat existing handover docs as truth unless confirmed by code.

## 1. Executive Summary

FormaOS is a multi-tenant compliance operations platform for regulated organizations. The public site sells a "compliance operating system"; the authenticated app implements operational surfaces for obligations, controls, policies, evidence, care records, incidents, CAPA, forms, reports, teams, roles, settings, billing, audit trail, and AI-assisted compliance work.

Current maturity: broad and real, but uneven. The app is not a shell. Many critical flows have actual persistence, RLS-backed tenancy, server actions, storage paths, audit logs, exports, and UI state. The product also carries clear signs of rapid expansion: parallel auth paths, duplicate permission systems, stale module gating, schema compatibility fallbacks, future-dated migrations, and several routes that look complete while using old or partial tables.

Biggest strengths:

- Strong product breadth with many implemented modules under `app/app`.
- Consistent Next.js App Router structure with server-rendered app shell and shared system-state hydration.
- Supabase RLS is broadly enabled for tenant isolation.
- Evidence, reports, CAPA, billing, team invitations, and some compliance actions have real server-side persistence.
- The codebase contains serious operational scaffolding: Sentry hooks, rate-limiting helpers, health endpoints, storage buckets, admin console, webhooks, queue/Trigger.dev hooks, and validation scripts.
- The public site and pricing flow now mostly align with a Foundation self-serve and Growth/Enterprise sales-led motion.

Biggest weaknesses:

- Entitlement and module gating are materially incomplete and internally inconsistent.
- There are multiple competing auth/org/permission abstractions, and they do not all make the same decisions.
- Billing has two checkout implementations and a webhook idempotency pattern that can lose failed side effects.
- Service-role usage is common and often justified, but boundary checks are not standardized.
- Several modules are production-looking but shallow, disabled, or schema-split: public forms submission, roles editing, workflows, custom reports, retention, SSO, form analytics, AI usage controls, and policy approval.
- The database history is fragile: `20250101_000_base_schema.sql` documents pre-existing/manual core tables, migrations are heavily idempotent, and several migration filenames are future-dated relative to this audit.
- There are stale or duplicate implementation paths that can mislead a new dev team.

Production confidence rating: 6.8 out of 10.

The product is good enough for controlled production with careful operator oversight, especially for a known set of early customers. It is not yet robust enough for broad, low-touch enterprise onboarding without tightening billing, entitlements, schema discipline, admin access, service-role boundaries, and shallow feature surfaces.

## 2. System Mental Model

FormaOS has two main product surfaces:

- Public site under `app/(marketing)`.
- Authenticated app under `app/app`, with admin console under `app/admin` and operational APIs under `app/api`.

The public site is mostly statically rendered. It uses shared CTA helpers in `lib/marketing/cta.ts` and pricing definitions in `lib/marketing/pricing.ts`. Foundation is self-serve and routes to `/auth/signup?plan=basic&intent=checkout&source=pricing`. Growth and Enterprise are contact-led. The public contact form writes to `marketing_leads`.

Authentication uses Supabase Auth through `@supabase/ssr`, with server clients in `lib/supabase/server.ts`, browser client in `lib/supabase/client.ts`, and service-role client in `lib/supabase/admin.ts`. The main app layout at `app/app/layout.tsx` calls `fetchSystemState()` from `lib/system-state/server.ts`, which hydrates user, organization, membership, role, subscription, entitlements, and module access into client providers.

Organization tenancy is based primarily on `organizations` and `org_members`. Most RLS policies enforce membership by checking `org_members.user_id = auth.uid()` and matching `organization_id`. Server code often repeats this with explicit membership checks before using service-role operations.

Billing maps public plan names to internal keys:

- Foundation -> `basic`
- Growth -> `pro`
- Enterprise -> `enterprise`

Billing state lives in `org_subscriptions`, `org_entitlements`, `billing_events`, Stripe customer IDs, and plan columns on `organizations`. Checkout is implemented both as a route handler (`app/api/billing/checkout/route.ts`) and as server actions (`app/app/actions/billing.ts`). Stripe webhooks upsert subscription state and sync entitlements.

Evidence is central. Evidence metadata lives in `org_evidence`; files are stored in the private Supabase Storage `evidence` bucket. Evidence can attach to obligations/tasks and a small list of entity types through `app/api/v1/evidence/upload/route.ts`: `incident`, `staff_credential`, and `capa`. Older server action upload code in `app/app/actions/evidence.ts` is stronger on MIME/magic-byte validation but narrower around task evidence.

Audit trail is primarily `org_audit_logs`. Some modules write audit rows directly; CAPA also writes `org_capa_events`. Entity-specific audit panels use `app/api/v1/audit-trail/route.ts`, which expects audit targets shaped like `entityType:entityId`. Older rows without that target shape will not reliably appear in entity panels.

Workflows and automation exist through `app/api/workflows/route.ts`, `lib/automation/workflow-store.ts`, queue helpers, Trigger.dev hooks, and workflow tables, but the exposed UX is degraded or gated. Store functions use the admin client and rely heavily on callers to enforce org scope.

The system's biggest architectural idea is "server-rendered app shell plus hydrated system state plus module pages/actions." That is a good spine. The biggest operational problem is that many modules grew around that spine before authz, entitlements, schema names, and audit semantics were fully normalized.

## 3. Architecture Overview

Framework and runtime:

- Next.js `^16.1.6`, App Router, route handlers, server actions, and React Server Components.
- React `19.2.3`.
- TypeScript `5.9.3`, strict typechecking via `tsconfig.typecheck.json`.
- Tailwind CSS `3.4.17`, local design tokens, `components/ui`, and `lucide-react`.
- Supabase Auth, Postgres, RLS, and Storage.
- Stripe for subscriptions and checkout.
- Resend for email.
- Trigger.dev/queue hooks for async work.
- Sentry, server logging, OpenTelemetry/Langfuse/PostHog hooks where configured.

Important root files:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tsconfig.typecheck.json`
- `.env.example`
- `proxy.ts`
- `app/layout.tsx`
- `app/app/layout.tsx`
- `lib/system-state/server.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`

Data flow pattern:

1. Request enters `proxy.ts`.
2. Proxy applies domain redirects, auth redirects, app/admin CSP nonce, coarse `/api/*` rate limiting, and API session-cookie backstop.
3. Route/page/server action creates a Supabase server client.
4. Authenticated app pages call `fetchSystemState()`.
5. Module pages query Supabase directly or call server actions.
6. Server actions usually validate membership, mutate Supabase, optionally write audit rows, then `revalidatePath`.
7. Storage operations upload to private buckets and store metadata in org-scoped tables.

Server action/API patterns:

- Stronger actions use `requirePermission` from `app/app/actions/rbac.ts`, `requireEntitlement` from `lib/billing/entitlements.ts`, or explicit owner/admin checks.
- Weaker actions use only "is this user an org member?" checks.
- Some APIs use route-local role checks instead of shared guards.
- Service-role code is common for cross-table joins, storage metadata, webhook writes, background jobs, and admin-only operations.

Component patterns:

- Public marketing routes are mostly static page components with shared CTA/pricing helpers.
- Authenticated modules mix server components, client widgets, inline server actions, and shared components.
- The app shell uses a persistent sidebar/topbar and global providers (`components/app-providers.tsx`, `components/app-hydrator.tsx`).

Key architectural strengths:

- The app shell has a coherent system-state hydration model.
- Supabase RLS is the default tenancy backstop.
- Most important mutations are server-side.
- The codebase has operational hooks for logging, rate limiting, queues, webhooks, and storage.
- The module structure is discoverable for a new team.

Key architectural weaknesses:

- There are at least three authorization models: `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, and `lib/authz/permission-engine.ts`.
- `lib/system-state/types.ts` module definitions do not match the real product surface.
- Billing checkout exists in both route-handler and server-action forms.
- Auth signup/bootstrap exists in multiple paths.
- Some modules use `organization_id`; others use `org_id`; some stale code uses the wrong one.
- Schema compatibility fallbacks are now a design pattern, not a temporary bridge.
- Public forms are split between legacy tables and the newer forms platform.
- Many production APIs use service-role access but do not share one standard org-scope guard.

## 4. Public Website Assessment

### Homepage and Product Pages

Routes:

- `/`
- `/product`
- `/features`
- `/features/pillars`
- `/operate`
- `/govern`
- `/prove`
- `/evaluate`

Key files:

- `app/(marketing)/layout.tsx`
- `app/(marketing)/page.tsx`
- `components/marketing/*`
- `lib/marketing/cta.ts`

Purpose: position FormaOS as a compliance operating system and drive demo/contact/signup intent.

CTA flow: shared CTA helpers mostly route to `/contact` or the pricing page. Foundation pricing is the one clear self-serve path.

Solid:

- Static rendering is appropriate for marketing.
- Metadata and JSON-LD are present.
- CTA centralization in `lib/marketing/cta.ts` reduces drift.
- Recent cleanup appears to have removed unsupported trial language.

Weak:

- Some claims imply comprehensive, immutable, cross-module evidence chains. The implementation is real but uneven; audit target formats and evidence entity support are not universal.
- The public narrative is ahead of entitlement enforcement and reporting depth.
- Marketing layout includes inline script for scroll state; acceptable, but it is another CSP exception point.

Risk rating: Medium.

### Pricing

Routes:

- `/pricing`

Key files:

- `app/(marketing)/pricing/page.tsx`
- `components/marketing/PricingPageContent.tsx`
- `lib/marketing/pricing.ts`
- `lib/plans.ts`

CTA flow:

- Foundation -> `/auth/signup?plan=basic&intent=checkout&source=pricing`
- Growth -> `/contact?plan=pro...`
- Enterprise -> `/contact?plan=enterprise...`

Solid:

- Public plan labels are clear.
- Foundation self-serve is constrained to `basic` in the signup page.
- Growth/Enterprise do not expose anonymous payment links.

Weak:

- Internal keys `basic/pro/enterprise` differ from public Foundation/Growth/Enterprise and older code still references starter/pro naming.
- Billing entitlements and system-state module access disagree on what basic/pro include.
- Stripe code still contains hardcoded fallback price IDs.

Risk rating: High because pricing is a trust and revenue path.

### Contact

Routes:

- `/contact`

Key files:

- `app/(marketing)/contact/page.tsx`
- `app/(marketing)/contact/actions.ts`

Purpose: lead capture for demo/sales/security conversations.

Solid:

- Server action has honeypot, rate limit, field length caps, email regex, and source context.
- Leads persist to `marketing_leads`.

Weak:

- Validation is hand-rolled instead of Zod/shared schema.
- Plan/source/context are flattened into a message string rather than structured columns.
- Resend is documented in the stack, but the contact action only inserts a row; no confirmed notification path was visible here.

Risk rating: Low to Medium.

### Trust, Security, Enterprise

Routes:

- `/security`
- `/security-review`
- `/trust/*`
- `/enterprise`
- `/enterprise-proof`

Key files:

- `app/(marketing)/security/*`
- `app/(marketing)/trust/*`
- `app/(marketing)/enterprise/*`

Purpose: procurement confidence, vendor review, security posture, and buyer assurance.

Solid:

- This route group fits the product category.
- Security and trust content is backed by some real operational code: CSP, Sentry, RLS, audit logs, storage policies, health endpoints, and detailed monitoring docs.

Weak:

- Some commitments need legal/security ownership before enterprise selling.
- Sentry source map upload and production alerting are configuration-dependent.
- Distributed rate limiting depends on Upstash credentials; local/in-memory fallback is not production-grade.

Risk rating: Medium to High.

### Industries, Use Cases, Compare Pages

Routes:

- `/industries/*`
- `/use-cases/*`
- `/compare/*`
- `/ndis-providers`
- `/healthcare-compliance`
- `/financial-services-compliance`
- `/childcare-compliance`
- `/construction-compliance`

Purpose: SEO and industry-specific buyer framing.

Solid:

- The app does contain real care operations, staff compliance, incidents, forms, reports, and compliance primitives that support these industry narratives.
- Industry-aware navigation exists in `lib/navigation/industry-sidebar.ts`.

Weak:

- Industry-specific reporting packs and proof exports are not equally deep across industries.
- Staff credential evidence UX and care-plan reporting are not as mature as the industry pages may imply.
- Competitor comparison pages require ongoing legal/fairness review.

Risk rating: Medium.

### Changelog, Roadmap, Case Studies

Routes:

- `/changelog`
- `/roadmap`
- `/case-studies`
- `/customer-stories`
- `/faq`

Purpose: transparency, proof, and buyer education.

Solid:

- Useful for early customer trust.
- Recent app crawler docs appear to support current disabled-action messaging.

Weak:

- Case-study/proof pages can become misleading if not clearly representative.
- Roadmap pages must stay synchronized with disabled/gated product surfaces.

Risk rating: Medium.

## 5. Authenticated App Assessment

### App Shell, Dashboard, Navigation, Onboarding

Routes:

- `/app`
- `/app/dashboard`
- `/app/dashboard/builder`
- `/app/onboarding-roadmap`

Key files:

- `app/app/layout.tsx`
- `components/app-providers.tsx`
- `components/app-hydrator.tsx`
- `components/sidebar.tsx`
- `components/topbar.tsx`
- `lib/system-state/server.ts`
- `lib/system-state/types.ts`
- `lib/navigation/industry-sidebar.ts`

Database:

- `organizations`
- `org_members`
- `org_subscriptions`
- `org_entitlements`
- `org_first_session_progress`
- `org_tasks`

How it works: the app layout fetches system state, repairs workspace state if needed, shows onboarding until organization onboarding is complete, hydrates global client state, and renders persistent sidebar/topbar providers.

Solid:

- Strong central system-state concept.
- App shell gives all modules a consistent auth/org context.
- First-session progress has a real persistence table.
- Sidebar adapts by industry and role.

Incomplete or risky:

- `components/app-hydrator.tsx` writes `formaos_is_founder` into localStorage. It is not an auth boundary, but it leaks a privileged hint to client state.
- `components/topbar.tsx` queries `profiles`, while other code uses `user_profiles`. That is a schema inconsistency.
- Sidebar exposes many modules without checking the stale `MODULE_DEFINITIONS`/entitlements map.
- `/app/settings` "Switch Organization" is a link to settings, not a real org switcher.
- System-state module definitions omit many real modules and set odd requirements, for example `billing` as enterprise-only.

Risk rating: High because this is the app control plane.

### Compliance / Obligations / Controls

Routes:

- `/app/compliance`
- `/app/compliance/frameworks`
- `/app/compliance/cross-map`
- `/app/compliance/soc2`
- `/app/controls*`
- `/app/tasks`

Key files:

- `app/app/actions/compliance-engine.ts`
- `app/app/actions/control-evaluations.ts`
- `app/app/actions/tasks.ts`
- `lib/audit/readiness-calculator.ts`
- `lib/audit-reports/report-builder.ts`

Database:

- `compliance_frameworks`
- `compliance_controls`
- `org_frameworks`
- `org_control_evaluations`
- `org_tasks`
- `org_evidence`
- `control_evidence`
- `control_tasks`

Solid:

- Actual scoring/evaluation/reporting logic exists.
- Tasks and evidence connect into compliance score calculation.
- Some actions enforce permissions and entitlements.

Incomplete or risky:

- `app/app/actions/control-evaluations.ts` accepts `orgId` directly for evaluation and relies on RLS/server client behavior rather than a clear shared org guard.
- Compliance code is highly schema-tolerant, with many fallback paths returning empty arrays or default scores. This makes schema drift less visible.
- Task completion does not consistently enforce approved evidence as a prerequisite.
- Scores can look precise while being derived from sparse or fallback data.

Risk rating: Medium to High.

### Policies

Routes:

- `/app/policies*`

Key files:

- `app/app/actions/policies.ts`

Database:

- `org_policies`
- `org_policy_versions`
- `org_evidence`
- `org_audit_logs`

Solid:

- Create/update/delete/link evidence paths exist.
- Uses `requirePermission("EDIT_CONTROLS")`.
- Evidence linking checks the evidence row belongs to the org.

Incomplete or risky:

- No complete approval/review workflow is implemented.
- Status strings are accepted from form data without a strong enum in the action.
- Versioning is not treated as a first-class immutable approval event in the action reviewed.
- The product promise of governed policy lifecycle is ahead of implementation.

Risk rating: High for compliance credibility.

### Evidence Vault

Routes:

- `/app/vault`
- `/app/vault/review`
- `/app/evidence`
- `/app/evidence/gaps`

Key files:

- `app/app/actions/evidence.ts`
- `app/api/v1/evidence/upload/route.ts`
- `app/app/actions/vault.ts`
- `components/compliance/EntityEvidencePanel.tsx`
- `supabase/migrations/20260425_evidence_workflow_integrity.sql`

Database/storage:

- `org_evidence`
- `control_evidence`
- `evidence` bucket

Solid:

- Private bucket with org-scoped storage policies.
- API upload validates parent records before service-role metadata insert.
- Server action upload has file size, MIME, and magic-byte checks.
- Review flow prevents self-approval and logs evidence verification events.

Incomplete or risky:

- API upload route has weaker file content validation than the server action route.
- Supported entity types are only `incident`, `staff_credential`, `capa`, and obligation/task. Care-plan evidence is not supported by this upload API even though other parts of the product imply broader evidence attachments.
- Legacy upload action comments out storage cleanup on DB insert failure, leaving possible orphaned storage.
- Audit target formats vary; entity panels may not show older rows.

Risk rating: Medium to High.

### Participants / Residents / Patients

Routes:

- `/app/participants*`
- `/app/patients*`

Key files:

- `app/app/actions/care-operations.ts`
- `app/app/participants/page.tsx`

Database:

- `org_patients`
- linked care/visit/incident/evidence tables

Solid:

- Real CRUD and detail linkage exists.
- Org scoping is generally present.

Incomplete or risky:

- Search filters in pages use raw search strings in PostgREST `.or(...)` filters, which can break query syntax.
- Participant list uses broad server queries and in-memory shaping.
- Validation is mostly hand-rolled FormData parsing.

Risk rating: Medium.

### Care Plans

Routes:

- `/app/care-plans*`

Key files:

- `app/app/actions/care-operations.ts`
- `app/app/actions/care-plans.ts`
- `app/app/care-plans/page.tsx`
- `app/app/care-plans/[id]/page.tsx`
- `supabase/migrations/20260208_care_operations_modules.sql`

Database:

- `org_care_plans`
- `org_patients`
- JSONB goals/supports/progress fields

Solid:

- Main pages use real `org_care_plans` data.
- Goals/supports/progress are implemented through JSONB updates.
- Care plans link to participants and care operations.

Incomplete or risky:

- `app/app/actions/care-plans.ts` appears stale or parallel and uses `org_id` where the current schema/page code uses `organization_id`.
- Status taxonomy is inconsistent: code references `review`, `under_review`, `completed`, `expired`, and `archived` in different places.
- JSONB goals/supports are flexible but will become difficult to report, audit, and permission independently.
- Some inline server actions redirect to `/signin`, while the real auth route group is `/auth/*`.

Risk rating: Medium to High.

### CAPA

Routes:

- `/app/capa`
- `/app/capa/new`
- `/app/capa/[id]`

Key files:

- `app/app/capa/actions.ts`
- `supabase/migrations/20260618_capa_lifecycle_workflow.sql`

Database:

- `org_capa_items`
- `org_capa_events`
- `org_evidence`
- `org_audit_logs`

Solid:

- CAPA phase 1 is one of the more complete modules.
- Lifecycle states, owner assignment, root cause, corrective/preventive actions, verification, closure, evidence, CAPA events, and audit logs exist.
- Actions use `fetchSystemState()` and owner/admin checks.

Incomplete or risky:

- No entitlement gating for CAPA despite roadmap intent to gate it.
- Incident source validation exists, but obligation and policy source validation are not symmetrical.
- CAPA metrics and cross-module reporting are still thin.
- Migration filename is future-dated relative to the audit date.

Risk rating: Medium.

### Visits / Service Logs

Routes:

- `/app/visits*`

Key files:

- `app/app/actions/care-operations.ts`

Database:

- `org_visits`
- `org_patients`

Solid:

- Create/update/status actions exist.
- Org-scoped persistence exists.

Incomplete or risky:

- `staff_id` can be submitted from form data without clear validation that the staff user belongs to the same org.
- Role checks are weaker than expected for care operations.

Risk rating: Medium.

### Progress Notes

Routes:

- `/app/progress-notes`

Key files:

- `app/app/actions/progress-notes.ts`
- care operations pages/components

Database:

- `org_progress_notes`

Solid:

- Real persistence exists.
- Fits the care operations model.

Incomplete or risky:

- Needs consistent clinical/care audit semantics: author, sign-off, amendment, and retention should be stronger than generic CRUD.
- Evidence/reporting integration appears lighter than the UI surface suggests.

Risk rating: Medium.

### Incidents

Routes:

- `/app/incidents*`

Key files:

- `app/app/actions/care-operations.ts`
- `app/app/incidents/page.tsx`
- `app/api/incidents/export/*`

Database:

- `org_incidents`
- `org_evidence`
- `org_tasks`
- `org_capa_items`
- `org_audit_logs`

Solid:

- Incident create, list, resolve, evidence, and CAPA source linkage exist.
- Resolving incident logs audit event.
- Follow-up task creation exists.

Incomplete or risky:

- Incident creation does not consistently write a first-class audit event in the reviewed action.
- Incident list queries a limited set and then filters in memory; search can miss older matching incidents.
- Investigation workflow exists but is not as connected as the product story implies.

Risk rating: Medium.

### Staff Compliance

Routes:

- `/app/staff-compliance*`
- `/app/certificates`

Key files:

- `app/app/actions/care-operations.ts`
- `app/app/staff-compliance/page.tsx`
- `app/api/v1/evidence/upload/route.ts`

Database:

- `org_staff_credentials`
- `org_evidence`
- `user_profiles`

Solid:

- Credential CRUD and verification exist.
- Evidence API supports `staff_credential`.
- Page avoids N+1 profile lookup by querying profiles in batch.

Incomplete or risky:

- `createStaffCredential` accepts `user_id` from form data without a clear org-member validation step in the reviewed action.
- `verifyStaffCredential` appears available to any org member, not just admin/compliance roles.
- Staff evidence UI is still not fully proven.

Risk rating: High for regulated workforce proof.

### Team

Routes:

- `/app/team`
- `/app/team/org-chart`

Key files:

- `app/app/actions/team.ts`

Database:

- `org_members`
- `invitations`
- `org_entitlements`

Solid:

- Team invite checks permission, duplicate membership, pending invitations, and team-limit entitlement.
- Email invite path exists.
- Audit logging exists.

Incomplete or risky:

- `removeTeamMember` needs explicit last-owner and self-removal protection if not already enforced elsewhere.
- The permission model used here is not the same as the custom role engine.

Risk rating: Medium.

### Registers

Routes:

- `/app/registers`
- `/app/registers/training`

Key files:

- `app/app/actions/registers.ts`

Database:

- `org_assets`
- `org_risks`
- `org_training_records`

Solid:

- Register abstractions exist and are useful for compliance operations.

Incomplete or risky:

- Appears more schema-tolerant and shallow than core evidence/CAPA.
- Needs clearer ownership, review, and export semantics before enterprise reliance.

Risk rating: Medium.

### Forms

Routes:

- `/app/forms`
- `/app/forms/builder/*`
- `/submit/[formId]`

Key files:

- `lib/forms/form-store.ts`
- `lib/forms/submission-engine.ts`
- `app/submit/[formId]/page.tsx`
- `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql`

Database:

- `org_forms`
- `org_form_submissions`
- legacy-looking `forms`
- legacy-looking `form_responses`

Solid:

- New forms platform has store and submission engine abstractions.
- Builder/publish/submission/export concepts exist.
- RLS migration tries to repair forms schema and policies.

Incomplete or risky:

- Public submit route `app/submit/[formId]/page.tsx` reads from `forms` and writes to `form_responses`, not the newer `org_forms` and `org_form_submissions` used by `lib/forms/*`.
- The forms RLS migration checks `settings->>'requires_auth'`, while app-level field names include camelCase `requireAuthentication`; this can broaden public insert behavior if the expected key is missing.
- Public submit route does not use the main `submitFormResponse` validation engine, rate limits, captcha/honeypot, max-submission logic, or schema controls.
- Form-store search uses raw text inside PostgREST `.or(...)`.

Risk rating: High.

### Reports

Routes:

- `/app/reports*`
- `/api/reports/export`
- `/api/reports/exports/[jobId]/status`

Key files:

- `app/app/actions/reports.ts`
- `app/api/reports/export/route.ts`
- `lib/audit-reports/report-builder.ts`
- `lib/audit-reports/pdf-generator.ts`
- `lib/reports/export-jobs.ts`

Database/storage:

- `report_export_jobs`
- `report-exports` bucket
- `audit-bundles` bucket
- compliance/evidence/task/policy/audit tables

Solid:

- Async report export jobs exist.
- Inline processing, queue fallback, Trigger.dev hook, retries, storage upload, signed URLs, and status route exist.
- Some server actions enforce `EXPORT_REPORTS` and entitlements.

Incomplete or risky:

- `/api/reports/export` checks owner/admin but does not enforce report entitlements in the route handler.
- Report builder uses service role and can generate polished PDFs from thin data.
- Critical gaps and readiness are only as strong as the underlying compliance evaluation coverage.
- Signed URL is stored in `report_export_jobs.file_url`; it expires after one hour, so completed jobs can hold stale URLs unless status regenerates or stores path.

Risk rating: Medium to High.

### Executive View

Routes:

- `/app/executive`
- `/app/executive/group`
- `/api/executive/*`

Key files:

- `lib/executive/*`
- executive route handlers/pages

Database:

- derived from compliance, evidence, CAPA, reports, subscriptions, org tables

Solid:

- Useful product surface for leadership buyers.

Incomplete or risky:

- Executive rollups depend on score/reporting integrity that is still maturing.
- CAPA and group-level metrics need stronger proof before treating this as board-ready.
- Entitlement gating for executive rollup is not part of the current entitlement matrix.

Risk rating: High.

### Settings

Routes:

- `/app/settings*`

Key files:

- `app/app/settings/actions.ts`
- `app/app/settings/security/sso-actions.ts`
- settings route pages
- SSO APIs under `app/api/sso/*`

Database:

- `organizations`
- `organization_sso`
- notification/email/security/retention-related tables

Solid:

- Settings surface is broad.
- Basic organization name update is permission-checked and audited.
- SSO config/test APIs exist and use admin-context helpers.

Incomplete or risky:

- `updateOrgName` lacks length/schema validation.
- SSO/directory/retention surfaces are mostly gated/degraded but look close to complete.
- SSO config routes do not show entitlement gating.
- Settings pages reveal many partially implemented enterprise surfaces.

Risk rating: Medium to High.

### Roles

Routes:

- `/app/settings/roles`
- `/app/settings/roles/new`
- `/app/settings/roles/[roleId]`

Key files:

- `app/app/settings/roles/page.tsx`
- `app/app/settings/roles/new/page.tsx`
- `app/app/settings/roles/[roleId]/page.tsx`
- `lib/authz/permission-engine.ts`
- `app/app/actions/rbac.ts`

Database:

- `custom_roles`
- `team_groups`
- `team_members`
- `org_members`

Solid:

- Role pages exist.
- Custom role create path exists.
- Permission matrix can be displayed.

Incomplete or risky:

- Create role action only checks `fetchSystemState`; it does not explicitly require owner/admin/manage-users.
- Role detail says "Editing not available yet."
- Custom role assignment appears tied to `team_members`, not direct org membership.
- `lib/authz/permission-engine.ts` uses service role and does not scope team memberships by org when collecting `custom_role_id`.
- `app/app/actions/rbac.ts` maps `auditor` to `VIEWER` even though an `AUDITOR` role exists in the type model.

Risk rating: High.

### Workflows / Automation

Routes:

- `/app/workflows*`
- `/api/workflows`

Key files:

- `app/api/workflows/route.ts`
- `lib/automation/workflow-store.ts`

Database:

- workflow definition/execution tables from `20260315_workflow_engine_v2.sql`

Solid:

- Definitions, execution records, queue hooks, and route handlers exist.
- Role check allows owner/admin/compliance officer.

Incomplete or risky:

- No entitlement gating in the route handler.
- `lib/automation/workflow-store.ts` uses admin client and has functions such as `getWorkflowDefinition(id)` and execution update paths that are not org-scoped internally.
- `saveWorkflowDefinition` looks up existing rows by workflow ID alone before insert.
- UI is still degraded/disabled per roadmap docs.

Risk rating: High.

### Audit Trail / Activity

Routes:

- `/app/audit-trail`
- `/app/audit`
- `/app/activity`
- `/api/v1/audit-trail`

Key files:

- `app/api/v1/audit-trail/route.ts`
- `lib/audit/org-audit-log.ts`
- `app/app/actions/audit-events.ts`

Database:

- `org_audit_logs`
- `org_capa_events`

Solid:

- Entity audit route is authenticated, rate-limited, and org-scoped.
- Humanized actions support CAPA and evidence events.
- CAPA has a second event stream.

Incomplete or risky:

- Entity filtering depends on `target` being exactly `entityType:entityId` or suffix-like. Older/simple targets will not appear.
- Route uses `.maybeSingle()` membership by user, which can misbehave for multi-org users.
- Some important creates do not consistently write audit rows.

Risk rating: Medium.

### AI Assistant

Routes:

- `/api/v1/ai/chat`
- `/api/v1/ai/conversations*`
- `/api/v1/ai/usage`
- app shell assistant components

Key files:

- `app/api/v1/ai/chat/route.ts`
- `lib/ai/compliance-context.ts`
- `lib/ai/streaming.ts`
- `lib/ai/usage-meter.ts`
- `lib/ai/prompt-templates.ts`

Database:

- `ai_chat_conversations`
- `ai_chat_messages`
- `ai_usage_log`

Solid:

- AI chat checks config, auth, membership, rate limit, template permissions, conversation ownership, and streams responses.
- System prompt uses real org compliance context.

Incomplete or risky:

- `checkUsageLimit`/`trackUsage` exist but are not called in the reviewed chat route.
- Plan limits use `starter/pro/enterprise` while the rest of the app uses `basic/pro/enterprise`.
- AI context queries evidence `status`, while other evidence code also uses `verification_status`; this may undercount verified evidence.
- If AI persistence tables are missing, the route degrades rather than hard-failing, which can hide migration problems.

Risk rating: Medium to High.

### Theme

Routes:

- global app shell/settings

Key files:

- `app/app/actions/theme.ts`
- `supabase/migrations/20260610_update_theme_preference_values.sql`

Solid:

- Straightforward preference feature.

Incomplete or risky:

- Low business risk. Watch for future-dated migration naming discipline.

Risk rating: Low.

## 6. Auth, Org, Tenancy, and Security Assessment

Auth flow:

- Signup page: `app/auth/signup/page.tsx`.
- OAuth callback: `app/auth/callback/route.ts`.
- Bootstrap/session tracking: `app/api/auth/bootstrap/route.ts`.
- Additional signup API: `app/api/auth/signup/route.ts`.
- Organization creation: `lib/supabase/transaction.ts`, especially `bootstrapOrganizationAtomic`.

What is solid:

- Supabase Auth is consistently used.
- App layout blocks unauthenticated `/app/*`.
- OAuth callback repairs workspace, handles invitations, and initializes compliance graph.
- Bootstrap route rate-limits by user and logs login.
- Service-role client throws in production if missing.

Key risks:

- `app/auth/signup/page.tsx` calls `/api/auth/email-signup`, while `app/api/auth/signup/route.ts` is another confirmed-user creation path. This is confusing and risks drift.
- OAuth state validation in `app/auth/callback/route.ts` is conditional on `provider=google`; the signup page builds redirect URLs with `plan`/`intent`, not necessarily `provider`, so state validation may be skipped depending on Supabase callback params.
- `bootstrapOrganizationAtomic` is not a true transaction. It creates org, legacy org, membership, onboarding, subscription, and welcome email with manual rollback and non-critical subscription creation.
- `bootstrapOrganizationAtomic` creates a 14-day `trialing` subscription even though `TRIAL_ELIGIBLE_PLANS` is empty and pricing copy has moved away from trials.
- `fetchSystemState()` can use admin fallback to repair membership lookup failures. Helpful operationally, but it can mask RLS and schema problems.
- Multi-org handling is inconsistent. Several membership lookups use `.maybeSingle()` by user without a selected organization context.

Org scoping:

- RLS uses `org_members` membership checks.
- Server code generally scopes by `organization_id`.
- Some newer forms/custom roles tables use `org_id`.
- Some stale code uses the wrong column name for the current table.

Service-role usage:

Appropriate in:

- Stripe webhooks.
- Admin console.
- Report export background jobs.
- Storage metadata insert after trusted parent validation.
- Cross-table reads not possible with user RLS.

Risky or needs standardization in:

- Workflow store functions that do not org-scope by default.
- Custom role permission engine team membership lookup.
- Public form split-brain route.
- Report builder generating org reports solely by passed `orgId`.
- Any route where parent validation is route-local and not enforced by a shared guard.

Storage security:

- Evidence bucket policies in `20260425_evidence_workflow_integrity.sql` are strong: private bucket, org ID as first path segment, membership checks.
- Export buckets need the same level of review for signed URL expiry, path structure, and stale URL storage.

Rate limiting:

- `proxy.ts` has in-memory global API rate limiting.
- Many routes use `rateLimitApi` or `checkRateLimit`.
- Production-style distributed rate limiting depends on Upstash env vars.
- In-memory proxy limit is per runtime instance and not sufficient alone in production.

Debug/admin:

- Debug routes use `app/api/debug/_guard.ts`, which returns 404 outside development and requires founder access in development. This is good.
- Admin delegated access exists in `app/app/admin/access.ts`, but `proxy.ts` only allows founder emails for `/admin`, which likely blocks delegated platform admins before server-side access checks run.

## 7. Supabase / Database / Storage Assessment

Migration inventory:

- 116 migration files under `supabase/migrations`.
- Key base migration: `20250101_000_base_schema.sql`.
- Core RLS: `20250312_phase7_core_rls.sql`.
- Billing: `20250317_billing_core.sql`, `20250322_add_price_id_to_org_subscriptions.sql`, `20260612_add_plan_code_to_org_subscriptions.sql`, `20260616_org_subscriptions_plan_key_check.sql`.
- Care: `20260208_care_operations_modules.sql`, `20260402_care_goals.sql`, `20260617_fix_care_plans_rls_update.sql`.
- Forms: `20260402_forms_platform.sql`, `20260426_001_ensure_forms_platform_schema.sql`.
- Evidence: `20260311_evidence_checksum.sql`, `20260425_evidence_entity_polymorphism.sql`, `20260425_evidence_workflow_integrity.sql`, `20260425_fix_org_evidence_rls.sql`.
- Audit: `20250311_phase7_audit_rls.sql`, `20260403_audit_trail_enhanced.sql`, `20260302_unified_audit_view.sql`.
- CAPA: `20260618_capa_lifecycle_workflow.sql`.
- Security/admin: `20260212_223000_enterprise_sso_and_status.sql`, `20260601_security_hardening_v2.sql`, `20260602_fix_missing_rls.sql`, `20260221_admin_control_plane.sql`.

Major table groups:

- Tenancy: `organizations`, `org_members`.
- Billing: `org_subscriptions`, `org_entitlements`, `billing_events`.
- Compliance: `compliance_frameworks`, `compliance_controls`, `org_frameworks`, `org_control_evaluations`, `org_tasks`.
- Evidence: `org_evidence`, `control_evidence`.
- Policies: `org_policies`, `org_policy_versions`.
- Care: `org_patients`, `org_care_plans`, `org_visits`, `org_progress_notes`, `org_incidents`, `org_staff_credentials`.
- CAPA: `org_capa_items`, `org_capa_events`.
- Forms: `org_forms`, `org_form_submissions`, plus legacy-looking `forms`, `form_responses`.
- Audit: `org_audit_logs`.
- Settings/security: `organization_sso`, security/session/auditor/retention-related tables.

RLS:

- Broadly enabled and membership-based.
- Most policies enforce tenancy, not fine-grained permissions.
- Several care and CAPA tables allow all org members broad insert/update/delete unless server-side checks restrict them.
- This is acceptable only if every mutation path uses correct server guards. Current code does not fully meet that bar.

Storage:

- `evidence` bucket is private and path-scoped by org ID.
- Export buckets are used for report/audit/compliance artifacts.
- Signed URL expiry and stored file_url behavior need more discipline.

Evidence model:

- `org_evidence` started as task-based and became polymorphic.
- API supports only a subset of entity types.
- Policy evidence is linked by updating `policy_id`.
- Audit linkage is not uniform.

CAPA model:

- Strong phase 1 table design with lifecycle status, source type/id, event table, and evidence index.
- Needs server-side source validation for all supported source types.
- Needs entitlement enforcement.

Care model:

- Broad care operations tables exist.
- Some important child collections are JSONB inside care plans, which speeds implementation but weakens reporting, auditing, per-item permissions, and relational integrity.
- Stale actions using `org_id` against `org_care_plans` are a concrete schema drift smell.

Forms model:

- New schema uses `org_forms` and `org_form_submissions`.
- Public route uses older `forms` and `form_responses`.
- RLS settings key mismatch around `requires_auth` vs `requireAuthentication` is a real policy risk.

Billing model:

- Subscription and entitlement tables exist.
- Webhook idempotency exists but is implemented too early in the processing lifecycle.
- Plan key checks were added later, showing active cleanup.

Schema drift risks:

- Base migration says core tables were pre-existing outside migration history.
- Many migrations are `IF NOT EXISTS` repair-style migrations.
- Code contains many missing-column/table fallbacks.
- Future-dated migrations make remote status and ordering operationally confusing.

Suggested DB improvements:

- Freeze migration naming discipline immediately.
- Verify remote migration status with Supabase CLI before further schema work.
- Normalize `org_id` vs `organization_id` table conventions.
- Convert high-value JSONB child structures to relational tables where audit/reporting needs are real.
- Add constraints/enums for statuses across care plans, incidents, CAPA, policies, credentials, and tasks.
- Standardize audit target format and backfill older rows.
- Add indexes for high-cardinality entity filters, evidence entity links, audit target lookup, report jobs status/next_run, and forms public slug/status lookups.

## 8. Billing / Stripe / Entitlements Assessment

Pricing model:

- Public Foundation maps to internal `basic`.
- Public Growth maps to internal `pro`.
- Public Enterprise maps to internal `enterprise`.

Key files:

- `lib/plans.ts`
- `lib/marketing/pricing.ts`
- `lib/billing/entitlements.ts`
- `lib/billing/stripe.ts`
- `app/api/billing/checkout/route.ts`
- `app/app/actions/billing.ts`
- `app/api/billing/webhook/route.ts`

Checkout intent:

- Signup page sets `formaos_checkout_intent` cookie for self-serve `basic`.
- Billing page/action can start checkout after org bootstrap.
- Checkout sessions include org and plan metadata.

Webhook assumptions:

- `billing_events` is used for idempotency.
- Subscription webhooks update `org_subscriptions`, organization plan, and entitlements.

Critical webhook risk:

- `app/api/billing/webhook/route.ts` inserts the event into `billing_events` before processing side effects. If processing fails after insert, Stripe retry will hit the duplicate event row and return no-op. This can permanently lose subscription provisioning for that event.

Plan mapping risks:

- `lib/billing/entitlements.ts` uses `basic/pro/enterprise`.
- AI usage limits use `starter/pro/enterprise`.
- Some billing compatibility code maps `basic` to `starter`.
- System-state `PLAN_FEATURES` disagree with billing entitlements.

Entitlement gap:

Current entitlement keys are narrow:

- `audit_export`
- `reports`
- `framework_evaluations`
- `certifications`
- `team_limit`
- `ai_assistant`
- `soc2_certification`

Missing or not consistently enforced:

- `capa_management`
- `custom_reports`
- `form_analytics`
- `workflow_automation`
- `sso_saml`
- `directory_sync`
- `retention_governance`
- `executive_rollup`
- `industry_report_packs`
- `care_operations`
- `staff_compliance`

Other billing risks:

- `lib/billing/stripe.ts` contains hardcoded fallback Stripe price IDs. In production this can point to stale or wrong Stripe resources if env vars are missing.
- Checkout route allows direct plan checkout for configured/fallback enterprise prices, while public motion says Enterprise is sales-led.
- `upsertFromSubscription` has a customer fallback path that finds a subscription row by customer ID but does not assign that row's organization ID to the target org variable.
- Subscription and entitlement cache TTLs can leave app state stale after webhooks unless explicit revalidation is consistent.

## 9. Evidence and Audit Trail Assessment

Supported evidence entity types:

- obligations/tasks
- `incident`
- `staff_credential`
- `capa`
- policy linking through `linkArtifactToPolicy`

Upload/download:

- `app/api/v1/evidence/upload/route.ts` supports multi-file upload, parent validation, private storage upload, DB metadata insert, and storage rollback on insert failure.
- `app/app/actions/evidence.ts` supports stricter file validation for task evidence.
- Vault signed URL helpers handle private download.

Source backlinks:

- CAPA evidence exists.
- Incident and staff credential evidence are accepted by API.
- Care-plan evidence is not supported by the API despite broader product implications.
- Policy evidence is link-based rather than upload-to-policy-based.

Audit events:

- CAPA writes `org_capa_events` and `org_audit_logs`.
- Evidence verification writes audit events.
- Some creates and updates across care operations are lighter.
- Audit panel route filters by target convention.

Gaps:

- No universal entity evidence contract.
- No universal audit event contract.
- No backfill of older audit target formats.
- No uniform file validation across upload paths.
- Orphaned storage cleanup is incomplete in legacy path.

## 10. Workflow Integrity Assessment

### Public CTA -> Signup / Contact / Billing / App

Verdict: works but fragile.

Solid:

- Pricing CTA sets self-serve basic checkout intent.
- Growth/Enterprise route to contact.
- Signup page enforces basic-only self-serve.

Fragile:

- Auth callback state validation may be skipped without provider param.
- Bootstrap creates trialing subscription despite no-trial commercial posture.
- Billing checkout duplicates route/action logic.

### First-Session Onboarding

Verdict: real and mostly solid.

Solid:

- App layout gates onboarding based on org state.
- First-session progress table exists.

Fragile:

- Onboarding semantics must stay aligned with actual modules.
- System-state repair behavior can hide provisioning problems.

### Billing Checkout Intent

Verdict: real but high-risk.

Solid:

- Metadata includes org and plan.
- Existing active/trialing/past_due subscriptions redirect to portal.

Risk:

- Hardcoded price fallbacks.
- Webhook idempotency can lose failed processing.
- Entitlements incomplete.

### Care Plan Lifecycle

Verdict: works but fragile.

Solid:

- Main lifecycle pages and actions exist.

Risk:

- Stale parallel actions use wrong schema column.
- JSONB child data limits audit/reporting.
- Status names drift.

### CAPA Lifecycle

Verdict: one of the strongest flows, with phase 2 gaps.

Solid:

- Lifecycle enforcement, events, audit, evidence, and owner/admin checks.

Risk:

- Missing entitlement.
- Obligation/policy source validation incomplete.
- Metrics/reporting shallow.

### Incident -> Investigation -> Evidence -> Resolve

Verdict: works but incomplete.

Solid:

- Incidents, evidence, resolve action, and CAPA source link exist.

Risk:

- Creation audit is inconsistent.
- Investigation and CAPA handoff are not deep enough for the full product promise.

### Obligation -> Evidence -> Vault -> Audit Trail

Verdict: real but uneven.

Solid:

- Task evidence upload, vault, verification, and audit trail exist.

Risk:

- Audit filtering misses nonstandard targets.
- Task completion does not always require approved evidence.

### Policy Create/Edit/Version

Verdict: shallow for governance.

Solid:

- CRUD and evidence linking exist.

Risk:

- Approval lifecycle is missing.
- Versioning and status semantics need stronger enforcement.

### Forms Builder/Submissions/Export

Verdict: misleading until split-brain is fixed.

Solid:

- New form store and submission engine exist.

Risk:

- Public submit route uses legacy tables and bypasses main engine.
- RLS settings key mismatch can broaden public submissions.

### Evidence Upload/Download/Source Link

Verdict: real and useful, not universal.

Solid:

- Storage and metadata design is good.

Risk:

- Supported entity list is narrow.
- Validation differs by path.

### Staff Credential Verification

Verdict: real but insufficiently governed.

Solid:

- Credentials and verification exist.

Risk:

- User/org validation and verifier role requirements are too weak.

### Dashboard Task Completion

Verdict: real but scoring integrity depends on evidence discipline.

Solid:

- Tasks persist and update.

Risk:

- Completion may overstate compliance if evidence is not required/verified.

### Audit Trail Filtering

Verdict: useful but format-fragile.

Solid:

- Authenticated, rate-limited, org-scoped route exists.

Risk:

- Target format convention is not universally enforced.

### Report/Export Flows

Verdict: operationally real, product-depth mixed.

Solid:

- Async jobs, storage, signed URLs, PDF generation.

Risk:

- Entitlement gap in route.
- Reports can be thin and still look official.

### Settings Save Flows

Verdict: partially real.

Solid:

- Organization name update exists and logs audit.

Risk:

- Many settings surfaces are disabled/gated.
- Enterprise settings lack consistent entitlement checks.

### Role Detail Flows

Verdict: shallow.

Solid:

- Roles can be created and displayed.

Risk:

- Editing disabled.
- Create lacks strong permission guard.
- Custom role engine is not integrated consistently.

### Workflow Creation/Run/Toggle

Verdict: incomplete and risky if exposed.

Solid:

- Route/store exists.

Risk:

- No entitlement gate.
- Store functions rely on caller org checks.
- UI is degraded/plan-gated.

## 11. Product Integrity Assessment

Real features:

- Authenticated app shell.
- Org membership and RLS tenancy.
- Foundation pricing to signup/checkout intent.
- Billing checkout/webhook/portal basics.
- Evidence upload, vault, signed download, and review.
- CAPA phase 1 lifecycle.
- Care participants, care plans, visits, incidents, staff credentials.
- Team invitations.
- Report export jobs.
- Audit trail basics.
- Marketing/contact site.

Shallow features:

- Policy approval/version governance.
- Custom reports.
- Roles/custom permissions.
- Executive rollup.
- Workflow automation.
- Forms public submission.
- SSO/directory/retention settings.
- AI usage limits and plan controls.
- Industry-specific report packs.

Disabled or degraded features:

- Empty AI send controls until prompt exists.
- Workflow creation/templates.
- Custom report builder.
- Form analytics.
- SSO save/test/sync.
- Directory sync.
- Retention dry run/execute/save.

Misleading surfaces:

- Public forms route looks like a working published form but uses legacy tables.
- Role pages imply custom permissions but editing is unavailable and enforcement is inconsistent.
- Reports can look official while drawing from sparse fallback data.
- Executive view may imply board-grade rollups before metrics are complete.
- Public trust copy can imply universal audit/evidence chains not yet present across all modules.

Features to remove, gate, or build:

- Build or hide public form submission until it uses `org_forms` and `org_form_submissions`.
- Gate CAPA, custom reports, workflows, SSO, retention, form analytics, and executive rollup server-side.
- Build policy approval before positioning governance too strongly.
- Hide or clearly label custom role editing until enforcement and editing are real.

## 12. Code Quality Findings

Duplicated logic:

- Billing checkout: `app/api/billing/checkout/route.ts` and `app/app/actions/billing.ts`.
- Auth signup/bootstrap: signup page, `/api/auth/signup`, `/api/auth/email-signup`, OAuth callback, `ensureUserOrganization`, `bootstrapOrganizationAtomic`.
- Permissions: `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, `lib/authz/permission-engine.ts`.
- Rate limiting: proxy-level limiter, `rateLimitApi`, `checkRateLimit`, local bypass helpers.
- Care plan actions: `app/app/actions/care-operations.ts` and stale-looking `app/app/actions/care-plans.ts`.

Dead or stale code candidates:

- `app/app/actions/care-plans.ts` with `org_id` against current `org_care_plans`.
- `lib/bootstrap/ensure-organization.ts`.
- `app/api/auth/signup/route.ts` if `/api/auth/email-signup` is the real signup route.
- Legacy `forms`/`form_responses` public submit path if the new forms platform is canonical.

Naming inconsistencies:

- `basic` vs `starter`.
- Foundation/Growth vs basic/pro.
- `org_id` vs `organization_id`.
- `profiles` vs `user_profiles`.
- `status` vs `verification_status` for evidence.
- `review` vs `under_review` care status.
- `/signin` redirects vs `/auth/signin` route family.

Brittle files:

- `proxy.ts`: many security/routing concerns in one file.
- `lib/system-state/server.ts`: large, central, cache-heavy, repair-heavy.
- `app/auth/callback/route.ts`: too many auth/provisioning/invitation/founder responsibilities.
- `app/api/billing/webhook/route.ts`: high-stakes, broad, idempotency issue.
- `app/app/actions/care-operations.ts`: many modules in one action file with hand-rolled validation.
- `lib/automation/workflow-store.ts`: service-role store with weak internal org scoping.

Risky patterns:

- Service-role functions accepting raw org IDs without shared guard.
- Missing-column/table fallback logic returning empty/default results.
- Raw user search interpolation into PostgREST `.or(...)`.
- Inline server actions inside large pages for complex workflows.
- JSONB child records where relational audit/reporting is needed.

Refactor opportunities:

- One `requireOrgContext` guard for pages/actions/routes.
- One permission engine.
- One entitlement registry.
- One checkout orchestration path.
- One evidence upload service.
- One audit event writer with typed target format.
- One forms submission engine used by public and app routes.

## 13. Security and Compliance Findings

Highest-risk security issues:

1. Incomplete server-side entitlement enforcement across paid modules.
2. Service-role workflow/report/custom-role paths rely on caller discipline.
3. Billing webhook idempotency can permanently skip failed side effects.
4. Forms public submission route bypasses main validation engine and uses old tables.
5. Role/custom permission system is not consistently enforced.
6. Staff credential verification and assignment need stricter role/member validation.
7. Multi-org membership selection is inconsistent.
8. Hardcoded Stripe price fallbacks can create live billing mistakes.
9. RLS policies often provide tenancy only, not permission-level protection.
10. Missing uniform audit events weaken compliance traceability.

Compliance credibility issues:

- Policy lifecycle lacks approval/review.
- Audit trail is not universally typed/backfilled.
- Evidence entity support is incomplete.
- Reports can be thin while appearing formal.
- Staff credential proof flow is not fully governed.
- Retention, SSO, directory sync, and workflow automation are gated/deferred but visible.

Auditability gaps:

- Some create/update actions do not log.
- Target convention is inconsistent.
- JSONB goals/supports lack per-item audit trail.
- Public form submissions are not part of the main forms engine.

## 14. Performance and Reliability Findings

Slow or fragile areas:

- App shell fetches extensive system state and hydrates global providers on every app route.
- Compliance/report builders use multiple broad queries and in-memory aggregation.
- Participants/incidents pages filter after limited queries, which is both incomplete and inefficient.
- AI compliance context queries multiple tables on every chat.
- Report export can process inline unless queue/Trigger.dev is configured.

Query risks:

- Missing pagination on several list views.
- Raw `.or(...)` search strings can break filters.
- Service-role report builders can pull all evidence/tasks for large orgs.
- Audit trail suffix `like` filter on `target` can be expensive without indexes.

Caching/revalidation risks:

- System-state subscription/entitlement cache can be stale after billing changes.
- Report jobs store expiring signed URLs.
- Schema fallback paths can cache empty/default states that hide issues.

Monitoring gaps:

- Sentry source maps require env/CI configuration.
- Upstash must be configured for production rate limiting.
- Synthetic monitoring and k6/ZAP are documented but not proven as always-on.

## 15. Top 25 Issues

| # | Severity | Area | Exact issue | Why it matters | Suggested fix | Files involved |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P0 | Billing | Webhook inserts `billing_events` before side effects complete. | Failed processing becomes a permanent duplicate no-op on Stripe retry. | Track `processing/succeeded/failed`, mark success only after side effects, allow retry of failed events. | `app/api/billing/webhook/route.ts` |
| 2 | P0 | Billing | Hardcoded Stripe fallback price IDs. | Missing env can charge wrong/stale prices. | Remove production fallbacks; fail closed outside local/dev. | `lib/billing/stripe.ts` |
| 3 | P1 | Entitlements | Current entitlement keys omit many paid modules. | Users can see/use features outside commercial plan. | Expand entitlement registry and enforce in server actions/routes. | `lib/billing/entitlements.ts`, `lib/system-state/types.ts` |
| 4 | P1 | Auth/Billing | New orgs get 14-day `trialing` subscriptions despite no-trial plan. | Product, billing, and entitlement states disagree. | Use explicit `pending_checkout`/`free`/`basic` semantics. | `lib/supabase/transaction.ts`, `lib/plans.ts` |
| 5 | P1 | Forms | Public submit route uses `forms`/`form_responses`, not `org_forms`/`org_form_submissions`. | Published forms can bypass real validation and persistence model. | Rebuild `/submit/[formId]` on `submission-engine`. | `app/submit/[formId]/page.tsx`, `lib/forms/submission-engine.ts` |
| 6 | P1 | Forms/RLS | RLS checks `requires_auth`; app settings use `requireAuthentication`. | Public insert policy may be broader than intended. | Normalize settings key and add migration/backfill/test. | `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql`, `lib/forms/*` |
| 7 | P1 | Admin | Middleware blocks `/admin` for non-founder, while server supports delegated admins. | Delegated platform admin feature cannot work. | Align `proxy.ts` with `requireAdminAccess` or remove delegated admin UI. | `proxy.ts`, `app/app/admin/access.ts` |
| 8 | P1 | Authz | Three permission systems disagree. | Inconsistent access decisions and hard-to-review security. | Consolidate into one guard and one permission matrix. | `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, `lib/authz/permission-engine.ts` |
| 9 | P1 | Roles | Custom role creation lacks explicit owner/admin permission guard. | Members may create roles if route accessible. | Require `MANAGE_USERS`/owner/admin server-side. | `app/app/settings/roles/new/page.tsx` |
| 10 | P1 | Workflows | Workflow store functions are not org-scoped internally. | Caller mistakes can leak/corrupt cross-org workflow data. | Require org ID in every store getter/update and assert ownership. | `lib/automation/workflow-store.ts`, `app/api/workflows/route.ts` |
| 11 | P1 | Staff | Credential user IDs are form-supplied without clear org-member validation. | Credentials can attach to wrong users or unverified staff. | Validate target user membership and verifier role. | `app/app/actions/care-operations.ts` |
| 12 | P1 | Staff | Any org member can verify staff credentials in reviewed action. | Weak segregation of duties for regulated workforce proof. | Restrict to admin/compliance roles and audit verifier. | `app/app/actions/care-operations.ts` |
| 13 | P1 | Policies | Approval workflow missing. | Governance promise is incomplete. | Add policy review/approval tables, states, and audit events. | `app/app/actions/policies.ts`, `org_policies` |
| 14 | P1 | Audit | Entity audit route depends on inconsistent target format. | Entity panels can omit real history. | Typed audit target columns or enforced `entityType:entityId` plus backfill. | `app/api/v1/audit-trail/route.ts`, `org_audit_logs` |
| 15 | P1 | Signup | OAuth state validation may be skipped without `provider=google`. | CSRF/state guarantees are weaker than intended. | Validate state whenever state cookie/param exists. | `app/auth/callback/route.ts`, `app/auth/signup/page.tsx` |
| 16 | P1 | Reports | `/api/reports/export` lacks explicit entitlement enforcement. | Paid report access can bypass app action gates. | Call `requireEntitlement` for reports/audit exports. | `app/api/reports/export/route.ts` |
| 17 | P2 | Reports | Completed jobs store one-hour signed URLs. | Completed export links can rot. | Store storage path; generate fresh signed URL on status/download. | `lib/reports/export-jobs.ts` |
| 18 | P2 | Care | Stale `care-plans.ts` uses wrong `org_id` column. | Future callers hit broken path. | Delete or migrate to canonical care actions. | `app/app/actions/care-plans.ts` |
| 19 | P2 | Care | Care-plan goals/supports are JSONB. | Reporting/audit/per-item permissions will be weak. | Move high-value child records to relational tables. | `org_care_plans`, care actions |
| 20 | P2 | Search | Raw search strings in PostgREST `.or(...)`. | Malformed input can break queries. | Escape/sanitize or use safer search RPC. | `app/app/participants/page.tsx`, `lib/forms/form-store.ts` |
| 21 | P2 | Evidence | API upload path has weaker file validation than server action upload. | Malicious or invalid files can be stored. | Centralize file validation and MIME sniffing. | `app/api/v1/evidence/upload/route.ts`, `app/app/actions/evidence.ts` |
| 22 | P2 | Evidence | Legacy upload leaves orphaned storage on DB failure. | Storage cost and audit inconsistency. | Add compensating delete on metadata insert failure. | `app/app/actions/evidence.ts` |
| 23 | P2 | AI | Usage limits exist but are not enforced in chat route. | AI costs can exceed plan expectations. | Call `checkUsageLimit` and `trackUsage` in streaming finish path. | `app/api/v1/ai/chat/route.ts`, `lib/ai/usage-meter.ts` |
| 24 | P2 | Migrations | Future-dated and repair-style migrations. | Remote schema status is hard to trust. | Freeze naming, verify remote status, document manual baselines. | `supabase/migrations/*` |
| 25 | P2 | App Shell | Module definitions do not match real modules. | Navigation/access state misleads users and devs. | Rebuild module registry from real product modules and entitlements. | `lib/system-state/types.ts`, `components/sidebar.tsx` |

## 16. Top 25 Suggested Upgrades

| # | Priority | Upgrade | Why it helps | Primary files/areas |
| --- | --- | --- | --- | --- |
| 1 | P0 | Rework Stripe webhook idempotency into a state machine. | Prevents lost billing side effects. | `app/api/billing/webhook/route.ts` |
| 2 | P0 | Fail closed on missing Stripe price envs in production. | Prevents wrong charges. | `lib/billing/stripe.ts` |
| 3 | P1 | Create one shared `requireOrgContext`/`requireOrgPermission`/`requireOrgEntitlement` guard. | Makes security review possible. | `lib/authz`, `app/app/actions/*`, `app/api/*` |
| 4 | P1 | Expand entitlements and enforce them server-side. | Aligns product packaging with code. | `lib/billing/entitlements.ts`, module actions/routes |
| 5 | P1 | Rebuild public form submission on the canonical forms platform. | Removes split-brain forms behavior. | `app/submit/[formId]/page.tsx`, `lib/forms/*` |
| 6 | P1 | Implement policy approval workflow. | Fills core governance gap. | policies pages/actions/migrations |
| 7 | P1 | Normalize `org_id` vs `organization_id`. | Reduces schema bugs. | migrations, forms, care, roles |
| 8 | P1 | Standardize audit event schema and backfill entity targets. | Makes audit panels trustworthy. | `org_audit_logs`, audit helpers |
| 9 | P1 | Harden staff credential verification. | Improves regulated workforce proof. | care actions, credential pages |
| 10 | P1 | Add true CAPA entitlement and source validation. | Completes CAPA phase 1 governance. | `app/app/capa/actions.ts` |
| 11 | P1 | Collapse duplicate checkout implementations. | Reduces billing drift. | billing route/action |
| 12 | P1 | Replace trialing bootstrap with explicit checkout state. | Aligns product and billing. | org bootstrap/billing |
| 13 | P1 | Align admin middleware and delegated admin access. | Makes platform admin model coherent. | `proxy.ts`, admin access |
| 14 | P2 | Remove stale care-plan action file or port it. | Prevents accidental broken calls. | `app/app/actions/care-plans.ts` |
| 15 | P2 | Move care-plan goals/supports to relational child tables. | Better reporting/audit. | care migrations/actions |
| 16 | P2 | Centralize evidence upload validation. | Consistent file safety. | evidence route/action |
| 17 | P2 | Store export storage paths, not only signed URLs. | Reliable downloads after expiry. | report jobs |
| 18 | P2 | Add pagination and server-side filtering to large lists. | Better scale and correctness. | participants/incidents/audit/vault |
| 19 | P2 | Escape all PostgREST `.or(...)` search strings. | Query safety. | list/search code |
| 20 | P2 | Enforce AI usage limits and plan model. | Controls cost and packaging. | AI routes/meter |
| 21 | P2 | Replace fallback-heavy schema code with explicit migration checks. | Surfaces real drift. | compliance/reports/forms |
| 22 | P2 | Add status enums/check constraints. | Prevents taxonomy drift. | migrations/actions |
| 23 | P2 | Rebuild module registry from real navigation and plan gates. | Accurate UX/access. | system state/sidebar |
| 24 | P3 | Rename public/internal plan concepts in docs and code comments. | Reduces dev confusion. | billing docs/code |
| 25 | P3 | Reduce `console.*` in production paths in favor of structured logging. | Cleaner monitoring. | app/api/app actions/lib |

## 17. Recommended Engineering Roadmap

### Next 7 Days

1. Verify Supabase remote migration state and document manual baselines.
2. Fix Stripe webhook idempotency and remove production price fallbacks.
3. Decide canonical signup path; mark or remove duplicate auth bootstrap paths.
4. Gate CAPA, reports export route, workflows, SSO, retention, custom reports, and form analytics server-side.
5. Fix public form submission to use `org_forms`/`org_form_submissions`, or temporarily disable public submit links.
6. Align admin middleware with delegated admin model.
7. Add last-owner/self-removal guard review for team member removal.

### Next 30 Days

1. Consolidate permission systems into one shared guard.
2. Expand entitlement registry and rebuild module definitions.
3. Implement policy approval/review/version lifecycle.
4. Normalize care-plan status names and remove stale `care-plans.ts`.
5. Harden staff credential verification and evidence UX.
6. Standardize audit targets and backfill old audit rows.
7. Store export paths and regenerate signed URLs on demand.
8. Replace trialing bootstrap with explicit checkout/subscription states.

### Next 90 Days

1. Convert high-value JSONB child records to relational tables.
2. Build real custom reports and industry report packs.
3. Make workflows a fully gated, audited, org-scoped module.
4. Add executive metrics based on verified CAPA/evidence/reporting data.
5. Automate Sentry source maps, synthetic checks, k6, and ZAP staging baseline.
6. Reduce schema fallback paths after two green deploy cycles.
7. Run a service-role boundary audit across every API and background job.

## 18. Brutal Final Verdict

What is genuinely strong:

- The product is not vaporware. CAPA, evidence, care operations, billing, reports, team invites, app shell, and marketing flows have real code and persistence.
- The team has thought about tenancy, RLS, audit logs, private storage, webhooks, and operational monitoring.
- The app has enough implemented surface to support controlled pilots and serious demos.

What is overbuilt:

- The number of modules exceeds the maturity of the entitlement, permission, and schema governance layers.
- The marketing/trust surface is larger than the product's deepest verified workflows.
- There are multiple auth, permission, billing, and workflow abstractions where one boring standard would be safer.

What is shallow:

- Policy approval.
- Custom roles.
- Public forms.
- Custom reports.
- Workflow automation.
- Executive rollups.
- Enterprise SSO/directory/retention actions.
- AI plan/usage controls.

What could break:

- Billing provisioning after a webhook processing error.
- Public form submissions because they are on a split schema path.
- Custom role expectations because creation/display exist but editing/enforcement are incomplete.
- Workflow data isolation if future callers use store functions without org checks.
- Staff credential trust if verification remains too permissive.
- Compliance reports if customers expect auditor-grade depth from thin source data.

What must be fixed before serious customer onboarding:

- Billing webhook idempotency.
- Stripe env fail-closed behavior.
- Server-side entitlement gates.
- Public forms split-brain.
- Permission model consolidation.
- Policy approval workflow.
- Staff credential verification governance.
- Supabase remote migration verification.
- Audit target standardization.
- Production monitoring/rate-limit/Sentry configuration.

Final production confidence: 6.8 out of 10 for controlled onboarding, 5.5 out of 10 for low-touch enterprise scale.

The honest read: FormaOS is a strong early product with unusually broad implemented surface area, but it is carrying the weight of several partially merged eras. The next engineering phase should not add more modules. It should make the existing modules boringly correct: one authz model, one entitlement model, one evidence contract, one audit contract, one billing path, one canonical schema, and a smaller number of features that are unquestionably real.
