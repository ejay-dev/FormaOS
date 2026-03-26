---
name: formaos-deploy
description: Deploy, release, and operate FormaOS in production. Use when working with Vercel deployment, CI/CD pipelines (GitHub Actions), environment variables, database migrations, release discipline, monitoring (Sentry, PostHog, OpenTelemetry), cron jobs, or production incidents. Also use for mobile app deployment (Capacitor/React Native).
---

# FormaOS Deployment & Operations Engineering

## Architecture Overview

- **Platform:** Vercel (Sydney region `syd1`)
- **CI/CD:** GitHub Actions (10+ workflows)
- **Monitoring:** Sentry (errors), PostHog (analytics), OpenTelemetry + Langfuse (tracing)
- **Database:** Supabase (managed PostgreSQL)
- **Background jobs:** Trigger.dev
- **Caching/Rate limiting:** Upstash Redis
- **Mobile:** Capacitor (iOS + Android)
- **Current version:** 2.2.0 (codename: Citadel)

## Key Files & Directories

| Area | Path |
|------|------|
| Vercel config | `vercel.json` |
| Next.js config | `next.config.ts` |
| CI/CD workflows | `.github/workflows/` (10+ pipelines) |
| Environment template | `.env.example` |
| Release checklist | `RELEASE_DISCIPLINE_CHECKLIST.md` |
| Changelog | `CHANGELOG.md` |
| Database migrations | `supabase/migrations/` |
| Background jobs | `trigger/` |
| Mobile app | `mobile/`, `capacitor.config.json` |
| Build scripts | `scripts/` |
| Cron config | `vercel.json` (compliance check at 6 AM UTC) |

## Pre-Deploy Checklist

```bash
# 1. Code quality (run in parallel)
npm run lint              # ESLint — must pass
npm run type-check        # TypeScript — zero errors

# 2. Tests
npm run test              # Unit tests — must pass
npm run qa:smoke          # Smoke E2E — must pass

# 3. Build
npm run build             # Next.js build — must succeed

# 4. Full QA (for major releases)
npm run qa:full           # All test suites
npm run test:compliance:all  # Compliance checks
npm run test:security     # Security baseline
```

## CI/CD Pipelines

| Workflow | Purpose |
|----------|---------|
| `qa-pipeline.yml` | Primary: lint, type-check, tests, build |
| `security-scan.yml` | Dependency audits, security baseline |
| `compliance-testing.yml` | GDPR + SOC 2 validation |
| `accessibility-testing.yml` | A11y smoke tests |
| `performance-check.yml` | Lighthouse metrics |
| `deployment-gates.yml` | Pre-deployment validation |
| `visual-regression.yml` | Screenshot regression |
| `security-baseline.yml` | Security baseline checks |
| `load-testing.yml` | Load/stress testing |
| `quality-dashboard.yml` | Test metrics aggregation |

## Environment Variables (Critical)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin DB access |
| `STRIPE_*` (6 keys) | Billing (LIVE production keys) |
| `FOUNDER_EMAILS` | Admin access control |
| `UPSTASH_REDIS_*` | Rate limiting / caching |
| `SENTRY_*` | Error monitoring |
| `TRIGGER_*` | Background job config |

## Workflow

### Standard Deploy
1. Ensure all CI checks pass on PR
2. Merge to `main` → Vercel auto-deploys
3. Monitor Sentry for new errors post-deploy
4. Check health endpoint: `/api/health`

### Database Migration Deploy
1. Write migration in `supabase/migrations/`
2. Test migration locally
3. Apply to staging Supabase instance
4. Verify RLS policies work
5. Apply to production
6. Deploy application code that depends on new schema

### Mobile App Release
1. Follow `mobile/` build scripts
2. Use Capacitor for iOS + Android builds
3. Follow App Store / Play Store submission guides
4. Update `capacitor.config.json` version

### Production Incident Response
1. Check Sentry for error details and stack trace
2. Check Vercel function logs for timeouts/crashes
3. Check Upstash Redis dashboard for rate limiting issues
4. Check Supabase dashboard for database issues
5. Check Trigger.dev dashboard for background job failures
6. Roll back via Vercel instant rollback if needed

## Cron Jobs

| Schedule | Job | Path |
|----------|-----|------|
| Daily 6 AM UTC | Compliance check | `app/api/cron/` |

## Rules

- **Vercel deploys automatically on merge to `main`** — ensure CI passes first
- **Stripe keys are LIVE production** — never test with prod checkout
- **Database migrations are irreversible once deployed** — test thoroughly
- **Follow `RELEASE_DISCIPLINE_CHECKLIST.md`** for major releases
- **Monitor Sentry** after every deploy — catch regressions early
- **Health check** (`/api/health`) must return 200 post-deploy
- **Function timeouts:** billing/auth = 60s, default = 30s (in `vercel.json`)
- **Never commit `.env.local`** — it contains production secrets
- **Background jobs (Trigger.dev)** — verify webhook delivery after deploy
- **Mobile releases** require separate App Store / Play Store review cycles
- **Rollback via Vercel** if critical errors detected — don't debug in production
