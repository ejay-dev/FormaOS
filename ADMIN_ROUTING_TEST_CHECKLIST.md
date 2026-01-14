# 🔐 Admin Routing Fix - Test Checklist & Deployment Guide

**Date**: 14 January 2026  
**Status**: ✅ Code Complete & Ready for Testing  
**Estimated Test Time**: 15-20 minutes

---

## Pre-Deployment Verification

### Code Review ✅

- [x] `/admin/page.tsx` - Simple redirect to `/admin/dashboard`
- [x] `/admin/dashboard/page.tsx` - Main dashboard page created
- [x] `app/auth/callback/route.ts` - Founder redirects to `/admin/dashboard`
- [x] `middleware.ts` - Founder check before any redirects
- [x] `admin-shell.tsx` - Navigation links updated

### Architecture Review ✅

- [x] Middleware founder check runs BEFORE any app/pricing redirects
- [x] Non-founders blocked at middleware level
- [x] Unauthenticated users redirected to signin
- [x] No redirect loops possible
- [x] Clean routing: all admin routes prefixed `/admin/[page]`

---

## Test Plan

### 1️⃣ Unauthenticated Access

**Test Case 1.1**: Unauthenticated user visits `/admin`

```
Steps:
  1. Clear browser cookies
  2. Navigate to https://app.formaos.com.au/admin
  3. Check browser console logs
  4. Verify redirect location
  
Expected Results:
  ✓ Redirected to /auth/signin
  ✓ Console shows: "[Middleware] ❌ /admin requires authentication"
  ✓ No errors
  ✓ Can proceed with Google login
```

**Test Case 1.2**: After login with non-founder

```
Steps:
  1. Continue with Google OAuth using non-founder email
  2. Check console logs
  3. Verify final destination
  
Expected Results:
  ✓ Redirected to /onboarding
  ✓ Console shows: "[auth/callback] ℹ️  Regular user (not founder)"
  ✓ Can complete onboarding
```

**Test Case 1.3**: After login with founder

```
Steps:
  1. Clear cookies, go back to /admin
  2. Login with ejazhussaini313@gmail.com
  3. Check all console logs
  4. Wait for page to load
  
Expected Results:
  ✓ Console shows: "[auth/callback] ✅ FOUNDER DETECTED: ejazhussaini313@gmail.com"
  ✓ Console shows: "[auth/callback] 🔐 ADMIN GATE CHECK"
  ✓ Console shows: "redirectTarget: /admin/dashboard"
  ✓ Redirected to /admin/dashboard
  ✓ Page shows dashboard with KPI cards
  ✓ All navigation items visible in sidebar
  ✓ No errors in console
```

---

### 2️⃣ Founder Access

**Test Case 2.1**: Founder direct access to `/admin`

```
Prerequisite: Logged in as ejazhussaini313@gmail.com

Steps:
  1. Navigate to https://app.formaos.com.au/admin
  2. Observe page load
  3. Check console logs
  4. Verify destination
  
Expected Results:
  ✓ Console shows: "[Middleware] ✅ FOUNDER ACCESS GRANTED TO /admin"
  ✓ Auto-redirects to /admin/dashboard
  ✓ Dashboard loads successfully
  ✓ No redirect loops
  ✓ Performance: <500ms load time
```

**Test Case 2.2**: Founder direct access to `/admin/dashboard`

```
Prerequisite: Logged in as ejazhussaini313@gmail.com

Steps:
  1. Navigate to /admin/dashboard directly
  2. Verify page renders
  
Expected Results:
  ✓ Page loads immediately
  ✓ Shows all KPI cards
  ✓ Shows organization growth chart
  ✓ Shows plan distribution
  ✓ No errors
```

**Test Case 2.3**: Founder navigation

```
Prerequisite: On admin dashboard

Steps:
  1. Click "Users" in sidebar
  2. Verify navigation
  3. Click "Dashboard" to return
  4. Verify all nav items work
  
Expected Results:
  ✓ All navigation items clickable
  ✓ URLs match routes (e.g., /admin/users, /admin/billing, etc.)
  ✓ Active state highlighted correctly
  ✓ No errors
```

**Test Case 2.4**: Founder logout

```
Prerequisite: On admin dashboard

Steps:
  1. Click logout button (top right)
  2. Check redirect
  3. Try to access /admin again
  
Expected Results:
  ✓ Logged out successfully
  ✓ Redirected to home or signin
  ✓ Can log back in
  ✓ Session cleared properly
```

---

### 3️⃣ Non-Founder Access

**Test Case 3.1**: Non-founder direct access to `/admin`

```
Prerequisite: Logged in as non-founder user

Steps:
  1. Navigate to /admin directly
  2. Check console logs
  3. Verify redirect
  
Expected Results:
  ✓ Console shows: "[Middleware] ❌ NON-FOUNDER BLOCKED FROM /admin"
  ✓ Console shows: "redirectTo: /pricing"
  ✓ Redirected to /pricing
  ✓ Cannot access admin console
```

**Test Case 3.2**: Non-founder trying `/admin/dashboard`

```
Prerequisite: Logged in as non-founder user

Steps:
  1. Navigate to /admin/dashboard directly
  2. Try to access via URL bar
  
Expected Results:
  ✓ Redirected to /pricing
  ✓ Cannot render dashboard
  ✓ Access blocked at middleware
```

**Test Case 3.3**: Non-founder trying other `/admin` routes

```
Prerequisite: Logged in as non-founder user

Steps:
  1. Try: /admin/users
  2. Try: /admin/billing
  3. Try: /admin/trials
  
Expected Results:
  ✓ All redirected to /pricing
  ✓ Cannot access any admin page
```

---

### 4️⃣ Domain Handling

**Test Case 4.1**: `www.formaos.com.au/admin`

```
Steps:
  1. Navigate to https://www.formaos.com.au/admin
  2. Observe behavior
  
Expected Results:
  ✓ Redirected to https://app.formaos.com.au/admin
  ✓ Then processes normal /admin flow
  ✓ Final destination is correct
```

**Test Case 4.2**: `app.formaos.com.au/admin`

```
Steps:
  1. Navigate to https://app.formaos.com.au/admin
  2. Observe behavior
  
Expected Results:
  ✓ Processes normal /admin flow immediately
  ✓ No extra redirects
```

---

### 5️⃣ Error Scenarios

**Test Case 5.1**: Middleware fails

```
Steps:
  1. Simulate network error (DevTools → Network throttle)
  2. Try to access /admin
  
Expected Results:
  ✓ Graceful error handling
  ✓ No 500 errors
  ✓ Page remains responsive
```

**Test Case 5.2**: Missing environment variables

```
Prerequisites:
  - FOUNDER_EMAILS not set

Steps:
  1. Try to access /admin with founder account
  
Expected Results:
  ✓ Falls back to FOUNDER_USER_IDS
  ✓ OR blocks access if no founders configured
  ✓ No crashes
```

---

### 6️⃣ Performance Tests

**Test Case 6.1**: Load time for founder

```
Steps:
  1. Open DevTools Network tab
  2. Navigate to /admin
  3. Check total load time
  
Expected Results:
  ✓ Dashboard loads in <500ms
  ✓ All resources loaded
  ✓ No 404 errors
```

**Test Case 6.2**: Redirect performance

```
Steps:
  1. Clear cache
  2. Access /admin → dashboard
  3. Measure redirect time
  
Expected Results:
  ✓ Redirect happens immediately (<50ms)
  ✓ No delay between /admin and /admin/dashboard
```

---

## Console Output Reference

### ✅ Expected Logs - Founder

**First Access (Unauthenticated)**:
```
[Middleware] 🔧 ENV CHECK
  FOUNDER_EMAILS_RAW: "ejazhussaini313@gmail.com"
  NODE_ENV: "production"

[Middleware] ❌ /admin requires authentication
[Redirect to /auth/signin]
```

**After OAuth Login**:
```
[auth/callback] 🔍 Founder check:
  email: "ejazhussaini313@gmail.com"
  userId: "12345678..."
  isFounder: true

[auth/callback] ✅ FOUNDER DETECTED: ejazhussaini313@gmail.com

[auth/callback] 🔐 ADMIN GATE CHECK
  email: "ejazhussaini313@gmail.com"
  isFounder: true
  redirectTarget: "/admin/dashboard"

[auth/callback] ✅ Founder setup complete, redirecting to /admin/dashboard

[admin/layout] ✅ Founder access granted
  email: "ejazhussaini313@gmail.com"
```

### ⚠️ Expected Logs - Non-Founder

```
[Middleware] 🔍 FOUNDER CHECK
  pathname: "/admin"
  userEmail: "usr***"
  userId: "87654321..."
  isFounder: false
  hasUser: true

[Middleware] ❌ NON-FOUNDER BLOCKED FROM /admin
  email: "usr***"
  redirectTo: "/pricing"
```

---

## Sign-Off Checklist

After all tests pass, confirm:

- [ ] All 5 test categories completed
- [ ] No errors found
- [ ] Console logs match expected output
- [ ] Performance acceptable (<500ms)
- [ ] No security issues found
- [ ] Both domains working
- [ ] Founder can access admin
- [ ] Non-founders are blocked
- [ ] Unauthenticated users redirected to signin

---

## Deployment Steps

```bash
# 1. Verify all changes committed
git status

# 2. Check logs one more time
git log --oneline -5

# 3. Ensure environment variables set
echo $FOUNDER_EMAILS  # Should show: ejazhussaini313@gmail.com

# 4. Run build (optional, on CI/CD)
npm run build

# 5. Deploy
git push origin main

# 6. Monitor logs in Vercel
# Watch for: "[Middleware] ✅ FOUNDER ACCESS GRANTED"
# Watch for: "[auth/callback] ✅ FOUNDER DETECTED"
```

---

## Rollback Plan

If issues found:

```bash
# Revert to previous commit
git revert HEAD -m 1

# OR restore specific files
git checkout HEAD^ app/admin/page.tsx
git checkout HEAD^ app/auth/callback/route.ts
git checkout HEAD^ middleware.ts
```

---

## Success Criteria

✅ **Complete Success When**:

1. Unauthenticated users → `/auth/signin`
2. Founder (`ejazhussaini313@gmail.com`) → `/admin/dashboard`
3. Non-founder users → `/pricing`
4. Console logs show correct decision path
5. No redirect loops
6. All navigation items work
7. Performance <500ms
8. Both domains working

---

## Support & Debugging

**If founder cannot access admin**:

1. Check console logs for founder email
2. Verify FOUNDER_EMAILS env var is set
3. Confirm isFounder() function matches email
4. Check if session token valid (logout/login)

**If redirect loop occurs**:

1. Check `/admin/page.tsx` - should be simple redirect
2. Verify middleware returns `response` for founders
3. Ensure `/admin/dashboard` page exists

**If non-founder can access admin**:

1. Check middleware founder check logic
2. Verify FOUNDER_EMAILS/FOUNDER_USER_IDS correct
3. Confirm non-founder's email not in founder list

---

**Ready for Deployment**: ✅  
**Last Updated**: 14 January 2026  
**Estimated Duration**: 15-20 minutes for full test suite
