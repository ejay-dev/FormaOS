# Smoke Test Checklist — Audit Wave 2026-04-30

Companion to `docs/deep-codebase-audit.md`. Covers every behavior changed by commits `c3a856c` through the most recent audit-driven commit. The migrations from `supabase/migrations/20260430_*` and `20260501_*` should already be applied before running this checklist.

Execution order matters: each section depends on the previous one's auth state. Plan ~30-45 min for a full pass against a fresh local dev server.

```bash
npm run dev
```

---

## 1. Bootstrap & auth (commit `c3a856c`, P1 #7, #8)

| # | Step | Expected |
|---|---|---|
| 1.1 | Open `/auth/signup`. Sign up with a fresh email + password. Pick `Foundation` plan. | Redirected to `/app` (or onboarding). New org created. |
| 1.2 | In Supabase SQL editor: `SELECT plan_key, status, trial_started_at, trial_expires_at FROM org_subscriptions WHERE organization_id = '<your-org>';` | `status = 'pending_checkout'` (not `'trialing'`). `trial_started_at` is null. `trial_expires_at` is ~14 days out. |
| 1.3 | Sign out. Try to sign in via Google OAuth (if configured). | Sign-in completes successfully — confirms OAuth state validation is working when state cookie/param are present. |
| 1.4 | (Optional) Tamper test: open dev tools → Application → Local Storage → confirm `formaos_is_founder` is **not** set. | Key absent; previous founder leak removed. |

---

## 2. Stripe webhook idempotency state machine (commit `c3a856c`, P0 #3)

Requires Stripe CLI: `stripe listen --forward-to http://localhost:3000/api/billing/webhook`.

| # | Step | Expected |
|---|---|---|
| 2.1 | Trigger a checkout completion: `stripe trigger checkout.session.completed`. | Webhook returns 200. SQL: `SELECT id, status, attempts FROM billing_events ORDER BY started_at DESC LIMIT 5;` shows the event with `status='succeeded'`, `attempts=1`. |
| 2.2 | Re-send the SAME event from Stripe dashboard. | Webhook returns 200 with `{"received": true, "idempotent": true}`. The row is still `succeeded`, `attempts` unchanged. |
| 2.3 | Simulate a side-effect failure (temporarily break `syncEntitlementsForPlan` by env, or just observe the path on a real failure). After re-delivery: SQL same query. | First failed attempt has `status='failed'`. Stripe retry shows `attempts=2`. After eventual success, `status='succeeded'`. |

---

## 3. Stripe price fail-closed (commit `c3a856c`, P0 #4)

| # | Step | Expected |
|---|---|---|
| 3.1 | Set `NODE_ENV=production` and unset `STRIPE_PRICE_FOUNDATION` locally. Run `npm run build`. | Build succeeds (it's not a build-time check). |
| 3.2 | Hit the checkout flow. | `getStripePriceId('basic')` returns null in production with no fallback; checkout surfaces `stripe_price_id_missing` warning instead of charging against the dev sandbox ID. |

---

## 4. RLS regressions closed (migrations `001`, `002`, `003`, `005`)

| # | Step | Expected |
|---|---|---|
| 4.1 | Create two test users in different orgs. | Each org isolated. |
| 4.2 | As user A, grab an `org_evidence.id` belonging to org A. | Returns row. |
| 4.3 | As user B, query the same id: `select * from public.org_evidence where id = '<from-A>';` | Zero rows. |
| 4.4 | Repeat for `control_evidence`, `org_certifications`, `org_files`, `policies`, `tasks`, `webhook_deliveries`. | All zero-rows from cross-org perspective. |
| 4.5 | `org_control_evaluations` cross-org check (now has RLS). | Zero rows from cross-org. |

---

## 5. Reports export entitlement gate (commit `c3a856c`, P1 #14)

| # | Step | Expected |
|---|---|---|
| 5.1 | As a Foundation org member with role=admin, hit `GET /api/reports/export?type=soc2`. | If `audit_export` entitlement enabled (Foundation has it by default), 200 + jobId. If somehow disabled, 403 with `code=ENTITLEMENT_REQUIRED`. |
| 5.2 | Repeat as `member` role. | 403 admin-required. |

---

## 6. Forms public submit disabled (commit `c3a856c`, P1 #5)

| # | Step | Expected |
|---|---|---|
| 6.1 | Visit `/submit/<any-form-id>` directly. | 404 (next/notFound). The legacy split-brain submission route is intentionally disabled. |

---

## 7. Workflow store org scoping (commit `c3a856c`, P1 #10)

| # | Step | Expected |
|---|---|---|
| 7.1 | Create a workflow as user A in org A. Note the workflow id. | Workflow created. |
| 7.2 | As user B in org B, hit `GET /api/automation/workflows/[id]/executions?id=<A's-id>`. | Empty `executions` array — `getWorkflowExecutionHistory` now filters on org_id. Previously this would return A's execution history. |

---

## 8. Staff credential governance (commit `c3a856c`, P1 #12)

| # | Step | Expected |
|---|---|---|
| 8.1 | As user with role=`member`, hit `/app/staff-compliance` and try to create a credential. | Form action throws "Forbidden: only owner/admin/compliance/manager roles can register staff credentials." |
| 8.2 | As user with role=`admin`, create a credential with a `user_id` belonging to a user from a DIFFERENT org. | Throws "Target user is not a member of this organization." |
| 8.3 | As user with role=`admin`, create a credential successfully. | Audit row in `org_audit_logs` with `entity_type='staff_credential'`, action `STAFF_CREDENTIAL_CREATED`. |
| 8.4 | As role=`member`, try `verifyStaffCredential`. | Throws "Forbidden: only owner/admin/compliance roles can verify credentials." |

---

## 9. AI usage limits enforced (commit `c3a856c`, P1 #18)

Requires `OPENAI_API_KEY`.

| # | Step | Expected |
|---|---|---|
| 9.1 | As Foundation org user, send a message via AI chat. | Response streams. After completion, SQL: `SELECT * FROM ai_usage_log ORDER BY created_at DESC LIMIT 1;` shows the org's row with token counts. |
| 9.2 | Manually insert 1001 ai_usage_log rows for the org for the current month, then try to send another. | 429 with `error: 'AI usage limit reached'` and details payload. |

---

## 10. Audit-log typed columns (commit `efb61115` + migration `006`)

| # | Step | Expected |
|---|---|---|
| 10.1 | Create a CAPA / resolve an incident / verify a credential / approve a policy. | Each writes a fresh `org_audit_logs` row. |
| 10.2 | SQL: `SELECT entity_type, entity_id, action FROM org_audit_logs ORDER BY created_at DESC LIMIT 5;` | Most recent rows have non-null `entity_type` (`capa`/`incident`/`staff_credential`/`policy`) and `entity_id`. |
| 10.3 | Open an entity detail page that shows audit history (e.g., `/app/capa/[id]`). | Recent events appear. |

---

## 11. Policy approval lifecycle Phase 1 (commit `e8ec2182`)

| # | Step | Expected |
|---|---|---|
| 11.1 | As admin, create a new policy. | Lands at status `draft`. SQL: `SELECT version_number, status FROM policy_versions WHERE policy_id = '<new>';` shows v1 / draft. |
| 11.2 | Edit the draft. Save. | Version 1 updates in place (still draft). |
| 11.3 | Click "Submit for Review". | UI shows lifecycle = `pending approval`. `org_audit_logs` has `POLICY_SUBMITTED_FOR_REVIEW`. |
| 11.4 | As the SAME user (the author), reload the page. | Approve/Reject buttons hidden. Self-approval message visible. |
| 11.5 | Sign in as a different owner/admin. Reload the policy detail. Click "Approve & Publish" with optional comment. | Lifecycle now `published`. New audit event `POLICY_APPROVED_AND_PUBLISHED`. SQL: row in `policy_approvals` with `decision='approved'`, comment recorded. |
| 11.6 | Edit the policy again. | Forks v2 (draft). v1 remains as `published` until re-archived; only one published per policy at a time. |
| 11.7 | Submit v2 for review. As the approver, click "Reject" with a reason. | v2 returns to `draft`. v1 still published. `org_audit_logs` has `POLICY_REJECTED`. |

---

## 12. Custom reports + automation + retention + form analytics entitlements (commit `be0f4c05`)

| # | Step | Expected |
|---|---|---|
| 12.1 | As Foundation user, hit `GET /api/v1/reports/custom`. | 403 — `Custom reports require a Growth or Enterprise entitlement`. |
| 12.2 | Bump the org to Pro (set `org_entitlements.enabled=true` for `custom_reports`). Same call. | 200, list of saved reports. |
| 12.3 | As Foundation user, hit `GET /api/automation/workflows`. | 403 with `Workflow automation requires an Enterprise entitlement`. |
| 12.4 | As Foundation user, hit `GET /api/governance/retention`. | 403 entitlement error. |
| 12.5 | As Foundation user, hit `GET /api/v1/forms/[formId]/analytics`. | 403 — `Form analytics requires a Growth or Enterprise entitlement`. |

---

## 13. Report export storage durability (Option B / migration `20260501_002`)

| # | Step | Expected |
|---|---|---|
| 13.1 | Trigger a report export. Note the `jobId`. | Job runs, completes. |
| 13.2 | Wait >1 hour. Hit `GET /api/reports/exports/[jobId]/status`. | `fileUrl` is present and DOWNLOADS successfully. The status route regenerates a fresh signed URL on every call. (Pre-fix this URL would have rotted.) |
| 13.3 | SQL: `SELECT storage_path, storage_bucket FROM report_export_jobs WHERE id = '<jobId>';` | Both columns populated. |

---

## 14. List page sanitization + pagination (Option C)

| # | Step | Expected |
|---|---|---|
| 14.1 | `/app/participants?q=foo,bar` | List filtered by ilike `%foobar%` — comma stripped — not multiple OR filters. |
| 14.2 | `/app/participants?q=` containing `(` `)` `*` `%` `_`. | Special chars stripped. No PostgreSQL/PostgREST errors. |
| 14.3 | `/app/participants?page=2` (with >50 participants in fixture). | Shows participants 51-100. |
| 14.4 | `/app/forms?page=2&q=` similar. | Pagination + sanitization both work. |

---

## 15. Status CHECK constraints (Option A / migration `20260501_001`)

| # | Step | Expected |
|---|---|---|
| 15.1 | Try to insert a row into `org_tasks` with `status='nonsense'` via Supabase SQL editor. | Constraint violation: `org_tasks_status_check`. |
| 15.2 | Repeat for org_policies, org_incidents, org_staff_credentials, org_assets, org_risks. | Each blocks invalid status values; allowed values still work. |
| 15.3 | Existing rows with non-allowlisted statuses still load fine. | Yes — constraints are `NOT VALID`. Operator can later run `ALTER TABLE ... VALIDATE CONSTRAINT ...` after cleanup. |

---

## 16. Care plan goals backfill (Option D / migration `20260501_003`)

| # | Step | Expected |
|---|---|---|
| 16.1 | Pick a care plan with JSONB goals. SQL: `SELECT goal_text, status, progress_percentage FROM org_care_goals WHERE care_plan_id = '<plan>';` | Returns a row per JSONB goal. Status mapped (pending → not_started, achieved → achieved). |
| 16.2 | The in-app care-plan detail page still works. | Yes — the page reads JSONB, which is unchanged. Backfill is a one-shot read enrichment; Phase 2 will swap reads. |

---

## What this checklist does NOT cover

- Production-only behaviors that need real Stripe / Sentry / Upstash credentials (e.g., distributed rate limit, source-map upload, real Stripe price IDs).
- Multi-region / data-residency.
- Long-running cron jobs (compliance check, report exports queue, security retention).
- Phase 2 of policy lifecycle (acknowledgments, multi-approver quorum, version-history UI) — not yet implemented.
- Permission model consolidation — not yet implemented.

If any item above fails, file an issue with the section number and the actual vs expected. The audit doc at `docs/deep-codebase-audit.md` describes the underlying contract for each finding.
