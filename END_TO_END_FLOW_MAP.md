# End-to-End CTA Flow Mapping

## Flow 1: Start Free Trial (New User)

### Expected Journey

```
Home → "Start Free Trial"
  → /auth/signup
  → User creates account
  → /auth/callback (OAuth processing)
  → /app/onboarding (if exists) OR /app (dashboard)
  → Dashboard with trial active
```

### Current State

- ✅ Step 1: Home → /auth/signup (VERIFIED)
- ⏳ Step 2: Signup → Account creation (NEEDS TESTING)
- ⏳ Step 3: Account creation → Callback (NEEDS TESTING)
- ⏳ Step 4: Callback → Onboarding/Dashboard (NEEDS TESTING)
- ⏳ Step 5: Trial activation (NEEDS VERIFICATION)

### Questions to Answer

1. Does /app/onboarding exist?
2. Is trial plan auto-assigned on signup?
3. Does dashboard load without errors for new trial users?
4. Are trial users blocked by any paywalls?

---

## Flow 2: Request Demo

### Expected Journey

```
Home → "Request Demo"
  → /contact
  → User fills form
  → Form submission
  → Success confirmation
```

### Current State

- ✅ Step 1: Home → /contact (VERIFIED)
- ⏳ Step 2: Form exists and loads (NEEDS TESTING)
- ⏳ Step 3: Form submission works (NEEDS TESTING)
- ⏳ Step 4: Success state shown (NEEDS TESTING)

---

## Flow 3: Login (Returning User)

### Expected Journey

```
Header → "Login"
  → /auth/signin
  → User enters credentials
  → Authentication
  → /app (dashboard)
  → Correct workspace loaded
```

### Current State

- ✅ Step 1: Header → /auth/signin (VERIFIED)
- ⏳ Step 2: Login form works (NEEDS TESTING)
- ⏳ Step 3: Authentication succeeds (NEEDS TESTING)
- ⏳ Step 4: Redirect to /app (NEEDS TESTING)
- ⏳ Step 5: Dashboard loads correctly (NEEDS TESTING)

---

## Flow 4: Pricing → Start Free

### Expected Journey

```
Pricing → "Start Free"
  → /auth/signup?plan=pro
  → User creates account
  → Trial plan assigned
  → /app (dashboard)
  → Full access enabled
```

### Current State

- ✅ Step 1: Pricing → /auth/signup (VERIFIED)
- ⏳ Step 2: Plan parameter preserved (NEEDS TESTING)
- ⏳ Step 3: Trial assigned correctly (NEEDS TESTING)
- ⏳ Step 4: Dashboard access (NEEDS TESTING)

---

## Testing Plan

I need to test these flows by:

1. Examining the auth callback handler
2. Checking if onboarding exists
3. Verifying trial plan assignment logic
4. Testing the contact form
5. Checking dashboard access for new users

Let me start by examining the critical files...
