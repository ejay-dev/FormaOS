---
name: formaos-auth
description: Work with FormaOS authentication, authorization, SSO, and security features. Use when modifying login/signup flows, OAuth (Google), SAML/SSO, MFA/2FA (TOTP + backup codes), session management, password policies, CSRF protection, security headers, or role-based access control. Also use when debugging auth issues or hardening security.
---

# FormaOS Authentication & Security Engineering

## Architecture Overview

- **Supabase Auth** as identity provider
- **Methods:** Email/password, Google OAuth, SAML SSO
- **MFA:** TOTP with encrypted secrets + backup codes (crypto.randomBytes)
- **Sessions:** JWT + secure cookies, with timeout enforcement
- **Roles:** Founder/admin access via `FOUNDER_EMAILS` env var
- **Rate limiting:** Fail-closed on auth routes via Upstash Redis
- **Security audit:** Enterprise-grade, approved March 5, 2026

## Key Files & Directories

| Area | Path |
|------|------|
| Auth logic | `lib/auth/` |
| Security utilities | `lib/security.ts` |
| Auth API routes | `app/api/auth/` (signup, signin, password reset, MFA, callback) |
| SSO/SAML | `app/api/sso/`, `lib/sso/` |
| Auth UI components | `components/auth/` |
| Auth pages | `app/auth/` |
| Permission guards | `lib/api-permission-guards.ts` |
| Rate limiting | `lib/ratelimit.ts` |
| Session management | `lib/auth/` |
| Onboarding flow | `app/onboarding/` |
| Auth E2E tests | `e2e/auth-invariant.spec.ts` |
| Security tests | `__tests__/security/` |
| Security CI | `.github/workflows/security-scan.yml`, `.github/workflows/security-baseline.yml` |

## Workflow

### Modifying Auth Flows
1. Read `lib/auth/` for current auth logic
2. Check `app/api/auth/` for relevant API routes
3. Update Supabase Auth config if needed
4. Update UI in `components/auth/` and `app/auth/`
5. Verify rate limiting is applied (fail-closed)
6. Run auth tests: `e2e/auth-invariant.spec.ts`
7. Run security baseline: `npm run test:security`

### Adding SSO/SAML Provider
1. Read `lib/sso/` for current SAML implementation
2. Add provider config in `app/api/sso/`
3. Test SAML assertion parsing and validation
4. Verify session creation post-SSO
5. Check org-level SSO enforcement

### Hardening Security
1. Check `lib/security.ts` for existing security utilities
2. Review CSP headers in `next.config.ts` (nonce-based for app, static for marketing)
3. Verify security headers: X-Frame-Options, HSTS, etc.
4. Check password-breach checking on signup
5. Run security scan: `.github/workflows/security-scan.yml`

## Security Checklist (Post-Audit Hardened)

- [x] TOTP encryption required in production
- [x] Backup codes use `crypto.randomBytes` (not Math.random)
- [x] Supabase error objects never leaked to clients
- [x] 2FA disable requires password re-verification
- [x] All public endpoints rate-limited
- [x] CSRF protection enabled
- [x] Secure cookie settings (HttpOnly, Secure, SameSite)
- [x] Session timeout enforcement
- [x] Password breach checking on signup

## Rules

- **Auth rate limiting is fail-closed** — if Redis is down, deny auth requests
- **Never use `Math.random`** for security-sensitive values — use `crypto` module
- **Never leak Supabase error objects** to clients — sanitize all error responses
- **2FA changes require password re-verification** — no exceptions
- **TOTP secrets must be encrypted** in production (`lib/security.ts`)
- **Session cookies:** HttpOnly, Secure, SameSite=Lax
- **Founder access** is controlled by `FOUNDER_EMAILS` env var — not DB roles
- **Auth routes get 60s timeout** — configured in `vercel.json`
- **Always run `e2e/auth-invariant.spec.ts`** after auth changes
- **Never store plaintext passwords or tokens** — use Supabase Auth or encrypted storage
- **CSP headers use nonces** for app routes — never use `unsafe-inline`
