# 03 — Services & Access

Every external service FormaOS depends on, what it does, where to find it, and **what access to grant the new CTO**. This is a handover checklist — work through it row by row.

Throughout: **"founder"** = current owner (outgoing). **"CTO"** = incoming. **"Engineer"** = future hires.

## 1. Source of truth

| Service | What FormaOS uses it for | Access tier needed by CTO | Where to grant |
|---|---|---|---|
| **GitHub** — repo `ejay-dev/FormaOS` | Source code, CI/CD, issues, PRs, workflow secrets, scheduled actions. | **Admin** — needs to manage workflow secrets, branch protection, deploy keys. | github.com/ejay-dev/FormaOS/settings/access → invite as Admin. |
| **Vercel** — project `forma-os` (`prj_xHXEcnSdaZq1kB3eSqMtcYs2IINR`), team `team_0VMzNZhdH45R3KEBoXtjZOa3` | Hosting (production + preview + dev branches), function logs, env vars, cron config, deploy history. | **Owner** of the project, or **Admin** of the team. CTO must be able to set env vars, roll back deployments, and configure crons. | vercel.com/team_0VMzNZhdH45R3KEBoXtjZOa3 → Settings → Members → invite. |
| **Supabase** — project `bvfniosswcvuyfaaicze` ("Care OS"), org `txknoiurvarucsfkhlmf`, region `ap-southeast-1` | Postgres database, auth, storage, real-time, edge functions. | **Owner** of the project. CTO needs SQL access + service-role key rotation + RLS edits. | supabase.com/dashboard/project/bvfniosswcvuyfaaicze/settings/team. |
| **Stripe** | Subscriptions, invoices, webhooks, Stripe Tax for AU GST. Live + test mode. | **Admin** for both Live + Test mode. CTO needs to rotate webhook secrets, manage products/prices, issue refunds. | dashboard.stripe.com → Settings → Team. |

These four are **non-negotiable**. Without all four, the CTO can't operate the system end-to-end.

## 2. Observability + ops

| Service | What FormaOS uses it for | Access tier needed by CTO | Where to grant |
|---|---|---|---|
| **Sentry** — org + project per `SENTRY_ORG` / `SENTRY_PROJECT` env. Source maps uploaded via `SENTRY_AUTH_TOKEN`. | Errors (server + client + edge), session replay (2% baseline / 100% on-error), alerts (defined in `sentry/alerts.yaml` but **manually synced into Sentry dashboard**). | **Admin** to manage alerts + integrations + auth tokens. | sentry.io → Settings → Members. |
| **Upstash Redis** — `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (fail-closed for auth, fail-open for UX surfaces), cache layer, soft job queue. | **Owner** of the workspace; needs to rotate tokens + see usage. | console.upstash.com → Settings → Team. |
| **Resend** — `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email (auth, billing notifications, password resets, GDPR purge notifications). SPF/DKIM/DMARC pre-configured for `formaos.com.au`. | **Admin** to rotate API key + manage domains. | resend.com → Settings → Team. |
| **Vercel Analytics** (bundled with Vercel) | Web vitals + simple traffic data. Free tier. | Comes with Vercel Owner/Admin. | n/a |
| **PostHog** — `NEXT_PUBLIC_POSTHOG_KEY` | Client-side product analytics, feature flags. **Server-side capture is NOT wired** (gap; revenue + activation funnels are invisible until this lands). | **Admin** to manage events, dashboards, feature flags. | app.posthog.com → Settings → Members. |
| **Langfuse** (optional, LLM ops) | When `LANGFUSE_*` keys are set, traces LLM calls (cost, latency, prompt diffing). Not in prod hot path today. | **Admin** if enabled. | cloud.langfuse.com → Settings. |
| **PagerDuty** ⚠️ **NOT YET PROVISIONED** | Code-ready in `lib/observability/paging.ts` — `pageOnCall()` already called on Stripe webhook signature failure. Without `PAGERDUTY_ROUTING_KEY` in Vercel prod env, calls fall through to a structured warn-log + Sentry mobile-app push. **First-week ops job.** | **Admin** + needs to set up the service + integration + paging rules. | pagerduty.com → after creating account. |

## 3. Compliance + supporting infra

| Service | What FormaOS uses it for | Access |
|---|---|---|
| **Trigger.dev** — `TRIGGER_*` env, mostly stubbed today | Designed for async background jobs; production work flows through Vercel cron + `lib/queue/` instead. Keep the integration alive but not load-bearing. | Admin if enabled; CTO can defer. |
| **1Password** (or your secret manager) — credentials store referenced in `ONCALL.md` | Service-role keys, encryption keys, third-party API tokens. **Source of truth for `.env.production` outside the Vercel UI.** | CTO needs vault access from day 1. |
| **Google Workspace** (for `formaos.com.au`) | Founder email + DNS for the domain. | Hand over the domain admin OR add CTO as super-admin. |
| **DNS provider** (likely Vercel Domains or Cloudflare — confirm) | A/AAAA, MX, SPF, DKIM, DMARC records for `formaos.com.au`. | Confirm provider + grant admin. |
| **Apple App Store + Google Play** (if mobile shipped — confirm scope) | Mobile app distribution. Not in main app today (web-only); check before claiming this. | Defer if web-only. |

## 4. Secrets inventory — what's in `.env.production`

Sourced from `.env.example`. The CTO needs ALL of these for prod operation (read from Vercel Dashboard → Settings → Environment Variables → Production).

### 4.1 Production-required (validated strictly at Vercel build time)

| Key | Source | Rotation difficulty |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → API | Trivial (re-issue project, rare) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → API | Trivial — Supabase rotates anon key on demand |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → API → service_role | **HIGH risk** — full DB access. Rotating means re-deploying every consumer (backend, cron, scripts). |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` | Hardcoded (`https://app.formaos.com.au`) | n/a |
| `FOUNDER_EMAILS` | Comma-separated list of founder addresses | Trivial — env-var update only. Add the CTO's email here on day 1. |
| `STRIPE_SECRET_KEY` | Stripe dashboard → API → restricted/secret key, **live mode** | **HIGH** — billing breaks. Rotate by issuing new key, updating env, redeploying, revoking old. |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → endpoint → Signing secret | Medium — webhook calls fail until env updated + redeployed. |
| `STRIPE_PRICE_FOUNDATION` / `GROWTH` / `SCALE` | Stripe dashboard → Products → Pricing | Set once per pricing tier. |
| `STRIPE_REQUIRE_LIVEMODE_IN_PROD=true` | Literal `true` | Static — should always be true in prod. |
| `RESEND_API_KEY` | Resend dashboard → API Keys | Medium |
| `RESEND_FROM_EMAIL` | `noreply@formaos.com.au` (or similar) | Static |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash console → REST API | Medium |
| `CRON_SECRET` | Random 32-byte string. Used by all cron auth. | Medium — every cron 401s until updated. Rotate during a quiet window. |
| `HEALTH_DETAILED_FOUNDER_TOKEN` | Random 32-byte string. Gates `/api/health/detailed`. | Trivial |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → project → Client Keys (DSN) | Trivial |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Sentry → Account → Auth Tokens | Medium |

### 4.2 Encryption keys — **rotate with care**

These encrypt user-owned data at rest. Rotating them requires data-migration unless you maintain backward-compat (most code paths read both old + new key during the window).

| Key | What it protects | Rotation requires |
|---|---|---|
| `TOTP_ENCRYPTION_KEY` | 32-byte hex. AES-256-GCM of MFA TOTP secrets in `user_security.two_factor_secret`. | **Force re-enrolment for every MFA user.** Hardest rotation in the system. |
| `INTEGRATION_CONFIG_KEY` (legacy alias `INTEGRATION_CONFIG_SECRET`) | AES-256-GCM of integration credentials (`directory_sync_configs.config`, etc.) | Re-encrypt all existing rows on rotation. |
| `TRUST_PACKET_SIGNING_KEY` | Ed25519 private key. Signs trust packet exports. | Re-sign in-flight exports or accept they're invalidated. |
| `EMAIL_UNSUBSCRIBE_SECRET` | HMAC secret. Signs unsubscribe tokens in outbound emails. | Old tokens invalidate; users must request a new email to unsubscribe. |
| `SAML_SP_PRIVATE_KEY`, `SAML_SP_PUBLIC_CERT` | Service-provider keypair for SAML SSO. | Update at every IdP that has this configured. |
| `VAPID_PRIVATE_KEY`, `FIREBASE_SERVER_KEY` | Web push + mobile push respectively. | Push subscriptions invalidate on rotation. |
| `NEXTAUTH_SECRET` | Legacy fallback for `INTEGRATION_CONFIG_KEY`. | Deprecate. |

**There is no documented rotation procedure for any of these — that's a known gap. Adding rotation runbooks is recommended early ops work.**

### 4.3 Optional / per-feature

- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — for AI assistant features (off in dev by default).
- `OTEL_EXPORTER_OTLP_ENDPOINT` + auth — when wiring OpenTelemetry to a backend.
- `LANGFUSE_*` — LLM ops tracking.
- `POSTHOG_*` — server-side capture (not wired today).
- `PAGERDUTY_ROUTING_KEY` — see §2.

## 5. Day-1 access-handover checklist

In this order. Each block is independent so you can run them in parallel where you have the help.

### Block A — get the CTO into the cockpit

- [ ] Invite CTO to **GitHub** as Admin. Confirm they can clone the repo + open a PR.
- [ ] Invite CTO to **Vercel team** as Admin. Walk them through Settings → Environment Variables → Production. Confirm they can view (not modify yet) all keys above.
- [ ] Add CTO email to `FOUNDER_EMAILS` env var in Vercel → Production → trigger a redeploy.
- [ ] Invite CTO to **Supabase** project as Owner. Confirm they can read the SQL editor + see migrations.
- [ ] Invite CTO to **Stripe** as Admin (both Live + Test mode). Confirm they can see the live webhook endpoint + the products + the test mode.
- [ ] Share the **1Password vault** (or whatever secret manager you use).

### Block B — observability access

- [ ] Invite CTO to **Sentry** org as Admin. Walk through `sentry/alerts.yaml` and confirm what's actually live in the Sentry dashboard matches.
- [ ] Invite CTO to **Upstash Redis** workspace as Owner.
- [ ] Invite CTO to **Resend** as Admin.
- [ ] Invite CTO to **PostHog** project as Admin.
- [ ] (When ready) Provision **PagerDuty** with the CTO present. Set `PAGERDUTY_ROUTING_KEY`. Fire a synthetic P0 to verify path.

### Block C — bookkeeping

- [ ] Add CTO as super-admin in **Google Workspace** for `formaos.com.au` (so they can manage email + DNS + the GitHub org email).
- [ ] Confirm + grant access to **DNS provider** (Vercel Domains or Cloudflare).
- [ ] Hand over **company-side accounts** outside the eng surface: ABN, AU privacy commissioner registration if applicable, Stripe payouts bank account, accounting software. Not strictly engineering but the CTO needs visibility.

### Block D — code-side handover

- [ ] CTO can `git push` to a branch + open a PR + have CI run.
- [ ] CTO can run the full local test suite (`npm run type-check && npx jest`).
- [ ] CTO can apply a migration via Supabase CLI OR the Supabase MCP — pick one and verify it works for them.
- [ ] CTO can deploy a trivial change end-to-end (commit → PR → CI green → merge → live).

After all four blocks, you can offboard yourself from operational access (keep ownership of any contracts you've personally signed; that's separate from engineering access). Recommend a **2-week overlap** where you both hold full access in case something blows up.

## 6. Secret-rotation cadence (recommended, not enforced)

Not currently codified anywhere — this is the new CTO's call. Industry baseline:

| Class | Rotation cadence |
|---|---|
| Service-role keys (Supabase, Stripe, Resend) | 90 days OR on personnel change |
| Encryption keys (TOTP, INTEGRATION_CONFIG) | Yearly, OR immediately on suspected compromise. **Plan the data migration.** |
| Cron + health tokens | 90 days |
| API keys for monitoring (Sentry, PostHog) | 180 days |
| SAML SP keys | Per IdP cycle (usually yearly) |

Build the rotation calendar into your ops doc once you've designed it.

## 7. Cost surface

Rough monthly spend by category as of 2026-05. Treat as ballpark — pull actuals from invoices.

| Service | Plan | Monthly (AUD) |
|---|---|---|
| Vercel | Pro | ~$30 |
| Supabase | Pro | ~$40 (will scale with usage) |
| Stripe | Per-transaction (2.9% + AUD $0.30) | revenue-linked |
| Resend | Per-email tier | ~$25 |
| Upstash | Free → Pay-as-you-go | ~$15 |
| Sentry | Team | ~$50 |
| PostHog | Free tier (limited) | $0 |
| Domain + DNS | Per registrar | ~$5 |
| **Total fixed** | | **~$165** |

PagerDuty, status page, status monitor will add maybe AUD $100/mo combined once provisioned.

## 8. Things the new CTO should change about access

Honest opinions, not prescriptions:

1. **Move secrets out of Vercel UI** into a dedicated secret manager (Doppler, 1Password Secrets, AWS Parameter Store) and sync from there. Vercel UI is fine for solo but bad for teams (no audit log of who changed what).
2. **Set up branch protection on `main`** — require PR review + status checks before merge. Currently the founder can push directly (don't). The CTO can fix this on day 1 via GitHub → Settings → Branches.
3. **Enable GitHub 2FA org-wide** — required for any contributor. Free.
4. **Document the secret-rotation runbook** — see §6. There's nothing here today; the gap is large.
5. **Consider an internal status page / Notion handbook** for the day-to-day "who has what" so this doc doesn't become the only source of truth.

When the CTO is ready, they update this file with what's changed.
