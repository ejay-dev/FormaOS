# FormaOS

FormaOS is a compliance operations platform built on Next.js, Supabase, Stripe, Trigger.dev, and a growing control-plane/admin operating layer.

## What Lives Here

- `app/`: product app, marketing site, admin console, API routes
- `lib/`: domain services for billing, security, reporting, control-plane, onboarding, and compliance logic
- `supabase/migrations/`: schema history and platform/security hardening work
- `trigger/`: background jobs and workflow exports
- `e2e/`, `tests/`, `__tests__/`: browser, integration, and unit coverage

## Core Product Areas

- Multi-tenant compliance workspace with organization onboarding and role-aware access
- Billing, trials, entitlements, exports, and report generation
- Executive/compliance posture, evidence, controls, and automation workflows
- Admin console for platform support, security, releases, and control-plane operations
- Marketing/trust surfaces for enterprise buyers

## Platform Stack

- `Next.js 16`, `React 19`, `TypeScript 5`
- `Supabase` for auth, database, and storage
- `Stripe` for subscriptions and billing operations
- `Trigger.dev` for async/background workflows
- `Upstash Redis` for rate limiting and operational caching
- `OpenTelemetry`, `Langfuse`, `Sentry`, and internal monitoring hooks for observability

## Admin Console

The admin surface now supports:

- delegated platform-admin roles in addition to founder access
- immutable/legacy unified audit reads
- reason-gated admin mutations
- approval-gated high-risk changes for delegated admins
- customer-360 org view with members, entitlements, support, activity, sessions, security, and exports
- live ops surfaces for security, sessions, and activity

Relevant areas:

- `app/admin/`
- `app/api/admin/`
- `app/app/admin/access.ts`
- `lib/admin/`
- `lib/control-plane/`

## Local Development

```bash
cd ~/formaos
npm install
npm run dev
```

Before builds and dev, the project checks root and environment setup:

```bash
npm run check-root
npm run check-env
```

## High-Value Commands

```bash
npm run typecheck
npm run build
npm run qa:smoke
npm run qa:a11y
npm run audit:marketing-copy
npm run check:security-baseline
npm run check:admin-nav
```

## Working Rules

- Prefer `rg` for search and `npm run typecheck` before large merges.
- Treat `supabase/migrations/` as the source of truth for data model changes.
- Admin/security changes should preserve auditability, CSRF protection, and org isolation.
- Keep marketing claims aligned with implemented product capabilities.

## Current Gaps Worth Knowing

- Root project docs are still catching up to the codebase breadth.
- There are multiple parallel operating surfaces: product app, marketing site, admin console, control-plane, and async jobs.
- Reliability depends heavily on strong validation around billing, onboarding, provisioning, and admin actions.

See also:

- `TODO.md`
- `FORMAOS_CODEBASE_AUDIT_2026_03_05.md`
- `FORMAOS_MASTER_PROMPTS.md`
- `FORMAOS_MASTER_PROMPT_RUN_2026_03_14.md`
