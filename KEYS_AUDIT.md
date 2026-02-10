# 🔐 FormaOS Keys & Configuration Audit

**Generated:** 2026-02-10  
**Status:** Complete Inventory  
**Purpose:** Single source of truth for all environment variables, secrets, and configuration

---

## 📋 Executive Summary

This document maps all environment variables, secrets, and configuration used across FormaOS:
- **Runtime scopes:** Local Dev / Preview / Production / CI
- **Storage locations:** GitHub Actions Secrets/Vars, Vercel Env, Supabase dashboard, local .env
- **Usage patterns:** Client-side (NEXT_PUBLIC_*) vs Server-only
- **Security classification:** Public / Private / Secret

---

## 🎯 Key Findings

### Critical Issues Identified
1. **Naming Inconsistency:** `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`
   - Code uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
   - Workflows use: `SUPABASE_SERVICE_KEY` ❌
   - **Action Required:** Standardize to `SUPABASE_SERVICE_ROLE_KEY`

2. **Duplicate Variables:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Both are checked in client.ts (line 26-31)
   - **Action Required:** Standardize to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Missing Variables in CI:**
   - Workflows reference `SUPABASE_URL` but code expects `NEXT_PUBLIC_SUPABASE_URL`
   - Workflows reference `SUPABASE_ANON_KEY` but code expects `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📊 Complete Environment Variable Inventory

### 1. Supabase Configuration

#### NEXT_PUBLIC_SUPABASE_URL
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ✅ Yes (Critical)
- **Security:** Public - Safe to expose
- **Format:** `https://[project-id].supabase.co`
- **Used In:**
  - `lib/supabase/client.ts` (line 89)
  - `lib/supabase/server.ts` (line 25)
  - `lib/supabase/admin.ts` (line 6)
  - `e2e/**/*.spec.ts` (multiple test files)
- **Scope:**
  - ✅ Local Dev: Required
  - ✅ Preview: Required
  - ✅ Production: Required
  - ✅ CI: Required
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (all scopes)
  - GitHub Actions: Use `secrets.NEXT_PUBLIC_SUPABASE_URL` or `vars.NEXT_PUBLIC_SUPABASE_URL`

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ✅ Yes (Critical)
- **Security:** Public - Safe to expose (RLS protected)
- **Format:** JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- **Used In:**
  - `lib/supabase/client.ts` (line 29)
  - `lib/supabase/server.ts` (line 28)
  - `e2e/helpers/test-auth.ts` (line 11)
- **Scope:**
  - ✅ Local Dev: Required
  - ✅ Preview: Required
  - ✅ Production: Required
  - ✅ CI: Required
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (all scopes)
  - GitHub Actions: Use `secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY` or `vars.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Notes:**
  - Also checked as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (line 28) - should remove this alias

#### SUPABASE_SERVICE_ROLE_KEY
- **Type:** Private (SERVER-ONLY)
- **Required:** ✅ Yes (Critical)
- **Security:** 🔴 SECRET - NEVER expose client-side
- **Format:** JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- **Used In:**
  - `lib/supabase/admin.ts` (line 9)
  - `e2e/helpers/test-auth.ts` (line 12)
  - `scripts/test-db-integrity.js` (line 2)
- **Scope:**
  - ✅ Local Dev: Required (for admin operations)
  - ✅ Preview: Required
  - ✅ Production: Required
  - ✅ CI: Required (for E2E tests with admin access)
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (Production, Preview only)
  - GitHub Actions: `secrets.SUPABASE_SERVICE_ROLE_KEY`
- **⚠️ CRITICAL:** This key bypasses Row Level Security (RLS)
- **Note:** Also referred to as `SUPABASE_SERVICE_ROLE` in some E2E tests (inconsistency)

---

### 2. Application URLs

#### NEXT_PUBLIC_APP_URL
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ✅ Yes (Critical for auth)
- **Security:** Public
- **Format:** `https://app.formaos.com.au` (production) or `http://localhost:3000` (dev)
- **Used In:**
  - `middleware.ts` (domain routing logic)
  - `emails/**/*.tsx` (line 1 in each)
  - `e2e/**/*.spec.ts` (multiple tests)
- **Scope:**
  - ✅ Local Dev: `http://localhost:3000`
  - ✅ Preview: `https://[branch]-formaos.vercel.app`
  - ✅ Production: `https://app.formaos.com.au`
  - ✅ CI: `http://localhost:3000` or test URL
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (set per scope)
  - GitHub Actions: `vars.NEXT_PUBLIC_APP_URL` or inline in workflow

#### NEXT_PUBLIC_SITE_URL
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ✅ Yes (Critical for auth)
- **Security:** Public
- **Format:** `https://formaos.com.au` (production) or `http://localhost:3000` (dev)
- **Used In:**
  - `middleware.ts` (domain routing logic)
  - `e2e/node-wire.spec.ts` (line 7)
- **Scope:**
  - ✅ Local Dev: `http://localhost:3000`
  - ✅ Preview: `https://[branch]-formaos-site.vercel.app`
  - ✅ Production: `https://formaos.com.au`
  - ❌ CI: Not required
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (set per scope)

---

### 3. Authentication & Session

#### NEXT_PUBLIC_AUTH_REDIRECT_URL
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ❌ No (Optional - uses NEXT_PUBLIC_APP_URL if not set)
- **Security:** Public
- **Format:** `https://app.formaos.com.au/auth/callback`
- **Used In:**
  - Not directly referenced (Supabase handles via site URL)
- **Scope:**
  - ⚠️ Local Dev: Not needed (localhost works)
  - ⚠️ Preview: Optional
  - ⚠️ Production: Optional (defaults to APP_URL/auth/callback)
- **Status:** 🟡 Can be removed or deprecated

#### NEXT_PUBLIC_COOKIE_DOMAIN
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ❌ No (Auto-detected)
- **Security:** Public
- **Format:** `.formaos.com.au` (production) or undefined (dev)
- **Used In:**
  - `lib/supabase/cookie-domain.ts` (auto-resolution logic)
- **Scope:**
  - ❌ Local Dev: Not needed (auto-detected)
  - ❌ Preview: Not needed (auto-detected)
  - ❌ Production: Not needed (auto-detected)
- **Status:** 🟢 Auto-detected, no config needed

---

### 4. Founder Access Control

#### FOUNDER_EMAILS
- **Type:** Private (SERVER-ONLY)
- **Required:** ✅ Yes (for /admin access)
- **Security:** 🟡 Sensitive (but not secret)
- **Format:** Comma-separated list: `email1@domain.com,email2@domain.com`
- **Used In:**
  - `middleware.ts` (isFounder check)
  - `lib/auth/founder-check.ts` (if exists)
- **Scope:**
  - ✅ Local Dev: Required
  - ✅ Preview: Required
  - ✅ Production: Required
  - ❌ CI: Not required (unless testing admin routes)
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (all scopes)
  - GitHub Actions: `secrets.FOUNDER_EMAILS` or `vars.FOUNDER_EMAILS`

#### FOUNDER_USER_IDS
- **Type:** Private (SERVER-ONLY)
- **Required:** ❌ No (Optional - email check is primary)
- **Security:** 🟡 Sensitive
- **Format:** Comma-separated UUIDs: `uuid-1,uuid-2,uuid-3`
- **Used In:**
  - `middleware.ts` (secondary isFounder check)
- **Scope:**
  - ⚠️ Local Dev: Optional
  - ⚠️ Preview: Optional
  - ⚠️ Production: Recommended
  - ❌ CI: Not required
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (all scopes)

---

### 5. Automation & Cron

#### CRON_SECRET
- **Type:** Private (SERVER-ONLY)
- **Required:** ✅ Yes (if using /api/cron endpoints)
- **Security:** 🔴 SECRET
- **Format:** Random string (32+ chars): `openssl rand -hex 32`
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
- **Used In:**
  - `.env.automation.example` (template)
  - `app/api/cron/**/*.ts` (if exists)
- **Scope:**
  - ⚠️ Local Dev: Optional (if testing cron)
  - ⚠️ Preview: Optional
  - ✅ Production: Required (if cron used)
  - ❌ CI: Not required
- **Storage:**
  - Local: `.env.local`
  - Vercel: Environment Variables (Production, Preview)
  - GitHub Actions: `secrets.CRON_SECRET`

---

### 6. Testing & E2E

#### E2E_TEST_EMAIL
- **Type:** Private (CI/Testing only)
- **Required:** ✅ Yes (for E2E auth tests)
- **Security:** 🟡 Sensitive
- **Format:** `test-user@example.com`
- **Used In:**
  - `e2e/helpers/test-auth.ts` (line 6)
  - Multiple E2E test files
- **Scope:**
  - ❌ Local Dev: Optional (for local E2E)
  - ❌ Preview: Not needed
  - ❌ Production: Not needed
  - ✅ CI: Required
- **Storage:**
  - Local: `.env.local` (optional)
  - GitHub Actions: `secrets.E2E_TEST_EMAIL`

#### E2E_TEST_PASSWORD
- **Type:** Private (CI/Testing only)
- **Required:** ✅ Yes (for E2E auth tests)
- **Security:** 🔴 SECRET
- **Format:** Password string
- **Used In:**
  - `e2e/helpers/test-auth.ts` (line 7)
  - Multiple E2E test files
- **Scope:**
  - ❌ Local Dev: Optional (for local E2E)
  - ❌ Preview: Not needed
  - ❌ Production: Not needed
  - ✅ CI: Required
- **Storage:**
  - Local: `.env.local` (optional)
  - GitHub Actions: `secrets.E2E_TEST_PASSWORD`

#### PLAYWRIGHT_BASE_URL
- **Type:** Public (Testing config)
- **Required:** ❌ No (defaults to localhost:3000)
- **Security:** Public
- **Format:** `http://localhost:3000` or test URL
- **Used In:**
  - `e2e/**/*.spec.ts` (multiple tests)
  - `playwright.config.ts` (if exists)
- **Scope:**
  - ❌ All: Optional (defaults applied)

#### CI
- **Type:** Public (Node.js convention)
- **Required:** ❌ No (Auto-set by CI environments)
- **Security:** Public
- **Format:** `true` or unset
- **Used In:**
  - `e2e/helpers/test-auth.ts` (line 15)
  - Multiple test files
- **Scope:**
  - ✅ CI: Auto-set by GitHub Actions
- **Storage:** Auto-set, no config needed

---

### 7. Monitoring & Analytics (Optional)

#### NEXT_PUBLIC_SENTRY_DSN
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ❌ No (Optional)
- **Security:** Public
- **Format:** `https://[key]@[org].ingest.sentry.io/[project]`
- **Used In:**
  - `sentry.client.config.ts` (line 1)
  - `sentry.server.config.ts`
- **Scope:**
  - ❌ Local Dev: Optional
  - ⚠️ Preview: Recommended
  - ✅ Production: Recommended
  - ❌ CI: Not needed
- **Storage:**
  - Local: `.env.local` (optional)
  - Vercel: Environment Variables (Production, Preview)

#### NEXT_PUBLIC_GA_ID
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ❌ No (Optional)
- **Security:** Public
- **Format:** `G-XXXXXXXXXX`
- **Used In:**
  - Analytics components (if exists)
- **Scope:**
  - ❌ Local Dev: Not needed
  - ❌ Preview: Optional
  - ⚠️ Production: Optional
- **Storage:**
  - Vercel: Environment Variables (Production)

#### CODECOV_TOKEN
- **Type:** Private (CI only)
- **Required:** ❌ No (Optional - for coverage upload)
- **Security:** 🔴 SECRET
- **Used In:**
  - `.github/workflows/quality-gates.yml` (line 76)
  - `.github/workflows/qa-pipeline.yml` (line 47)
- **Scope:**
  - ❌ All: CI only
- **Storage:**
  - GitHub Actions: `secrets.CODECOV_TOKEN`
- **Status:** ✅ Already marked `continue-on-error: true`

#### SNYK_TOKEN
- **Type:** Private (CI only)
- **Required:** ❌ No (Optional - for security scanning)
- **Security:** 🔴 SECRET
- **Used In:**
  - `.github/workflows/quality-gates.yml` (line 152)
  - `.github/workflows/qa-pipeline.yml` (line 59)
- **Scope:**
  - ❌ All: CI only
- **Storage:**
  - GitHub Actions: `secrets.SNYK_TOKEN`
- **Status:** ✅ Already marked `continue-on-error: true`

#### LHCI_GITHUB_APP_TOKEN
- **Type:** Private (CI only)
- **Required:** ❌ No (Optional - for Lighthouse CI)
- **Security:** 🔴 SECRET
- **Used In:**
  - `.github/workflows/performance-check.yml` (if exists)
- **Scope:**
  - ❌ All: CI only
- **Storage:**
  - GitHub Actions: `secrets.LHCI_GITHUB_APP_TOKEN`
- **Status:** Should be marked `continue-on-error: true`

---

### 8. Node.js & Build Configuration

#### NODE_ENV
- **Type:** Public (Node.js convention)
- **Required:** ✅ Yes (Auto-set by framework)
- **Security:** Public
- **Format:** `development` | `production` | `test`
- **Used In:**
  - `lib/supabase/server.ts` (line 13)
  - `sentry.client.config.ts` (line 2)
  - Multiple files
- **Scope:**
  - ✅ All: Auto-set
- **Storage:** Auto-set by Next.js, no config needed

#### NEXT_PUBLIC_VERCEL_ENV
- **Type:** Public (NEXT_PUBLIC_*)
- **Required:** ❌ No (Auto-set by Vercel)
- **Security:** Public
- **Format:** `production` | `preview` | `development`
- **Used In:**
  - `sentry.client.config.ts` (line 3)
- **Scope:**
  - ✅ All: Auto-set by Vercel
- **Storage:** Auto-set by Vercel, no config needed

---

## 🔧 Workflow Environment Variable Mapping

### Current Issues in GitHub Actions Workflows

#### qa-pipeline.yml (Lines 10-13)
```yaml
env:
  NODE_VERSION: '20'
  SUPABASE_URL: ${{ secrets.SUPABASE_URL || '' }}              # ❌ Should be NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY || '' }}    # ❌ Should be NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY || '' }} # ❌ Should be SUPABASE_SERVICE_ROLE_KEY
```

**Fix Required:**
```yaml
env:
  NODE_VERSION: '20'
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || vars.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || vars.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

#### Other Workflows
- All workflows should use consistent naming
- Use `vars.` for non-secret public values
- Use `secrets.` for private values

---

## 📍 Storage Locations Summary

### GitHub Actions (Secrets & Variables)

**Required Secrets:**
- `SUPABASE_SERVICE_ROLE_KEY` (SECRET)
- `E2E_TEST_EMAIL` (Sensitive)
- `E2E_TEST_PASSWORD` (SECRET)

**Required Variables (or Secrets):**
- `NEXT_PUBLIC_SUPABASE_URL` (Can be public var)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Can be public var)

**Optional Secrets (already marked continue-on-error):**
- `CODECOV_TOKEN`
- `SNYK_TOKEN`
- `LHCI_GITHUB_APP_TOKEN`

### Vercel Environment Variables

**Production Scope:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Sensitive - encrypted)
- `NEXT_PUBLIC_APP_URL=https://app.formaos.com.au`
- `NEXT_PUBLIC_SITE_URL=https://formaos.com.au`
- `FOUNDER_EMAILS` (comma-separated)
- `FOUNDER_USER_IDS` (optional, comma-separated)
- `CRON_SECRET` (if using cron)
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

**Preview Scope:**
- Same as Production, but with preview URLs
- `NEXT_PUBLIC_APP_URL=https://preview-[branch].vercel.app`

**Development Scope:**
- Same as Production, but with localhost URLs
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Local Development (.env.local)

**Minimum required:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin Access
FOUNDER_EMAILS=your-email@example.com
```

### Supabase Dashboard

**OAuth Redirect URLs (must be configured):**
- Production: `https://app.formaos.com.au/auth/callback`
- Preview: `https://[branch]-formaos.vercel.app/auth/callback`
- Local: `http://localhost:3000/auth/callback`

**Site URL:**
- Production: `https://app.formaos.com.au`

**JWT Settings:**
- JWT expiry: Default (3600 seconds / 1 hour)
- JWT secret: Auto-generated (do not change unless rotating)

---

## ⚠️ Security Compliance Checklist

### ✅ PASS: Properly Protected
- ✅ Service role key only used server-side
- ✅ No secrets in tracked git files
- ✅ Sensitive keys use `secrets.` in workflows
- ✅ Client.ts uses fallback for missing config
- ✅ Admin.ts guards against missing service role

### 🟡 WARNING: Needs Attention
- 🟡 Naming inconsistency: `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`
- 🟡 Duplicate check: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 🟡 Workflow variable names don't match code expectations

### ❌ CRITICAL: Must Fix
- ❌ GitHub Actions workflows use wrong variable names
- ❌ Need to standardize all naming

---

## 🔄 Key Rotation Procedures

### Supabase JWT Keys Rotation

**Service Role Key Regeneration:**
1. Go to Supabase Dashboard → Project Settings → API
2. Click "Generate new JWT secret"
3. **WARNING:** This invalidates ALL existing JWTs (all user sessions)
4. Update `SUPABASE_SERVICE_ROLE_KEY` in:
   - Vercel Environment Variables (Production, Preview)
   - GitHub Actions Secrets
   - Local `.env.local` files for all developers
5. Redeploy application
6. All users must re-authenticate

**Anon Key Rotation:**
- Anon key is derived from JWT secret
- Rotating JWT secret automatically rotates anon key
- Follow same procedure as service role key rotation

**Best Practice:**
- Rotate keys quarterly or after security incident
- Coordinate rotation during low-traffic period
- Have rollback plan (keep old keys for 24h grace period if possible)
- Test in Preview environment first

---

## 📊 Quick Reference Table

| Variable | Type | Required | Scope | Storage | Security |
|----------|------|----------|-------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Yes | All | All | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Yes | All | All | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | ✅ Yes | All | Vercel, GitHub, Local | 🔴 SECRET |
| `NEXT_PUBLIC_APP_URL` | Public | ✅ Yes | All | All | Public |
| `NEXT_PUBLIC_SITE_URL` | Public | ✅ Yes | All | All | Public |
| `FOUNDER_EMAILS` | Private | ✅ Yes | All | Vercel, Local | 🟡 Sensitive |
| `FOUNDER_USER_IDS` | Private | ⚠️ Optional | Prod | Vercel, Local | 🟡 Sensitive |
| `CRON_SECRET` | Private | ⚠️ Optional | Prod | Vercel, Local | 🔴 SECRET |
| `E2E_TEST_EMAIL` | Private | ⚠️ CI only | CI | GitHub | 🟡 Sensitive |
| `E2E_TEST_PASSWORD` | Private | ⚠️ CI only | CI | GitHub | 🔴 SECRET |
| `CODECOV_TOKEN` | Private | ❌ Optional | CI | GitHub | 🔴 SECRET |
| `SNYK_TOKEN` | Private | ❌ Optional | CI | GitHub | 🔴 SECRET |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | ❌ Optional | Prod | Vercel | Public |

---

## 🎯 Action Items

### Immediate (Critical)
1. ✅ **Standardize naming** in GitHub Actions workflows
2. ✅ **Remove duplicate variable checks** in client.ts
3. ✅ **Update workflow env references** to match code expectations

### High Priority
4. ✅ **Create verification scripts** for all keys
5. ✅ **Document Vercel env setup** in VERCEL_ENV_PATCH.md
6. ✅ **Audit git history** for accidentally committed secrets

### Medium Priority
7. ⚠️ **Add pre-commit hooks** for secret detection
8. ⚠️ **Document key rotation procedures** for team
9. ⚠️ **Set up monitoring** for failed auth attempts

### Low Priority
10. 🟢 **Remove deprecated variables** (e.g., NEXT_PUBLIC_AUTH_REDIRECT_URL)
11. 🟢 **Add environment validation** script to package.json
12. 🟢 **Create .env.example** template with all variables

---

## 📞 Support & Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **GitHub Actions Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-10  
**Maintained By:** DevOps Team
