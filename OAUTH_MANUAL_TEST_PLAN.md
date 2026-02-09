# OAuth Fix - Manual Test Plan

## Pre-Deployment Checklist

- [ ] All code changes deployed to production
- [ ] Google Cloud Console configured (see OAUTH_CONFIG_REFERENCE.md)
- [ ] Supabase OAuth provider updated
- [ ] No database migrations needed (logic-only changes)

---

## Test 1: New User - Google OAuth Signup (Desktop)

### Steps

1. Open Chrome/Firefox/Safari on desktop
2. Clear all cookies and cache for `*.formaos.com.au`
3. Navigate to: `https://app.formaos.com.au/auth/signup`
4. Verify you see the "Continue with Google" button
5. Click "Continue with Google"
6. **CRITICAL CHECK**: Google consent screen should say "FormaOS" at the top, NOT "Supabase"
7. Click "Continue" to approve
8. Wait for redirect (should be ~3-5 seconds)

### Expected Results

- ✅ Redirect to `/app/onboarding`
- ✅ Page title shows "FormaOS Onboarding"
- ✅ No redirect back to login screen
- ✅ New user account created in database
- ✅ Organization and membership records created

### Verification in Database

```sql
-- Check user was created
SELECT id, email FROM auth.users WHERE email = 'your-test-email@gmail.com';

-- Check org was created
SELECT id, name, plan_key FROM organizations
  WHERE created_by = '[user-id-from-above]';

-- Check membership was created
SELECT * FROM org_members
  WHERE user_id = '[user-id-from-above]';

-- Check subscription exists
SELECT * FROM org_subscriptions
  WHERE organization_id = '[org-id-from-above]';
```

---

## Test 2: New User - Google OAuth Signup with Plan Parameter (Desktop)

### Steps

1. Clear cache and cookies
2. Navigate to: `https://app.formaos.com.au/auth/signup?plan=pro`
3. Click "Continue with Google"
4. Complete Google authentication
5. Verify you land in `/app/onboarding` with "Pro" plan shown

### Expected Results

- ✅ Redirect to `/app/onboarding?plan=pro`
- ✅ Plan selection is preserved
- ✅ Database shows `organizations.plan_key = 'pro'`

### Verification in Database

```sql
SELECT plan_key FROM organizations
  WHERE id = '[org-id]';
-- Should return: pro
```

---

## Test 3: New User - Google OAuth Signup (Mobile iOS)

### Steps

1. On iPhone, open Safari
2. Clear history and website data for `*.formaos.com.au`
3. Navigate to: `https://app.formaos.com.au/auth/signup`
4. Tap "Continue with Google"
5. Complete Google authentication
6. Wait for redirect

### Expected Results

- ✅ Redirect to `/app/onboarding` (NOT back to login)
- ✅ Onboarding page is responsive and usable
- ✅ No layout shift or rendering issues

---

## Test 4: New User - Google OAuth Signup (Mobile Android)

### Steps

1. On Android phone, open Chrome
2. Clear browsing data (all time, all types)
3. Navigate to: `https://app.formaos.com.au/auth/signup`
4. Tap "Continue with Google"
5. Complete Google authentication

### Expected Results

- ✅ Redirect to `/app/onboarding`
- ✅ Mobile layout is correct
- ✅ No double-login behavior

---

## Test 5: Returning User - Google OAuth Login (Desktop)

### Steps

1. From Test 1, you have an existing account
2. Clear all cookies (but not local storage)
3. Navigate to: `https://app.formaos.com.au/auth/signin`
4. Click "Continue with Google"
5. Google may skip consent (already authorized) or show it again
6. Wait for redirect

### Expected Results

- ✅ Redirect to `/app/dashboard` (NOT `/app/onboarding`)
- ✅ User is logged in
- ✅ No redirect back to login page
- ✅ Organizations/data loads correctly

---

## Test 6: Returning User - Complete Onboarding First (Desktop)

### Steps

1. Create new account with Test 1
2. Complete onboarding (select industry, frameworks, team size)
3. Verify you land in `/app/dashboard`
4. Logout (click profile → Sign out)
5. Click "Sign in" again
6. Navigate to: `https://app.formaos.com.au/auth/signin`
7. Click "Continue with Google"

### Expected Results

- ✅ Redirect directly to `/app/dashboard` (skip onboarding)
- ✅ All user data is present
- ✅ No loops or redirects

---

## Test 7: OAuth Error - User Denies Permission

### Steps

1. Navigate to: `https://app.formaos.com.au/auth/signin`
2. Click "Continue with Google"
3. At Google consent screen, click "Back" or "Cancel"
4. Wait for redirect

### Expected Results

- ✅ Redirect back to `/auth/signin`
- ✅ Error message appears: "Authentication failed. Please try again."
- ✅ User can retry

---

## Test 8: OAuth Error - Network Failure

### Steps

1. Start OAuth flow
2. Intercept with DevTools (Network tab → throttle to offline)
3. Click "Continue with Google"
4. Let the request timeout

### Expected Results

- ✅ Error message appears on signin page
- ✅ User can retry without data loss
- ✅ No partial account creation

---

## Test 9: Plan Preservation Through OAuth

### Steps

1. Navigate to: `https://app.formaos.com.au/auth/signup?plan=basic`
2. Complete Google OAuth
3. Complete onboarding
4. Check database

### Expected Results

- ✅ `organizations.plan_key = 'basic'`
- ✅ User has basic plan entitlements

### Repeat with

- `?plan=pro` → Should show `plan_key = 'pro'`
- `?plan=professional` → Should show `plan_key = 'pro'` (maps to pro)
- No plan param → Should show `plan_key = 'basic'` (default)

---

## Test 10: Founder Account Behavior

### Steps

1. Ensure founder email is in `FOUNDER_EMAILS` env var
2. Create account with that email via Google OAuth
3. Wait for redirect

### Expected Results

- ✅ Redirect to `/admin/dashboard` (NOT `/app/onboarding`)
- ✅ Admin panel loads
- ✅ Organization has `plan_key = 'pro'`
- ✅ Founder has `role = 'owner'` in org_members

---

## Test 11: Concurrent OAuth Sessions

### Steps

1. Open two browser windows/tabs
2. In Tab 1: Start OAuth flow for User A
3. In Tab 2: Start OAuth flow for User B
4. Complete both authentications rapidly
5. Verify both users land in onboarding/dashboard

### Expected Results

- ✅ Both users have separate sessions
- ✅ No cross-contamination
- ✅ Each user lands in correct redirect

---

## Test 12: OAuth Followed by Direct Login

### Steps

1. Create account with Google OAuth (Test 1)
2. Go to account settings (if available) and set password
3. Logout
4. Click "Sign in"
5. Use email/password to login
6. Later, use "Continue with Google" again

### Expected Results

- ✅ Email/password login works
- ✅ Google OAuth works
- ✅ Both routes work for same account
- ✅ Consistent redirect behavior

---

## Server-Side Logging Verification

### Check application logs for:

```
[auth/callback] ✅ Session established for user: test@example.com
[auth/callback] 🔍 Founder check: isFounder: false
[auth/callback] 🚀 NEW USER: Creating organization
[auth/callback] ✅ NEW USER setup complete, redirecting to onboarding
```

### OAuth Error Logs:

```
[auth/callback] OAuth error: { error: 'access_denied', errorDescription: 'User denied access' }
```

### Founder Logs:

```
[auth/callback] ✅ FOUNDER DETECTED: founder@formaos.com.au
[auth/callback] ✅ Founder setup complete, redirecting to /admin/dashboard
```

---

## Rollback Testing (If Needed)

### Revert Procedure

1. Revert [app/auth/callback/route.ts](app/auth/callback/route.ts) to previous commit
2. Redeploy
3. Test basic OAuth flow still works

### What Should Still Work After Rollback

- ✅ Google OAuth authentication
- ✅ Basic redirects to /app
- ✅ No breaking changes to other features

---

## Pass/Fail Criteria

### PASS if:

- ✅ All 12 tests complete without errors
- ✅ No users report double-login issues
- ✅ Google consent screen shows "FormaOS"
- ✅ New users land in onboarding
- ✅ Returning users land in dashboard
- ✅ Plan parameters are preserved
- ✅ Mobile works (iOS & Android)
- ✅ Server logs show correct sequence

### FAIL if:

- ❌ Any user lands back on login page after OAuth
- ❌ Consent screen shows "Supabase" or project ID
- ❌ Plan parameter is lost
- ❌ OAuth errors are not shown to users
- ❌ Mobile shows redirect issues
- ❌ Founder not detected properly
- ❌ Database records not created

---

## Support & Escalation

If test fails:

1. Check [OAUTH_CONFIG_REFERENCE.md](OAUTH_CONFIG_REFERENCE.md) for values
2. Verify Google Cloud Console settings
3. Check Supabase OAuth provider settings
4. Review server logs for error patterns
5. Contact engineering team with:
   - Test number that failed
   - Browser/device info
   - Server logs excerpt
   - Database state of affected user
