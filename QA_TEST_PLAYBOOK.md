# FormaOS - QA Testing Playbook

**Version:** 1.0
**Status:** Ready for Testing
**Bugs Fixed:** 2
**Critical Issues:** 0

---

## Pre-Testing Checklist

Before running any tests, verify:

- [ ] All environment variables configured correctly
- [ ] Database migrations complete
- [ ] Stripe test keys configured
- [ ] Supabase service role key set
- [ ] FOUNDER_EMAILS configured with test email
- [ ] Application builds successfully: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## PHASE 1: Auth & Identity

### Test 1.1: Google OAuth Flow (Founder)

**Test Data:**
- Email: Use FOUNDER_EMAILS value (e.g., test-founder@example.com)

**Steps:**
1. Visit `http://localhost:3000/auth/signin` (or staging URL)
2. Click "Sign in with Google"
3. Authenticate with founder email
4. **Expected Result:** 
   - Session created successfully
   - Redirected to `/admin/dashboard`
   - Can access admin console

**Verification:**
- Check browser console for errors
- Check server logs for auth callback logs
- Verify founder role in org_members table

**Status:** ⏳ READY TO TEST

### Test 1.2: Google OAuth Flow (Regular User)

**Steps:**
1. Visit `/auth/signin`
2. Click "Sign in with Google"
3. Authenticate with non-founder email (e.g., user@example.com)
4. **Expected Result:**
   - Session created
   - Redirected to onboarding (if first time)
   - OR redirected to /app (if completed onboarding)

**Status:** ⏳ READY TO TEST

### Test 1.3: Session Persistence

**Steps:**
1. Sign in successfully
2. Close browser/tab completely
3. Open new browser tab and visit `/app`
4. **Expected Result:** Still authenticated, no redirect to signin

**Status:** ⏳ READY TO TEST

---

## PHASE 2: Onboarding Flow

### Test 2.1: Complete 7-Step Onboarding

**Test Data:**
- New regular user email
- Plan: Basic (for free trial)
- Team size: 20
- Industry: Healthcare
- Framework: HIPAA

**Steps:**

1. **Step 1 - Welcome**: Click "Get Started"
   - ✅ Advance to Step 2
   
2. **Step 2 - Organization Details**:
   - Organization Name: "Test Org - $(date)"
   - Team Size: "20"
   - Select Plan: "Basic"
   - ✅ Click "Continue"
   - ✅ Advance to Step 3

3. **Step 3 - Industry Selection**:
   - Select Industry: "Healthcare"
   - ✅ Click "Continue"
   - ✅ Advance to Step 4

4. **Step 4 - Framework Selection**:
   - Select Framework: "HIPAA"
   - ✅ Click "Continue"
   - ✅ Advance to Step 5

5. **Step 5 - Team Invitation (Optional)**:
   - Skip or invite test members
   - ✅ Click "Continue"
   - ✅ Advance to Step 6

6. **Step 6 - Review**:
   - Review all selections
   - ✅ Click "Complete"
   - ✅ Redirected to /app

7. **Step 7 - Dashboard**:
   - ✅ Dashboard loads
   - ✅ Trial status shows "14 days remaining"

**Expected Result:** Onboarding marked complete, trial activated

**Verification:**
- Check org_onboarding_status.completed_at (should be set)
- Check org_subscriptions.trial_expires_at (should be NOW + 14 days)
- Check org_subscriptions.status (should be 'trialing')

**Status:** ⏳ READY TO TEST

### Test 2.2: Early Exit and Resume

**Steps:**
1. Start onboarding, complete Step 3 only
2. Navigate away (close tab/refresh)
3. Navigate back to `/onboarding`
4. **Expected Result:** Resume at Step 4 (not reset to Step 1)

**Status:** ⏳ READY TO TEST

---

## PHASE 3: Trial System

### Test 3.1: Trial Auto-Activation

**Steps:**
1. Complete signup with Basic or Pro plan
2. Verify database:
   ```sql
   SELECT status, trial_expires_at, trial_started_at 
   FROM org_subscriptions 
   WHERE organization_id = '...';
   ```
3. **Expected:**
   - status = 'trialing'
   - trial_expires_at = NOW + 14 days
   - trial_started_at = NOW

**Status:** ⏳ READY TO TEST

### Test 3.2: Trial Status Banner

**Steps:**
1. Sign in with trial account
2. Visit `/app`
3. **Expected Result:**
   - Blue banner shows "14 days left in your free trial"
   - Can access all features

**Status:** ⏳ READY TO TEST

### Test 3.3: Trial Expiring Soon (3 Days)

**Admin Action:**
1. Use admin console to set trial_expires_at to 3 days from now
2. **Steps:**
   - Sign in with founder account
   - Navigate to `/admin/trials`
   - Find the organization
   - Check it appears in "Expiring Soon" section

3. **Expected Result:**
   - Banner shows amber/warning color
   - Message: "X day(s) left in your free trial"
   - "Upgrade Now" CTA prominent

**Status:** ⏳ READY TO TEST

### Test 3.4: Trial Expired

**Admin Action:**
1. Set trial_expires_at to yesterday
2. **Steps:**
   - Sign in with regular user
   - Try to access `/app`
   - Try to access paid feature

3. **Expected Result:**
   - Redirected to `/app/billing`
   - Shows "Trial has expired" message
   - "Upgrade Required" button prominent
   - Features blocked

**Status:** ⏳ READY TO TEST

---

## PHASE 4: Billing & Stripe

### Test 4.1: Stripe Checkout

**Test Data:**
- Plan: Pro
- Stripe test card: 4242 4242 4242 4242
- Expiry: 12/25
- CVC: 123

**Steps:**
1. Sign in with trial user (Basic plan)
2. Navigate to `/app/billing`
3. Click "Upgrade to Pro"
4. **Expected:**
   - Redirected to Stripe checkout
   - Organization name pre-filled
   - Can see Pro plan details

5. Enter test card details
6. Complete payment
7. **Expected:**
   - Redirected back to `/app/billing?status=success`
   - org_subscriptions updated:
     - stripe_subscription_id populated
     - stripe_customer_id populated
     - status = 'active'
     - plan_key = 'pro'

**Status:** ⏳ READY TO TEST

### Test 4.2: Plan Downgrade

**Stripe Dashboard Action:**
1. Navigate to Stripe test dashboard
2. Find subscription
3. Change from Pro → Basic
4. In app, visit `/app/billing`
5. **Expected:** Shows new plan (Basic)

**Status:** ⏳ READY TO TEST

---

## PHASE 5: RBAC Testing

### Test 5.1: Owner Permissions

**Setup:**
- User A: Owner role

**Steps:**
1. Sign in as User A (Owner)
2. Can access:
   - ✅ /app (dashboard)
   - ✅ /app/policies (create/edit)
   - ✅ /app/tasks (create/edit)
   - ✅ /app/team (manage members)
   - ✅ /app/billing (manage subscription)
3. **Expected:** All features accessible

**Status:** ⏳ READY TO TEST

### Test 5.2: Member Permissions

**Setup:**
- User B: Member role

**Steps:**
1. Sign in as User B (Member)
2. Can access:
   - ✅ /app (dashboard) - read-only
   - ✅ /app/policies (view only)
   - ✅ /app/tasks (create in own scope)
3. Cannot access:
   - ❌ /app/team (403)
   - ❌ /app/billing (403)
4. **Expected:** Limited access enforced by API

**Status:** ⏳ READY TO TEST

### Test 5.3: Cross-Org Access Blocked

**Setup:**
- User A in Org 1
- User B in Org 2
- Both authenticated

**Steps:**
1. Sign in as User A
2. Intercept network request to query Org 2's data:
   ```
   GET /app/api/organizations/ORG_2_ID
   ```
3. **Expected:** 403 Forbidden (RLS policy blocks)

**Status:** ⏳ READY TO TEST

---

## PHASE 6: Admin Console

### Test 6.1: Admin Access (Founder Only)

**Steps:**
1. Sign in with founder email
2. Navigate to `/admin`
3. **Expected:** Full access to admin dashboard

**Steps (Non-Founder):**
1. Sign in with regular user
2. Try to navigate to `/admin`
3. **Expected:** Redirected to `/pricing` (403 Forbidden)

**Status:** ⏳ READY TO TEST

### Test 6.2: Admin Features

**As Founder:**
1. Visit `/admin/users`
   - ✅ List of all users displayed
   - ✅ Search functionality works

2. Visit `/admin/organizations`
   - ✅ List of all orgs displayed
   - ✅ Stats shown (users, subscriptions, etc.)

3. Visit `/admin/trials`
   - ✅ Active trials listed
   - ✅ Expiring trials section
   - ✅ Extend/Expire buttons functional (fixed!)

4. Visit `/admin/billing`
   - ✅ Revenue stats shown
   - ✅ Subscription breakdown shown

**Status:** ⏳ READY TO TEST

---

## PHASE 7: Team Invitations

### Test 7.1: Invite Member (Fixed!)

**Steps:**
1. Sign in as Owner
2. Visit `/app/team`
3. Click "Invite Member"
4. Enter email: invitee@example.com
5. Select role: "Member"
6. Click "Send"
7. **Expected:**
   - Success message shown
   - Email sent to invitee@example.com (check Resend logs)
   - team_invitations table has record (fixed!)

**Verification:**
```sql
SELECT * FROM team_invitations 
WHERE email = 'invitee@example.com' AND status = 'pending';
```

**Status:** ⏳ READY TO TEST

### Test 7.2: Accept Invitation

**As Invitee (New User):**
1. Receive email invitation
2. Click accept link: `/accept-invite/{token}`
3. Sign in (Google OAuth)
4. **Expected:**
   - Invited to organization
   - Role applied correctly
   - Redirected to /app
   - Can see organization

**Status:** ⏳ READY TO TEST

### Test 7.3: Expired Invitation

**Admin Action:**
1. Create invitation
2. Wait 7 days (or update database to set expires_at to past)
3. Try to accept with old token
4. **Expected:**
   - Error: "Invitation expired"
   - Cannot accept

**Status:** ⏳ READY TO TEST

---

## PHASE 8: Performance & UX

### Test 8.1: Page Load Times

**Steps:**
1. Open DevTools Network tab
2. Navigate between pages:
   - /app → /app/policies (should be <100ms)
   - /app → /app/billing (should be <100ms)
   - /app → /app/team (should be <100ms)
3. **Expected:** Sidebar navigation instant

**Status:** ⏳ READY TO TEST

### Test 8.2: Mobile Responsiveness

**Steps:**
1. Open DevTools mobile view (375px width)
2. Test on key pages:
   - /app (dashboard)
   - /app/billing
   - /app/team
3. **Expected:**
   - Readable text
   - No horizontal scroll
   - Buttons accessible

**Status:** ⏳ READY TO TEST

---

## PHASE 9: Error Handling

### Test 9.1: Network Error

**Steps:**
1. Start the app
2. Throttle network to SLOW 4G (DevTools)
3. Perform action (e.g., create policy)
4. **Expected:**
   - Clear error message
   - Retry option available
   - No silent failures

**Status:** ⏳ READY TO TEST

### Test 9.2: Missing Environment Variables

**Admin/DevOps Action:**
1. Remove STRIPE_SECRET_KEY
2. Try to checkout
3. **Expected:**
   - User-friendly error: "Stripe is not configured"
   - No cryptic stack traces

**Status:** ⏳ READY TO TEST

---

## PHASE 10: Security

### Test 10.1: XSS Prevention

**Steps:**
1. Try to inject script in organization name:
   - `<script>alert('XSS')</script>Test Org`
2. Save org details
3. **Expected:**
   - Script is escaped
   - Displayed as text, not executed

**Status:** ⏳ READY TO TEST

### Test 10.2: CORS Headers

**Steps:**
1. Check response headers from `/app/api/*` endpoints
2. **Expected:**
   ```
   Access-Control-Allow-Origin: https://app.formaos.com.au
   Access-Control-Allow-Methods: GET, POST, ...
   ```

**Status:** ⏳ READY TO TEST

---

## Test Execution Log

| Phase | Test | Status | Notes | Date |
|-------|------|--------|-------|------|
| 1 | 1.1: Founder OAuth | ⏳ | | |
| 1 | 1.2: Regular OAuth | ⏳ | | |
| 1 | 1.3: Session Persist | ⏳ | | |
| 2 | 2.1: 7-Step Flow | ⏳ | | |
| 2 | 2.2: Resume Flow | ⏳ | | |
| 3 | 3.1: Trial Activation | ⏳ | | |
| 3 | 3.2: Trial Banner | ⏳ | | |
| 3 | 3.3: Trial Expiring | ⏳ | | |
| 3 | 3.4: Trial Expired | ⏳ | | |
| 4 | 4.1: Stripe Checkout | ⏳ | | |
| 4 | 4.2: Plan Downgrade | ⏳ | | |
| 5 | 5.1: Owner Permissions | ⏳ | | |
| 5 | 5.2: Member Permissions | ⏳ | | |
| 5 | 5.3: Cross-Org Block | ⏳ | | |
| 6 | 6.1: Admin Access | ⏳ | | |
| 6 | 6.2: Admin Features | ⏳ | | |
| 7 | 7.1: Invite Member | ⏳ | Fixed table name! | |
| 7 | 7.2: Accept Invite | ⏳ | | |
| 7 | 7.3: Expired Invite | ⏳ | | |
| 8 | 8.1: Page Load Speed | ⏳ | | |
| 8 | 8.2: Mobile View | ⏳ | | |
| 9 | 9.1: Network Error | ⏳ | | |
| 9 | 9.2: Missing EnvVars | ⏳ | | |
| 10 | 10.1: XSS Prevention | ⏳ | | |
| 10 | 10.2: CORS Headers | ⏳ | | |

---

## Bugs Fixed (Ready for Testing)

1. ✅ **Admin Trials Endpoint** - Fixed table name `organization_members` → `org_members`
2. ✅ **Team Invitations** - Fixed table names `org_invites` → `team_invitations`

Both issues are now resolved and ready for verification in testing.

---

## Deployment Readiness

**Before Deploying:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Bugs fixed and verified
- [ ] Performance baseline established
- [ ] Security audit passed
- [ ] Database backups confirmed
- [ ] Staging environment matches production
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Monitoring alerts enabled

**After Deploying:**
- [ ] Health checks passing
- [ ] No error spikes in logs
- [ ] New users can sign up
- [ ] Trial system working
- [ ] Admin console accessible
- [ ] Billing working
- [ ] All APIs responding

---

## Next Actions

1. Run all Phase tests (1-10)
2. Log any new issues found
3. Verify all fixes work as expected
4. Get QA sign-off
5. Deploy to production
6. Monitor for 24 hours
7. Declare release ready

