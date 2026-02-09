# OAuth Configuration Quick Reference

## Google Cloud Console - Exact Values

### OAuth Consent Screen

```
Product name shown to users: FormaOS
User support email: support@formaos.com.au
App logo URL: https://formaos.com.au/brand/formaos-mark-light.svg
Developer contact information: [your-admin-email@formaos.com.au]

Authorized domains:
  - formaos.com.au
  - app.formaos.com.au
```

### OAuth 2.0 Client Credentials

```
Client ID: [from Supabase - do not change]
Client Secret: [from Supabase - do not change]

Authorized JavaScript origins:
  - https://app.formaos.com.au
  - https://www.formaos.com.au
  - https://formaos.com.au
  - https://bvfniosswcvuyfaaicze.supabase.co (Supabase project)

Authorized redirect URIs:
  - https://app.formaos.com.au/auth/callback
  - https://formaos.com.au/auth/callback
  - https://bvfniosswcvuyfaaicze.supabase.co/auth/v1/callback (Supabase required)
```

## Supabase Dashboard - Exact Values

### Authentication → Providers → Google

```
Authorized redirect URLs:
  https://app.formaos.com.au/auth/callback
  https://formaos.com.au/auth/callback
```

**DO NOT CHANGE**: Client ID and Client Secret (managed via Google Cloud)

## Environment Variables (Already Set?)

```
NEXT_PUBLIC_SUPABASE_URL=https://bvfniosswcvuyfaaicze.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
FOUNDER_EMAILS=your-email@formaos.com.au
FOUNDER_USER_IDS=[your-user-id]
```

## Code-Side Redirect Values (Already Correct)

### Sign-In Page

```typescript
redirectTo: `${base}/auth/callback`;
```

### Sign-Up Page

```typescript
redirectTo: plan
  ? `${appBase}/auth/callback?plan=${encodeURIComponent(plan.key)}`
  : `${appBase}/auth/callback`;
```

### Callback Route

```typescript
// OAuth error handling
if (error) {
  return redirectWithCookies(
    `${appBase}/auth/signin?error=oauth_error&message=${encodeURIComponent(
      errorDescription || 'Authentication failed. Please try again.',
    )}`,
  );
}

// Session established
const user = data.user;

// New users → onboarding
return redirectWithCookies(`${appBase}/onboarding${planQuery}`);

// Existing users (complete) → app
return redirectWithCookies(`${appBase}/app`);

// Founders → admin
return redirectWithCookies(`${appBase}/admin/dashboard`);
```

## Expected Behavior After Deployment

| Scenario                | Before                         | After                              |
| ----------------------- | ------------------------------ | ---------------------------------- |
| New user OAuth          | 🔴 Lands on login loop         | ✅ Lands in /app/onboarding        |
| Returning user OAuth    | 🔴 Lands on login loop         | ✅ Lands in /app/dashboard         |
| Consent screen branding | 🔴 Shows "Supabase project ID" | ✅ Shows "FormaOS"                 |
| Plan preservation       | 🔴 Lost in OAuth               | ✅ Preserved through callback      |
| User denies permission  | 🔴 No error message            | ✅ "Authentication failed" message |

## Testing URLs

```
# New user signup
https://app.formaos.com.au/auth/signup?plan=pro

# Existing user login
https://app.formaos.com.au/auth/signin

# Explicit plan selection
https://app.formaos.com.au/auth/signup?plan=basic
```

## Debugging Checklist

### Users landing on login loop

- [ ] Check browser URL after OAuth: should be /app/onboarding or /app/dashboard
- [ ] Check server logs for "Session established for user"
- [ ] Check database: organization and org_members records created
- [ ] Check middleware: /auth/callback is in PUBLIC_ROUTES

### Consent screen still shows Supabase project ID

- [ ] Wait 2+ hours (Google caches for up to 24 hours)
- [ ] Clear browser cache and private window
- [ ] Verify "App name" = "FormaOS" in Google Cloud Console

### Plan parameter missing

- [ ] Check browser URL before OAuth redirect
- [ ] Check server logs: plan extraction in callback
- [ ] Check database: organizations.plan_key is set correctly

## Related Files

- [OAUTH_DEPLOYMENT_GUIDE.md](OAUTH_DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [OAUTH_DEPLOYMENT_READY.md](OAUTH_DEPLOYMENT_READY.md) - Deployment summary
- [app/auth/callback/route.ts](app/auth/callback/route.ts) - OAuth callback implementation
