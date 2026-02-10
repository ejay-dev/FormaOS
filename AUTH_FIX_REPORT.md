# Auth Fix Report - Google Login + Founder Admin Access

**Date:** 2026-02-10  
**Status:** ✅ Deployed

## Root Causes Identified

### 1. PKCE Code Verifier Cookie Loss

**Issue:** The PKCE code verifier cookie was being lost on some browsers (especially mobile Safari) and Vercel preview deployments due to:

- Cookie domain mismatch between sign-in origin and callback origin
- Vercel preview deployments using unique subdomains (e.g., `formaos-abc123-team.vercel.app`)
- ITP (Intelligent Tracking Prevention) on Safari blocking cookies

**Fix Applied:**

- Improved `lib/supabase/cookie-domain.ts` to detect and handle Vercel preview domains
- Enhanced PKCE fallback in `app/auth/callback/route.ts` with multiple recovery strategies
- Added comprehensive logging to diagnose cookie issues

### 2. PKCE Fallback Mechanism

**Issue:** The existing PKCE fallback tried to use an empty code verifier (`code_verifier: ''`) which never works.

**Fix Applied:**

- Now searches for all possible verifier cookies before giving up
- Tries multiple token exchange methods:
  1. Standard PKCE exchange with found verifier cookies
  2. Authorization code grant with service role key
- Added detailed logging for each fallback attempt

### 3. Founder Detection Logging

**Issue:** Founder email matching was not being logged in production, making it impossible to debug `isFounder: false` issues.

**Fix Applied:**

- Updated `lib/utils/founder.ts` to log founder checks on the server side
- Masked email for privacy while still showing enough to verify

## Files Changed

| File                            | Change                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `lib/supabase/cookie-domain.ts` | Added `isVercelPreview()` detection; prevent domain cookies on preview deployments |
| `app/auth/callback/route.ts`    | Improved PKCE fallback with multiple recovery strategies and better logging        |
| `lib/utils/founder.ts`          | Enhanced logging for founder detection (works in production)                       |
| `app/app/layout.tsx`            | Already had `export const dynamic = 'force-dynamic'` (from previous fix)           |

## Validation Checklist

### Local Build

- [x] `npm run build` succeeds
- [x] TypeScript compilation passes
- [x] ESLint passes (within warning threshold)

### Production Verification

- [ ] New user Google sign-in works
- [ ] Existing user Google sign-in works
- [ ] Founder email can access `/admin/dashboard`
- [ ] Preview deployments preserve cookies

### What to Monitor in Vercel Logs

Look for these log patterns:

```
# Successful PKCE exchange
[auth/callback] Session established for: user@example.com

# PKCE fallback triggered (cookies lost)
[auth/callback] PKCE verifier missing – attempting server-side fallback

# Successful fallback
[auth/callback] ✅ Admin API token exchange succeeded for: user@example.com

# Founder access check
[isFounder] Check: { maskedEmail: 'eja***@gmail.com', emailMatch: true, result: true }

# Founder granted admin access
[Middleware] ✅ FOUNDER ACCESS GRANTED TO /admin
```

## Supabase Dashboard Configuration Required

Ensure these are configured in Supabase Dashboard → Auth → URL Configuration:

1. **Site URL:** `https://app.formaos.com.au` (or your production URL)

2. **Redirect URLs (must include all):**
   - `https://app.formaos.com.au/auth/callback`
   - `https://formaos.com.au/auth/callback`
   - `https://*.vercel.app/auth/callback` (for preview deployments)

3. **Google OAuth Provider:**
   - Client ID configured correctly
   - Client Secret configured correctly
   - Redirect URI in Google Console matches Supabase's

## Vercel Environment Variables Required

Ensure these are set in Vercel for **Production**, **Preview**, and **Development**:

| Variable                        | Description                                   | Scope      |
| ------------------------------- | --------------------------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                          | All        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                             | All        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key                     | All        |
| `NEXT_PUBLIC_APP_URL`           | `https://app.formaos.com.au`                  | Production |
| `NEXT_PUBLIC_SITE_URL`          | `https://formaos.com.au`                      | Production |
| `FOUNDER_EMAILS`                | `ejazhussaini313@gmail.com` (comma-separated) | All        |

For Preview deployments, `NEXT_PUBLIC_APP_URL` should be dynamic or use `VERCEL_URL`.

## Troubleshooting

### "PKCE failed" Error

1. Check Vercel logs for `[auth/callback] PKCE verifier missing`
2. Verify cookie domain isn't being set for preview deployments
3. Ensure redirect URLs in Supabase include the callback domain

### Founder Can't Access Admin

1. Check logs for `[isFounder] Check:` - verify `emailMatch: true`
2. Confirm `FOUNDER_EMAILS` env var is set in Vercel (not just locally)
3. Check that the email matches exactly (case-insensitive)

### Session Not Persisting

1. Check `[auth/callback]` logs for any errors
2. Verify cookies are being set (`cookies.set` in logs)
3. Check browser dev tools for blocked cookies

## Next Steps (Manual)

1. **Supabase:** Verify Google OAuth redirect URLs include preview domains
2. **Vercel:** Confirm `FOUNDER_EMAILS` is set for all environments
3. **Test:** Sign in with founder email and access `/admin/dashboard`
