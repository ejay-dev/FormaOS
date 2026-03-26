---
name: formaos-api
description: Build, extend, and debug FormaOS REST API routes and server actions. Use when working with API endpoints (/api/v1/*, /api/admin/*), server actions, API keys (fos_ prefix), webhooks, rate limiting, permission guards, OpenAPI spec, or API middleware. Also use when adding new endpoints, debugging API errors, or modifying request/response handling.
---

# FormaOS API Engineering

## Architecture Overview

- **Next.js API Routes** (serverless on Vercel, Sydney region `syd1`)
- **RESTful** `/api/v1/` public API with OpenAPI spec (`openapi.json`)
- **Internal routes:** `/api/admin/`, `/api/auth/`, `/api/billing/`, `/api/sso/`
- **Rate limiting:** Upstash Redis via `lib/ratelimit.ts`
- **Permission guards:** `lib/api-permission-guards.ts`
- **Structured logging:** Pino (`lib/logger.ts`) — never use `console.log` in API routes

## Key Files & Directories

| Area | Path |
|------|------|
| Public API (v1) | `app/api/v1/` (~18 resource groups) |
| Admin API | `app/api/admin/` |
| Auth API | `app/api/auth/` |
| Billing API | `app/api/billing/` |
| SSO/SAML | `app/api/sso/` |
| Cron jobs | `app/api/cron/` |
| Health/Status | `app/api/health/`, `app/api/status/`, `app/api/version/` |
| Server actions | `app/app/actions/` |
| Permission guards | `lib/api-permission-guards.ts` |
| Rate limiting | `lib/ratelimit.ts` |
| OpenAPI spec | `openapi.json` |
| API key management | `app/api/v1/api-keys/` |
| Webhook delivery | `app/api/v1/webhooks/`, `trigger/webhook-delivery.ts` |
| API tests | `__tests__/api/` |

## Workflow

### Adding a New API Endpoint
1. Create route file in `app/api/v1/{resource}/route.ts`
2. Add permission guard using `lib/api-permission-guards.ts`
3. Add rate limiting via `lib/ratelimit.ts` (fail-closed on auth routes)
4. Use Pino logger — never `console.log`
5. Validate inputs with Zod schemas
6. Ensure org-scoped queries (multi-tenant isolation)
7. Update `openapi.json` with new endpoint schema
8. Write tests in `__tests__/api/`
9. Run `npm run type-check && npm run test`

### Adding a Server Action
1. Create in `app/app/actions/`
2. Use `"use server"` directive
3. Validate with Zod, check auth/permissions
4. Log via audit trail for state-changing actions

### Debugging API Issues
1. Check Pino structured logs (not console)
2. Verify rate limiting config in `lib/ratelimit.ts`
3. Check permission guards in `lib/api-permission-guards.ts`
4. Verify Supabase RLS policies are not blocking queries
5. Check Vercel function timeout (60s for billing/auth, 30s default)

## Rules

- **Always use Pino logger** — zero `console.log` in API layer
- **Always add rate limiting** — use `lib/ratelimit.ts`, fail-closed on auth routes
- **Always add permission guards** — use `lib/api-permission-guards.ts`
- **Always validate inputs** with Zod schemas
- **Always scope queries to org** — multi-tenant isolation is mandatory
- **API keys use `fos_` prefix** — never change this convention
- **Webhook signatures must be verified** (Stripe, Trigger.dev)
- **Function timeouts:** billing/auth = 60s, everything else = 30s
- **Update `openapi.json`** when adding/modifying public API endpoints
- **Zero TypeScript `any` types** in the API layer
- **Run `npm run type-check`** after changes — zero TS errors policy
