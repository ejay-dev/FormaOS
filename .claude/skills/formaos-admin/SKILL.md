---
name: formaos-admin
description: Build and extend the FormaOS admin console and platform administration features. Use when working with the founder/admin panel, organization management, user management, subscription oversight, feature flags, security monitoring, QA audit runner, session logs, or platform-level controls.
---

# FormaOS Admin Console Engineering

## Architecture Overview

- **Admin access** controlled by `FOUNDER_EMAILS` environment variable
- **Admin console** at `/admin` route group
- **Admin API** at `/api/admin/` with dedicated permission guards
- **Capabilities:** org management, user oversight, subscription control, security monitoring, feature flags, QA auditing

## Key Files & Directories

| Area | Path |
|------|------|
| Admin UI pages | `app/admin/`, `app/app/admin/` |
| Admin API routes | `app/api/admin/` (orgs, users, subscriptions, audits, features, health, sessions) |
| Admin logic | `lib/admin/` |
| Permission guards | `lib/api-permission-guards.ts` |
| Founder auth | `FOUNDER_EMAILS` env var |
| Admin E2E tests | `e2e/admin-founder-smoke.spec.ts` |
| System state API | `app/api/system-state/` |

## Admin Capabilities

| Feature | Description |
|---------|-------------|
| Org management | Create, view, configure organizations |
| User management | View users, manage roles, deactivate accounts |
| Subscription oversight | View/modify plans, manage trials, override billing |
| Feature flags | Enable/disable features per org or globally |
| Security monitoring | Session logs, suspicious activity, audit trails |
| QA audit runner | Run platform-wide quality checks |
| Health monitoring | System health, API status, service dependencies |

## Workflow

### Adding an Admin Feature
1. Read `lib/admin/` for existing admin logic
2. Add API route in `app/api/admin/{feature}/route.ts`
3. Add admin permission guard — only founders can access
4. Add UI page in `app/admin/` or `app/app/admin/`
5. Log admin actions via `lib/audit-trail.ts`
6. Write tests referencing `e2e/admin-founder-smoke.spec.ts`

### Working with Feature Flags
1. Feature flags are managed via admin API
2. Can be org-scoped or global
3. Check feature flag state in application code before feature access
4. Admin UI provides toggle interface

### Security Monitoring
1. Session logs track active/expired sessions
2. Suspicious activity detection flags anomalies
3. Audit trail provides immutable activity history
4. Admin can force-expire sessions

## Rules

- **Admin access is founder-only** — controlled by `FOUNDER_EMAILS` env var, not DB roles
- **All admin actions must be audit-logged** — use `lib/audit-trail.ts`
- **Admin API routes must use admin permission guards** — separate from regular guards
- **Never expose admin routes to non-founders** — verify at API layer AND UI layer
- **Feature flag changes are high-impact** — log who changed what and when
- **Admin can view cross-org data** — but this bypasses RLS, so handle with extreme care
- **Session management actions (force-expire) must be logged** with reason
- **Run `e2e/admin-founder-smoke.spec.ts`** after admin changes
