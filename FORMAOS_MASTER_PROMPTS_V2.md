# FormaOS Master Prompts V2

Generated: 2026-03-14
Based on: Full codebase audit across structure, API, security, frontend, testing, DevOps, and business logic.

These five prompts are designed to be executed independently. Each targets a different dimension of the product and is scoped to produce 2,000+ lines of production code. Combined, they cover the largest remaining gaps in the platform that are not addressed by the current admin operating model work (items 1-10 in the active backlog).

Execution audit: see `FORMAOS_MASTER_PROMPT_RUN_2026_03_14.md` for the prompt-by-prompt completion status against this V2 pack.

---

## Codebase Audit Summary

Before the prompts, here is the audit that informed them.

### Scale

| Dimension | Count |
|---|---|
| TypeScript/TSX files | 1,257 |
| Total lines of code | 260,555 |
| App workspace routes | 35 (dashboard, tasks, vault, evidence, compliance, etc.) |
| Marketing pages | 37 (product, features, pricing, trust, security, industries, etc.) |
| Admin console pages | 39 files across settings, orgs, support, components |
| API route files | 124 (admin, auth, v1, billing, cron, debug, etc.) |
| Lib domain modules | 219 files across 90+ directories |
| Shared components | 243 files across 42 component directories |
| Supabase migrations | 72 SQL migration files |
| E2E test specs | 36 Playwright specs |
| Unit/integration tests | ~59 files (17 in __tests__, 42 in tests/) |
| Background jobs | 2 Trigger.dev tasks (exports, queue batch) |
| Integrations | 6 connectors (Slack, Teams, Jira, Linear, Google Drive, Webhook Relay) |

### Architecture Strengths

1. **Strong domain clustering** - `lib/` is organized by business domain: billing (6 files, subscriptions/entitlements/drift/reconciliation), security (16 files, CSRF/MFA/session/rate-limiting/detection), compliance (5 files, scanner/snapshots/enforcement/evidence), automation (8 files, triggers/events/scoring/scheduling), onboarding (8 files, checklists/roles/tours/progress).

2. **Deep admin console** - Already has delegated admin governance, approval workflows, customer-360 views, immutable audit feeds, reason-gated mutations, CSRF protection, and live ops surfaces for security/sessions/activity.

3. **Enterprise security posture** - TOTP 2FA with AES-256-GCM encryption, session rotation, password history, rate limiting (Upstash Redis), geo-IP tracking, MFA enforcement, CORS/CSRF protection, security event correlation, and detection rules.

4. **Comprehensive marketing surface** - 37 marketing pages covering product, features, industries, frameworks, use-cases, trust center, security review, compare, pricing, customer stories, changelog, roadmap, and documentation.

5. **Observability stack** - OpenTelemetry, Langfuse, Sentry, Pino structured logging, enterprise monitoring, API wrappers, and monitoring flags.

6. **Compliance framework engine** - Framework registry, installers, evidence suggestions, control deduplication, compliance snapshots, multi-framework rollup, and posture calculation.

7. **Billing maturity** - Stripe integration with subscriptions, entitlements, drift detection, nightly reconciliation, plan management, and trial controls.

### Critical Gaps Identified

#### Gap 1: Test Coverage Is Dangerously Thin
- **2,694 lines of unit tests** for 260K lines of production code = ~1% coverage
- No tests for: workflow engine, webhook system, realtime, AI assistant, integrations (Slack/Teams/Jira/Linear/Google Drive), compliance graph, report builder, multi-org, industry packs, file versioning, data residency, SCIM server, SSO/SAML, executive modules, customer health, care scorecard, device tier, navigation, notifications, system state
- E2E tests are marketing/smoke-heavy; no E2E coverage for core app workflows (task lifecycle, evidence upload, compliance scoring, audit trail, team management, vault operations)
- No test factories, no shared fixtures, no database seeding for integration tests

#### Gap 2: Customer-Facing API Is Skeletal
- Only 7 v1 API routes totaling 1,039 lines: audit-logs, compliance, data-residency, evidence, tasks, webhooks (CRUD + individual)
- Missing v1 endpoints for: organizations, members/roles, frameworks, controls, certificates, reports, onboarding state, billing/subscription status, notifications, settings, search, care plans, incidents, visits, progress notes, staff compliance
- No API key management system for customers
- No OpenAPI/Swagger specification
- No API versioning strategy beyond the v1 prefix
- No per-customer rate limiting (only global)
- Webhook delivery exists in `lib/webhooks.ts` (485 lines) but no delivery queue, no retry infrastructure, no dead-letter handling

#### Gap 3: Automation Engine Is Underpowered for a Compliance Platform
- Total automation code: ~3,564 lines across 8 files
- Workflow engine (`lib/workflow-engine.ts`): 361 lines, basic trigger+action model only
- No conditional branching or workflow DAGs
- No parallel execution or fork/join
- No approval/wait states within workflows
- No workflow versioning or rollback
- No visual workflow builder
- No workflow templates per industry or framework
- Scheduled processor exists but no cron management UI
- No execution replay or debugging tools
- 2 background jobs total (Trigger.dev) - no job dashboard, no failure recovery UI

#### Gap 4: Real-Time & Notification System Is Incomplete
- `lib/realtime.ts` (323 lines): basic Supabase Realtime hooks for table subscriptions and presence
- No notification center component or notification preferences
- No email digest system
- No push notification support
- No notification routing (in-app vs email vs Slack vs Teams)
- Activity feed exists in admin but not in the product app
- Presence tracking defined but not integrated into workspace UI
- No live compliance alerts for end users
- No real-time collaboration indicators (who's editing what)

#### Gap 5: Enterprise Identity & Data Governance Is Partially Built
- SCIM server: 733 lines, single file - needs integration testing, error handling, pagination, group sync
- SSO/SAML: 338 lines across 2 files - basic SAML flow, needs SP-initiated flow hardening, metadata endpoint, JIT provisioning validation
- Data residency: `lib/data-residency.ts` (3,561 lines) exists but no enforcement middleware, no region-aware routing
- No data retention policy engine
- No PII scanning or classification
- No cross-tenant data isolation verification tests (automated)
- No directory sync (Azure AD, Okta, Google Workspace)
- No audit of identity provider events

#### Gap 6: Integration Connectors Are Not Wired End-to-End
- 6 integration files totaling 2,744 lines (Slack 502, Teams 700, Jira 235, Linear 232, Google Drive 217, Webhook Relay 858)
- No integration management UI for customers
- No OAuth flow for connecting integrations
- No integration health monitoring
- No bi-directional sync (only outbound patterns visible)
- No integration marketplace or catalog page

#### Gap 7: Background Job Infrastructure Is Minimal
- Only 2 Trigger.dev tasks: report-export-job, compliance-export-job, enterprise-export-job, queue-process-batch
- No job dashboard for operators
- No dead-letter queue handling
- No job scheduling UI
- No job dependency management
- The scheduled automation processor exists in lib/ but is not wired to Trigger.dev or cron

#### Gap 8: App Workspace Has Breadth but Untested Depth
- 35 workspace routes exist but many are likely thin wrappers
- No workspace-level search across entities
- No bulk operations UI beyond admin (components/bulk-operations exists but unclear integration)
- No keyboard shortcuts or command palette integration for power users
- Form builder exists but unclear sophistication
- No offline support or PWA capabilities

---

## Master Prompt 1: Full-Stack Test Infrastructure And Business Logic Verification

> **Expected output: ~3,000+ lines of test code, fixtures, factories, and test utilities**

You are the quality engineering lead for FormaOS. The codebase has 260,555 lines of TypeScript across 1,257 files, but only ~2,694 lines of unit tests. This is a critical gap for a compliance platform where correctness is the product. Your job is to build a production-grade test infrastructure and write the missing tests for the most business-critical modules.

### Context

The existing test infrastructure:
- Jest 30 with ts-jest and jsdom environment
- Playwright 1.58 for E2E (36 specs, mostly marketing/smoke)
- `__tests__/lib/` has tests for: billing, cache, config, control-plane-flags, founder, plans, queue, rate-limiter, ratelimit, roles, security-pure, utils, api-permission-guards, api-validation
- `tests/` has tests for: admin access, auth emails, automation triggers, billing (entitlements/invariants/reconciliation/stripe/subscriptions/webhook), compliance (GDPR/SOC2), export tokens, onboarding (framework-selection/industry-progress/roadmaps/roles/progress/rbac), observability, performance cache, provisioning recovery
- Missing test coverage for: workflow engine, webhook system, realtime hooks, AI assistant, all 6 integrations, compliance graph, report builder, multi-org logic, industry packs, file versioning, data residency, SCIM server, SSO/SAML, executive modules, customer health score, care scorecard, device tier, navigation, notifications, system state, audit trail, and the entire `components/` layer
- No test factories or shared fixtures for creating test data (orgs, users, memberships, subscriptions, tasks, evidence, etc.)

### Your Job

#### Phase 1: Test Infrastructure (produce ~500 lines)

1. Create `tests/factories/` with typed factory functions for all major entities:
   - `createMockOrg()` - organization with configurable plan, industry, framework, trial state
   - `createMockUser()` - user with configurable role, MFA state, session
   - `createMockMembership()` - org membership with role and permissions
   - `createMockSubscription()` - Stripe subscription with plan, status, entitlements
   - `createMockTask()` - compliance task with status, assignee, evidence
   - `createMockEvidence()` - evidence document with verification state
   - `createMockWorkflow()` - workflow rule with triggers, conditions, actions
   - `createMockWebhook()` - webhook config with events, delivery history
   - `createMockAuditEntry()` - audit log entry with actor, action, resource
   - `createMockFramework()` - compliance framework with controls and mappings

2. Create `tests/helpers/` with:
   - `mockSupabase()` - configurable Supabase client mock that supports chained queries (`.from().select().eq().single()`)
   - `mockStripe()` - Stripe client mock for subscriptions, invoices, customers
   - `mockRedis()` - Upstash Redis mock for rate limiting and caching
   - `setupTestEnv()` - standardized environment variable setup for tests

#### Phase 2: Business Logic Tests (produce ~1,200 lines)

Write comprehensive unit tests for these untested critical modules:

1. **`lib/workflow-engine.ts`** (~200 lines of tests)
   - Test each TriggerType fires correctly
   - Test each ActionType executes the right side effect
   - Test condition evaluation with various operators
   - Test disabled workflows are skipped
   - Test error handling when actions fail
   - Test org isolation (workflow from org A cannot affect org B)

2. **`lib/webhooks.ts`** (~200 lines of tests)
   - Test webhook registration and event subscription
   - Test HMAC signature generation and verification
   - Test payload construction for each event type
   - Test delivery status tracking (pending, success, failed, retrying)
   - Test retry logic with backoff
   - Test webhook disable on repeated failures
   - Test concurrent delivery handling

3. **`lib/compliance-graph.ts`** (~150 lines of tests)
   - Test graph construction from controls and evidence
   - Test coverage calculation
   - Test gap identification
   - Test multi-framework overlap detection
   - Test graph updates when evidence changes

4. **`lib/multi-org.ts`** (~150 lines of tests)
   - Test org switching
   - Test cross-org data isolation
   - Test membership validation
   - Test org creation and provisioning flow
   - Test org limits and plan enforcement

5. **`lib/report-builder.ts`** (~150 lines of tests)
   - Test report generation for each report type
   - Test data aggregation and formatting
   - Test PDF generation
   - Test export with different options
   - Test permission checks on report access

6. **`lib/industry-packs.ts`** (~150 lines of tests)
   - Test pack loading for each industry
   - Test control mapping to frameworks
   - Test customization application
   - Test pack versioning

7. **`lib/data-residency.ts`** (~100 lines of tests)
   - Test region detection
   - Test routing decisions
   - Test data location validation
   - Test residency constraint enforcement

8. **`lib/file-versioning.ts`** (~100 lines of tests)
   - Test version creation
   - Test version comparison
   - Test rollback
   - Test version limit enforcement
   - Test concurrent version creation

#### Phase 3: Integration Tests (produce ~800 lines)

Write integration tests for the most critical API routes:

1. **Auth flow integration** (~150 lines)
   - Test signup → email confirmation → first login → session creation
   - Test MFA enrollment → MFA challenge → MFA verification
   - Test session revocation and re-authentication
   - Test password reset flow

2. **Billing integration** (~150 lines)
   - Test trial creation → trial expiry → upgrade prompt
   - Test subscription creation → entitlement activation
   - Test subscription cancellation → grace period → access revocation
   - Test Stripe webhook processing for invoice events

3. **Compliance workflow integration** (~150 lines)
   - Test framework installation → control creation → evidence upload → compliance score update
   - Test automation trigger → action execution → audit log creation
   - Test export request → job creation → file generation → download

4. **Admin API integration** (~150 lines)
   - Test founder access to all admin routes
   - Test delegated admin access with approval gates
   - Test admin mutation audit trail completeness
   - Test CSRF token validation on admin mutations

5. **v1 API integration** (~200 lines)
   - Test each v1 endpoint with valid and invalid auth
   - Test pagination, filtering, and sorting
   - Test rate limiting per API key
   - Test webhook delivery on resource changes

#### Phase 4: E2E App Workflow Tests (produce ~500 lines)

Write Playwright E2E tests for core app workflows that currently have no coverage:

1. **`e2e/task-lifecycle.spec.ts`** (~100 lines)
   - Create task → assign → add evidence → complete → verify in audit log

2. **`e2e/evidence-management.spec.ts`** (~100 lines)
   - Upload evidence → attach to control → verify → view in compliance dashboard

3. **`e2e/team-management.spec.ts`** (~100 lines)
   - Invite member → accept invite → change role → verify permissions → remove member

4. **`e2e/vault-operations.spec.ts`** (~100 lines)
   - Create vault entry → add version → download → verify audit trail

5. **`e2e/compliance-scoring.spec.ts`** (~100 lines)
   - Install framework → map controls → upload evidence → verify score updates in real time

### Output Required

- All factory functions in `tests/factories/`
- All helper utilities in `tests/helpers/`
- All unit tests passing with `npm test`
- All integration tests in `tests/integration/`
- All E2E tests in `e2e/`
- Update `package.json` scripts if needed for new test categories
- Final test count and coverage summary

### Verification

```bash
npm test -- --verbose
npm run test:e2e -- e2e/task-lifecycle.spec.ts e2e/evidence-management.spec.ts e2e/team-management.spec.ts e2e/vault-operations.spec.ts e2e/compliance-scoring.spec.ts
npm run typecheck
```

---

## Master Prompt 2: Customer-Facing API Platform, Webhook Delivery, And Integration Wiring

> **Expected output: ~2,800+ lines of API routes, webhook infrastructure, integration wiring, and management UI**

You are the API platform engineer for FormaOS. Enterprise customers need programmatic access to their compliance data, event-driven integrations, and connected tools. The current v1 API has 7 routes (1,039 lines), the webhook system has types but no delivery infrastructure, and 6 integration connectors exist but are not wired to the product.

### Context

Current state:
- `app/api/v1/` has: audit-logs, compliance, data-residency, evidence, tasks, webhooks (CRUD + individual)
- `lib/webhooks.ts` (485 lines): types and CRUD for webhook configs, payload construction, HMAC signing, delivery tracking - but no actual delivery queue or retry infrastructure
- `lib/integrations/`: slack.ts (502), teams.ts (700), jira.ts (235), linear.ts (232), google-drive.ts (217), webhook-relay.ts (858) - connector code exists but no management UI, no OAuth flows, no health monitoring
- No API key management for customers
- No OpenAPI specification
- No per-customer rate limiting
- Auth on v1 routes uses Supabase session - no API key auth option
- Trigger.dev is available for background job processing

### Your Job

#### Phase 1: API Key Management System (produce ~500 lines)

1. Create `lib/api-keys/` module:
   - `lib/api-keys/types.ts` - ApiKey interface (id, org_id, name, key_hash, prefix, scopes, rate_limit, last_used, created_by, created_at, revoked_at)
   - `lib/api-keys/manager.ts` - createApiKey (generate, hash with SHA-256, store), revokeApiKey, rotateApiKey, listApiKeys, validateApiKey (hash lookup, scope check, rate limit check, update last_used)
   - `lib/api-keys/scopes.ts` - define granular scopes: `tasks:read`, `tasks:write`, `evidence:read`, `evidence:write`, `compliance:read`, `audit:read`, `webhooks:manage`, `members:read`, `reports:read`, `frameworks:read`

2. Create migration `supabase/migrations/20260315_api_keys.sql`:
   - `api_keys` table with RLS policies scoped to org
   - `api_key_usage_log` table for tracking per-key usage
   - Indexes on key_hash and org_id

3. Create API key management routes:
   - `app/api/v1/api-keys/route.ts` - GET (list), POST (create) - requires org admin role
   - `app/api/v1/api-keys/[keyId]/route.ts` - DELETE (revoke), PATCH (update name/scopes)

4. Create `lib/api-keys/middleware.ts` - API key auth middleware that:
   - Extracts key from `Authorization: Bearer fos_...` header
   - Falls back to Supabase session auth if no API key
   - Validates key hash, checks scope, enforces rate limit
   - Injects `apiKeyId` and `orgId` into request context

#### Phase 2: Complete v1 API Surface (produce ~800 lines)

Add the missing v1 endpoints. Each route must support API key auth, pagination (cursor-based), filtering, and org-scoped access.

1. `app/api/v1/organizations/route.ts` - GET current org details
2. `app/api/v1/members/route.ts` - GET list members, POST invite member
3. `app/api/v1/members/[memberId]/route.ts` - GET, PATCH role, DELETE remove
4. `app/api/v1/frameworks/route.ts` - GET installed frameworks with coverage stats
5. `app/api/v1/controls/route.ts` - GET controls with evidence status
6. `app/api/v1/controls/[controlId]/route.ts` - GET detail with mapped evidence
7. `app/api/v1/certificates/route.ts` - GET certificates with expiry status
8. `app/api/v1/reports/route.ts` - GET list reports, POST generate report
9. `app/api/v1/reports/[reportId]/route.ts` - GET report, GET download
10. `app/api/v1/notifications/route.ts` - GET notifications, PATCH mark read
11. `app/api/v1/search/route.ts` - GET unified search across tasks, evidence, controls, members

Each endpoint must:
- Validate API key scopes
- Apply org-level RLS
- Return consistent JSON envelope: `{ data, meta: { cursor, hasMore, total } }`
- Include `X-RateLimit-Remaining` header
- Log access to `api_key_usage_log`

#### Phase 3: Webhook Delivery Infrastructure (produce ~600 lines)

Build a reliable webhook delivery system on top of the existing `lib/webhooks.ts`.

1. Create `lib/webhooks/delivery-queue.ts`:
   - `queueWebhookDelivery(orgId, event, payload)` - find all subscribed webhooks, create delivery records, dispatch to Trigger.dev
   - Delivery record: webhook_id, event, payload, attempt, status, response_code, response_body, delivered_at, next_retry_at

2. Create `trigger/webhook-delivery.ts` - Trigger.dev task:
   - POST payload to webhook URL with HMAC signature in `X-FormaOS-Signature` header
   - Timeout: 30 seconds
   - Retry with exponential backoff: 1m, 5m, 30m, 2h, 12h (5 retries max)
   - Record response code and body
   - After 5 failures, mark webhook as `failing` and notify org admins
   - After 50 consecutive failures, auto-disable webhook

3. Create `app/api/v1/webhooks/deliveries/route.ts` - GET delivery history with filtering by event, status, webhook_id

4. Create `app/api/v1/webhooks/test/route.ts` - POST send a test event to a webhook URL

5. Create migration `supabase/migrations/20260315_webhook_deliveries.sql`:
   - `webhook_deliveries` table with indexes on webhook_id, status, created_at
   - `webhook_delivery_attempts` table for retry history

6. Wire webhook dispatch into existing mutation paths:
   - After task CRUD in `app/api/v1/tasks/route.ts`
   - After evidence CRUD in `app/api/v1/evidence/route.ts`
   - After member changes
   - After compliance score updates
   - After certificate events

#### Phase 4: Integration Management (produce ~600 lines)

Wire the existing integration connectors into a customer-facing integration management system.

1. Create `lib/integrations/manager.ts`:
   - `listAvailableIntegrations()` - returns catalog with name, description, icon, status, capabilities
   - `connectIntegration(orgId, type, config)` - store encrypted config, test connection, activate
   - `disconnectIntegration(orgId, integrationId)` - revoke tokens, remove config, audit log
   - `testIntegration(orgId, integrationId)` - health check, return status
   - `getIntegrationStatus(orgId)` - list all connected integrations with health

2. Create `app/api/v1/integrations/route.ts` - GET catalog, GET connected integrations
3. Create `app/api/v1/integrations/[integrationId]/route.ts` - POST connect, DELETE disconnect, POST test
4. Create `app/api/v1/integrations/[integrationId]/events/route.ts` - GET event history for this integration

5. Create integration settings UI component:
   - `components/integrations/integration-catalog.tsx` - grid of available integrations with connect/disconnect
   - `components/integrations/integration-card.tsx` - individual integration card with status, last sync, health indicator
   - `components/integrations/integration-config-dialog.tsx` - configuration dialog for each integration type

6. Create `app/app/settings/integrations/page.tsx` - integration management page in the app workspace

7. Wire integration dispatch alongside webhook dispatch:
   - Slack: post to configured channel on compliance alerts, task completions, certificate expirations
   - Teams: same events via Teams connector
   - Jira: create/sync issues for compliance tasks
   - Linear: create/sync issues for compliance tasks
   - Google Drive: sync evidence documents

#### Phase 5: API Documentation (produce ~300 lines)

1. Create `app/(marketing)/documentation/api/page.tsx` - API reference page:
   - Authentication section (API keys, scopes, rate limits)
   - Endpoint reference with request/response examples
   - Webhook events reference with payload schemas
   - Error codes reference
   - Code examples in cURL, JavaScript, Python

2. Create `lib/api-keys/openapi.ts` - generate OpenAPI 3.1 spec from route metadata

### Output Required

- API key management system with migration
- Complete v1 API surface (11+ new endpoints)
- Webhook delivery infrastructure with Trigger.dev integration
- Integration management system with UI
- API documentation page
- All routes passing typecheck
- Audit log entries for all API key and integration operations

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="api-keys|webhooks|integrations"
# Manual: create API key, make authenticated request, verify webhook delivery
```

---

## Master Prompt 3: Advanced Workflow Automation Engine With Visual Builder

> **Expected output: ~2,500+ lines of workflow engine, execution runtime, templates, and visual builder UI**

You are the automation engineer for FormaOS. A compliance platform lives or dies by its automation. The current workflow engine (`lib/workflow-engine.ts`, 361 lines) supports basic trigger-action pairs. For enterprise customers managing hundreds of controls across multiple frameworks, this needs to become a sophisticated workflow engine with conditional logic, approval gates, parallel execution, templates, and a visual builder.

### Context

Current automation state:
- `lib/workflow-engine.ts` (361 lines): basic WorkflowRule model with TriggerType (7 types) and ActionType (6 types)
- `lib/automation/trigger-engine.ts` (816 lines): processes triggers, evaluates conditions, executes actions
- `lib/automation/event-processor.ts` (354 lines): handles database events, monitors compliance score changes
- `lib/automation/scheduled-processor.ts` (535 lines): runs scheduled checks (certificate expiry, task overdue, compliance drift)
- `lib/automation/compliance-score-engine.ts` (390 lines): calculates and saves compliance scores
- `lib/automation/integration.ts` (300 lines): convenience wrappers for common trigger points
- 2 Trigger.dev tasks for export jobs and queue processing
- No workflow DAGs, no branching, no approval gates, no parallel execution, no visual builder, no templates

### Your Job

#### Phase 1: Workflow Engine Core (produce ~800 lines)

Redesign the workflow engine to support enterprise-grade automation patterns. Keep backwards compatibility with existing WorkflowRule.

1. Create `lib/automation/workflow-types.ts` - new type system:
   ```
   WorkflowDefinition {
     id, name, description, version, org_id, enabled, created_by
     trigger: TriggerNode
     steps: WorkflowStep[]
   }

   WorkflowStep = ActionStep | ConditionStep | ApprovalStep | ParallelStep | DelayStep | LoopStep

   ActionStep { type: 'action', action: ActionType, config, onError: 'stop' | 'continue' | 'retry' }
   ConditionStep { type: 'condition', conditions: Condition[], thenSteps: WorkflowStep[], elseSteps: WorkflowStep[] }
   ApprovalStep { type: 'approval', approvers: string[], timeout: Duration, onTimeout: 'approve' | 'reject' | 'escalate', timeoutEscalateTo?: string[] }
   ParallelStep { type: 'parallel', branches: WorkflowStep[][] }
   DelayStep { type: 'delay', duration: Duration }
   LoopStep { type: 'loop', collection: string, itemVariable: string, steps: WorkflowStep[], maxIterations: number }

   Condition { field: string, operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'exists' | 'not_exists' | 'matches', value: any }
   ```

2. Create `lib/automation/workflow-executor.ts` - execution runtime:
   - `executeWorkflow(definition, context)` - walks the step tree, executes each step
   - Step execution is recursive for nested steps (conditions, parallel, loops)
   - Each step produces an `ExecutionResult { stepId, status, output, error, duration, childResults }`
   - Parallel steps use `Promise.allSettled` for concurrent execution
   - Approval steps create a pending approval record and pause execution (resume via callback)
   - Delay steps schedule a Trigger.dev delayed task
   - Error handling per step: stop (abort workflow), continue (skip, log, proceed), retry (up to 3 times with backoff)
   - Full execution trace stored for debugging

3. Create `lib/automation/workflow-context.ts` - execution context management:
   - `WorkflowContext` class with variable scoping (global, step-level, loop iteration)
   - Expression evaluator: `{{trigger.data.taskId}}`, `{{steps.step1.output.score}}`, `{{env.orgName}}`
   - Built-in functions: `now()`, `formatDate()`, `jsonPath()`, `coalesce()`, `count()`, `sum()`

4. Create `lib/automation/workflow-store.ts` - persistence:
   - `saveWorkflowDefinition(def)` - versioned storage, new version on each save
   - `getWorkflowDefinition(id, version?)` - load specific or latest version
   - `listWorkflows(orgId, { enabled?, trigger? })` - list with filters
   - `getWorkflowExecutionHistory(workflowId, { status?, limit? })` - execution log
   - `getExecutionDetail(executionId)` - full step trace

#### Phase 2: Execution Infrastructure (produce ~500 lines)

1. Create migration `supabase/migrations/20260315_workflow_engine_v2.sql`:
   - `workflow_definitions` table (id, org_id, name, description, version, definition JSONB, enabled, created_by, created_at, updated_at)
   - `workflow_executions` table (id, workflow_id, org_id, trigger_event JSONB, status enum, started_at, completed_at, error, execution_trace JSONB)
   - `workflow_approvals` table (id, execution_id, step_id, approvers JSONB, status, approved_by, approved_at, timeout_at)
   - RLS policies scoped to org_id
   - Indexes for common query patterns

2. Create `trigger/workflow-execution.ts` - Trigger.dev tasks:
   - `executeWorkflowTask` - main execution task with timeout and retry
   - `resumeWorkflowAfterDelay` - resume paused workflow after delay step
   - `resumeWorkflowAfterApproval` - resume after approval decision
   - `workflowTimeoutCheck` - check and handle approval timeouts

3. Create `app/api/automation/workflows/route.ts` - CRUD for workflow definitions
4. Create `app/api/automation/workflows/[id]/route.ts` - GET, PATCH, DELETE, POST execute (manual trigger)
5. Create `app/api/automation/workflows/[id]/executions/route.ts` - GET execution history
6. Create `app/api/automation/approvals/route.ts` - GET pending approvals, POST approve/reject

#### Phase 3: Workflow Templates (produce ~400 lines)

Create pre-built workflow templates for common compliance patterns.

1. Create `lib/automation/templates/` directory with templates:
   - `certificate-expiry-escalation.ts` - when certificate expiring → notify assignee → wait 7 days → if not renewed → notify manager → wait 3 days → escalate to compliance lead → create overdue task
   - `evidence-review-cycle.ts` - when evidence uploaded → assign reviewer → if reviewer approves → update control status → recalculate compliance score; if reviewer rejects → notify uploader with reason → create remediation task
   - `new-employee-onboarding.ts` - when member added → create training tasks based on role → assign orientation checklist → schedule 30-day compliance check → if checklist incomplete at 30 days → notify manager
   - `incident-response.ts` - when incident created → classify severity → if critical → notify all admins + create war room → assign incident lead → create investigation tasks → schedule 48-hour review; if non-critical → assign to on-call → create investigation task
   - `quarterly-compliance-review.ts` - scheduled quarterly → gather all control statuses → identify gaps → create remediation tasks for gaps → generate compliance report → notify executive team → schedule follow-up in 30 days
   - `vendor-risk-assessment.ts` - when vendor added → create risk questionnaire task → assign to procurement → when completed → score vendor risk → if high risk → require approval from compliance lead → schedule annual re-review
   - `policy-review-cycle.ts` - scheduled annually per policy → notify policy owner → create review task → if not completed in 14 days → escalate → when completed → update policy version → notify affected staff → create acknowledgment tasks
   - `audit-preparation.ts` - 30 days before audit → gather evidence inventory → identify gaps → create evidence collection tasks → 14 days before → verify all evidence current → generate audit readiness report → 7 days before → final review notification

2. Create `lib/automation/templates/index.ts` - template registry with metadata (name, description, industry, framework, trigger type, estimated setup time)

#### Phase 4: Visual Workflow Builder UI (produce ~800 lines)

Build a visual workflow builder that lets users create and edit workflows.

1. Create `components/automation/workflow-builder.tsx` - main builder component:
   - Canvas area with step nodes connected by arrows
   - Drag-and-drop step palette (action, condition, approval, parallel, delay, loop)
   - Click-to-configure each step
   - Visual validation (red borders on invalid steps, connection warnings)
   - Zoom and pan controls
   - Undo/redo support

2. Create `components/automation/workflow-step-node.tsx` - individual step rendering:
   - Different visual shapes per step type (rectangle for action, diamond for condition, octagon for approval, parallel bars for parallel)
   - Status indicators (configured/unconfigured, enabled/disabled)
   - Inline summary of step configuration
   - Delete and reorder handles

3. Create `components/automation/workflow-step-config.tsx` - step configuration panel:
   - Dynamic form based on step type
   - Action type selector with config fields per action
   - Condition builder with field/operator/value
   - Approval config (approver selection, timeout, escalation)
   - Delay duration picker
   - Variable insertion with autocomplete (`{{trigger.data...}}`)

4. Create `components/automation/workflow-template-picker.tsx` - template selection:
   - Grid of template cards with industry/framework tags
   - Preview of template steps
   - One-click install with customization dialog

5. Create `components/automation/workflow-execution-viewer.tsx` - execution trace viewer:
   - Same visual layout as builder but read-only
   - Each step colored by execution status (green=success, red=failed, yellow=pending, gray=skipped)
   - Click step to see input/output/error details
   - Timeline view with duration per step
   - Re-run button for failed workflows

6. Create `app/app/workflows/page.tsx` - workflow management page:
   - List of workflows with status, last run, success rate
   - Create new workflow (blank or from template)
   - Edit existing workflow (opens builder)
   - Execution history per workflow
   - Enable/disable toggle

7. Create `app/app/workflows/[id]/page.tsx` - workflow detail page:
   - Visual builder in edit mode
   - Execution history tab
   - Settings tab (name, description, trigger config, enabled)

### Output Required

- Complete workflow type system with all step types
- Execution runtime with context, variables, and error handling
- Database migration for workflow tables
- Trigger.dev tasks for async execution
- 8 pre-built workflow templates
- Visual workflow builder UI components
- Workflow management pages
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="workflow|automation"
```

---

## Master Prompt 4: Real-Time Notification Platform And Activity Intelligence

> **Expected output: ~2,200+ lines of notification infrastructure, activity feed, preferences, and delivery channels**

You are the real-time platform engineer for FormaOS. A compliance platform must keep users informed about deadline changes, evidence reviews, compliance drift, certificate expirations, and team activity. The current system has basic Supabase Realtime hooks (323 lines) and presence types, but no notification center, no delivery preferences, no email digests, no multi-channel routing, and no activity feed in the product app.

### Context

Current state:
- `lib/realtime.ts` (323 lines): `useRealtimeTable`, `useActivityFeed`, `usePresence` hooks using Supabase Realtime channels
- `components/notifications/` exists but content unknown
- No notification preferences system
- No email digest capability (Resend is available for transactional email)
- No in-app notification center component
- No notification routing (in-app vs email vs Slack)
- Activity feed exists in admin console but not in the product app
- Slack and Teams connectors exist in `lib/integrations/` but not wired for notifications
- `lib/email/` has email sending infrastructure via Resend

### Your Job

#### Phase 1: Notification Data Model And Engine (produce ~500 lines)

1. Create migration `supabase/migrations/20260315_notifications.sql`:
   - `notifications` table: id, org_id, user_id, type (enum), title, body, data JSONB, read_at, archived_at, created_at
   - `notification_preferences` table: id, user_id, org_id, channel (in_app | email | slack | teams), event_type, enabled, digest_frequency (instant | hourly | daily | weekly | never)
   - `notification_channels` table: id, user_id, org_id, channel_type, config JSONB (slack_channel, teams_webhook, email_override), verified, created_at
   - `activity_feed` table: id, org_id, actor_id, actor_email, action, resource_type, resource_id, resource_name, metadata JSONB, created_at
   - RLS policies: users see only their own notifications and org activity
   - Indexes on (user_id, read_at), (org_id, created_at), (user_id, type)

2. Create `lib/notifications/types.ts` - notification event types:
   ```
   NotificationEventType =
     | 'task.assigned' | 'task.due_soon' | 'task.overdue' | 'task.completed'
     | 'evidence.review_requested' | 'evidence.approved' | 'evidence.rejected'
     | 'certificate.expiring_30d' | 'certificate.expiring_7d' | 'certificate.expired'
     | 'compliance.score_dropped' | 'compliance.score_improved' | 'compliance.gap_detected'
     | 'member.joined' | 'member.removed' | 'member.role_changed'
     | 'workflow.approval_requested' | 'workflow.completed' | 'workflow.failed'
     | 'incident.created' | 'incident.escalated' | 'incident.resolved'
     | 'system.maintenance' | 'system.release' | 'system.security_alert'
     | 'report.ready' | 'export.completed' | 'export.failed'
   ```

3. Create `lib/notifications/engine.ts` - notification dispatch engine:
   - `notify(orgId, recipients, event)` - main dispatch function
   - Resolves recipient preferences per channel
   - Creates in-app notification record
   - Routes to enabled channels: email (immediate or digest queue), Slack, Teams
   - Supports bulk notify (e.g., notify all org admins)
   - Deduplication: don't re-notify for the same event within configurable window
   - Priority levels: critical (bypass digest, always deliver), high, normal, low

4. Create `lib/notifications/digest.ts` - email digest system:
   - `queueForDigest(userId, notification)` - add to digest queue
   - `generateDigest(userId, frequency)` - compile queued notifications into digest email
   - `sendDigest(userId, digest)` - render and send via Resend
   - Digest frequencies: hourly, daily (9am user timezone), weekly (Monday 9am)

5. Create `lib/notifications/channels/` - channel adapters:
   - `in-app.ts` - insert into notifications table
   - `email.ts` - send via Resend with branded template, or queue for digest
   - `slack.ts` - post to user's configured Slack channel using existing connector
   - `teams.ts` - post to Teams webhook using existing connector

#### Phase 2: Notification Center UI (produce ~700 lines)

1. Create `components/notifications/notification-center.tsx` - slide-out notification panel:
   - Triggered by bell icon in topbar with unread badge count
   - Grouped by date (Today, Yesterday, This Week, Earlier)
   - Each notification: icon (per type), title, body preview, timestamp, read/unread indicator
   - Click to navigate to relevant resource
   - Mark as read (individual and all)
   - Archive/dismiss
   - Filter by type (tasks, compliance, team, system)
   - Infinite scroll with cursor-based pagination

2. Create `components/notifications/notification-item.tsx` - individual notification row:
   - Type-specific icon and color coding
   - Smart timestamp ("2 minutes ago", "Yesterday at 3pm")
   - Action buttons (mark read, archive, view resource)
   - Swipe-to-dismiss on mobile

3. Create `components/notifications/notification-preferences.tsx` - preferences panel:
   - Matrix: rows = event types (grouped by category), columns = channels (in-app, email, Slack, Teams)
   - Toggle each combination on/off
   - Email digest frequency selector per category
   - "Quiet hours" configuration
   - "Notification test" button to send a test notification through each channel
   - Accessible from user profile/settings

4. Create `components/notifications/notification-toast.tsx` - real-time toast notifications:
   - Auto-show when new critical/high-priority notification arrives
   - Stack up to 3 toasts
   - Auto-dismiss after 5 seconds (configurable)
   - Click to view, X to dismiss
   - Uses Supabase Realtime subscription on notifications table

5. Update `components/topbar.tsx` - add notification bell icon:
   - Unread count badge (red dot for 1-9, number for 10+)
   - Click opens NotificationCenter
   - Real-time badge update via Supabase subscription

#### Phase 3: Activity Feed (produce ~500 lines)

1. Create `lib/activity/feed.ts` - activity feed engine:
   - `logActivity(orgId, actorId, action, resource)` - unified activity logging
   - `getActivityFeed(orgId, { cursor, limit, filters })` - paginated feed with filters
   - `getResourceActivity(orgId, resourceType, resourceId)` - activity for specific resource
   - `getUserActivity(orgId, userId)` - what a specific user has done
   - Activity types: created, updated, deleted, assigned, completed, approved, rejected, uploaded, downloaded, commented, shared, archived, restored

2. Create `components/activity/activity-feed.tsx` - activity feed component:
   - Timeline view with avatars, action descriptions, timestamps
   - Filterable by: activity type, user, resource type, date range
   - Collapsible groups for rapid-fire activities ("3 tasks completed in the last hour")
   - Click-through to the resource
   - Real-time updates via Supabase subscription

3. Create `components/activity/activity-item.tsx` - individual activity entry:
   - User avatar + name
   - Action verb with resource link: "Jane uploaded evidence for Control AC-1"
   - Relative timestamp
   - Contextual metadata (e.g., compliance score change: "+3 points")

4. Create `app/app/activity/page.tsx` - dedicated activity page:
   - Full activity feed for the organization
   - Sidebar filters
   - Export activity log as CSV

5. Wire activity logging into key mutation paths:
   - Task CRUD, assignment, status changes
   - Evidence upload, verification, rejection
   - Member changes (invite, join, role change, remove)
   - Compliance score changes
   - Workflow executions
   - Settings changes
   - Framework installation/removal

#### Phase 4: Notification API Routes (produce ~300 lines)

1. `app/api/notifications/route.ts` - GET notifications (paginated, filterable), PATCH mark read/archived
2. `app/api/notifications/preferences/route.ts` - GET/PUT preferences
3. `app/api/notifications/channels/route.ts` - GET/POST/DELETE notification channels
4. `app/api/notifications/unread-count/route.ts` - GET unread count (for badge)
5. `app/api/activity/route.ts` - GET activity feed (paginated, filterable)

#### Phase 5: Digest Job (produce ~200 lines)

1. Create `trigger/notification-digest.ts` - Trigger.dev scheduled task:
   - Runs every hour
   - For each user with pending hourly digest: compile and send
   - Daily digest: runs at 9am per user timezone
   - Weekly digest: runs Monday 9am per user timezone
   - Track digest send history to prevent duplicates

### Output Required

- Notification database schema with migration
- Notification engine with multi-channel routing
- Email digest system with Trigger.dev scheduled processing
- Notification center UI (panel, preferences, toasts)
- Activity feed system with UI
- API routes for notifications and activity
- Activity logging wired into key mutation paths
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="notification|activity|digest"
# Manual: trigger a task assignment, verify in-app notification appears, verify email sent
```

---

## Master Prompt 5: Enterprise Identity, SCIM Provisioning, SSO Hardening, And Data Governance

> **Expected output: ~2,500+ lines of identity management, SCIM server, SSO flows, data governance, and compliance automation**

You are the enterprise identity and data governance engineer for FormaOS. Enterprise buyers require automated user provisioning (SCIM), hardened SSO/SAML, directory sync, data residency enforcement, retention policies, and identity-aware audit trails. The current implementations exist but are incomplete: SCIM server (733 lines, single file), SSO/SAML (338 lines, 2 files), data residency (3,561 lines but no enforcement middleware).

### Context

Current state:
- `lib/scim/scim-server.ts` (733 lines): SCIM 2.0 server with user CRUD, but needs group support, pagination, bulk operations, error handling per RFC 7644, and integration tests
- `lib/sso/saml.ts` (187 lines): SAML assertion parsing and validation
- `lib/sso/org-sso.ts` (151 lines): org-level SSO configuration management
- `lib/data-residency.ts` (3,561 lines): data residency types and configuration, but no middleware enforcement, no routing, no compliance verification
- `app/api/scim/` and `app/api/sso/` routes exist but unclear completeness
- No JIT (Just-In-Time) provisioning validation
- No directory sync (Azure AD, Okta, Google Workspace)
- No data retention policy engine
- No PII scanning or data classification
- No identity provider event audit logging
- No cross-tenant isolation verification (automated)
- Supabase Auth is the auth backbone with email/password, magic link, Google OAuth, and SAML

### Your Job

#### Phase 1: SCIM 2.0 Server Completion (produce ~600 lines)

Harden the SCIM server to be fully RFC 7644 compliant.

1. Enhance `lib/scim/scim-server.ts`:
   - Add Group resource support: create group → map to FormaOS role, update group membership, delete group
   - Add bulk operations endpoint (`/Bulk`) with `failOnErrors` support
   - Add proper pagination with `startIndex`, `count`, `totalResults` per RFC 7644 Section 3.4.2
   - Add filtering support (`filter=userName eq "john"`) with operators: eq, ne, co, sw, ew, gt, lt, ge, le, pr
   - Add sorting support
   - Add ETags for conflict detection
   - Return proper SCIM error responses (status, scimType, detail) per RFC 7643 Section 3.12

2. Create `lib/scim/scim-groups.ts` - Group management:
   - Map SCIM groups to FormaOS roles/teams
   - Handle nested group membership
   - Sync group changes to org membership and permissions

3. Create `lib/scim/scim-schemas.ts` - schema definitions:
   - User schema with enterprise extension
   - Group schema
   - ServiceProviderConfig schema
   - ResourceTypes schema
   - Schemas endpoint for schema discovery

4. Create `lib/scim/scim-auth.ts` - SCIM authentication:
   - Bearer token authentication for SCIM endpoints
   - Token generation and rotation per org
   - Rate limiting per SCIM token
   - Audit logging for all SCIM operations

5. Enhance SCIM API routes:
   - `app/api/scim/v2/Users/route.ts` - GET (list with pagination/filter), POST (create)
   - `app/api/scim/v2/Users/[id]/route.ts` - GET, PUT, PATCH, DELETE
   - `app/api/scim/v2/Groups/route.ts` - GET (list), POST (create)
   - `app/api/scim/v2/Groups/[id]/route.ts` - GET, PUT, PATCH, DELETE
   - `app/api/scim/v2/Bulk/route.ts` - POST bulk operations
   - `app/api/scim/v2/Schemas/route.ts` - GET schema discovery
   - `app/api/scim/v2/ServiceProviderConfig/route.ts` - GET capabilities
   - `app/api/scim/v2/ResourceTypes/route.ts` - GET resource types

#### Phase 2: SSO/SAML Hardening (produce ~400 lines)

1. Enhance `lib/sso/saml.ts`:
   - SP-initiated flow: generate AuthnRequest with signing, redirect to IdP, handle response
   - IdP-initiated flow: validate unsolicited response, enforce audience restriction
   - Assertion validation: signature verification, condition checks (NotBefore, NotOnOrAfter), audience URI matching
   - Single Logout (SLO): handle logout request from IdP, initiate logout to IdP
   - Metadata endpoint: generate SP metadata XML with signing certificate, ACS URL, SLO URL

2. Create `lib/sso/jit-provisioning.ts` - Just-In-Time provisioning:
   - On first SAML login: create user account, create org membership, assign default role
   - On subsequent logins: update user attributes from SAML assertion (name, email, groups)
   - Map SAML groups/roles to FormaOS roles
   - Validate email domain matches org SSO configuration
   - Audit log JIT provisioning events

3. Create `lib/sso/directory-sync.ts` - directory synchronization:
   - `syncDirectory(orgId, provider, config)` - pull users and groups from directory
   - Support providers: Azure AD (Microsoft Graph), Okta (SCIM push), Google Workspace (Admin SDK)
   - Sync operations: create missing users, deactivate removed users, update changed attributes, sync group memberships
   - Conflict resolution: directory is source of truth, FormaOS-only attributes preserved
   - Scheduled sync (configurable interval) via Trigger.dev
   - Sync status dashboard with last sync time, changes made, errors

4. Create SSO management routes:
   - `app/api/sso/config/route.ts` - GET/PUT SSO configuration per org
   - `app/api/sso/metadata/route.ts` - GET SP metadata XML
   - `app/api/sso/test/route.ts` - POST test SSO connection
   - `app/api/sso/directory-sync/route.ts` - GET sync status, POST trigger sync

5. Create SSO management UI:
   - `components/settings/sso-config.tsx` - SSO configuration panel:
     - IdP metadata upload or URL
     - ACS URL and Entity ID display (for customer to configure IdP)
     - Test connection button
     - JIT provisioning toggle and default role selector
     - Domain restriction configuration
   - `components/settings/directory-sync.tsx` - directory sync panel:
     - Provider selector (Azure AD, Okta, Google Workspace)
     - Connection configuration
     - Sync schedule configuration
     - Last sync status and history
     - Manual sync trigger

#### Phase 3: Data Governance Engine (produce ~800 lines)

1. Create `lib/data-governance/retention.ts` - data retention policy engine:
   - `RetentionPolicy { org_id, resource_type, retention_days, action: 'archive' | 'delete' | 'anonymize', exceptions: string[] }`
   - `applyRetentionPolicy(orgId, policy)` - configure retention for a resource type
   - `evaluateRetention(orgId)` - find records past retention, return count per type
   - `executeRetention(orgId, dryRun)` - archive/delete/anonymize expired records
   - Built-in policies per compliance framework (GDPR: right to erasure, SOC2: log retention)
   - Immutable audit trail for all retention actions

2. Create `lib/data-governance/classification.ts` - data classification:
   - Classification levels: public, internal, confidential, restricted
   - Auto-classification rules based on field names (email, phone, ssn, dob → PII → confidential)
   - Manual classification overrides
   - Classification report generation

3. Create `lib/data-governance/pii-scanner.ts` - PII detection:
   - Scan patterns: email addresses, phone numbers, SSN/TFN patterns, dates of birth, names (via NER), addresses, financial data
   - `scanRecord(record)` - return PII fields found with classification
   - `scanTable(table, sampleSize)` - sample records and report PII presence
   - `generatePIIReport(orgId)` - comprehensive PII inventory

4. Create `lib/data-governance/residency-enforcement.ts` - data residency middleware:
   - `enforceResidency(orgId, operation, data)` - validate data stays within configured region
   - Region detection from org configuration
   - Block cross-region data transfers that violate policy
   - Log residency violations
   - Integration with Supabase Edge Functions for region-aware routing

5. Create `lib/data-governance/isolation-verifier.ts` - tenant isolation verification:
   - `verifyIsolation(orgId)` - run isolation checks:
     - Verify RLS policies are active on all tenant-scoped tables
     - Attempt cross-org data access (should fail)
     - Verify org_id is present and indexed on all tenant tables
     - Check for any queries without org_id filter
   - `generateIsolationReport(orgId)` - compliance report for tenant isolation
   - Scheduled verification via Trigger.dev (weekly)

6. Create migration `supabase/migrations/20260315_data_governance.sql`:
   - `retention_policies` table
   - `retention_executions` table (audit trail)
   - `data_classifications` table
   - `pii_scan_results` table
   - `isolation_verification_results` table
   - RLS policies for all governance tables

#### Phase 4: Data Governance API And UI (produce ~500 lines)

1. Create API routes:
   - `app/api/governance/retention/route.ts` - GET/POST retention policies
   - `app/api/governance/retention/execute/route.ts` - POST execute retention (with dry-run option)
   - `app/api/governance/classification/route.ts` - GET/PUT data classifications
   - `app/api/governance/pii/route.ts` - GET PII scan results, POST trigger scan
   - `app/api/governance/isolation/route.ts` - GET isolation verification results, POST trigger verification
   - `app/api/governance/residency/route.ts` - GET residency configuration, PUT update

2. Create data governance UI:
   - `app/app/governance/page.tsx` - data governance dashboard:
     - Retention policy overview with next execution dates
     - PII inventory summary
     - Data classification breakdown
     - Isolation verification status
     - Residency compliance status

   - `components/governance/retention-policies.tsx` - retention policy management:
     - List policies by resource type
     - Create/edit policy (resource type, retention days, action)
     - Dry-run execution with preview of affected records
     - Execution history

   - `components/governance/pii-dashboard.tsx` - PII inventory:
     - Heatmap of PII across tables
     - Classification assignments
     - Export PII inventory as compliance artifact

   - `components/governance/isolation-status.tsx` - isolation verification:
     - Last verification date and result
     - Table-by-table RLS status
     - Any violations highlighted
     - Trigger manual verification

#### Phase 5: Identity Event Audit Trail (produce ~200 lines)

1. Create `lib/identity/audit.ts` - identity-specific audit logging:
   - Log all identity events: SCIM user create/update/delete, SCIM group changes, SSO login, SSO logout, JIT provisioning, directory sync, password change, MFA enrollment/removal, API key create/revoke, session create/revoke
   - Structured log format with: timestamp, event_type, actor (user or SCIM client or system), target_user, org_id, ip_address, user_agent, result (success/failure), metadata
   - Queryable via API: filter by event type, actor, target, date range
   - Export as compliance artifact (CSV, JSON, PDF)

2. Create `app/api/identity/audit/route.ts` - GET identity events with filtering and pagination
3. Create `components/identity/identity-audit-log.tsx` - UI for viewing identity events:
   - Timeline view with filtering
   - Event detail expansion
   - Export button

### Output Required

- Complete SCIM 2.0 server with groups, bulk, pagination, filtering
- Hardened SSO/SAML with SLO, metadata, JIT provisioning
- Directory sync for Azure AD, Okta, Google Workspace
- Data retention policy engine with execution
- PII scanner and data classification
- Tenant isolation verification
- Data residency enforcement middleware
- Data governance dashboard UI
- Identity event audit trail
- Database migrations for all new tables
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="scim|sso|governance|identity|residency"
# Manual: configure SCIM in test IdP, provision user, verify in FormaOS
# Manual: configure SSO, test SP-initiated login, verify JIT provisioning
# Manual: set retention policy, run dry-run, verify affected records
```

---

## Execution Notes

### Priority Order

1. **Prompt 1 (Testing)** - run first. Tests protect everything else you build.
2. **Prompt 3 (Workflows)** - highest product value for existing customers.
3. **Prompt 4 (Notifications)** - makes the platform feel alive and responsive.
4. **Prompt 2 (API Platform)** - unlocks enterprise integrations and developer adoption.
5. **Prompt 5 (Identity/Governance)** - required for enterprise sales but can follow the others.

### Estimated Output

| Prompt | Estimated Lines | Key Deliverables |
|---|---|---|
| 1. Test Infrastructure | ~3,000 | Factories, helpers, 50+ test suites, 5 E2E specs |
| 2. API Platform | ~2,800 | API keys, 11 endpoints, webhook delivery, integration UI |
| 3. Workflow Engine | ~2,500 | Engine v2, executor, 8 templates, visual builder |
| 4. Notifications | ~2,200 | Engine, digest, center UI, activity feed, preferences |
| 5. Identity/Governance | ~2,500 | SCIM groups, SSO hardening, retention, PII, isolation |
| **Total** | **~13,000** | |

### What These Prompts Do NOT Cover (handled by items 1-10)

- Admin operating policy and delegated admin workflows
- Org lifecycle controls (suspend/restore/retire)
- Customer health and activation views
- Enterprise proof pack / sales artifacts
- Engineering change matrix
- Release discipline and checklists
- Market segment selection
- Buyer confidence / trust center improvements
- Operator metrics dashboard
- Naming consolidation and hidden complexity reduction
