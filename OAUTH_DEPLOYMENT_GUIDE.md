# OAuth Fix Deployment Guide

## What Was Fixed

### Issue 1: OAuth Callback Loop (FIXED ✅)

- Added proper OAuth error handling for user denials
- Corrected the `redirectTo` parameter in Google OAuth calls
- Fixed session exchange error messages
- Ensured auth callback is skipped by middleware session check
- Correct redirect routing:
  - New users → `/app/onboarding`
  - Existing users (onboarding complete) → `/app/dashboard`
  - Existing users (onboarding incomplete) → `/app/onboarding`

### Issue 2: Consent Screen Branding (REQUIRES MANUAL CONFIG)

- Code is ready, but consent screen branding requires dashboard configuration
- The Supabase project ID showing is a configuration issue, not code

## Deployment Steps

### Step 1: Deploy Code Changes

These files have been updated:

- `app/auth/callback/route.ts` - Fixed OAuth error handling and redirect logic
- `app/auth/signin/page.tsx` - Already correct (redirectTo: /auth/callback)
- `app/auth/signup/page.tsx` - Already correct (redirectTo: /auth/callback with plan param)
- `middleware.ts` - Already correct (/auth/callback is public route)

Deploy these changes to production.

### Step 2: Configure Google Cloud Console

Follow these exact steps in Google Cloud Console:

#### 2.1 OAuth Consent Screen Setup

1. Navigate to: **APIs & Services** → **OAuth consent screen**
2. Select **External** for User type
3. Fill in the following:
   - **App name**: `FormaOS`
   - **User support email**: `support@formaos.com.au`
   - **App logo**: Upload from `https://formaos.com.au/brand/formaos-mark-light.svg`
   - **Developer contact information**: Your FormaOS admin email
4. Click **Save and Continue**

#### 2.2 Authorized Domains

In the same OAuth consent screen:

1. Scroll to **Authorized domains**
2. Add these domains:
   - `formaos.com.au`
   - `app.formaos.com.au`
3. Click **Save and Continue**

#### 2.3 OAuth 2.0 Client Credentials

1. Navigate to: **APIs & Services** → **Credentials**
2. Find your Google OAuth 2.0 Client ID (created with Supabase)
3. Click on it and edit:
   - **Authorized JavaScript origins** (add if missing):
     ```
     https://app.formaos.com.au
     https://www.formaos.com.au
     https://formaos.com.au
     ```
   - **Authorized redirect URIs** (add if missing):
     ```
     https://app.formaos.com.au/auth/callback
     https://formaos.com.au/auth/callback
     ```
4. Click **Save**

### Step 3: Configure Supabase Auth Provider

1. Log in to Supabase Dashboard
2. Navigate to: **Authentication** → **Providers**
3. Find **Google**
4. Ensure **Authorized redirect URLs** includes:
   ```
   https://app.formaos.com.au/auth/callback
   https://formaos.com.au/auth/callback
   ```
5. Save changes

### Step 4: Verify Environment Variables

Ensure these are set in your production environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
FOUNDER_EMAILS=your-email@formaos.com.au
FOUNDER_USER_IDS=[your-user-id]
```

## Testing After Deployment

### Test 1: New User Flow (Mobile)

1. Clear all cookies/cache on mobile device
2. Visit: `https://app.formaos.com.au/auth/signup?plan=pro`
3. Tap "Continue with Google"
4. **Verify**: Google consent screen shows "FormaOS" (not Supabase project ID)
5. Complete Google authentication
6. **Expected result**: Land in `/app/onboarding` with plan=pro preset
7. Verify you can proceed through onboarding

### Test 2: New User Flow (Desktop)

1. Clear cookies/cache
2. Visit: `https://app.formaos.com.au/auth/signin`
3. Click "Continue with Google"
4. Complete Google authentication
5. **Expected result**: Land in `/app/onboarding` (not back on login page)
6. Complete onboarding, verify redirect to `/app/dashboard`

### Test 3: Returning User Flow

1. Log out completely
2. Visit: `https://app.formaos.com.au/auth/signin`
3. Click "Continue with Google"
4. Complete authentication with existing account
5. **Expected result**: Land in `/app/dashboard` (onboarding already complete)
6. Verify no redirect back to login

### Test 4: Plan Preservation

1. Visit: `https://app.formaos.com.au/auth/signup?plan=basic`
2. Complete Google OAuth
3. Verify in database: `organizations.plan_key = 'basic'`
4. Repeat with `?plan=pro` and verify `plan_key = 'pro'`

### Test 5: OAuth Error Handling

1. Start Google OAuth flow
2. Click "Cancel" or "Deny permission" at consent screen
3. **Expected result**: Redirect to login with error message

## Debugging

### Users Still Seeing Login Loop

- Check `/auth/callback` logs in server
- Verify SESSION was successfully exchanged (`Session established for user`)
- Check if org and membership are created in database
- Verify middleware is allowing the callback route

### Consent Screen Still Shows Supabase Project ID

- Wait 1-2 hours after updating Google Cloud Console (caching)
- Clear browser cache and incognito/private window test
- Verify "App name" is set to "FormaOS" in OAuth consent screen

### Plan Parameter Not Preserved

- Check browser URL before OAuth redirect (should have ?plan=X)
- Check server logs in callback route for plan extraction
- Verify database shows correct plan_key value

## Rollback Plan

If issues occur:

1. Revert the callback route to previous version
2. Ensure `redirectTo` remains as `${appBase}/auth/callback`
3. No database migrations needed - all changes are logic-only

## Success Indicators

After deployment, you should see:

1. ✅ Users no longer returned to login page after OAuth
2. ✅ Google consent screen shows "FormaOS" branding
3. ✅ New users land in `/app/onboarding`
4. ✅ Returning users land in `/app/dashboard`
5. ✅ Plan selection is preserved through OAuth
6. ✅ All user accounts properly provisioned with org/membership

## Support

Contact engineering team if any steps fail or users report issues.
