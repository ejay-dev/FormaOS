# 04 — Project Plan

The state of FormaOS as of 2026-05-27, what's in flight, what's owed, what your first 90 days should probably look like. This is the doc you'll keep updated most often — overwrite as reality changes.

## 1. Where the product is

### 1.1 Market position

From `WEDGE_MARKET_STRATEGY.md` (authoritative):

> **Australian regulated service providers, with the sharpest initial wedge in:**
> - NDIS providers
> - Disability and community care operators
> - Health-adjacent organisations with audit-heavy obligations

The wedge says: AU-first, regulated industries, procurement+security-review acceleration > generic SMB productivity. **Don't broaden** the messaging across every framework + industry at the same intensity — overfit for the wedge until it's undeniable.

The product is positioned as a "compliance operating system" — internal differentiation vs competitors is the tamper-evident hash-chained audit trail + pre-built framework packs for industries no one else covers (NDIS Practice Standards, NSQHS, AHPRA, ACECQA, AFS).

### 1.2 Product maturity

**Production-ready for controlled launch; not yet self-running enterprise scale.**

- Core authenticated workflows are implemented + broadly tested.
- The biggest launch risks are external configuration (PagerDuty, status page, RPO/RTO docs) and unfinished governance features, not a single broken surface.
- ~7/10 production-ready rating per the 2026-04-29 dev-team handover; the 2026-05-26/27 audit cycle has materially improved that — current estimate ~8.5/10.

### 1.3 Pricing (Stripe-live)

| Plan | AUD/mo | Limits | Notes |
|---|---|---|---|
| **Foundation / basic** | 297 | 1 site, 10 users, 2 frameworks | Entry tier |
| **Growth / pro** | 797 | 3 sites, 25 users, 4 frameworks | Most-bought |
| **Scale** | 1,800 | unlimited sites, 75 users, unlimited frameworks | |
| **Enterprise** | custom | unlimited everything + SSO/SAML, SCIM, retention governance | Contact sales |

Trials are grandfathered-only (`TRIAL_ELIGIBLE_PLANS = []`); new self-serve signups land in `pending_checkout` with 1-day grace then forced into Stripe Checkout.

GST inclusive; Stripe Tax wired (`automatic_tax: { enabled: true }`).

## 2. Recent audit cycle inventory (2026-05-26 → 2026-05-27)

Two major batches landed. Reading these gives the CTO 80% of the "why does this code look the way it does" context.

### 2.1 Batch 1 — original 13-dimension audit P0/P1 items (2026-05-26)

All shipped + applied to production + tested.

| Tag | What it fixed |
|---|---|
| **P0-1** | Append-only RLS on audit tables (RESTRICTIVE `no_update` + `no_delete` policies). Closed the `org_audit_logs_unified` permissive `FOR ALL` hole that let any org member mutate their own audit log. |
| **P0-2** | Deleted `lib/audit-trail.ts` (legacy non-chained audit writer) + 11 stale jest mocks + restricted the import. |
| **P0-3** | IDOR fix on `/api/comments` — entity-ownership verification before read or write. |
| **P0-4** | Stripe `checkout.session.completed` webhook routed through `upsertFromSubscription` for first-bind + customer-drift + subscription-drift guards. |
| **P0-5** | Stabilised `getSessionMembership` — reads `user_preferences.current_organization_id` first, falls back to deterministic ordering. Closed multi-org user "active org is undefined" hole. |
| **P0-6 / 7** | `NOT NULL` + `FK CASCADE` on `tasks.organization_id`; `FK CASCADE` on `org_compliance_status.organization_id`. |
| **P0-8** | GDPR Right-to-Erasure shipped: `user_purge_jobs` table, `lib/admin/gdpr-purge.ts`, `POST /api/admin/users/[userId]/gdpr-purge` (approval-gated, reason ≥ 8 chars), hourly cron processor. Decisions matrix at `docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md`. |
| **P0-9** | `retireOrganizationLifecycle()` now triggers `createEnterpriseExportJob` + stamps `retire_purge_at = now + ORG_RETIRE_GRACE_DAYS`. |
| **P0-10** | `Math.random()` purged from security paths → `crypto.randomUUID/randomInt`. New ESLint rule `formaos/no-math-random` set to `error` on `lib/security/**` + `lib/api-keys/**`. |
| **P0-12 / 13** | Admin session-revoke endpoint + JWT-iat enforcement (`user_session_revocations` table + `assertSessionNotRevoked` wired into `requireAdminAccess` + v1 session-cookie fallback). |
| **P1-A** | Atomic backup-code consumption via `consume_backup_code_hash` SECURITY DEFINER RPC. |
| **P1-B / C** | Per-user MFA verify rate-limit on `/api/auth/mfa-verify` + `/api/security/mfa/disable`. |
| **P1-D** | `customer.subscription.paused` + `invoice.voided` Stripe webhook handlers. |
| **P1-E** | Admin plan-change now round-trips to Stripe via `stripe.subscriptions.update` with proration. |

Also in this batch (untagged): **H1** PagerDuty paging wiring (account still not provisioned), **H2** Report-Only CSP + `/api/csp-report`, **H3** per-email failed-login counter + account lockout, **C2** Zod validation rolled out across many v1 mutating endpoints, **M2** consolidation of audit-logging APIs onto the canonical hash-chained writer, **M6** retention_policies schema bridge.

### 2.2 Batch 2 — follow-ups + cleanup (2026-05-27)

| Tag | What it shipped |
|---|---|
| **R1** | Export-time PII redaction for purged subjects. `purged_subject_redactions` table, `lib/audit/redact-purged-subjects.ts`, capture-before-delete in `processUserPurge`, redactor wired into 3 export sites (audit CSV, enterprise bundle, identity audit). |
| **R2 (Phase B)** | Dropped `public.orgs` table + both mirror triggers; repointed 4 dependent FKs to `organizations(id) ON DELETE CASCADE`; deleted `lib/supabase/mirror-legacy-orgs.ts`; flipped `scripts/check-orgs-sync.mjs` to assert "orgs MUST stay dropped". |
| **R6** | Migration-ledger alignment toolchain. Root cause: Supabase MCP `apply_migration` records under synthetic timestamps, not FS prefixes, so the CLI saw migrations duplicated as "local only" + "remote only". Reconciled in prod (21 INSERTs to align). New `list_migration_ledger()` RPC + snapshot file + PR gate. |
| **R7** | `rls-contract` workflow promoted to per-PR gate (was nightly-only). Runs jest cross-org isolation + `npm run test:db:rls` + `npm run test:db:orgs-sync` + R6 ledger alignment. Fork PRs skip cleanly. |
| **R8** | New `__tests__/integration/rls/cross-org-read-isolation.test.ts` — companion to the existing write-isolation suite, asserts cross-org READ deny across 4 representative tables + audit_log. |
| **R9** | `org_evidence.file_hash text` column + SHA-256 capture at upload + `lib/evidence/verify-file-hash.ts` for on-demand re-download + compare. |
| **Cleanup** | Deleted 13 root-cruft scripts + 20 zero-import lib modules + 16 companion test files + 1 misleadingly-named test. **9494 LoC removed**. |
| **Logger** | Migrated 73 `console.error/warn/log` calls in `app/api/**` to the canonical `routeLog` pattern. |
| **Frontend** | Deleted `.animate-pulse-glow` + `.signal-pulse` CSS + the single consumer. Added `dark:` variants to `ErrorBoundary` + Settings "Danger Zone". |
| **Org-retire purge cron** | `lib/admin/org-purge.ts` + daily cron `/api/cron/process-org-purges`. Feature-flagged behind `ORG_PURGE_ENABLED=true`, **default off**. `MAX_ORGS_PER_TICK=5`. Pre-delete `admin_audit_log` write. |
| **Bulk-ops approval gate** | Closed the bypass on `/api/admin/bulk-operations` — `suspend_orgs` now requires four-eye approval, matching the sibling single-org pattern. |

## 3. What's NOT done — your incoming backlog

Honest list. Each row has a `tag → headline → why it matters → effort`.

### 3.1 Audit-cycle items deferred (each known and scoped)

| Tag | Headline | Why deferred | Effort |
|---|---|---|---|
| **R3** | Keyed/HMAC audit chain + external timestamp anchor | Affects chain verification API that customer auditors may consume externally. Needs an ADR before code. | Design doc + protocol decision + ~1 week implementation. |
| **R4** | Merkle inclusion proofs on compliance exports | Same ADR territory. Exports advertise a hash root but provide no path-to-leaf proof. | Per-export Merkle tree + proof generation + verification helper for external auditors. ~1 week. |
| **R5** | Compliance-score gameability fix | `not_applicable` exclusion + `risk_level` downgrade currently have no approval gate — auditor can demonstrate score inflation in 5 minutes. | Mechanical: two server-side approval checks + audit-log entries on each transition. ~1 day. |
| **R10** | NDIS framework depth | Currently relabeled SOC 2. Marketing-level claim vs code reality. | Business decision: build real evaluators (weeks) OR temper marketing copy (hours). |
| | `org_evidence.file_hash` backfill for legacy rows | New uploads get hashed (R9). Legacy rows are NULL. | One-shot job that streams each storage object, hashes, populates. Needs an ops decision for files that are already missing. ~1 day. |

### 3.2 Operational gaps (mostly external setup)

| Item | Why it matters | Owner |
|---|---|---|
| **PagerDuty routing key** | Code-ready (`lib/observability/paging.ts` already calls `pageOnCall()` on Stripe webhook signature failure), but no key = no actual page. Founder still relies on Sentry mobile-app push. **First-week ops job.** | CTO + founder, day 1. |
| **Public status page** | Customers learn of outages via in-app banner or email. Enterprise customers will ask for this in their first procurement review. | CTO, week 2. |
| **RPO/RTO documented + restore tested** | Supabase PITR is 7 days. No documented restore procedure; never tested. | CTO, month 1. |
| **PostHog server-side capture** | Board-level revenue + activation funnels can't populate until this lands. | CTO, month 1. |
| **OpenTelemetry domain spans** | Today: HTTP + undici spans only. Supabase queries, Stripe calls, Redis ops show as generic HTTP — invisible for perf debugging. | CTO, month 2. |
| **Encryption-key rotation runbooks** | Zero documented rotation procedure for `TOTP_ENCRYPTION_KEY`, `INTEGRATION_CONFIG_KEY`, `TRUST_PACKET_SIGNING_KEY`, `EMAIL_UNSUBSCRIBE_SECRET`, SAML SP keypair, VAPID/FCM keys. Compromise response is a scramble today. | CTO, month 1. |
| **Branch protection on `main`** | Founder can push directly today. CTO should require PR review + status checks. | CTO, day 1. |
| **GitHub 2FA org-wide** | Required hardening, free. | CTO, day 1. |
| **Sentry alerts auto-sync** | `sentry/alerts.yaml` is manually imported. Drift between repo + dashboard is the failure mode. | CTO, month 2. |
| **`product_releases` → stable promotion endpoint** | Releases stay in `draft` because no admin endpoint promotes them. Customer-facing changelog feature is half-shipped. | CTO, month 2. |
| **Vercel log drain** | Function logs only live in Vercel's UI; no shipping to a log lake (Better Stack / Datadog). Listed in `RUNBOOKS.md §9`. | CTO, month 2. |
| **Cron monitoring** | Every cron writes a structured log on every tick; nothing alerts when a tick is missed. | CTO, month 1. |

### 3.3 Code-quality long-tail (advisory)

| Item | Cost of not fixing | Effort |
|---|---|---|
| ~278 `formaos/no-admin-client-with-org-filter` warnings | Each is a tenant-isolation-by-convention site that could've been org-scoped client. Ratchet prevents growth; chip away ~10 per week. | Ongoing. |
| `typecheck` excludes `__tests__/` + `tests/` + `e2e/` | Test code can rot. | Split `tsconfig.typecheck.json` + fix the currently-broken test types. 1 day. |
| jest fetch-mock pollutes integration tests | `__tests__/integration/rls/*.test.ts` workaround it inline. | Split jest config into unit + integration projects. 1 day. |
| 198 of 217 migrations originally not in `supabase_migrations` ledger | Was blocking new contributors; **R6 toolchain solves this going forward**. Snapshot lives at `supabase/.migration-ledger-snapshot.json`. | Done; just keep the snapshot refreshed. |

## 4. Suggested 30/60/90 — opinion, not policy

**Tweak after your first week. Don't follow it blind.**

### 4.1 First 30 days — make it safe to operate

Goal: by day 30, you can leave for a weekend without checking Slack.

- **Week 1**:
  - Read all six handover docs end-to-end.
  - Day-1 access checklist (`03-services-and-access.md §5`) for yourself.
  - Provision PagerDuty. Set `PAGERDUTY_ROUTING_KEY`. Fire a test P0. Verify path.
  - Enable branch protection on `main`. Enable org-wide GitHub 2FA.
  - Add yourself to `FOUNDER_EMAILS`. Redeploy.
  - Pair with the founder for 30 minutes on the codebase tour.
- **Week 2**:
  - Stand up a public status page. Wire to `/api/health`.
  - Decide who else is on the rotation (you alone is still solo). If staying solo, set explicit "no human ACK expected before 9am AEST" expectations per severity band.
  - Walk + correct `sentry/alerts.yaml` — make sure what's defined matches what's live in the Sentry UI.
- **Week 3**:
  - Document the encryption-key rotation procedure for each key. Add to `docs/operations/key-rotation/`. Include test-rotation playbook.
  - Run a Supabase restore-to-branch dry-run. Document the RPO/RTO.
- **Week 4**:
  - Ship cron-tick monitoring (simplest: a heartbeat row each cron writes; an external monitor pages if the row is older than 2× the cron interval).
  - Ship R5 compliance-score gating fix.

### 4.2 Days 31-60 — close the audit follow-up loop

Goal: by day 60, the audit findings list is empty except R3/R4 which need design discussion.

- Ship R10 (NDIS depth — business decision first, then build OR temper).
- Ship `org_evidence.file_hash` backfill (after deciding policy for already-missing files).
- Ship PostHog server-side capture. Light up the revenue + activation funnels.
- Ship OpenTelemetry domain spans for Supabase, Stripe, Redis.
- Decide on R3 (keyed audit chain) — write the ADR, get buy-in or defer formally.
- Ship the `product_releases` → stable promotion admin endpoint.

### 4.3 Days 61-90 — scale + posture

Goal: position the company for enterprise procurement reviews + first hire (if planning one).

- SOC 2 / ISO 27001 readiness review for **FormaOS itself** (not the product). Decide if you're pursuing formal certification.
- Decide on hire #1 (probably full-stack engineer with security background given the codebase shape).
- R4 Merkle proofs on exports if R3 went well.
- Sentry alerts → sync from `sentry/alerts.yaml` via Terraform or CI script.
- Vercel log drain to a real log lake.

## 5. Business context you should know

Useful frame; not on the company website.

- **Revenue stage**: early. The CTO should treat this as a "build out the engineering org for the first 1-10 paying enterprise customers" problem, not "scale to 10,000 users" problem.
- **AU-first**: the wedge market is regulated AU providers. Don't accidentally over-pivot to generic US SaaS framing in product/marketing decisions.
- **Compliance is the product**: customers buy because their auditors trust the chain + the bundles. If you ever feel temptation to take a shortcut on audit integrity (e.g., "let's just update this audit_log row to fix the bug"), the answer is no — the chain integrity is the product.
- **Founder/CTO relationship**: founder retains business decisions (pricing, customers, market positioning); CTO owns engineering execution + technical decisions. `ADMIN_OPERATING_POLICY.md` §1 makes this explicit at the platform-permission layer (founders retain full platform authority; CTO-tier roles are delegated).
- **Open questions the CTO should raise early**:
  - What's the runway? Drives whether to invest in deeper certification work vs ship features fast.
  - Who else has access to production data? (Anyone besides the founder + CTO?)
  - Has the leaked Stripe test key from the audit cycle been rotated? (The founder confirmed yes; verify.)

## 6. KPIs the eng team should be on the hook for

Not prescriptive — pick what fits.

| KPI | Why | Where to measure |
|---|---|---|
| **P0 MTTR** | Customer-impacting outage recovery time. Bound by your SLA. | PagerDuty (once provisioned) + postmortems. |
| **Deploy frequency** | Healthy SaaS deploys ≥ daily. Currently ~3-5/day during active dev. | Vercel deploys page. |
| **Change failure rate** | % of deploys that produce a rollback or hotfix within 24h. <15% is the DORA "elite" threshold. | Manual track in CHANGELOG.md. |
| **RLS contract pass rate** | % of PRs that pass `rls-contract` first attempt. Should be 100%; <100% means devs are writing tenant-isolation bugs and CI is catching them — track to identify weak spots. | GitHub Actions. |
| **Audit-chain integrity** | `verifyChainIntegrity()` pass rate via the daily `audit-chain-verify` cron. Always 100%; any failure is P0. | Cron log. |
| **Stripe webhook idempotency** | % of webhook events processed exactly once. Track `billing_events.attempts` distribution. | SQL query. |
| **Test-suite runtime** | Whole CI under 15 min P95. Above that and devs stop running it locally. | GitHub Actions. |
| **Tenant-isolation ratchet count** | Decreasing trend. Today ~278; lint-warning-ratchet.yml drives the number down. | `npm run lint:tenant-isolation`. |

## 7. Things that aren't audit findings but should be on your radar

The "soft" infrastructure debts that don't fit neatly into any of the above.

1. **No formal RFC/ADR process.** Decisions live in commit messages + this folder. Fine for solo; needs structure once team grows.
2. **No incident-postmortem repository.** Template exists in `ONCALL.md` but no central place where past postmortems live. Should be a `docs/postmortems/` dir.
3. **CHANGELOG.md is hand-maintained.** Tedious + drift-prone. Consider release-please or similar.
4. **No formal RCA cadence** — `RUNBOOKS.md` has 12 entries but isn't reviewed regularly. Quarterly review with the team is worth scheduling.
5. **`docs/dev-team-handover.md`** is the 2026-04-29 single-file handover that predates the audit work. Useful for historical context, **this folder supersedes it**. Consider archiving (`docs/archive/`) once the CTO is fully onboard.
6. **The `gitnexus/` directory** is an external code-intelligence index referenced by CLAUDE.md. Keep the index fresh by running `npx gitnexus analyze` when warned.

---

This doc updates as your situation changes. Keep it current. If a section becomes wrong, fix it in the same PR that made it wrong.
