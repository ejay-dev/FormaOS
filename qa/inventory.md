# FormaOS QA Inventory — Phase 0

Surface map for the full-sweep QA pass. Drives Phases 1–10.
Web only; mobile app excluded per scope.

---

## 1. Page surface (161 total)

### Marketing — 65 pages, `app/(marketing)/`
Home, product, features, pricing, enterprise, operate, govern, prove, our-story, about, contact, changelog, roadmap, blog (+ `[slug]`), faq, customer-stories (+ template), documentation (+ api), integrations, frameworks, evaluate, industries, status, enterprise-proof.

Compare (9): 6clicks, auditboard, complispace, drata, hyperproof, riskware, secureframe, vanta, index.

Legal (3): legal index, privacy, terms + top-level terms.

Security (2): security, security-review (+ faq).

Trust (9): trust index, data-handling, dpa, incident-response, packet, procurement, sla, subprocessors, vendor-assurance.

Industry/use-case (14): healthcare-compliance, healthcare-compliance-platform, ndis-compliance-system, ndis-providers, childcare-compliance, construction-compliance, financial-services-compliance, iso-compliance-software, soc2-compliance-automation, audit-evidence-management, what-is-a-compliance-operating-system, use-cases/{financial-services, government-public-sector, healthcare, incident-management, ndis-aged-care, workforce-credentials}.

### App (authed) — 72 pages, `app/app/`
Dashboard (+ builder), onboarding-roadmap, profile, search, activity, history, audit-trail, audit (+ export/[userId]), billing.

Compliance (4): compliance, compliance/frameworks, compliance/cross-map, compliance/soc2.

Controls, policies (+ new, versions, [id]), evidence (+ gaps), certificates, capa, governance.

Incidents (4): list, new, [id], [id]/investigation, analytics.

Care: care-plans (+ new, [id]), progress-notes, participants (+ new, [id], [id]/medications), patients (+ [id]), visits (+ new, [id]), staff, staff-compliance (+ new, [id]), ndis-claiming, people, team (+ org-chart).

Tasks (+ board, calendar), workflows (+ [id]), forms (+ builder/[id], [formId]/submissions), registers (+ training), vault (+ review).

Executive (+ group), reports (+ custom, trends).

Settings (12): index, organization, roles, retention, security, integrations (+ marketplace), notifications, email-preferences, email-history, executive-digest, auditor-access, ai.

Admin shell inside app: app/admin, app/admin/orgs/[orgId].

### Admin console — 24 pages, `app/admin/`
index, dashboard, activity, audit, billing, bulk, control-plane, customer-health, emails, exports, features, health, orgs (+ [orgId]), releases, revenue, security (+ triage), security-live, sessions, settings, support, system, trials, usage-analytics, users.

### Auth — 9 pages, `app/auth/`
index, signin, signup, login, forgot-password, reset-password, check-email, confirm/error, plan-select. Plus top-level `/signin` and `/join`.

### Audit portal (public, token-scoped) — 4 pages, `app/audit-portal/[token]/`
index, controls, evidence, reports.

### Standalone — 5 pages
accept-invite/[token], accept-organization-invite/[membershipId], auth-redirect, organization/[orgId]/audit, workspace-recovery, unauthorized, onboarding, submit/[formId].

---

## 2. API surface (~190 routes, `app/api/`)

- **Public**: `/health`, `/health/detailed`, `/version`, `/status/cron`, `/indexnow`, `/feedback`, `/trust-packet/vendor`, `/trust-packet/generate`.
- **Auth**: `/auth/*` (signup, email-signup, bootstrap, password/*, resend-confirmation, clear-session, health), `/session/{heartbeat,revoke}`.
- **SSO**: `/sso/{config,discover,metadata,test,directory-sync}`, `/sso/saml/{login,acs,metadata}/[orgId]`.
- **SCIM v2**: Users, Groups, Bulk, ResourceTypes, Schemas, ServiceProviderConfig, root, [id].
- **Security**: `/security/log`, `/security/mfa/{setup,enable,disable}`, `/identity/audit`.
- **v1 public API**: ai/*, analytics/trends, api-keys/*, audit-logs, certificates, compliance, controls/*, data-residency, evidence, form-templates, forms/* (submissions, analytics, duplicate, publish), frameworks, integrations/* (events), members/*, notifications, organizations/* (onboarding-complete, seed-data), reports/* (custom/*, [reportId]), search/* (analytics, recent, saved, suggest, unified), soc2/{readiness,report}, tasks, webhooks/* (deliveries, test).
- **Admin**: `/admin/*` — activity, audit (+ run), bulk, control-plane (+ stream), exports (+ [jobId]), features, health, orgs/[orgId]/* (billing/{refund,retry-invoice}, entitlements, lifecycle, lock, members/[userId], notes, plan, trial/{extend,reset}), overview, releases/[releaseId], security (+ live), sessions, subscriptions/[orgId]/resync-stripe, support/* (automation-failures, billing-timeline, [requestId]), system, trials/extend, users/[userId]/{lock,resend-confirmation}.
- **Runtime**: `/runtime/control-plane` (+ stream), `/admin/control-plane` (+ stream).
- **Internal triggers**: compliance-export, enterprise-export, queue-process, report-export, webhook-delivery.
- **Cron**: compliance-check, compliance-exports, enterprise-exports, report-exports, security-retention.
- **Governance**: classification, isolation, pii, residency, retention (+ execute).
- **Workflows/Automation**: workflows/{root,[workflowId]/{route,execute,toggle}}, workflows/{approvals,executions}, automation/{approvals,cron,workflows/[id]/executions}.
- **Customer health + intelligence**: customer-health/{rankings,score}, intelligence/{framework-health,summary}, executive/{posture,audit-forecast,frameworks}.
- **Compliance**: compliance/exports/{create,[jobId]/status}, compliance/snapshots/{history,regression}.
- **Care ops**: care-operations/{credential-alerts,scorecard}, staff-credentials/export.
- **Misc**: activity, activity/track, search, onboarding-state, onboarding/{checklist,select-plan}, system-state, demo/seed, email/test, queue/process, notifications/*, frameworks/registry, incidents/export, trial/value-recap, billing/webhook, support/tickets, reports/export, reports/exports/[jobId]/status, exports/enterprise/[jobId].
- **Debug** (must be locked in prod): debug/{bootstrap,env,founder,log,supabase,supabase-functions}.

---

## 3. Roles (from `lib/roles.ts`, `lib/authz/ability.ts`, `lib/multi-org.ts`, `lib/api-permission-guards.ts`)

- **Tenant roles**: `owner`, `admin`, `member`, `viewer` (hierarchy: viewer < member < admin < owner).
- **Persona shim**: member/viewer → "employee", owner/admin → "employer" (used in sidebar/industry nav).
- **Special**: `staff` (appears in industry-sidebar navigation).
- **Platform admin** (outside org roles): founder/superadmin via `/admin/*` — gated through admin guards, not tenant role.
- **Unauthed**: public marketing + audit portal (token-scoped only).

Permission matrix to test: 5 roles × 161 pages × {read, write, delete} + 190 API routes = large — will sample by route group rather than exhaustive.

---

## 4. Export / download surface (the part you emphasized)

### Currently implemented formats
| Format | Where | Library |
|---|---|---|
| **PDF** | reports, audit, identity/audit, staff-credentials, trust-packet, enterprise bundles | `jspdf` + `jspdf-autotable`, `pdf-lib` |
| **CSV** | identity/audit, activity, reports/custom, registers | `lib/reports/csv-generator.ts` (hand-rolled) |
| **JSON** | reports, identity/audit, reports/custom | native |
| **ZIP** | enterprise exports, audit bundles, trust packet | `archiver` |

### Export endpoints found
- `/api/reports/export` — PDF, JSON
- `/api/v1/reports` — PDF, JSON
- `/api/v1/reports/custom/[reportId]/generate` — JSON, CSV
- `/api/identity/audit?format=` — JSON, CSV, PDF
- `/api/activity?format=csv`
- `/api/incidents/export`
- `/api/staff-credentials/export`
- `/api/compliance/exports/create` (+ status)
- `/api/exports/enterprise/[jobId]` (ZIP bundle)
- `/api/admin/exports` (+ [jobId])
- `/api/trust-packet/{generate,vendor}`

### ❗ Missing formats (your point — "any file type")
Not currently supported anywhere:
- **XLSX** — enterprise buyers expect this for evidence, controls, registers, audit logs, compliance matrices
- **DOCX** — policies, procedures, narrative reports, board/exec reports
- **HTML** (standalone, styled) — shareable static reports without app access
- **Markdown** — readme-style exports, docs
- **XML** — SCIM-style interop, some regulators require it
- **ICS** — calendar feeds for tasks/visits/audits (useful for care ops)
- **PNG/SVG snapshots** — charts, dashboards, org charts (some exist inline but no download)

Phase 4 will both (a) verify the formats we **do** ship and (b) flag each export endpoint as a candidate to expand to XLSX/DOCX/HTML minimum.

### Exportables that must render correctly in every format
SOC2 readiness report, compliance posture snapshot, control register, evidence register, audit-trail (identity + general), incident register + individual incident, care plan, progress notes, participant/patient record, staff record + credentials, policies + versions, certificates, risk register, training register, trust packet, enterprise audit bundle, custom reports, exec digest.

### PDF enterprise-polish checklist (per artifact)
Logo + brand on first page; org name + date/time + timezone in header; page numbers; report title + scope; table of contents (long docs); consistent font family/sizes; no clipped rows/overflow; no orphan headings; correct data (spot-check against DB); unicode + RTL survives; long tables paginate with repeated headers; generated-by + report-id footer; PDF metadata (title, author, subject); password-protect option for sensitive bundles.

---

## 5. Existing test infrastructure (reuse, don't rebuild)

- **Unit**: Jest 30 + RTL — `__tests__/`, `jest.config.js`
- **E2E**: Playwright 1.58 — `e2e/` (53 specs incl. smoke, app-link-integrity, admin-founder-smoke, a11y-smoke, enterprise-invariants, security-invariants, marketing-screenshots, audit-reports)
- **Visual**: backstop.config.js + Playwright screenshots
- **Lighthouse**: `.lighthouserc.json` + `lighthouserc.js` + `.lighthouseci/`
- **A11y**: `@axe-core/playwright`, `.pa11yci.json`
- **Compliance**: `tests/compliance/{gdpr,soc2}-compliance.js`
- **AB/marketing**: `tests/ab-testing/`, `tests/marketing/`
- **Scripts**: `scripts/app-link-integrity-audit.mjs`, `check-admin-nav-integrity.mjs`, `check-security-baseline.mjs`, `verify-security-monitoring.js`, `test-db-integrity.js`, `test-supabase-health.js`
- **npm aggregates**: `qa:smoke`, `qa:smoke:matrix`, `qa:a11y`, `qa:enterprise`, `qa:full`, `test:qa:quick`, `test:qa:full`, `test:all`

Gaps vs the plan: no XLSX/DOCX export tests (because those formats don't exist), no PDF content-assertion tests (only generation tests), no permissions-matrix test, no sustained load test (k6 is in devDeps but `^0.0.0` — not wired).

---

## 6. Integrations to cover in Phase 9

Stripe (checkout, webhooks, subscriptions, refunds, proration), Supabase (auth, DB, RLS, storage, functions), Google OAuth, SAML SSO (via `@node-saml`), SCIM provisioning, Resend (email), Sentry, PostHog, Trigger.dev (background jobs), Upstash Redis (rate limiting/queue), OpenAI / AI SDK, Langfuse (LLM obs).

---

## Scope summary

- **161 pages** to exercise visually + functionally
- **~190 API routes** to contract-test
- **5 roles** × sampled route groups for permissions
- **~20 exportable artifacts** × currently 4 formats + 3–5 gap formats flagged
- **~12 integrations** to verify end-to-end

Phase 0 done. Next: Phase 1 (marketing sweep) unless you want to prioritize Phase 4 (exports) or the XLSX/DOCX gap first.
