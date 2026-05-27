# FormaOS — Engineering Handover (CTO)

**Welcome.** You're picking up technical ownership of FormaOS — a multi-tenant compliance operations platform for Australian regulated providers (NDIS, disability, aged care, healthcare-adjacent). This folder is your onboarding kit.

**Compiled:** 2026-05-27 by the outgoing maintainer.
**Codebase version:** `3.7.1` (see `package.json`).
**Production:** `app.formaos.com.au` (Vercel `forma-os`, region `syd1`).
**Supabase project:** `bvfniosswcvuyfaaicze` (project name "Care OS", ap-southeast-1).

## How to read this

There are six docs in this folder. Read them in order on day 1; bookmark them after that.

| # | Doc | Read when | Time |
|---|---|---|---|
| 00 | **START HERE** (you are here) | First | 5 min |
| 01 | [Development](./01-development.md) — stack, repo layout, local dev, conventions, debugging | Day 1, before you write any code | 45 min |
| 02 | [Workflow](./02-workflow.md) — PR → review → deploy, releases, on-call, crons, incident response | Day 1, before you ship anything | 30 min |
| 03 | [Services & access](./03-services-and-access.md) — Vercel, Supabase, Stripe, Sentry, GitHub; what exists, what you need | Day 1, to unblock yourself | 20 min |
| 04 | [Project plan](./04-project-plan.md) — current state, 30/60/90, outstanding tech debt, audit findings, business context | Day 2, to plan your first week | 45 min |
| 05 | [Decision history](./05-decision-history.md) — why things are the way they are; load-bearing past decisions | Reference when you're tempted to change something | dip-in |

## The 90-second product summary

FormaOS turns compliance work into operational workflows. A regulated provider (say, an NDIS care company) signs up, picks frameworks they're audited against (SOC 2 / ISO 27001 / NDIS Practice Standards / etc.), maps controls to evidence, runs care operations (participants, visits, incidents, CAPA), and exports audit-ready bundles for their external auditors. Internal differentiation vs. competitors: tamper-evident hash-chained audit trail, AU-first positioning, pre-built framework packs for industries no one else covers.

**Pricing**: AUD $297 (Foundation/Starter) / $797 (Growth/Pro) / $1,800 (Scale) / Enterprise custom. Stripe-billed. Trials are grandfathered-only — new signups go through a 1-day `pending_checkout` grace then are forced into Stripe checkout.

## The 3 cardinal invariants (memorise these — they show up everywhere)

1. **Tenant isolation.** Every org's data is fully isolated. RLS at the database, org-scoped Supabase clients in code (`createSupabaseOrgClient(orgId)`), a custom ESLint rule (`formaos/no-admin-client-with-org-filter`) catching the danger pattern, a per-PR contract gate (`npm run test:db:rls`). If you ever find a query that filters by `org_id` but uses `createSupabaseAdminClient`, that's a tenant-isolation regression and it's P0.
2. **Audit chain is hash-linked and append-only.** `audit_log` rows carry `entry_hash` + `prev_hash` + `sequence_number`; integrity is verified by `verifyChainIntegrity()` in `lib/audit/hash-utils.ts`. RLS RESTRICTIVE policies (added 2026-05-26) deny UPDATE and DELETE at the database layer too. The chain is a *product feature* customers' auditors trust — never mutate audit rows at rest. PII redaction for GDPR purges happens at *export* time, not storage time.
3. **Billing entitlement correctness.** `lib/billing/entitlements.ts` is the single source of truth for "is this org entitled to feature X". Webhook is idempotent (`billing_events` table with `event_id` PK). Multiple guards reject drift between local state and Stripe (`upsertFromSubscription` in the webhook). Don't bypass it.

## Tech stack (one-liner)

**Next.js 16 + React 19 + TypeScript + Supabase Postgres + Stripe + Upstash Redis + Trigger.dev + Sentry**, deployed on Vercel `syd1`, Node 20.x.

Full architecture details: [01-development.md](./01-development.md).

## If you only read 3 files in the entire repo

1. **`CLAUDE.md`** — root project rules, GitNexus impact-analysis convention, and the "always do / never do" list. This is enforced by the team's tooling, not just advice.
2. **`PLATFORM_CONTROL_CONTRACTS.md`** — defines what each platform-control stream means (admin audit, user activity, security events, customer health, lifecycle status). When you add a new admin action, decide which stream owns it BEFORE you write code.
3. **`ADMIN_OPERATING_POLICY.md`** — the platform admin access model. Approval-gated actions, reason capture, separation of duties (founder vs delegated admin). The admin endpoints in `app/api/admin/` enforce this; the policy doc tells you *why*.

After those, this folder, then dip into `docs/` (specifically `docs/audit/`, `docs/operations/`, `docs/security/`) as needed.

## Recent context that's not in code

The outgoing maintainer ran a multi-batch audit + remediation cycle from 2026-05-26 through 2026-05-27. That cycle shipped:
- **20+ P0/P1 fixes** to tenant isolation, audit immutability, IDOR, webhook hardening, MFA, session revocation, FK constraints, the orgs ↔ organizations legacy drop, GDPR purge.
- **9 follow-on items** (export-time PII redaction, `org_evidence.file_hash`, RLS contract on PR gate, cross-org E2E, cleanup of dead code, structured logging, frontend cleanup, org-retire purge cron).

The full inventory is in [04-project-plan.md §"Recent audit cycle"](./04-project-plan.md). Several items remain explicitly deferred (keyed-HMAC audit chain, Merkle export proofs, compliance-scoring approval gates, NDIS depth, PagerDuty provisioning, status page, RPO/RTO docs) — those are your first-month decisions.

## Day-1 checklist

- [ ] Read all six docs in this folder (rough order; ~3 hours total).
- [ ] Get access to: GitHub repo, Vercel project (`forma-os`), Supabase project (`bvfniosswcvuyfaaicze`), Stripe dashboard, Sentry, Resend, Upstash Redis. See [03-services-and-access.md](./03-services-and-access.md).
- [ ] Clone the repo, `nvm use 20`, `npm install`, `npm run check-env` (will tell you what env vars to set), `npm run dev`. See [01-development.md §Local dev](./01-development.md).
- [ ] Run the full local test suite once so you've seen it pass: `npm run type-check && npx jest __tests__/ tests/`.
- [ ] Skim `git log --oneline -50` to see the commit cadence + recent themes.
- [ ] **Ask the outgoing maintainer**: who pays for PagerDuty (still un-provisioned), what's the status of the leaked Stripe test key rotation, and the GDPR matrix Q1–Q6 sign-off — the rolled-up answers are encoded in the current codebase but the trail is in the conversation history.

## Conventions for updating this handover

Once you're ramped, you own these docs. When you make a meaningful change to architecture, the workflow, or the project plan, update the relevant `0X-*.md` file in the same PR. If the change is big enough to need its own ADR, add it to `05-decision-history.md`.

## Outgoing maintainer's contact

Founder + outgoing maintainer: ejazhussaini313@gmail.com (per `git config user.email`). Hand-back questions you can't answer from the codebase alone go there. Try not to need it after week 2.
