# FormaOS Dev Team Handover Audit

Audit date: 2026-04-29
Scope: full project discovery, product/technical status, risks, and next roadmap.
Primary repo: `/Users/ejaz/FormaOS`

## 1. Executive Summary

FormaOS is a multi-tenant compliance operations platform for regulated teams. In plain English: it turns compliance work into operational workflows - obligations, policies, evidence, incidents, care records, staff credentials, reports, and audit trail - instead of leaving teams to rebuild proof from spreadsheets and documents.

Target buyers are regulated operators in NDIS, aged care, healthcare, childcare, construction, financial services, SaaS/technology, public sector, and enterprise risk/compliance teams. The public site positions FormaOS as a "compliance operating system"; the authenticated app is the workspace where teams run daily compliance and care operations.

Overall maturity: **Mostly ready for controlled production, not fully self-running enterprise scale yet.** The app has broad implemented surface area and strong integrity coverage, but the dev team must stabilize ops configuration, entitlement gating, migration discipline, Sentry/source maps, load/security monitoring, and a few high-value deferred modules before scaling heavily.

Production readiness rating: **Mostly ready / 7 out of 10.** Core authenticated workflows are working and broadly tested. Biggest launch risks are external configuration and unfinished governance features, not a single broken app surface.

Local verification on 2026-04-29 confirmed `check-env`, `typecheck`, `lint`, `build`, `check:app-links`, `db:test:verify`, `audit:marketing-copy`, and the Chromium smoke/app-link route suite. `test:supabase-health` skipped because the shell environment did not expose `NEXT_PUBLIC_SUPABASE_URL`, while `db:test:verify` loaded enough local configuration to verify the Supabase project host `bvfniosswcvuyfaaicze.supabase.co`.

## 2. Architecture And Stack

Core stack:

| Area | Current implementation |
| --- | --- |
| Framework | Next.js declared as `^16.1.6` in `package.json`, resolved locally to `16.2.4` in `package-lock.json`; App Router, React Server Components and route handlers |
| React | `react` / `react-dom` `19.2.3` |
| Language | TypeScript `5.9.3`, strict typecheck via `tsconfig.typecheck.json` |
| Styling | Tailwind CSS `3.4.17`, local design tokens, `components/ui`, `lucide-react` icons |
| Auth | Supabase Auth via `@supabase/ssr`; Google OAuth, email/password, password reset |
| Database | Supabase Postgres with RLS migrations in `supabase/migrations` |
| Storage | Supabase Storage buckets: `evidence`, `audit-bundles`, `compliance-exports`, `report-exports`, `enterprise-exports`, `user-avatars` |
| Billing | Stripe subscriptions, Checkout, portal, webhook, reconciliation |
| Email/contact | Resend plus Supabase auth email flows; marketing leads in `marketing_leads` |
| Background jobs | Trigger.dev SDK plus `/api/cron/*` and internal trigger routes |
| Monitoring | Sentry SDK, Pino-style logging, OpenTelemetry/Langfuse hooks, PostHog optional |
| Testing | Jest, Playwright, Axe, Lighthouse, k6, Supabase verify scripts, ZAP docs |
| Deployment | Vercel, region `syd1`, domains documented as `www.formaos.com.au`, `app.formaos.com.au`, apex |

Key files:

- App shell: `app/app/layout.tsx`
- Middleware/proxy/rate limiting/CSP: `proxy.ts`
- Supabase clients: `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- System state and entitlements hydration: `lib/system-state/server.ts`
- Roles: `lib/roles.ts`, `app/app/actions/rbac.ts`
- Plans: `lib/plans.ts`, `lib/billing/entitlements.ts`, `lib/billing/stripe.ts`
- Marketing CTA/pricing: `lib/marketing/cta.ts`, `lib/marketing/pricing.ts`

Important commands from `package.json`:

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run check:app-links
npm run db:test:verify
npm run test:e2e:smoke
npm run test:e2e:app-actions
npm run test:e2e:exports
npm run test:e2e:deep
npm run test:e2e:onboarding
npm run test:e2e:billing
npm run test:a11y
npm run test:lighthouse:public
npm run load:public:docker
```

## 3. Repo Structure Map

| Path | Purpose | Key files | Ownership/risk |
| --- | --- | --- | --- |
| `app/(marketing)` | Public website, SEO, pricing, industries, trust pages | `page.tsx`, `pricing/page.tsx`, `contact/actions.ts`, industry pages | Marketing claims must stay aligned with real product; many routes, easy to drift |
| `app/app` | Authenticated product app | `layout.tsx`, module pages, `actions/*.ts`, `capa/actions.ts` | Core user workflows; protect org isolation and server checks |
| `app/api` | Public/internal API routes | `/api/v1/*`, billing, auth, admin, cron, SSO, SCIM | Must validate auth, org scope, rate limits, service-role usage |
| `app/admin` | Platform admin console | dashboard, orgs, billing, health, releases, support | High-risk privileged surface; reason/CSRF/audit required |
| `components` | Shared UI and domain components | `billing`, `compliance`, `evidence`, `forms`, `marketing`, `settings`, `ui` | Large shared surface; visual regressions can spread |
| `lib` | Domain services and server helpers | `billing`, `security`, `forms`, `evidence`, `sso`, `reports`, `care` | Business logic; prefer local helpers over ad hoc API code |
| `supabase/migrations` | Database/schema/RLS/storage history | 116 SQL files; latest include `20260618_capa_lifecycle_workflow.sql` | History drift risk; future-dated filenames relative to this audit date |
| `e2e` | Playwright flows | `full-app-action-crawler.spec.ts`, `capa-flow.spec.ts`, `billing-handoff.spec.ts` | Main confidence layer; depends on seeded Supabase state |
| `__tests__`, `tests` | Jest/unit/integration/security/compliance | 327 `__tests__` files, 57 `tests` files | Broad unit coverage, but quality depends on env mocks |
| `docs` | Current operational docs | testing, monitoring, disabled actions, integration audits | Strong source for handover; keep current after roadmap work |
| `scripts` | QA/env/db/link checks | `check-env.js`, `app-link-integrity-audit.mjs`, `check-db-test-verify.mjs` | CI critical; do not bypass when shipping |
| `.github/workflows` | CI and quality gates | `formaos-quality-gates.yml`, `security-scan.yml`, `qa-pipeline.yml` | Secret naming/setup still needs ops cleanup |

## 4. Public Website Audit

Public routes found: 70 marketing page routes under `app/(marketing)`; the broader marketing surface contains 92 route/metadata entry files when route handlers and OG/twitter/sitemap files are included.

| Route group | Purpose and key files | CTA flow | State |
| --- | --- | --- | --- |
| `/` | Homepage via `app/(marketing)/page.tsx`, `HomeProofStaticShell`, homepage sections | Contact/demo/plan CTAs through `lib/marketing/cta.ts` | Production-ready; keep claims proof-backed |
| `/pricing` | Plan packaging via `pricing/page.tsx`, `PricingPageContent.tsx`, `lib/marketing/pricing.ts` | Foundation -> `/auth/signup?plan=basic&intent=checkout`; Growth/Enterprise -> `/contact` | Mostly ready; external Stripe prices/webhooks must be correct |
| `/contact` | Lead capture via `contact/page.tsx`, `contact/actions.ts`, `marketing_leads` | Form redirects with success/error query state | Ready; depends on Supabase/Resend |
| `/product`, `/features`, `/features/pillars` | Product overview and feature narrative | Demo/contact CTAs | Ready, but copy must avoid roadmap claims |
| `/industries` and industry pages | NDIS, healthcare, financial services, childcare, construction | Industry CTA component to compliance plan/demo | Mostly ready; social proof copy must remain representative |
| `/ndis-providers`, `/healthcare-compliance`, `/financial-services-compliance`, `/childcare-compliance`, `/construction-compliance` | SEO industry landing pages with OG images on key pages | `IndustryCTA` and `compliancePlanHref` | Mostly ready; repeated proof blocks were softened in prior cleanup |
| `/enterprise`, `/enterprise-proof`, `/security`, `/security-review`, `/trust/*` | Procurement, security, trust, vendor assurance, DPA, SLA | Security review/contact/trust packet CTAs | Mostly ready; legal/security commitments need owner review |
| `/case-studies`, `/customer-stories`, `/changelog`, `/roadmap`, `/faq` | Buyer proof, release transparency, FAQs | Proof walkthrough/contact CTAs | Ready as representative content; not all case studies are customer-validated |
| `/compare/*` | Competitor comparison pages: Vanta, Drata, Secureframe, 6clicks, CompliSpace, RiskWare, AuditBoard, Hyperproof | Comparison -> contact/demo | Mostly ready; review for fair, supportable claims |
| `/use-cases/*`, `/evaluate`, `/prove`, `/operate`, `/govern` | Outcome-oriented content paths | Contact/demo CTAs | Ready; keep connected to implemented modules |

Recent cleanup to preserve: `memory/2026-04-21.md` records removal of public free-trial/no-credit-card/self-serve signals and softening of proof/product/ROI/failure sections after screenshot feedback. `docs/disabled-actions-roadmap.md` records removal of unsupported report placeholder export CTAs. Do not reintroduce repetitive proof blocks or unsupported "export coming soon" buttons.

SEO/metadata: many major routes define metadata and OG images (`pricing/opengraph-image.tsx`, industry OG files, `trust/opengraph-image.tsx`). App link integrity recently passed 306 links per `docs/full-app-action-crawler-report.md`.

## 5. Authenticated App Module Status

The app action crawler covers 21 modules, 81 routes, 368 visible actions: 274 pass, 94 truthful disabled, 0 failing. Source: `docs/app-action-inventory.md` and `docs/full-app-action-crawler-report.md`.

| Module | Routes | Implemented functionality | Key code/data | Readiness |
| --- | --- | --- | --- | --- |
| Dashboard | `/app`, `/app/dashboard`, `/app/dashboard/builder`, `/app/onboarding-roadmap` | Summary cards, task links, onboarding/first-session strips, AI/help widgets | `app/app/layout.tsx`, `lib/system-state/server.ts`, `org_first_session_progress`, `org_tasks` | Mostly ready |
| Compliance / Obligations | `/app/compliance`, `/app/compliance/frameworks`, `/app/compliance/cross-map`, `/app/compliance/soc2`, `/app/controls*` | Frameworks, controls, compliance scoring, SOC2 dashboard, cross-map | `app/app/actions/compliance-engine.ts`, `control_evidence`, `control_tasks`, `org_control_evaluations` | Mostly ready |
| Policies | `/app/policies*` | Create/edit/version list, link evidence to policy, audit logging | `app/app/actions/policies.ts`, `org_policies`, `org_policy_versions`, `org_evidence.policy_id` | Partial: approval workflow missing |
| Evidence Vault | `/app/vault`, `/app/vault/review`, `/app/evidence`, `/app/evidence/gaps` | Upload/download, review, gaps, freshness, signed URLs | `app/api/v1/evidence/upload/route.ts`, `app/app/actions/vault.ts`, `org_evidence`, bucket `evidence` | Mostly ready |
| Participants / Residents | `/app/participants*`, `/app/patients*` | CRUD, risk/profile data, linked care plans, visits, incidents, evidence | `app/app/actions/care-operations.ts`, `org_patients` | Mostly ready |
| Care Plans | `/app/care-plans*` | Create plan, goals, supports, status transitions, progress sync | `app/app/actions/care-operations.ts`, `app/app/actions/care-plans.ts`, `org_care_plans` | Mostly ready |
| CAPA | `/app/capa`, `/app/capa/new`, `/app/capa/[id]` | Phase 1 lifecycle, owner/status/root cause/actions/verification/closure, incident link, evidence, audit panel | `app/app/capa/actions.ts`, `20260618_capa_lifecycle_workflow.sql`, `org_capa_items`, `org_capa_events` | Mostly ready; phase 2 links/metrics pending |
| Visits / Service Logs | `/app/visits*` | Create visits, scheduled/completed/cancelled/missed status | `createVisit`, `updateVisitStatus`, `org_visits` | Mostly ready |
| Progress Notes | `/app/progress-notes` | Create/sign off progress notes | `app/app/actions/progress-notes.ts`, `org_progress_notes` | Mostly ready |
| Incidents | `/app/incidents*` | Report, export, investigation route, resolve, CAPA source link | `app/app/actions/care-operations.ts`, `app/api/incidents/export`, `org_incidents` | Mostly ready |
| Staff Compliance | `/app/staff-compliance*`, `/app/certificates` | Credential CRUD, verify, export, expiry alerts | `createStaffCredential`, `verifyStaffCredential`, `org_staff_credentials` | Partial: credential evidence UI status needs follow-up |
| Team | `/app/team`, `/app/team/org-chart` | Invite/remove members, org chart | `app/app/actions/team.ts`, `org_members`, invitations | Mostly ready |
| Registers | `/app/registers`, `/app/registers/training` | Asset/risk/training registers with schema fallback | `app/app/actions/registers.ts`, `org_assets`, `org_risks`, `org_training_records` | Partial |
| Forms | `/app/forms`, `/app/forms/builder/*`, `/submit/[formId]` | Form builder, publish, submissions, export, templates | `lib/forms/form-store.ts`, `lib/forms/submission-engine.ts`, `org_forms`, `org_form_submissions` | Mostly ready; analytics deferred |
| Reports | `/app/reports*` | Standard report exports, trends, custom report routes | `app/app/actions/reports.ts`, `app/api/reports/export`, `report-exports` | Partial: custom report builder schema gated |
| Executive View | `/app/executive`, `/app/executive/group` | Posture, framework, forecast, board-level summaries | `app/api/executive/*`, `lib/executive/*` | Partial; CAPA metrics/group rollup need more proof |
| Settings | `/app/settings*` | Org, security, notification, integrations, retention, auditor access, email prefs/history, AI | `app/app/settings/actions.ts`, `organization_sso`, settings tables | Partial; SSO/directory/retention actions mostly gated |
| Roles | `/app/settings/roles*` | Role list/create/detail | permission matrix migrations, `app/app/actions/rbac.ts` | Partial; enforce every new role-sensitive mutation |
| Billing | `/app/billing` | Current plan, checkout, portal, autoCheckout from pricing | `app/app/actions/billing.ts`, `components/billing/BillingActionButtons.tsx`, Stripe webhook | Mostly ready with config dependencies |
| Workflows / Automation | `/app/workflows*` | Degraded UI, definitions/executions APIs, templates | `20260315_workflow_engine_v2.sql`, `lib/automation/*` | Partial/plan-gated |
| Audit Trail / Activity | `/app/audit-trail`, `/app/audit`, `/app/activity`, `/api/v1/audit-trail` | Entity filtering, export, activity feed | `org_audit_logs`, `lib/audit/*` | Mostly ready; historical target format can limit filtering |
| AI Assistant | Global app shell and `/api/v1/ai/*` | Chat/conversations/usage, OpenAI optional, Langfuse hooks | `components/ai-assistant`, `lib/ai`, `20260315_ai_chat_tables.sql` | Partial; depends on `OPENAI_API_KEY` and usage controls |
| Theme | Global/settings | Theme preference and values | `app/app/actions/theme.ts`, `20260610_update_theme_preference_values.sql` | Ready |

## 6. Major Workflows

| Workflow | Entry point and steps | Persistence | Tests/confidence | Gaps |
| --- | --- | --- | --- | --- |
| Public pricing -> signup -> billing | `/pricing` Foundation CTA -> `/auth/signup?plan=basic&intent=checkout` -> org bootstrap -> `/app/billing?autoCheckout=basic` -> Stripe Checkout | `organizations`, `org_members`, `org_subscriptions`, `billing_events` | `e2e/billing-handoff.spec.ts`, `e2e/self-serve-handshake.spec.ts`; medium-high | Requires live Stripe price IDs/webhook secrets and manual production smoke |
| First-session onboarding | `/app` after onboarding complete -> five care ops steps via `OnboardingProvider` | `org_first_session_progress` | onboarding specs; medium | Keep step semantics stable when modules change |
| Care plan -> goals/support -> progress | `/app/care-plans/new` -> detail -> goals/supports -> progress sync | `org_care_plans` JSON/goal/support fields, progress | `e2e/care-plans-workflow.spec.ts`, `e2e/care-plans.spec.ts`; high | Reporting rollups need maturity |
| CAPA lifecycle | `/app/capa/new` or incident source -> assign -> investigate -> actions -> verification -> close -> evidence | `org_capa_items`, `org_capa_events`, `org_evidence`, `org_audit_logs` | `e2e/capa-flow.spec.ts` passes; high for phase 1 | Phase 2: obligation/policy/investigation links, metrics, entitlements |
| Incident -> investigation -> evidence -> resolve | `/app/incidents/new` -> detail/investigation -> attach evidence -> resolve/CAPA | `org_incidents`, `org_evidence`, audit logs | `e2e/incident-investigation.spec.ts`, export crawler; medium-high | CAPA handoff beyond incident source needs refinement |
| Obligation -> evidence -> vault -> audit trail | `/app/tasks` or `/app/compliance` -> upload evidence -> vault/review -> audit panel | `org_tasks`, `org_evidence`, bucket `evidence`, `org_audit_logs` | `e2e/evidence-management.spec.ts`, `e2e/vault-operations.spec.ts`; high | Historical audit rows without `entityType:entityId` target may be harder to filter |
| Forms builder -> submissions -> export | `/app/forms/builder/new` -> publish -> `/submit/[formId]` -> submissions/export | `org_forms`, `org_form_submissions` | `e2e/form-builder-crud.spec.ts`, export suite; high | Analytics CTA is deferred |
| Policy create/edit/version | `/app/policies/new`, edit, versions | `org_policies`, versions, audit logs | crawler covers routes; medium | Approval/review workflow missing |
| Staff credential verification | `/app/staff-compliance/new` -> detail -> verify/export | `org_staff_credentials` | staff export/action crawler; medium | Evidence attachment UX not fully settled |
| Dashboard task completion | `/app/tasks` -> status update/complete -> compliance summary updates | `org_tasks`, `org_evidence` | `e2e/task-flow.spec.ts`, `task-lifecycle.spec.ts`; medium | Derived dashboard metrics need continued validation |
| Report export | `/app/reports` -> `/api/reports/export` | report artifacts, `report-exports` bucket | `e2e/export-integrity.spec.ts`; high | Custom reports and scheduling partial |
| App action crawler | `e2e/full-app-action-crawler.spec.ts` | no product persistence beyond safe test actions | 0 failures latest report | Destructive flows are not executed by design |

## 7. Database / Supabase Audit

There are 116 migration files in `supabase/migrations`. Important groups:

- Base/org/tasks/evidence/policies: `20250101_000_base_schema.sql`, `20250312_phase7_core_rls.sql`
- Frameworks/controls/compliance: `20250309_phase4_framework_intelligence.sql`, `20260407_framework_engine_foundation.sql`, `20260408_framework_engine_phase2.sql`
- Billing: `20250317_billing_core.sql`, `20250322_add_price_id_to_org_subscriptions.sql`, `20260612_add_plan_code_to_org_subscriptions.sql`, `20260616_org_subscriptions_plan_key_check.sql`
- Care operations: `20250320_patients_progress_notes.sql`, `20260208_care_operations_modules.sql`, `20260402_care_goals.sql`, `20260617_fix_care_plans_rls_update.sql`
- Forms: `20260402_forms_platform.sql`, `20260426_001_ensure_forms_platform_schema.sql`
- Evidence: `20260311_evidence_checksum.sql`, `20260425_evidence_entity_polymorphism.sql`, `20260425_evidence_workflow_integrity.sql`, `20260425_fix_org_evidence_rls.sql`
- Audit: `20250311_phase7_audit_rls.sql`, `20260403_audit_trail_enhanced.sql`, `20260302_unified_audit_view.sql`
- SSO/security: `20260212_223000_enterprise_sso_and_status.sql`, `20260426_002_ensure_organization_sso_schema.sql`, `20260601_security_hardening_v2.sql`, `20260602_fix_missing_rls.sql`
- CAPA: `20260618_capa_lifecycle_workflow.sql`
- Admin/control plane: `20260221_admin_control_plane.sql`, `20260301_admin_console.sql`, `20260314_admin_operating_model.sql`

Core tables requested:

| Table | Purpose and notes |
| --- | --- |
| `organizations`, `org_members` | Tenant and membership model. Most queries join/filter by `organization_id`; role stored on membership. |
| `org_subscriptions`, `org_entitlements`, `billing_events` | Billing state, plan keys, feature access, Stripe webhook idempotency. |
| `org_forms`, `org_form_submissions` | Form builder/submission platform; ensure migration adds schema-compatible RLS. |
| `org_evidence` | Central evidence metadata; polymorphic `entity_type/entity_id`, task link, file metadata, freshness/checksum columns. |
| `org_care_plans` | Care plans with goals/supports/progress fields and RLS update fix. |
| `org_capa_items`, `org_capa_events` | CAPA phase 1 lifecycle and event trail. |
| `org_first_session_progress` | First-session onboarding progress. |
| `org_audit_logs` | Main activity/audit feed, used by entity audit trail and exports. |
| `organization_sso` | SAML/directory configuration with RLS/service-role policy. |
| `org_staff_credentials` | Credential/compliance records; evidence linkage supported by upload API for `staff_credential`. |

RLS pattern: most org-scoped policies use `exists(select 1 from org_members where user_id = auth.uid() and organization_id = row.organization_id)`. Server routes also apply explicit org checks before mutations. The evidence upload route verifies parent org membership, then uses the admin client for DB insert after trusted validation.

Storage path pattern:

- Evidence: `evidence` bucket, private, path `orgId/obligations/{taskId}/{uuid.ext}` or `orgId/{entityType}/{entityId}/{uuid.ext}`.
- Exports: usually `{orgId}/{date}/{fileName}` in report/compliance/audit export buckets.

Known schema drift history:

- Several routes have schema-tolerant fallbacks for absent tables/columns.
- Forms schema was manually applied and probed on 2026-04-26 (`docs/app-integrity-audit.md`).
- Production monitoring docs say Supabase CLI was not authenticated/linked when last checked; remote migration status must be manually verified.
- Migration filenames include June 2026 dates even though this audit date is 2026-04-29. That can be operationally confusing and should be documented before the next migration train.

Required verification:

```bash
npx supabase login
npx supabase link --project-ref bvfniosswcvuyfaaicze
npx supabase migration list
npm run db:test:verify
npm run test:supabase-health
```

Recommended DB cleanup: freeze migration naming discipline, confirm remote migration order, remove obsolete compatibility fallbacks only after two green deploys, add explicit tests for `org_capa_*`, `organization_sso`, forms, evidence polymorphism, and subscription plan-key checks.

## 8. Auth / Tenancy / Security Audit

Strong areas:

- App layout gates `/app/*` through Supabase user and `fetchSystemState`.
- `fetchSystemState` is the main source of truth for user, org, role, subscription, entitlements.
- Server actions commonly re-check user and membership; high-risk APIs use Zod and `rateLimitApi`.
- Password validation requires 12+ chars and checks breach/strength paths.
- Middleware applies global `/api/*` rate limiting and CSP nonce handling.
- Session tracking exists in `app/api/auth/bootstrap/route.ts` and `lib/security/session-security.ts`.
- RLS is enabled broadly across org-scoped tables and storage buckets.

Partial/risky areas:

- Some app actions use local membership lookups instead of the newer shared permission helper; keep tightening toward `requirePermission`.
- Service-role usage is necessary in trusted boundaries, but every use must be parent-record/org-validated first.
- Upstash Redis is required for production-style distributed rate limiting; local fallback warnings are acceptable locally, not production.
- SSO/directory sync routes exist but product actions are still mostly disabled/gated.
- Debug routes exist under `/api/debug/*`; ensure production access remains locked down.
- Entitlements are not yet consistently enforced across all paid modules.

Recommended security tasks:

1. Audit every service-role route for explicit org and parent-record validation.
2. Make `check:security-baseline` required in CI.
3. Configure Sentry source maps and production alerts.
4. Set Upstash credentials in Vercel/GitHub.
5. Add ZAP staging baseline to release checklist, not production active scans.

## 9. Billing / Stripe Audit

Public commercial model:

- Foundation: internal `basic`, $297/month, self-serve Checkout.
- Growth: internal `pro`, from $1,800/month, sales-led/contact.
- Enterprise: internal `enterprise`, custom/procurement-led.

Key files:

- `lib/plans.ts`
- `lib/marketing/pricing.ts`
- `lib/billing/checkout-intent.ts`
- `app/auth/signup/page.tsx`
- `app/app/actions/billing.ts`
- `components/billing/BillingActionButtons.tsx`
- `app/api/billing/checkout/route.ts`
- `app/api/billing/webhook/route.ts`
- `docs/billing-migration-plan.md`

Working behavior:

- Foundation pricing CTA sets `formaos_checkout_intent` for 30 minutes and only accepts self-serve `basic`.
- Checkout sessions include `organization_id` and `plan_key` metadata.
- Webhook verifies Stripe signature, persists `billing_events` for idempotency, upserts subscription, updates organization plan, syncs entitlements.
- Existing active/trialing/past_due subscriptions are redirected to the Stripe portal instead of duplicate checkout.
- Nightly reconciliation exists in `lib/billing/nightly-reconciliation.ts`.

Risks:

- Live success depends on `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and correct `STRIPE_PRICE_FOUNDATION/GROWTH/ENTERPRISE`.
- Internal keys remain `basic/pro/enterprise`; do not rename casually.
- Legacy env names (`STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, starter/pro aliases) are documented for cleanup but should not be relied on.
- Growth/Enterprise public Payment Links must not be exposed anonymously because provisioning requires `organization_id`.

## 10. Evidence And Audit Trail

Supported evidence entity types in upload API: obligations/tasks, `incident`, `staff_credential`, `capa`. Unknown entity types are refused. Policy evidence is supported by linking an existing `org_evidence` row to `policy_id` through `linkArtifactToPolicy`.

Evidence persistence:

- Upload route: `app/api/v1/evidence/upload/route.ts`
- Legacy/server action: `app/app/actions/evidence.ts`
- Vault signed URL: `app/app/actions/vault.ts`
- Evidence metadata: `org_evidence`
- Storage bucket: `evidence`, private, RLS via `20260425_evidence_workflow_integrity.sql`

Audit trail:

- Audit insert helper: `app/app/actions/audit-events.ts`, `lib/audit/org-audit-log.ts`
- Entity feed route: `app/api/v1/audit-trail/route.ts`
- UI panels: `components/compliance/EntityEvidencePanel.tsx`, CAPA detail `AuditTrailPanel`
- CAPA writes both `org_capa_events` and `org_audit_logs`

Known limitations:

- The audit trail route filters `org_audit_logs.target` as `entityType:entityId` or suffix. Older rows without that format may not show under entity-specific panels.
- Evidence upload does not yet support all possible entities; care plan evidence is listed as component-supported but upload API currently explicitly validates incident/staff credential/CAPA/obligation.
- Staff credential evidence is supported at API validation level but needs clearer UI/flow proof.

## 11. Testing Audit

Current test inventory:

- `__tests__`: 327 test/spec files, 328 files total
- `tests`: 36 test/spec files, 66 files total
- `e2e`: 72 spec files, 77 files total
- `load-tests`: 4 k6 scripts

Key suites:

| Suite | Command | Covers | Required before deploy? |
| --- | --- | --- | --- |
| Type/lint/build | `npm run typecheck`, `npm run lint`, `npm run build` | Compile, lint, production build | Yes |
| App links | `npm run check:app-links` | App route/action/link integrity | Yes for route/doc link changes |
| DB verify | `npm run db:test:verify` | Supabase schema/RLS/storage expectations | Yes before deploy |
| Smoke | `npm run test:e2e:smoke` | Core app load and links | Yes |
| App actions | `npm run test:e2e:app-actions` | Visible safe actions | Yes |
| Exports | `npm run test:e2e:exports` | Export/download non-empty files | Yes |
| Deep/system | `npm run test:e2e:deep` | Deep workflow and integration | Pre-deploy |
| Onboarding | `npm run test:e2e:onboarding` | Signup/onboarding loops | Pre-deploy if onboarding/auth changed |
| Billing | `npm run test:e2e:billing` | Billing handoff | Pre-deploy if billing changed |
| CAPA | `npx playwright test e2e/capa-flow.spec.ts --project=chromium --reporter=list` | CAPA lifecycle and evidence | Required for CAPA changes |
| Accessibility | `npm run test:a11y` | Axe app/public checks | Pre-deploy |
| Lighthouse | `npm run test:lighthouse:public` | Public perf/a11y/SEO | Pre-deploy for marketing |
| Load | `npm run load:*` or Docker variants | k6 public/app/export/evidence load | Nightly/manual/staging |
| ZAP | docs command in `docs/security/zap-scan.md` | Staging baseline security | Weekly/manual |

Recommended testing matrix:

- Pre-commit: `npm run typecheck`, targeted unit/spec for touched area.
- Pre-PR: typecheck, lint, build, `check:app-links`, relevant E2E.
- Pre-deploy: fast PR gate from `docs/testing/README.md`.
- Nightly: full Playwright regression, accessibility, k6 public, ZAP staging.
- Weekly/manual: Supabase remote migration check, Stripe webhook drill, Lighthouse public baseline, Sentry review.

## 12. Deployment / Ops Audit

Configured/documented:

- Vercel project linked; `vercel.json` uses region `syd1`, cron `/api/cron/compliance-check` daily at 06:00, webhook/callback/onboarding max durations.
- Production domains documented as `www.formaos.com.au`, `app.formaos.com.au`, `formaos.com.au`.
- Health endpoint: `/api/health`; protected detailed endpoint `/api/health/detailed`.
- Monitoring docs exist: `docs/operations/production-monitoring-setup.md`, `docs/monitoring/sentry.md`, `docs/monitoring/synthetic-checks.md`.
- Sentry config files exist and PII scrubbing is documented.
- GitHub workflows exist for quality, security, accessibility, performance, visual, load.

Manual/remaining:

- Supabase CLI remote migration status was not checked until an operator logs in/links.
- Sentry CLI/source map upload requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- k6 was not installed locally in prior ops review; Docker runner is available.
- Synthetic monitoring needs external service setup.
- GitHub secrets are incomplete/renamed in docs: add current `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe, Sentry, Upstash, `STAGING_BASE_URL`.

## 13. Disabled / Deferred Features

From `docs/disabled-actions-roadmap.md` after CAPA and cleanup:

- Total visible actions crawled: 368
- Passing actions: 274
- Disabled truthful actions: 94
- Failed actions: 0
- KEEP_DISABLED: 85
- PLAN_GATE: 9
- REMOVE: 0
- BUILD_NEXT: 0
- IMPLEMENTED: 1, CAPA phase 1

Top 20 deferred/disabled items:

| Item | Recommendation |
| --- | --- |
| Empty AI assistant Send buttons across modules | Keep disabled until prompt input exists |
| SOC2 Generate Report before assessment | Keep state-gated |
| Executive Refresh state | Keep state-gated; clarify prerequisite if needed |
| Activity End of feed | Keep disabled state |
| Workflow Create workflow | Enterprise PLAN_GATE; build schema/config path |
| Workflow templates | Enterprise PLAN_GATE; merge into one creation flow |
| Custom reports unavailable | Growth PLAN_GATE; build saved report schema UX |
| Form submission analytics | Growth PLAN_GATE; build analytics |
| SSO Test Connection | Enterprise PLAN_GATE; admin-only |
| SSO Save + Sync Now | Enterprise PLAN_GATE; admin-only |
| Directory Run One-Off Sync | Enterprise PLAN_GATE; admin-only |
| Retention Dry Run | Enterprise PLAN_GATE; admin-only |
| Retention Execute | Enterprise PLAN_GATE; admin-only and audited |
| Retention Save Policy | Enterprise PLAN_GATE; admin-only |
| CAPA entitlement enforcement | Build next as Growth gate |
| CAPA obligation source link | Build next |
| CAPA policy source link | Build next |
| CAPA investigation source link | Build next |
| Industry report pack export | Build one real pack before restoring CTAs |
| Removed unsupported report placeholders | Keep removed |

## 14. Risk Register

| Severity | Area | Issue | Impact | Recommended owner/fix |
| --- | --- | --- | --- | --- |
| P0 | Ops/config | GitHub/Vercel secrets incomplete for Supabase/Stripe/Sentry/Upstash | CI/deploy/billing/monitoring can fail despite green local build | DevOps: complete env setup |
| P0 | DB | Remote Supabase migration status not verified; future-dated migrations relative to 2026-04-29 | Schema drift, missing CAPA/forms/evidence tables in production | Backend/DB: link CLI, list/apply/check |
| P0 | Billing | Stripe live price IDs/webhook secrets require external confirmation | Failed checkout or unprovisioned paid orgs | Billing/devops: production test purchase |
| P1 | Security | Entitlement/plan gating incomplete | Users may see/use features outside commercial plan | Backend/product: extend entitlement keys and enforce server-side |
| P1 | Monitoring | Sentry source maps/release upload not fully configured | Slow debugging in production incidents | DevOps: configure Sentry CI/Vercel |
| P1 | Security | Upstash Redis absent means local fallback only | Distributed rate limiting weak in production | DevOps: set Redis envs |
| P1 | Product | Policy approval workflow missing | Compliance governance weaker than marketing promise | Product/backend/frontend: build review/approval/versioning |
| P1 | CAPA | Phase 2 links/metrics missing | CAPA not fully connected to obligations/policies/reporting | Compliance/care team |
| P1 | Reporting | Custom reports and industry packs partial | Enterprise buyer asks may outpace product | Reporting owner |
| P1 | Staff compliance | Credential evidence UI not fully proven | Regulated workforce proof gap | Care/frontend |
| P2 | QA/Ops | k6/ZAP not fully automated | Perf/security regressions may be late | QA/devops |
| P2 | Admin | Some old compatibility/degraded paths remain | Maintenance complexity | Platform team |
| P2 | Audit | Historical rows may not filter by entity panel | Audit context gaps for old data | Backend |
| P2 | Marketing | Industry social proof and claims need continuous review | Trust risk if claims outpace proof | Product marketing/legal |
| P3 | Naming | Internal `basic/pro` differs from public Foundation/Growth | Developer confusion | Billing: defer dedicated migration |

## 15. Roadmap Recommendation

1. Phase 1 - Stabilize ops/config
   Complete Vercel/GitHub/Supabase/Stripe/Sentry/Upstash setup, run production/staging smoke, verify migrations. Highest risk reduction.

2. Phase 2 - Policy approval workflow
   Add reviewer/approver states, approvals table/events, UI queue, audit logs, tests. This strengthens governance credibility.

3. Phase 3 - Entitlements / plan gating
   Extend `lib/billing/entitlements.ts` for `capa_management`, `custom_reports`, `form_analytics`, `workflow_automation`, `sso_saml`, `directory_sync`, `retention_governance`, `executive_rollup`. Enforce in UI and server routes.

4. Phase 4 - CAPA Phase 2
   Add source links from obligations, policies, investigations; dashboard/reporting metrics; entitlement checks. Lowers incident/remediation gaps.

5. Phase 5 - Reduce disabled surface
   Build workflows/custom reports/form analytics or remove/hide unresolved affordances. Keep AI empty-send disabled.

6. Phase 6 - Reporting/export maturity
   Custom reports, scheduled reports, one real industry report pack, export job visibility.

7. Phase 7 - Load/security monitoring
   Nightly k6, ZAP staging baseline, Sentry release watch, synthetic checks, weekly Supabase drift check.

## 16. Required Env Vars

Minimum production:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_URL
FOUNDER_EMAILS
HEALTH_DETAILED_FOUNDER_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_FOUNDATION
STRIPE_PRICE_GROWTH
RESEND_API_KEY
RESEND_FROM_EMAIL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
CRON_SECRET
```

Recommended:

```bash
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
OPENAI_API_KEY
NEXT_PUBLIC_GOOGLE_CLIENT_ID
TRIGGER_SECRET_KEY
TRIGGER_PROJECT_REF
STAGING_BASE_URL
NEXT_PUBLIC_POSTHOG_KEY
```

## 17. First 7 Days Plan

1. Run local setup: `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`.
2. Verify env with `npm run check-env`; compare `.env.example` with Vercel/GitHub secrets.
3. Link Supabase CLI and run `npx supabase migration list`, then `npm run db:test:verify`.
4. Run Playwright fast gate: smoke, app-actions, exports, CAPA.
5. Confirm Stripe test webhook locally and one staging checkout path.
6. Review `docs/disabled-actions-roadmap.md`, `docs/entitlements-plan.md`, `docs/billing-migration-plan.md`.
7. Assign owners for policy workflow, entitlement gating, CAPA phase 2, ops monitoring.

## 18. First 30 Days Plan

1. Ship ops/config stabilization and make CI secrets consistent.
2. Implement entitlement keys and enforce one vertical slice, preferably CAPA Growth gate.
3. Build policy approval workflow with tests and audit logs.
4. Add CAPA source links and dashboard/reporting metrics.
5. Turn custom reports or workflow automation from degraded placeholder into real gated feature.
6. Configure Sentry release/source maps, synthetic checks, and k6/ZAP scheduled runs.
7. Re-run full app action crawler and update disabled-actions docs after each phase.

## 19. Handover Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run check:app-links
npm run db:test:verify
npm run test:e2e:smoke
npm run test:e2e:app-actions
npm run test:e2e:exports
npx playwright test e2e/capa-flow.spec.ts --project=chromium --reporter=list
npm run test:a11y
npm run test:lighthouse:public
```

## 20. Final Audit Verdict

FormaOS has a substantial working product, a broad public site, strong test scaffolding, and recent successful app-action/export/CAPA verification. A new dev team can safely continue if they treat migrations, billing, auth/tenancy, and entitlements as high-risk surfaces.

Do not start with redesign. Start with operational certainty, migration verification, billing proof, and gating discipline. Then ship policy approval, CAPA phase 2, and reporting maturity.
