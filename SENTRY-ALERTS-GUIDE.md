# Sentry Alerts Guide — FormaOS

## Overview

FormaOS uses Sentry for error monitoring, performance tracing, and session replay across three runtimes:

| Runtime           | Config File               | Trace Sample Rate |
| ----------------- | ------------------------- | ----------------- |
| Client (browser)  | `sentry.client.config.ts` | 10%               |
| Server (Node.js)  | `sentry.server.config.ts` | 5%                |
| Edge (middleware) | `sentry.edge.config.ts`   | 5%                |

Production-only: all three configs set `enabled: process.env.NODE_ENV === 'production'`.

---

## PII Scrubbing

Every event passes through `lib/sentry/scrub-pii.ts` via the `beforeSend` hook:

- **Email addresses** → `[email-redacted]`
- **Bearer / JWT tokens** → `[auth-token-redacted]`
- **Sensitive keys** (password, token, secret, apikey, api_key) → `[redacted]`
- **User context** → stripped to `{ id }` only
- **Request body** → deep-scrubbed recursively
- **Breadcrumb messages** → scrubbed for emails and tokens

---

## Error Boundaries

| Layer       | File                                      | Scope                       |
| ----------- | ----------------------------------------- | --------------------------- |
| Global      | `app/error.tsx`                           | All unhandled render errors |
| App Shell   | `components/app-shell-error-boundary.tsx` | Authenticated app shell     |
| Route-level | 134 `error.tsx` files                     | Individual routes           |

All error boundaries call `Sentry.captureException()` with route context.

---

## Recommended Alert Rules

Configure these in Sentry → Alerts → Create Alert Rule.

### 1. Spike in Errors (P1)

- **Condition**: Error count > 50 in 5 minutes
- **Action**: Slack #incidents + PagerDuty
- **Filter**: `environment:production`
- **Why**: Catches deployment regressions or infrastructure issues

### 2. New Issue Detected (P2)

- **Condition**: First occurrence of a new issue
- **Action**: Slack #engineering
- **Filter**: `environment:production`, `level:error`
- **Why**: Surfaces new bugs immediately

### 3. Auth Failures Spike (P1)

- **Condition**: Issues matching `Unauthorized|auth|session` > 20 in 10 minutes
- **Action**: Slack #security + PagerDuty
- **Why**: May indicate credential stuffing or auth infrastructure failure

### 4. Billing / Stripe Errors (P1)

- **Condition**: Issues matching `billing|stripe|webhook|subscription` > 5 in 10 minutes
- **Action**: Slack #billing + email to founder
- **Why**: Revenue-critical — failed webhooks mean lost subscriptions

### 5. Performance Regression (P2)

- **Condition**: Transaction p95 > 3s for any route
- **Action**: Slack #engineering
- **Filter**: `transaction.op:http.server`
- **Why**: Catches slow server actions and API routes

### 6. Onboarding Errors (P2)

- **Condition**: Issues with URL matching `/onboarding*` > 3 in 30 minutes
- **Action**: Slack #product
- **Why**: Onboarding friction directly impacts user activation

### 7. Compliance Engine Errors (P1)

- **Condition**: Issues matching `compliance|framework|control|evaluation` > 5 in 10 minutes
- **Action**: Slack #engineering + email to founder
- **Why**: Core product — compliance failures erode trust

### 8. Unhandled Rejection Rate (P2)

- **Condition**: Unhandled promise rejections > 10 in 15 minutes
- **Action**: Slack #engineering
- **Why**: Often indicates missing error handling in async code

---

## Session Replay

Client-side replay is configured with:

- **Normal sessions**: 10% sampled
- **Error sessions**: 100% captured
- **Privacy**: `maskAllText: true`, `blockAllMedia: true`

Access replays in Sentry → Replays. Useful for reproducing UI bugs reported by users.

---

## Ignored Errors

These are intentionally filtered out:

**Client**: `ResizeObserver loop`, `Non-Error promise rejection`, `Network request failed`, `Load failed`, `Failed to fetch`

**Server**: `NEXT_NOT_FOUND`, `NEXT_REDIRECT` (Next.js uses throw for navigation)

---

## Environment Tags

Events are tagged with `environment` from `NEXT_PUBLIC_VERCEL_ENV` (preview/production) or `NODE_ENV`.

---

## Troubleshooting

| Symptom              | Check                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| No events in Sentry  | Verify `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel env vars                   |
| Missing stack traces | Ensure source maps are uploaded (Sentry webpack plugin in `next.config.ts`) |
| PII in events        | Test with `scrubPiiFromEvent()` — add the leaking field to `SENSITIVE_KEYS` |
| Too many events      | Adjust `tracesSampleRate` or add to `ignoreErrors`                          |
| Replay not working   | Only active in production with `NEXT_PUBLIC_SENTRY_DSN` set                 |
