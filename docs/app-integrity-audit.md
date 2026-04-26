# App Integrity Audit

Updated: 2026-04-26

## Scope

Authenticated app surfaces audited in this pass:

- Dashboard and sidebar navigation
- Obligations / Compliance
- Policies and policy lifecycle routes
- Evidence Vault
- Participants, visits, progress notes, incidents, staff compliance
- Team and settings roles
- Registers and forms
- Reports and export surfaces
- Executive view and billing/settings entry points

This pass focused first on known user-reachable broken surfaces, then extended static route validation and targeted browser checks around routes, CTAs, exports, and downloads.

## Broken Routes Found And Fixed

| Surface | Problem | Resolution |
|---|---|---|
| Policy management | `/app/policies/[id]/versions` was linked but missing | Added org-scoped policy version history page with fallback to the current policy record when no lifecycle rows exist |
| Policy management | `/app/policies/[id]/edit` was linked but missing | Added org-scoped edit page with locked-state guidance for published or approval-controlled policies |
| Settings roles | `/app/settings/roles/[roleId]` was linked but missing | Added org-scoped custom role detail page with permissions and assigned member summary |
| Form submissions | `/app/forms/[formId]/analytics` linked to no page | Replaced visible link with disabled "Analytics coming soon" control |
| Forms builder | `/app/forms/builder/new` returned a 200 app frame without completing draft creation/redirect | Replaced the page with a GET route handler that creates the draft form and redirects to `/app/forms/builder/[id]` |

Static validation after the fixes:

- `npm run check:app-links`: 303 internal app links validated, 0 broken.

## Exports Found

| Surface | Status | Notes |
|---|---|---|
| Reports Center - trust packet | Working | `/api/reports/export?type=trust&format=pdf&mode=sync` remains exposed only when export access is available |
| Reports Center - SOC 2 | Working | Existing supported report type |
| Reports Center - ISO 27001 | Working | Existing supported report type |
| Reports Center - NDIS | Working | Existing supported report type |
| Reports Center - HIPAA | Working | Existing supported report type |
| Industry report templates | Disabled | Unsupported specific report types no longer link to `/api/reports/export`; controls now say "Export coming soon" |
| Universal RAG status report | Disabled | Unsupported `rag-status` export no longer links to `/api/reports/export` |
| Form submissions CSV | Implemented | Added `/api/v1/forms/[formId]/submissions/export` with session/API-key auth, org scope, UUID validation, CSV headers, empty CSV support, and content disposition |
| Vault/evidence download | Working | Download action is exposed with a stable test id and verified by E2E against signed storage URL/download behavior |
| Incident export | Existing | `/api/incidents/export` already exists and remains exposed from incidents |
| Staff credentials export | Existing | `/api/staff-credentials/export` already exists and remains exposed from staff compliance |

## Forms Schema Verification

- Current app table names are `org_forms`, `org_form_submissions`, and `org_form_templates`.
- The original matching repo migration is `supabase/migrations/20260402_forms_platform.sql`.
- Added repair migration `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql` so environments that missed the original migration still receive the forms tables idempotently.
- No alternate/legacy table name was found in active forms code; `lib/forms/*`, app forms pages, and the new export route all consistently use `org_forms` and `org_form_submissions`.
- The repair migration was manually applied to the configured Supabase project on 2026-04-26.
- Post-migration probe against project `bvfniosswcvuyfaaicze` verified authenticated read/write for `org_forms` and `org_form_submissions`, including submission-to-form joins and cleanup. `PGRST205` is gone for the configured test project.
- The export E2E no longer skips when forms tables are missing; it fails loudly and points back to the missing migration. After the manual migration, the form submissions export runs and downloads a CSV with headers/content.

## API And Server Action Notes

- Added `app/api/v1/forms/[formId]/submissions/export/route.ts`.
- The form export route uses `authenticateV1Request`, so it supports authenticated app sessions and API-key access consistently with adjacent V1 form routes.
- The route scopes both form and submission reads to `auth.context.orgId`.
- Invalid `formId` returns 400. Missing org-scoped form returns 404.
- Export output uses the shared tabular formatter and `Content-Disposition` attachment headers.
- `updatePolicy` now revalidates policy detail, edit, and version-history paths after save.
- Policy detail editing now treats both `owner` and `admin` as managers.
- Incident resolution now redirects back to the incident detail page after a successful mutation and throws on a returned action error instead of appearing to complete silently.
- Forms builder creation now uses a route handler for explicit GET redirect semantics instead of doing the mutation from a page render.
- Local authenticated E2E sessions now set a localhost-only `fos_e2e=1` marker and the standard cookie consent cookie. The app uses that marker only on localhost to bypass local/global rate-limit ceilings that were masking export and V1 route behavior when Redis was unavailable.

## Operational Stability Hardening

### Redis and rate limits

- Audited the Redis-backed rate-limit paths in `lib/security/rate-limiter.ts`, `lib/ratelimit.ts`, `lib/api-keys/middleware.ts`, and `proxy.ts`.
- Production Redis expectation is now explicit: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are required for distributed auth/admin limits. `REDIS_REQUIRED=true` can force the same requirement outside production.
- Auth rate limits fail closed in production when Redis is unavailable and return a clear backend-unavailable path instead of silently degrading distributed brute-force protection.
- Non-critical app/API/export paths degrade to in-memory limits with throttled server warnings so product availability is preserved during a Redis outage.
- Local/dev use deterministic in-memory fallback when Redis credentials are absent.
- E2E rate-limit bypass is constrained to localhost requests and requires either `x-formaos-e2e: 1` or the localhost-only `fos_e2e=1` cookie. It remains available when Playwright runs `next start` locally with `NODE_ENV=production`, but it is disabled for deployed production via `VERCEL_ENV=production` and does not work on non-local hosts.
- `.env.example` documents production Redis credentials and `SECURITY_LOG_DB_TIMEOUT_MS`.

### Audit and security logging

- Audited audit/security logging paths for evidence upload, incident resolution, staff credential verification, care plan status changes, policy actions, rate-limit logging, session-security logging, and queued security event logging.
- Compliance-critical audit events now call `logAuditEvent(..., { required: true })`. If both the session-scoped insert and service-role fallback fail, the user action fails instead of showing success without a required audit trail.
- Non-critical telemetry/security events remain non-blocking, but Supabase write errors and queued flush failures are logged to server logs instead of disappearing silently.
- Security log DB write timeouts are configurable with `SECURITY_LOG_DB_TIMEOUT_MS` and default to 1500ms, clamped to 500-5000ms, to avoid slow logging writes turning into UI/test timeouts.
- `/api/v1/audit-trail` no longer selects optional `org_audit_logs.domain`, `severity`, or `metadata` columns, so older environments with the base audit table do not emit `42703` schema warnings during drawer/audit-panel reads.

### Enterprise SSO schema

- `organization_sso` is an expected enterprise SSO table. The original enterprise migration path existed, but environments could still miss the table or have schema-cache drift.
- Added `supabase/migrations/20260426_002_ensure_organization_sso_schema.sql` as an idempotent repair migration. It creates/repairs `organization_sso`, expected columns, RLS policies, indexes, and updated-at trigger.
- Code now treats a missing `organization_sso` table as an optional enterprise feature for reads/discovery without noisy `PGRST205` logging. SSO writes return `sso_schema_unavailable` rather than pretending success.

### Runtime control-plane streams

- `runtime/control-plane/stream ERR_INVALID_STATE` was traced to SSE controller abort/cancel races under parallel E2E load.
- Runtime and admin control-plane streams now use a shared safe SSE writer that guards enqueue/close after abort and makes duplicate close paths idempotent.
- Added focused unit coverage for duplicate-close and already-closed enqueue behavior. This is classified as an app stream-handling bug fixed in the route layer, not a production data issue.

### Export schema-cache compatibility

- `/api/reports/export`, `/api/incidents/export`, and `/api/staff-credentials/export` now honor the same localhost-only E2E rate-limit bypass used by authenticated app API routes, preventing local in-memory export buckets from masking export behavior under parallel Playwright.
- Incident and staff credential exports no longer depend on Supabase relationship-cache joins for `reported_by` or `user_id`. They read flat org-scoped rows and resolve related display names separately, avoiding schema-cache relationship warnings.

## Hidden Or Deferred Features

- Industry-specific report exports are deferred until the backend supports those exact report types.
- Universal RAG status export is deferred until a matching backend report type exists.
- Form submissions analytics is deferred because only the API analytics endpoint exists; there is no authenticated app analytics page.
- Custom role editing is deferred; the role detail page is read-only and says editing is not available yet.

## Tests Added

### `e2e/app-action-integrity.spec.ts`

Covers:

- Sidebar route load sweep for the authenticated app
- Policy versions route
- Policy edit route
- Custom role detail route
- Primary CTAs for reports and settings roles
- App/API 404 response capture for authenticated routes

### `e2e/export-integrity.spec.ts`

Covers:

- Supported report export download
- Unsupported report template controls disabled instead of linked
- Form submissions CSV export when forms tables exist
- Verified vault evidence download action

Forms schema note: `supabase/migrations/20260402_forms_platform.sql` is the original repo-level migration that creates `org_forms`, `org_form_submissions`, and `org_form_templates`. This pass adds `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql` as an idempotent repair. The repair was manually applied to the configured Supabase project and the form export E2E now seeds a real form plus submission and downloads the CSV instead of skipping.

## Validation Results

- Forms schema live probe: passed. `org_forms` insert/update/read, `org_form_submissions` insert/read, joined read, and cleanup succeeded under the authenticated test org context.
- `npx playwright test e2e/export-integrity.spec.ts --project=chromium --reporter=list`: passed, 3 passed, 0 skipped.
- `npx playwright test e2e/app-action-integrity.spec.ts --project=chromium --reporter=list`: passed, 4 passed.
- Critical regression command across onboarding, care plans, task flow, forms, incidents, dashboard, deep workflow integrity, and system integration: after forms migration and rate-limit/test-session fixes, first full rerun passed 16/18 with 2 failures. Classifications:
  - `deep-workflow-integrity › Incident → resolve flow persists root cause + status`: test setup issue. Strict text locator matched duplicate hidden/rendered headings; replaced with scoped heading locator and reran.
  - `deep-workflow-integrity › Obligations register surfaces evidence count from real data`: test data/setup issue. UI authenticated a different temporary worker user/org than the seeded row under parallel execution; seeded specs now authenticate with `context.email`.
- Retry after fixes: `npx playwright test e2e/deep-workflow-integrity.spec.ts --project=chromium --reporter=list` passed, 5 passed.
- A later full parallel critical run under Redis-unavailable local load passed 12/18 and produced repeated `runtime/control-plane/stream` `ERR_INVALID_STATE` unhandled rejections plus slow/dropped telemetry writes. Retrying the failing set with one worker passed onboarding and system integration, but exposed a real `forms-new` route bug. `/app/forms/builder/new` has been fixed and `npx playwright test e2e/forms-new.spec.ts --project=chromium --reporter=list` now passes.
- Final validation commands were rerun after this doc update; see the final delivery report for exact command output.
- Operational stability validation on 2026-04-26:
  - Focused unit suites for rate limits, API-key middleware, SSO guards, and SSE writer passed: 6 suites, 74 tests.
  - `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run check:app-links` passed.
  - Targeted parallel Playwright stability suite passed with `--workers=2`: 20 passed in 2.3m.
  - No `runtime/control-plane/stream ERR_INVALID_STATE` appeared in the final two-worker run.
  - Previous local failures were classified and addressed: local built-server startup timeout was harness/server-start state, policy heading duplicate was a test locator issue, incident resolution was a test race against a same-URL server action, and report export timeout was a local in-memory rate-limit masking issue.

## Remaining Risks

- Forms schema drift risk is now low for the configured Supabase project because the repair migration is applied and proven. Other environments still need `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql` applied if they missed the original forms migration.
- Redis remains unavailable in this local shell by design, but the behavior is now explicit: local/dev use in-memory limits, production auth limits fail closed, and non-critical API paths log degraded fallback.
- Enterprise SSO schema risk is low after the repair migration and missing-table guards. Environments that enable SSO should still apply `supabase/migrations/20260426_002_ensure_organization_sso_schema.sql` before exposing SSO settings.
- Parallel E2E stability should be run with the documented targeted worker count. If future full-suite parallel runs fail, classify by route/action and retry the failing shard once before treating it as a product regression.

## Verdict

The four known broken surfaces are fixed:

- Report export mismatch no longer exposes unsupported export calls.
- Form submissions export route exists and is implemented.
- Policy dynamic routes no longer 404.
- Role detail route no longer 404.

Current app link inventory is zero-broken for static `/app` links. User-visible unsupported exports/actions touched in this pass are now disabled with truthful copy instead of linking to broken endpoints.

Post-migration export and app-action integrity suites pass with no skipped forms export coverage. The critical regression failures that remained after the first full rerun were classified and fixed as test/session stability issues, not unresolved visible product breakages.
