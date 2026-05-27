# 05 — Decision History

Load-bearing past decisions, ADR-style. **Read this when you're tempted to change something** that looks weird — there's usually a reason.

Format per entry: **Decision** / **Why** / **Trade-off** / **Reversibility** / **When to reconsider**.

This is not exhaustive — focus is on decisions that future engineers will routinely question.

---

## ADR-001: Hash-chained audit log (not just an append-only table)

**Decision:** Every audit-relevant event writes to `audit_log` with `prev_hash`, `entry_hash`, `sequence_number`. Hash algorithm versioned via `hash_algo` column (`v1` = legacy JS-side, `v2` = canonical server-side via `audit_log_append` RPC with `pg_advisory_xact_lock`). `verifyChainIntegrity()` walks the chain and asserts three invariants: hash recomputes, `prev_hash` matches prior row's `entry_hash`, sequence numbers monotonic.

**Why:** The audit chain is a product feature. Customer auditors trust the chain — break that property and you break the differentiator. SOC 2 CC7.2 evaluator (`lib/compliance/evaluators/soc2/CC7.2.ts`) actively runs the integrity check + reports pass/fail to the customer's compliance score.

**Trade-off:**
- Cost: writes serialise per-org via advisory lock. Burst throughput limited.
- Cost: chain mutation is forbidden — including for GDPR. PII redaction has to happen at *export* time (R1), never at rest.
- Benefit: tamper-evidence is the differentiator.

**Reversibility:** Hard. Removing the chain would invalidate every report previously sold as "hash-verified". If you ever need higher throughput, look at sharding (chain-per-(org, day)) before unwinding the chain itself.

**When to reconsider:** Never as a whole. Per-decision worth reconsidering: keying the hash with HMAC (R3, deferred — ADR needed), Merkle tree for export inclusion proofs (R4, deferred — ADR needed).

---

## ADR-002: PII redaction happens at export, not storage

**Decision:** When a user is GDPR-purged, their PII is NOT removed from `audit_log` / `org_audit_logs` / `admin_audit_log` / `security_audit_log` rows. Their identifiers (`user_id` UUID, email, full_name, extra identifiers) are captured into `purged_subject_redactions` *before* `auth.admin.deleteUser` runs. Every export pipeline that emits audit data (audit CSV, enterprise bundle, identity audit) calls `loadRedactor()` and walks each row's text + JSONB fields, replacing matches with `[redacted-by-erasure-request]`.

**Why:** Mutating audit rows at rest breaks the hash chain (ADR-001). GDPR Art. 17 covers copies that leave the system, not at-rest data, so the export boundary is the right enforcement point.

**Trade-off:**
- At-rest audit data still contains a purged subject's name + email. If an attacker dumps the database, they get the PII.
- Mitigated by: DB access is service-role only; RESTRICTIVE no-UPDATE/no-DELETE policies on audit tables; export pipeline is the only legitimate egress.
- Benefit: hash chain stays whole; product feature preserved; export consumers see a GDPR-clean view.

**Reversibility:** Adding selective in-row redaction would require a fork in `verifyChainIntegrity()` that tolerates "redacted" markers OR re-signing the chain after each redaction (which destroys tamper-evidence). Neither is clean. The export-time redaction is the right hill.

**When to reconsider:** If a regulator explicitly demands at-rest erasure for audit logs and rejects the export-time approach. (Unlikely under current AU + EU jurisprudence; check with legal.)

---

## ADR-003: Two-table organizations consolidation (orgs + organizations → organizations only)

**Decision (2026-05-27 R2):** Dropped `public.orgs` table + both mirror triggers. Repointed 4 dependent FKs (`memberships`, `org_memberships`, `org_notifications`, `org_subscriptions`) directly to `organizations(id) ON DELETE CASCADE`. `scripts/check-orgs-sync.mjs` flipped to assert "orgs MUST stay dropped".

**Why:** The dual-write was a 14-month legacy from a partial schema migration. Mirror triggers were a silent-failure surface — the 2026-05-23 incident produced 395 orphan rows from exactly that drift. Repointing FKs was the only durable fix.

**Trade-off:**
- One-time risk during cutover: if any orphan row existed (org_id in dependent FK that wasn't in `organizations`), the migration would have FK-violated. Pre-flight count confirmed 0 orphans.
- Future cost: if anyone re-introduces a legacy-org concept, naming has to differ (`orgs` can never come back as a different table).
- Benefit: eliminated 200+ lines of defensive mirror code in 5 callers + the mirror helper itself.

**Reversibility:** Restoring `orgs` would require re-running the original mirror pattern. Don't.

**When to reconsider:** Never.

---

## ADR-004: Supabase as the primary database, not a polyglot stack

**Decision:** All persistent data (transactional + analytics + auth + storage + real-time) lives in Supabase Postgres. No separate analytics warehouse, no separate auth provider, no Redis as primary store. Redis (Upstash) is rate-limit + cache + soft-queue only.

**Why:**
- One vendor, one operator model, one billing line.
- Postgres covers our access patterns at our scale (10s-100s of orgs).
- Supabase ships RLS, auth, real-time, storage as one bundle. The integration cost saving is real.
- AU data residency: Supabase `ap-southeast-1` is the easiest path to "all customer data stays in AU".

**Trade-off:**
- Lock-in to Supabase: their pricing changes, our cost changes. Their downtime, our downtime. PITR window is 7 days on the Pro plan, not arbitrary.
- Analytics queries compete with transactional queries on the same DB. At >50 paying customers this becomes a concern; today it's not.
- No specialized search engine (Elasticsearch, Algolia) — using Postgres FTS.

**Reversibility:** Moderate. Moving auth to Auth0/Clerk would be a months-long project but possible. Moving storage off Supabase Storage is straightforward (the files are just S3-compatible objects). The DB itself is hardest to move.

**When to reconsider:** If Supabase pricing makes the cost surface untenable, OR if multi-region distribution becomes a real requirement (US customers asking for US-residency), OR if Postgres performance becomes the bottleneck at scale.

---

## ADR-005: Tenant isolation enforced at three layers (defense in depth)

**Decision:** Tenant isolation is enforced at:
1. **Database layer**: every tenant table has RLS + FORCE RLS + a permissive membership-gated SELECT policy.
2. **Application layer**: `createSupabaseOrgClient(orgId)` from `lib/supabase/org-scoped.ts` stamps the org filter automatically. Service-role usage is allowed but discouraged + warned by `formaos/no-admin-client-with-org-filter`.
3. **CI layer**: per-PR `rls-contract` job runs jest cross-org isolation tests + the static+live RLS contract script + the orgs-removal invariant gate. Blocking.

**Why:** Tenant isolation is the cardinal invariant. A single bypass in any one layer would be catastrophic; three layers make it unlikely for a single bug to leak data.

**Trade-off:**
- Cost: every new tenant table needs RLS + membership policy. The `rls-contract` script enforces this; a PR that adds a tenant table without RLS fails CI.
- Cost: developers occasionally curse the org-scoped client wrapper when they want to do cross-org analytics — the answer is `createSupabaseAdminClient` with an explicit eslint-disable comment + justification. Friction is intentional.
- Benefit: this hasn't leaked across orgs in 18 months of production.

**Reversibility:** Don't.

**When to reconsider:** Never.

---

## ADR-006: `routeLog` (pino-backed) is the canonical logger for API routes

**Decision (2026-05-27):** All `app/api/**/route.ts` uses `routeLog(route)` from `lib/monitoring/server-logger.ts`. Domain-level structured logs (`billingLogger`, `authLogger`, etc.) come from `lib/observability/structured-logger.ts`. **No `console.*` in `app/api/`.**

**Why:** `console.error` loses Sentry breadcrumb context, structured fields, and PII scrubbing. pino's child-logger pattern attaches the route as a binding — every log automatically carries route + request context. The 2026-05-27 migration converted 73 `console.*` calls and the convention is now settled.

**Trade-off:**
- Two structured loggers in the codebase (`routeLog` for routes, domain loggers for libs). Mildly confusing for new contributors. Resolved by documentation (this folder + `01-development.md §6.3`).
- The audit recommended `apiLogger` from `lib/observability/structured-logger.ts`; the migration chose `routeLog` instead because ~150 routes already used it. Choosing `apiLogger` would have meant migrating those routes too.

**Reversibility:** Moderate. Migrating to a single logger interface is a 1-day refactor if you decide it's worth it.

**When to reconsider:** When `lib/observability/` grows the equivalent of pino-child + request-context bindings, the two could unify.

---

## ADR-007: Marketing pages intentionally bypass the design token system

**Decision:** Components under `app/(marketing)/**`, `components/marketing/**`, `components/motion/**`, `components/blog/**` are excluded from `formaos/no-hardcoded-colors`. They use raw hex (`#0b1022`, `#060d1a`, etc.), motion effects, and a different color palette (cyan accent vs. enterprise blue) than the product app.

**Why:** The product app and the marketing site have different audiences + different aesthetic requirements. The product app is enterprise-utility ("Linear / Notion energy"); the marketing site is conversion-led ("Vercel / Stripe energy"). Forcing both through the same tokens flattens both. The audit on 2026-05-26 surfaced 159 hex violations in the marketing layer — leaving them in place was a deliberate call, not an oversight.

**Trade-off:**
- Design drift across the two surfaces. Marketing screenshots in the product feel a touch off.
- Easier to ship new marketing pages quickly (no token vocabulary friction).

**Reversibility:** Easy — flip the lint config to enforce tokens everywhere + migrate the marketing components. Estimated 2-3 days of careful work.

**When to reconsider:** If a new design language unifies both surfaces, OR if the marketing team grows and wants a shared design system with the product team.

---

## ADR-008: `ORG_PURGE_ENABLED` defaults to `false` (org hard-delete is opt-in per environment)

**Decision (2026-05-27):** `lib/admin/org-purge.ts` reads `ORG_PURGE_ENABLED` env var; defaults to `false`. When false, the daily cron at `/api/cron/process-org-purges` is a no-op + structured log. Flag must be explicitly set to `'true'` (literal string, case-insensitive) to enable.

**Why:** Org hard-delete cascades through ~80 `org_*` tables including the audit chain for that org. Even with `MAX_ORGS_PER_TICK=5` cap + multi-condition gate (`lifecycle_status='retired'` + `retire_purge_at <= now()` + `retire_export_job_id IS NOT NULL` + export status = `completed`), the operation is irreversible (Supabase PITR is 7 days but recovery is a support ticket). The cost of an accidental purge is catastrophic; the cost of needing to flip a feature flag is trivial.

**Trade-off:**
- An org that should have been hard-deleted on day 90 stays around until ops flips the flag. Storage cost; no compliance impact (it's retired + locked + exported).
- Ops has to remember to flip the flag. Run an org-retirement, the cron is silent, ops thinks it ran.

**Reversibility:** Easy. Flip the flag.

**When to reconsider:** Once there are 10+ orgs in retired state past their purge window, default-off becomes operationally annoying. Move to default-on with a more conservative `MAX_ORGS_PER_TICK` (e.g., 1).

---

## ADR-009: Trials are grandfathered-only (no new trials)

**Decision:** `TRIAL_ELIGIBLE_PLANS = []` in `lib/plans.ts`. New signups skip trial entirely; they land in `pending_checkout` with 1-day grace, then forced into Stripe Checkout. Legacy trialing subscriptions continue (status='trialing' code paths remain).

**Why:** Free-trial conversion was low; the cost of supporting trial users (storage, support touchpoints, abandoned-trial pings) exceeded the conversion value. The wedge market (regulated providers) buys after a procurement review, not after a trial — so a trial doesn't even match the buyer's decision process.

**Trade-off:**
- Higher friction at signup. Customer has to commit (with payment info) to see the product running.
- Code paths for trialing status are partially-dead — they handle the grandfathered cohort but new code can't easily depend on trial semantics.

**Reversibility:** Easy — add a plan to `TRIAL_ELIGIBLE_PLANS` and adjust the onboarding flow. The infrastructure is all there.

**When to reconsider:** If the wedge expands toward SMB or self-serve-heavy segments, trials become valuable again.

---

## ADR-010: AU-only single-region deployment (Vercel syd1, Supabase ap-southeast-1)

**Decision:** Vercel project `forma-os` deploys to region `syd1` only. Supabase project `bvfniosswcvuyfaaicze` lives in `ap-southeast-1`. No multi-region replication, no read replicas in other regions.

**Why:** AU wedge market → AU data residency. Multi-region adds complexity (consistency, cost, ops overhead) we don't need at our scale.

**Trade-off:**
- A regional Vercel outage takes the entire app down. No failover.
- US customers (if any) get ~200-250ms baseline latency to the API.
- No "I need a US-residency tier" option without significant rework.

**Reversibility:** Vercel multi-region is a config change. Supabase replica requires their Read Replicas feature (Pro+ plan, paid extra). Real multi-region (separate DBs per region) is a months-long project.

**When to reconsider:** When you sign a US-headquartered customer who requires US residency, OR when AU-region outages start impacting customer SLAs.

---

## ADR-011: Founder retains full platform authority; delegated admins are explicit grants

**Decision:** `FOUNDER_EMAILS` env var (a list) defines founder access. Anyone in that list has full platform-admin permissions automatically. Delegated platform admins are explicit DB rows in `platform_admin_assignments` with `role_key` + `permissions` + `is_active`. Founders bypass the approval-gate on high-risk actions; delegated admins must have a second admin approve. See `ADMIN_OPERATING_POLICY.md`.

**Why:** Solo-founder reality + need to delegate as the team grows. Founder needs to break-glass in emergencies without needing a second-admin signature; delegates need supervision because their identity is less trusted.

**Trade-off:**
- Founder is a single point of failure for "I need to take a destructive action right now" scenarios. Mitigated by: every founder action is still audit-logged.
- Delegated admins can't unilaterally take destructive actions. Friction is the feature.

**Reversibility:** Easy — change the approval-gate predicate. But the model is sound.

**When to reconsider:** When the founder is no longer day-to-day operational. Then "founder" becomes a label without authority, and you want CTO-tier roles to have the same break-glass freedom (with audit). Already partially supported via the `platform_super_admin` role; just need to decide whether the founder shortcut still applies once you've left the day-to-day.

---

## ADR-012: jest's `global.fetch = jest.fn()` in `jest.setup.js` (and the integration-test workaround)

**Decision (existing):** `jest.setup.js` line 108 sets `global.fetch = jest.fn()` so unit tests don't accidentally hit the network. **This breaks integration tests** that need real network calls (Supabase, Stripe). The workaround: each integration test restores `globalThis.fetch = require('undici').fetch` in `beforeAll`.

**Why this exists (and why it sucks):** The mock was added to prevent leaky unit tests from accidentally calling external APIs. It works for that. But it makes the integration test path more fragile + harder to discover.

**Trade-off:**
- Unit tests are safe by default.
- Integration tests have to remember the restore + duplicate the WS shim (`scripts/_node20-ws-shim.mjs` equivalent for jest).
- New integration tests fail in confusing ways ("fetch failed") if the author doesn't know the convention.

**Reversibility:** The right fix is splitting jest config into two projects (`unit` with the mock, `integration` without). Probably 1-day refactor. **Listed in the project plan §3.3 as a code-quality item.**

**When to reconsider:** Immediately if you're writing integration tests regularly. The current state is "this works but devs trip over it".

---

## How to add new ADRs

When you make a non-obvious decision that future engineers will question, add an entry here. Pattern:

```
## ADR-XYZ: <short headline>

**Decision (YYYY-MM-DD):** what.

**Why:** why.

**Trade-off:** costs vs benefits.

**Reversibility:** Easy / Moderate / Hard.

**When to reconsider:** the conditions under which this should be revisited.
```

Don't proliferate — only land ADRs for decisions that meet **all** of:
1. Future contributors will look at the code and ask "why is it like this".
2. The answer isn't obvious from the code.
3. The wrong choice has meaningful cost.

For everything else, an inline `// audit-YYYY-MM-DD:` comment is enough.
