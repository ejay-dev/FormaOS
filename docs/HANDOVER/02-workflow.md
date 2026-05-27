# 02 — Workflow

How code, ops, and people move through FormaOS. Read this before you ship anything.

## 1. Branching + PR → deploy

### 1.1 The branch model

```
main ──●──●──●──●──●──●──●──●──●──●──●→  (always deployable to prod)
        │  │     │     │  │  │  │  │
        feature branches off main, PR back, squash-merge (or rebase)
```

- `main` is **always deployable**. Vercel deploys every commit on `main` to production.
- Feature branches: short-lived (hours to days), one PR each. Naming is loose — most use `<initials>/<topic>` but it's not enforced.
- No long-lived release branches, no develop branch, no GitFlow.
- Hotfixes: same flow as a feature — branch off `main`, PR, squash-merge. The "hotfix" path is the **same as any other change**; the difference is that you can request `skip_extended_gates` via `workflow_dispatch` on `deployment-gates.yml` (see §2.3) to bypass the slow advisory tests while still running core blocking gates.

### 1.2 Commit-message convention

Look at `git log --oneline -50` for the pattern. The tight version:

```
<type>(<scope>): <short subject under 70 chars>

<body — what changed and WHY, not what (the diff is the what).
Cross-reference audit batch tags like P0-1, R5, M2 when applicable.>

Co-Authored-By: <name> <email>
```

`<type>` ∈ `feat | fix | refactor | chore | docs | style | test | perf`. `<scope>` is freeform — common ones are `audit-YYYY-MM-DD` (during audit cycles), area names like `billing`, `security`, `admin`, or just module paths.

Co-authoring trailer is expected when AI assistants pair with you. The team uses Claude heavily.

### 1.3 The PR

- Open against `main`.
- Title mirrors the commit subject; CI runs immediately.
- Reviews: required if you're not a code owner of the touched files. Solo-founder reality today: most PRs go in self-reviewed. **The new CTO should change this** — at minimum, a "second pair of eyes" review for anything in `app/api/admin/`, `lib/billing/`, `lib/audit/`, `lib/security/`, or any migration.
- Squash-merge is the default; rebase-merge is fine too. Never merge-commit (the history is linear).
- After merge, Vercel deploys; usually 2-4 min to live.

### 1.4 The release discipline checklist

`RELEASE_DISCIPLINE_CHECKLIST.md` at the root has the canonical pre-ship list. The summary:

1. Confirm change category via `ENGINEERING_CHANGE_MATRIX.md` (per-area required checks).
2. Run `npm run type-check`.
3. Run the area-specific checks (admin → `check:admin-nav`, marketing → `audit:marketing-copy`, security → `check:security-baseline`).
4. Re-read user-facing copy for unsupported enterprise claims.
5. Note rollback path on the PR.

`ENGINEERING_CHANGE_MATRIX.md` enumerates which surface needs which extra check. Read it once; it's short.

## 2. CI gates

12 GitHub Actions workflows live in `.github/workflows/`. The grouping that matters:

### 2.1 Blocking on every PR + push (the "merge gate")

| Workflow | Job | What blocks merge |
|---|---|---|
| `qa-pipeline.yml` | type-check, lint (max 25 warnings), unit tests + coverage | Each step is required. |
| `qa-pipeline.yml` | **rls-contract** | Runs jest cross-org isolation + `npm run test:db:rls` + `npm run test:db:orgs-sync`. Skipped on fork PRs (no secrets); blocking on home repo. *Promoted to PR gate 2026-05-27 — was nightly-only before.* |
| `qa-pipeline.yml` | security-scan | `npm audit --audit-level=high --omit=dev` blocking. Snyk blocking when `SNYK_TOKEN` is configured. TruffleHog secret-scan runs on every push. |
| `security-baseline.yml` | 8-check static gate | Tracked .env files, Node runtime drift, no legacy Stripe imports, detailed health auth, security headers, admin MFA gate, CSRF default-on, orgs-sync CI gate. All must pass. |
| `formaos-quality-gates.yml` | type, lint, build, app-link integrity, db verify | Blocking. |
| `deployment-gates.yml` | core (config validation, type, lint, build, security baseline, critical security E2E) | Blocking on `push main`. |

### 2.2 Advisory on PR (won't block merge but visible)

- `accessibility-testing.yml` — axe checks, asserts no `serious`/`critical` violations.
- `performance-check.yml` — Lighthouse (perf is warn-only at minScore 0.7; a11y is error at 0.9).
- `compliance-testing.yml` — scheduled compliance suite.
- `visual-regression.yml` — Backstop-style baselines; artifacts uploaded on diff.
- `load-testing.yml` — k6 load profiles, scheduled.

### 2.3 The hotfix override

`deployment-gates.yml` accepts a `workflow_dispatch` input `skip_extended_gates=true`. **Core gates cannot be skipped.** This is the lever for true emergencies — flip the gate to skip the slow advisory tests (Lighthouse, full E2E) so a fix can ship in minutes. Process expectation: post-hotfix, re-run the full gate within 24h. There's no automated nag for this; the new CTO should consider adding one.

### 2.4 Scheduled / nightly

- `formaos-quality-gates.yml` — schedule cron `15:30 UTC` runs the full quality battery including E2E.
- `security-scan.yml` — daily at 6am UTC.
- `lint-warning-ratchet.yml` — weekly. If the warning count has dropped, auto-opens a PR to lower the ceiling. Drives the warning count down over time without manual effort.

### 2.5 Two known CI realities

1. **Fork PRs skip the gates that need secrets** (rls-contract, anything reading from Supabase). The pattern is documented inside each job (`steps.<gate>-secrets-check.outputs.available`). Home-repo PRs are fully gated.
2. **typecheck excludes `__tests__/`, `tests/`, `e2e/`**. Test-code typechecking is not gated. This is a known gap; the new CTO might choose to fix it (would require splitting `tsconfig.typecheck.json` and accepting some currently-broken test types).

## 3. Vercel cron schedule

Defined in `vercel.json`. Twelve entries today:

| Schedule (UTC) | Path | Purpose | Where it lives |
|---|---|---|---|
| `0 2 * * *` (daily 02:00) | `/api/cron/data-retention` | Purge expired data per retention rules. **Longest-running cron** — maxDuration 300s. | `app/api/cron/data-retention/route.ts` |
| `0 3 * * *` (daily 03:00) | `/api/cron/security-retention` | Trim old `security_events` rows beyond retention window. | `app/api/cron/security-retention/route.ts` |
| `0 4 * * *` (daily 04:00) | `/api/cron/billing-reconcile` | Compare local `org_subscriptions` to Stripe; surface drift. **BILLING_AUTO_FIX=false by default** — discrepancies pile up in `billing_reconciliation_log` until ops reviews. | `app/api/cron/billing-reconcile/route.ts` |
| `15 4 * * *` (daily 04:15) | `/api/cron/process-org-purges` | Hard-delete retired orgs past their `retire_purge_at` window — **GATED BY `ORG_PURGE_ENABLED=true` (default OFF)**. Without the flag, this is a no-op + structured log. | `app/api/cron/process-org-purges/route.ts` |
| `30 4 * * *` (daily 04:30) | `/api/cron/enforce-grace-period` | Flips orgs whose past-due exceeds 3 days into read-only by disabling entitlements. | `app/api/cron/enforce-grace-period/route.ts` |
| `0 5 * * *` (daily 05:00) | `/api/cron/audit-chain-verify` | Walks the hash chain per org, alerts on integrity break. Implements the SOC 2 CC7.2 check. | `app/api/cron/audit-chain-verify/route.ts` |
| `0 6 * * *` (daily 06:00) | `/api/cron/compliance-check` | Re-evaluates compliance scores for all orgs. | `app/api/cron/compliance-check/route.ts` |
| `0 * * * *` (every hour) | `/api/cron/scheduled-reports` | Generates org-scheduled reports + emails them. | `app/api/cron/scheduled-reports/route.ts` |
| `0 * * * *` (every hour) | `/api/cron/process-user-purges` | Picks up to 25 pending `user_purge_jobs` per tick; runs the GDPR cascade. | `app/api/cron/process-user-purges/route.ts` |
| `*/10 * * * *` (every 10 min) | `/api/cron/report-exports` | Drains the report-export job queue. | `app/api/cron/report-exports/route.ts` |
| `*/15 * * * *` (every 15 min) | `/api/cron/compliance-exports` | Drains compliance-export queue. | `app/api/cron/compliance-exports/route.ts` |
| `*/15 * * * *` (every 15 min) | `/api/cron/enterprise-exports` | Drains enterprise-bundle export queue. | `app/api/cron/enterprise-exports/route.ts` |

### 3.1 Cron auth

All cron endpoints call `verifyVercelCronRequest(request)` from `lib/security/cron-auth.ts`. The check is `Bearer $CRON_SECRET` + Vercel-issued User-Agent. A misconfigured `CRON_SECRET` is a silent outage class — the cron fires but every handler 401s. **Monitor by**: ensure each cron writes a structured log on every tick (the existing ones do); if you stop seeing the log, the auth is broken.

### 3.2 Manual replay

```bash
# From your shell (don't expose CRON_SECRET in client code)
curl -X POST https://app.formaos.com.au/api/cron/<job-name> \
  -H "Authorization: Bearer $CRON_SECRET"
```

Useful when a cron skipped a window (Vercel cron is best-effort, not guaranteed).

## 4. On-call + incident response

`ONCALL.md` at the root is authoritative; `RUNBOOKS.md` has the per-incident playbooks. Summary:

### 4.1 Severity classification

| Severity | Definition | SLA |
|---|---|---|
| **P0** | Customer data exposed, billing broken, signups broken, prod down. | Page now. ACK in 15min, mitigate in 60min. |
| **P1** | One critical surface degraded (cron stalled, SSO broken for one customer, dunning email broken). Money/trust at risk within a day. | ACK in 30min, mitigate in 4h. |
| **P2** | Bug affecting subset with workaround, perf regression, new error class with low rate. | Triage next business day. |
| **P3** | Operational hygiene: quota near limit, dep EOL, doc gap. | Backlog. |

P0 and P1 always produce a postmortem. P2 only when it recurs.

### 4.2 Current paging reality

- **Solo founder** is the only on-call. Coverage gaps (sleep, travel) accepted as business risk. **This is the biggest single ops debt — should be the new CTO's first organisational decision: extend the rotation or set explicit "no human ACK before 9am AEST" expectation per severity band.**
- **PagerDuty integration is code-ready but the account isn't provisioned.** `lib/observability/paging.ts` exposes `pageOnCall()` and the Stripe webhook signature failure path already calls it on every mismatch — but until `PAGERDUTY_ROUTING_KEY` is in Vercel prod env, calls fall through to a structured warn-log + Sentry's mobile-app push. **First-week task**: create the PagerDuty service, set the routing key, fire a test P0 to verify the path. Documented in `ONCALL.md` and surfaced in [04-project-plan.md](./04-project-plan.md).
- **Slack channels** referenced in `sentry/alerts.yaml` may not exist yet. Verify + create.
- **No public status page.** Customers learn of outages via in-app banner or email. Listed as a known gap.

### 4.3 Runbooks

`RUNBOOKS.md` has the per-incident playbooks. 12 entries currently:

1. Stripe webhook failure
2. RLS regression (audit-trail tampering, cross-tenant exposure)
3. Cron stalls
4. MFA / auth incident
5. Billing / dunning failure
6. Multi-tenant data isolation breach
7. Compliance score corruption
8. SAML SSO failure
9. Provisioning a Vercel log drain (TODO — operator action)
10. Data residency — known cosmetic gap (operator awareness)
11. Retention policy schema bridge (M6 — partially fixed 2026-05-26)
12. CSP `style-src 'unsafe-inline'` — deferred hardening

Each entry has: detection signal, immediate triage, mitigation, postmortem skeleton. When you fix an incident type, update the runbook.

### 4.4 Postmortem template

In `ONCALL.md` at the bottom. Eight sections: summary, timeline, impact, root cause, what went well, what went poorly, action items, lessons. **Always written**, not optional, for P0 / P1.

## 5. Monitoring + observability

| Layer | Tool | What you do with it |
|---|---|---|
| **Errors** | Sentry — `formaos` project. Configs in `sentry.{server,client,edge}.config.ts`. PII scrubbing in `lib/sentry/scrub-pii.ts`. | Triage every new issue. Alerts defined in `sentry/alerts.yaml` (currently **manual-import into Sentry**, not auto-synced — also a gap). |
| **Logs** | Vercel function logs + structured pino via `lib/monitoring/server-logger.ts` (`routeLog`). | `vercel logs --prod` for live tail. Drain to a log lake (Better Stack, Datadog) is on the wishlist — see RUNBOOKS §9. |
| **Tracing** | OpenTelemetry — HTTP + undici spans only. `instrumentation.ts` registers the providers. | `lib/observability/opentelemetry.ts`. Domain spans (Supabase, Stripe, Redis) are not wrapped yet — flagged as a follow-up. |
| **LLM ops** | Langfuse (optional). Wired via `lib/observability/langfuse.ts` when keys present. | LLM call cost + latency + prompt diffing. Enable if AI features grow. |
| **Product analytics** | PostHog. Client-side capture only today. **Server-side capture not wired** — board-level revenue + activation funnels can't populate until this lands. | Event taxonomy in `posthog/dashboards.md`. |
| **Health checks** | `GET /api/health`, `GET /api/health/detailed` (founder-token gated), `GET /api/health/observability` (DSN presence flags). | Wire to external monitor (UptimeRobot / Better Uptime). |
| **DB perf** | Supabase Dashboard → Database → Performance + Query Performance. | Spot-check weekly during scale phase. |
| **Crons** | Vercel Dashboard → Crons tab. | Verify each fires nightly. |

## 6. Releases

There is no "release" event distinct from a merge — every `main` commit deploys. Versioning is at `package.json:version` (currently `3.7.1`) — semver, incremented manually when the change is meaningful. **No git tags are cut** today; if the new CTO wants per-release tagging (recommended for compliance posture — "we shipped version X.Y.Z on date") that's a small addition.

`CHANGELOG.md` (~31KB, hand-curated) is the canonical release log. Format is reverse-chronological with sections per release. Update it for any change a customer would care about; skip for internal refactors.

### 6.1 The `release` concept in `product_releases`

`app/api/admin/releases/` reads/writes a `product_releases` table — this is the **product feature** for releases (the changelog surface that customers see), separate from the eng release flow. Currently releases stay in `draft` because there's no admin endpoint to promote them to `stable` — flagged as a follow-up (Original-audit R-stable-promotion).

## 7. Database migrations

Three rules:

1. **Source of truth is `supabase/migrations/`**. Add a numbered SQL file; don't edit existing ones unless explicitly fixing-up an already-applied migration that's broken on fresh resets.
2. **Migrations must be idempotent**: `IF NOT EXISTS`, `IF EXISTS`, `OR REPLACE`. The recent audit-cycle migrations follow a defensive shape: pre-condition check, apply, post-condition assertion. Match that style for anything destructive.
3. **Apply path**: `supabase db push` is the documented path. The Supabase MCP `apply_migration` is the alternative used during audit cycles. Both work; ledger drift between them is a known issue (see `docs/operations/migration-history-repair.md`).

### 7.1 Migration discipline checklist

For any migration that touches data (not just DDL):

- Run a **pre-flight count** against prod via `mcp__claude_ai_Supabase__execute_sql` before applying.
- Write the migration to **ABORT cleanly** if anomalies are found, with a clear error.
- Add a **post-condition** check at the end of the migration.
- For destructive ops (DROP, DELETE, NOT NULL on populated columns), require **operator confirmation** in the PR description.

### 7.2 The known broken state (repair in progress)

198 of 217 migrations were historically not recorded in `supabase_migrations.schema_migrations`. This blocked `supabase create-branch` for new contributors. Repair runbook at `docs/operations/migration-history-repair.md`.

**Repair tooling is wiring up now** (work in progress as of 2026-05-27):

- `scripts/snapshot-migration-ledger.mjs` — captures the live ledger to `supabase/.migration-ledger-snapshot.json`. Ops runs it against prod after each migration apply.
- `scripts/check-migration-ledger-alignment.mjs` (`npm run test:db:ledger-alignment`) — fails CI when the local migration files drift from the snapshot.
- Wired into `qa-pipeline.yml` `rls-contract` job so PRs catch drift before merge.

If you join while the snapshot is missing, the alignment check skips with an informative message; first ops task is to run `npm run db:ledger:snapshot` against prod and commit the snapshot.

## 8. Hooks + automation

- **No git hooks** are installed by default (no `.husky` or similar). `npm run check-root` and `check-env` run as `predev` / `prebuild`. The new CTO might add a pre-commit hook to run `type-check` + lint changed files; current convention is to rely on CI.
- **Vercel automatic deploys** on every `main` push — no manual deploy step.
- **Trigger.dev** is wired (`lib/trigger/`) but mostly stub today. Production async work flows through Vercel cron + `lib/queue/`.
- **Lint-warning ratchet** is fully automated — see §2.4.

## 9. Data residency + compliance posture

- **All customer data lives in Supabase `ap-southeast-1` (Sydney)**. No Australian customer data leaves AU at rest.
- **Stripe** holds payment data in their own infrastructure — covered by Stripe's compliance (PCI Level 1).
- **Resend** holds email content; based in US — flagged on the residency-gap runbook (RUNBOOKS §10).
- **Sentry** is US-hosted with PII scrubbing on the way in. Run the scrubber on any new error class.
- **SOC 2 / ISO 27001** posture is the product feature, not the company's own certification. The new CTO should decide if/when to pursue formal certification for FormaOS itself.

## 10. When you're handing OVER to someone (future-CTO scenario)

For your future use. Same flow as you're going through right now: update this folder, hand over service access, run a paired week. The `00-START-HERE.md` checklist works for the next person too.
