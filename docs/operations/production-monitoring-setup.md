# Production Monitoring Setup

Last reviewed: 2026-04-27

## Completed From Local Environment

- Vercel project link is present in `.vercel/project.json`.
- `npx vercel` is authenticated as the project owner account.
- Latest Vercel production deployment is `READY`.
- `www.formaos.com.au`, `app.formaos.com.au`, and `formaos.com.au` are aliased to the latest production deployment.
- `https://www.formaos.com.au/` returns HTTP 200.
- `https://www.formaos.com.au/api/health` returns HTTP 200.
- GitHub CLI is authenticated and can read repository secret names.
- Stripe CLI is installed and authenticated.
- Lighthouse can run through `npx` with local Chrome.
- Live public Lighthouse pass ran against `https://www.formaos.com.au`.

## Tool Status

| Tool | Status | Notes |
| --- | --- | --- |
| Vercel CLI | Available through `npx vercel`; authenticated | Project linked; production deployment checked read-only. |
| Supabase CLI | Available through `npx supabase`; not authenticated/linked | Remote migration status requires `supabase login` and `supabase link`. |
| Stripe CLI | Installed and authenticated | Use test mode for local billing tests. Do not create live charges. |
| GitHub CLI | Installed and authenticated | Secret names can be listed; values are not readable. |
| Sentry CLI | Not installed | Sentry SDK is installed; release/source-map verification needs CLI/token setup. |
| k6 | Not installed | Homebrew is not available on this machine, so local install was not completed. |
| Lighthouse | Available through `npx`; Chrome installed | Runner writes ignored JSON reports under `.lighthouseci/public/`. |

## Required Production Environment

Set these in Vercel production and GitHub Actions where applicable. Do not commit values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STAGING_BASE_URL`

## GitHub Actions Secret Readiness

Present as of this review:

- secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- variables: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Missing or should be added/renamed for the new quality workflow:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STAGING_BASE_URL`

Use these commands from a trusted shell that has the values available:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo ejay-dev/FormaOS
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo ejay-dev/FormaOS
gh secret set STRIPE_SECRET_KEY --repo ejay-dev/FormaOS
gh secret set STRIPE_WEBHOOK_SECRET --repo ejay-dev/FormaOS
gh secret set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --repo ejay-dev/FormaOS
gh secret set NEXT_PUBLIC_SENTRY_DSN --repo ejay-dev/FormaOS
gh secret set SENTRY_AUTH_TOKEN --repo ejay-dev/FormaOS
gh secret set SENTRY_ORG --repo ejay-dev/FormaOS
gh secret set SENTRY_PROJECT --repo ejay-dev/FormaOS
gh secret set UPSTASH_REDIS_REST_URL --repo ejay-dev/FormaOS
gh secret set UPSTASH_REDIS_REST_TOKEN --repo ejay-dev/FormaOS
gh secret set STAGING_BASE_URL --repo ejay-dev/FormaOS
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` already exists as a GitHub variable. Prefer keeping public values as variables and private values as secrets.

## Sentry Release And Source Maps

The app already has:

- `@sentry/nextjs`
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `withSentryConfig` in `next.config.ts`
- `hideSourceMaps: true`
- PII scrubbing through `lib/sentry/scrub-pii.ts`

Manual setup remaining:

```bash
npm install -g @sentry/cli
sentry-cli login
sentry-cli info
```

Then set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in Vercel and GitHub Actions. Verify the next production build uploads source maps and that new issues resolve to the deployed commit.

## Stripe Webhook Readiness

Use Stripe test mode locally:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

The local webhook endpoint in this repo is `/api/billing/webhook`.

## Supabase Remote Migration Status

Remote migration status was not checked because the Supabase CLI is not logged in and the repo is not linked.

Manual takeover:

```bash
npx supabase login
npx supabase link --project-ref bvfniosswcvuyfaaicze
npx supabase migration list
```

Confirm these migrations are applied:

- `20260425_first_session_progress.sql`
- `20260617_fix_care_plans_rls_update.sql`
- `20260426_001_ensure_forms_platform_schema.sql`
- `20260425_evidence_entity_polymorphism.sql`
- `20260425_evidence_workflow_integrity.sql`
- `20260425_fix_org_evidence_rls.sql`
- `20260426_002_ensure_organization_sso_schema.sql`

`npm run db:test:verify` should also pass against the configured Supabase project after any migration changes.

## k6 Setup

Homebrew is not installed locally, so k6 was not installed automatically.

Manual install options:

```bash
brew install k6
k6 version
BASE_URL=https://www.formaos.com.au VUS=3 DURATION=45s npm run load:public
```

If Homebrew is not desired, install from <https://grafana.com/docs/k6/latest/set-up/install-k6/>.

## Synthetic Monitoring

No Checkly or Better Stack credentials were available locally, and no paid resources were created. Configure checks using `docs/monitoring/synthetic-checks.md`.

Recommended minimum:

- homepage every 5 minutes
- pricing/contact/security/trust every 10 minutes
- `/api/health` every 1 minute
- staging authenticated smoke every 15 minutes

## Lighthouse Baseline

Live run against `https://www.formaos.com.au` on 2026-04-27:

| Route | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| `/` | 79 | 100 | 100 | 83 |
| `/pricing` | 77 | 100 | 100 | 83 |
| `/contact` | 81 | 100 | 100 | 83 |
| `/changelog` | 80 | 100 | 100 | 83 |
| `/security` | 77 | 100 | 100 | 83 |
| `/trust` | 80 | 100 | 100 | 83 |

Serious issue to watch: performance is acceptable but not excellent on several marketing routes. Treat sustained scores below 70 as a release-blocking regression for public pages.

## Post-Deploy Checklist

1. Confirm Vercel deployment is `READY`.
2. Confirm aliases for `www.formaos.com.au`, `app.formaos.com.au`, and apex point at the expected deployment.
3. Open `https://www.formaos.com.au/api/health`.
4. Run `npm run check:app-links`.
5. Run `LIGHTHOUSE_BASE_URL=https://www.formaos.com.au npm run test:lighthouse:public`.
6. Watch Sentry for new issues for 30 minutes.
7. Check Stripe webhook delivery health after billing changes.
8. Run a staging export/upload smoke when app workflows changed.

## Weekly Monitoring Checklist

1. Review Sentry new and regressed issues.
2. Review Vercel failed deployments and function error rates.
3. Review Supabase migration drift and slow query signals.
4. Review Upstash Redis error/rate-limit metrics.
5. Review Stripe webhook delivery failures.
6. Review synthetic check uptime and latency.
7. Run public Lighthouse and compare to the baseline above.
8. Run `npm run db:test:verify` against the configured project.
