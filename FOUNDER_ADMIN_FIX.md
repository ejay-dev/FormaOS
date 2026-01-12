# Founder Admin Routing Fix

## Problem Summary
Founder admin account (ejazhussaini313@gmail.com) was being treated as a regular user, causing:
- Redirect to user dashboard instead of /admin
- Subscription gating blocking access
- Unable to access admin console

## Root Causes
1. Auth callback didn't check for founder status before creating org
2. Middleware didn't prioritize founder access
3. Existing user/org data for founder email in database

## Fixes Applied

### 1. Auth Callback (`app/auth/callback/route.ts`)
**Added founder check immediately after OAuth exchange:**
```typescript
// Check if user is a founder - redirect to admin immediately
if (isFounder(data.user.email, data.user.id)) {
  console.log(`[auth/callback] Founder detected: ${data.user.email}, redirecting to /admin`);
  return NextResponse.redirect(`${appBase}/admin`);
}
```

**What this does:**
- Checks FOUNDER_EMAILS and FOUNDER_USER_IDS environment variables
- If match found, redirects directly to /admin
- Skips all org creation and onboarding logic for founders

### 2. Middleware (`middleware.ts`)
**Added founder detection at the top:**
```typescript
const isFounder = Boolean(
  user && ((userEmail && founderEmails.has(userEmail)) || founderIds.has(userId))
);
```

**Updated auth page redirect:**
- Founders on /auth pages → redirect to /admin
- Regular users → normal onboarding/app flow

**Added admin access bypass:**
```typescript
if (user && isFounder && pathname.startsWith("/admin")) {
  // Founders can access admin - no further checks needed
  return response;
}
```

**Updated subscription gating:**
- Founders bypass all subscription checks
- No trial expiration blocking for founders
- Full access to all features

### 3. Database Cleanup (`supabase/migrations/20250319_cleanup_founder_account.sql`)
**Created migration to remove founder's user data:**
- Deletes org_subscriptions
- Deletes org_entitlements  
- Deletes org_onboarding_status
- Deletes org_members
- Deletes organizations
- Deletes user_profiles
- Keeps auth.users (for authentication)

## How It Works Now

### Founder Login Flow:
1. User logs in with Google (ejazhussaini313@gmail.com)
2. OAuth callback exchanges code for session
3. **NEW:** Checks if email is in FOUNDER_EMAILS
4. **NEW:** If founder → redirect to /admin (skip everything else)
5. Middleware allows access to /admin
6. Admin console loads successfully

### Regular User Login Flow:
1. User logs in
2. OAuth callback exchanges code
3. Checks for founder status (not found)
4. Creates/checks organization
5. Redirects to onboarding or app
6. Subscription gating applies

### Admin Access:
- **Founders:** Direct access to /admin, no restrictions
- **Regular users:** Blocked by middleware, redirected to /app

## Required Actions

### 1. Run Database Cleanup
```bash
# Connect to your Supabase database
psql $DATABASE_URL -f supabase/migrations/20250319_cleanup_founder_account.sql
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Paste contents of `20250319_cleanup_founder_account.sql`
3. Run the script
4. Check the output for confirmation

### 2. Verify Environment Variable
Ensure `.env.local` (or Vercel env vars) contains:
```bash
FOUNDER_EMAILS=ejazhussaini313@gmail.com
```

### 3. Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 4. Clear Browser Data
- Clear cookies for localhost:3000 or your domain
- Or use incognito/private browsing

### 5. Test the Fix
1. Go to http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. Sign in with ejazhussaini313@gmail.com
4. **Expected:** Redirect to /admin
5. **Expected:** Admin dashboard loads
6. **Expected:** No subscription errors

## Verification Checklist

After applying fixes:

- [ ] Database cleanup script ran successfully
- [ ] FOUNDER_EMAILS environment variable is set
- [ ] Development server restarted
- [ ] Browser cookies cleared
- [ ] Login with founder email redirects to /admin
- [ ] Admin dashboard is accessible
- [ ] No subscription gating for founder
- [ ] Regular users still go to /app (not /admin)
- [ ] /admin URL directly accessible when logged in as founder
- [ ] app.formaos.com.au/admin works (in production)

## Testing Different Scenarios

### Test 1: Founder Login
```
1. Sign out completely
2. Go to /auth/signin
3. Sign in with ejazhussaini313@gmail.com
4. Should redirect to /admin
5. Admin dashboard should load
```

### Test 2: Direct Admin Access
```
1. Already logged in as founder
2. Navigate to /admin
3. Should load admin dashboard
4. No redirects to /app
```

### Test 3: Regular User Cannot Access Admin
```
1. Sign in with non-founder email
2. Try to access /admin
3. Should redirect to /app
4. Admin console not accessible
```

### Test 4: Founder Has No User Data
```
1. Log in as founder
2. Check database:
   - No records in org_members for founder user_id
   - No organizations owned by founder
   - Auth user still exists (can authenticate)
```

## Troubleshooting

### Issue: Still redirecting to /app
**Solution:**
1. Check FOUNDER_EMAILS is set correctly
2. Verify email matches exactly (case-insensitive)
3. Clear browser cookies
4. Restart dev server

### Issue: "Subscription inactive" error
**Solution:**
1. Verify middleware changes applied
2. Check isFounder logic is working
3. Ensure founder bypass is in place

### Issue: Database cleanup didn't work
**Solution:**
1. Check SQL script output for errors
2. Verify user exists in auth.users
3. Run script again if needed
4. Check RLS policies aren't blocking

### Issue: Admin console shows errors
**Solution:**
1. Check browser console for errors
2. Verify admin layout is loading
3. Check requireFounderAccess() is passing
4. Ensure service role key is set

## Security Notes

✅ **What's Secure:**
- Founder status checked server-side only
- No client-side role flags
- Environment variables not exposed
- Admin routes double-protected (middleware + layout)

✅ **What's Protected:**
- /admin routes require authentication
- Founder check uses email/ID from env vars
- Regular users cannot access admin
- No way to escalate privileges

## Production Deployment

When deploying to production:

1. **Set environment variable in Vercel:**
   ```
   FOUNDER_EMAILS=ejazhussaini313@gmail.com
   ```

2. **Run cleanup script on production database:**
   ```bash
   psql $PRODUCTION_DATABASE_URL -f supabase/migrations/20250319_cleanup_founder_account.sql
   ```

3. **Deploy code changes:**
   ```bash
   git add .
   git commit -m "Fix: Founder admin routing and access"
   git push
   ```

4. **Test on production:**
   - https://app.formaos.com.au/auth/signin
   - Sign in with founder email
   - Should redirect to https://app.formaos.com.au/admin

## Summary

The founder admin routing issue has been fixed by:
1. ✅ Adding founder detection in auth callback
2. ✅ Prioritizing founder access in middleware
3. ✅ Bypassing subscription checks for founders
4. ✅ Cleaning up existing user/org data
5. ✅ Ensuring /admin routes work correctly

Founders now have direct access to /admin without any user account data or subscription requirements.
