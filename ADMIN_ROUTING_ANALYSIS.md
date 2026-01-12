# Admin Routing Flow Analysis

## Issue
Visiting `/admin` was redirecting to `/pricing` instead of showing admin dashboard.

## Root Cause
Founders (platform admins) have **NO** org_members records - they're not tenants.
When a founder logged in, multiple code paths checked for org membership and redirected to `/onboarding` when none was found.
The onboarding page then redirected to `/pricing` for users without membership.

## Complete Fix Applied

### 1. Middleware (middleware.ts)
**Line 177-196**: Founder detection runs FIRST, immediately after auth check
- If user visits `/admin` and isFounder = true → allows access
- If user visits `/admin` and isFounder = false → redirects to `/auth/signin`
- Added comprehensive logging to diagnose env var issues

### 2. Auth Callback (app/auth/callback/route.ts)
**Line 66-71**: Detects founder after OAuth login
- Redirects founders directly to `/admin`
- Regular users go through org creation flow

### 3. Onboarding Page (app/onboarding/page.tsx)
**Line 45-68**: NEW FIX - Added founder bypass
- Checks if user is founder BEFORE org membership check
- Redirects founders to `/admin` if they somehow reach onboarding
- Prevents the redirect chain: onboarding → pricing

### 4. Marketing Layout (app/(marketing)/layout.tsx)
**Line 17-43**: Redirects authenticated users
- Founders → `/admin`
- Regular users → `/app`

### 5. App Layout (app/app/layout.tsx)
**Line 48-75**: Redirects founders to admin
- Founders should not access tenant app
- Redirects to `/admin` if they try

### 6. Admin Layout (app/admin/layout.tsx)
Calls `requireFounderAccess()` to verify access

### 7. Billing Actions (app/app/actions/billing.ts)
**Line 9-42**: Founder bypass in checkout
- Prevents founders from entering billing flow

## Expected Flow After Fix

### Scenario 1: Unauthenticated user visits /admin
1. Middleware (line 144): Not authenticated → redirect to `/auth/signin` ✅

### Scenario 2: Founder logs in via Google OAuth
1. Auth callback (line 69): isFounder = true → redirect to `/admin` ✅
2. Middleware (line 177-196): `/admin` path, isFounder = true → allow access ✅
3. Admin layout: requireFounderAccess() → verify → render dashboard ✅

### Scenario 3: Regular user visits /admin
1. Middleware (line 144): Authenticated → continue
2. Middleware (line 191): `/admin` path, isFounder = false → redirect to `/auth/signin` ✅

### Scenario 4: Founder somehow reaches /onboarding
1. Onboarding page (line 45-68): isFounder = true → redirect to `/admin` ✅
   (Prevents the pricing redirect)

## Critical Environment Variables

Must be set in Vercel Production environment:

```bash
FOUNDER_EMAILS=ejazhussaini313@gmail.com
```

Or:

```bash
FOUNDER_USER_IDS=<uuid-from-auth-users-table>
```

## Verification Steps

1. Set `FOUNDER_EMAILS` in Vercel → Settings → Environment Variables → Production
2. Redeploy from Vercel dashboard
3. Visit `https://app.formaos.com.au/admin`
4. Check Vercel Runtime Logs for:
   ```
   [Middleware] 🔧 ENV CHECK { FOUNDER_EMAILS_RAW: 'ejazhussaini313@gmail.com', ... }
   [Middleware] FOUNDER DETECTION { isFounder: true, emailMatch: true, ... }
   [Middleware] 🟢 FOUNDER ACCESS GRANTED - BYPASSING ALL CHECKS
   ```

## Diagnosis Guide

If still redirecting to `/pricing`:

1. **Check logs for `FOUNDER_EMAILS_RAW: undefined`**
   → Env var not set in Vercel

2. **Check logs for `isFounder: false` with env var set**
   → Email in auth.users doesn't match exactly
   → Check for whitespace, case sensitivity

3. **Check if founder has org_members record**
   → Run: `DELETE FROM public.org_members WHERE user_id = '<founder_uuid>'`
   → Founders should NOT be in any organization

4. **Still failing after env var set?**
   → Hard redeploy from Vercel dashboard
   → Clear browser cookies and cache
   → Check Runtime Logs line-by-line

## Files Modified

- ✅ middleware.ts - Moved founder check to first position (line 141-196)
- ✅ app/auth/callback/route.ts - Already had founder detection (line 66-71)
- ✅ app/onboarding/page.tsx - **NEW** Added founder bypass (line 45-68)
- ✅ app/(marketing)/layout.tsx - Already had founder redirect (line 17-43)
- ✅ app/app/layout.tsx - Already had founder redirect (line 48-75)
- ✅ app/app/actions/billing.ts - Already had founder bypass (line 9-42)

## Summary

The fix ensures founders are detected and redirected to `/admin` at EVERY possible entry point:
- OAuth callback
- Middleware (before ALL other checks)
- Onboarding page (NEW - prevents pricing redirect)
- Marketing layout
- App layout
- Billing actions

**No code path should lead a founder to `/pricing` anymore.**
