# QA Test Execution - Quick Start Guide

**Status:** Ready to Execute  
**Build:** ✅ Successful  
**Duration:** 2-3 hours  
**Environment:** Local / Staging

---

## Quick Start

### Prerequisites ✅
- [x] `npm install` completed
- [x] `npm run build` passed
- [x] Environment variables configured
- [x] Database migrations complete
- [x] Supabase connection verified

### Start Development Server
```bash
npm run dev
```

Navigate to: `http://localhost:3000`

---

## PHASE 1: Authentication (15 minutes)

### Test 1.1: Google OAuth - Founder ✅
**Status:** ⏳ READY  

1. Open `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Use FOUNDER_EMAILS email (check `.env.local`)
4. **Expected:** Redirected to `/admin/dashboard`
5. **Verify:** 
   - Admin console accessible
   - No errors in console
   - Session created in Supabase auth

**Result:** ⏳ Pending

---

### Test 1.2: Google OAuth - Regular User ✅
**Status:** ⏳ READY

1. Sign out first (if needed)
2. Open `http://localhost:3000/auth/signin`
3. Click "Sign in with Google"
4. Use non-founder email (e.g., test@example.com)
5. **Expected:** 
   - Redirected to `/onboarding` (if first time)
   - OR `/app` (if completed onboarding)
6. **Verify:** No errors, session active

**Result:** ⏳ Pending

---

### Test 1.3: Session Persistence ✅
**Status:** ⏳ READY

1. Sign in successfully
2. Copy current URL (should be `/app` or `/admin/dashboard`)
3. Close browser tab completely
4. Open new browser tab
5. Navigate to: `http://localhost:3000/app`
6. **Expected:** Still authenticated, no redirect to signin
7. **Verify:** Page loads without requiring re-authentication

**Result:** ⏳ Pending

---

## PHASE 2: Onboarding (20 minutes)

### Test 2.1: Complete 7-Step Onboarding ✅
**Status:** ⏳ READY

Use a fresh non-founder account:

**Step 1 - Welcome**
- [ ] Click "Get Started"
- [ ] Advance to Step 2

**Step 2 - Organization Details**
- [ ] Organization Name: "Test Org QA $(date)"
- [ ] Team Size: 20
- [ ] Select Plan: "Basic" (for free trial)
- [ ] Click "Continue"
- [ ] Advance to Step 3

**Step 3 - Industry Selection**
- [ ] Select Industry: "Healthcare"
- [ ] Click "Continue"

**Step 4 - Framework Selection**
- [ ] Select Framework: "HIPAA"
- [ ] Click "Continue"

**Step 5 - Team Invitation (Optional)**
- [ ] Skip (or add test members)
- [ ] Click "Continue"

**Step 6 - Review**
- [ ] Review all selections
- [ ] Click "Complete"
- [ ] Should redirect to `/app`

**Step 7 - Dashboard**
- [ ] Dashboard loads
- [ ] Trial status shows "14 days remaining"

**Database Verification:**
```sql
-- Check if onboarding completed
SELECT completed_at FROM org_onboarding_status 
WHERE organization_id = '[ORG_ID]';

-- Check if trial activated
SELECT status, trial_expires_at, trial_started_at 
FROM org_subscriptions 
WHERE organization_id = '[ORG_ID]';
```

**Expected Results:**
- completed_at is set (not null)
- status = 'trialing'
- trial_expires_at ≈ NOW + 14 days

**Result:** ⏳ Pending

---

### Test 2.2: Resume Onboarding ✅
**Status:** ⏳ READY

1. Start onboarding (fresh account)
2. Complete up to Step 3 only
3. Close tab / refresh page
4. Navigate back to `http://localhost:3000/onboarding`
5. **Expected:** Resume at Step 4 (NOT reset to Step 1)
6. **Verify:** Progress saved correctly

**Result:** ⏳ Pending

---

## PHASE 3: Trial System (25 minutes)

### Test 3.1: Trial Auto-Activation ✅
**Status:** ⏳ READY

1. Complete onboarding with Basic plan
2. **Verify in database:**
   ```sql
   SELECT status, trial_expires_at 
   FROM org_subscriptions 
   WHERE organization_id = '[ORG_ID]';
   ```
3. **Expected:**
   - status = 'trialing'
   - trial_expires_at = TODAY + 14 days
   - trial_started_at = TODAY

**Result:** ⏳ Pending

---

### Test 3.2: Trial Expiration Blocking ✅
**Status:** ⏳ READY

**Manual:**
1. Complete onboarding
2. Navigation to `/app/billing`
3. **Expected:** See "Trial active" message
4. Trial expiration date should be 14 days from now

**Database Test:**
1. Get the org_id from the test organization
2. Run:
   ```sql
   -- Check trial expiry logic
   SELECT 
     status,
     trial_expires_at,
     NOW() as current_time,
     CASE WHEN trial_expires_at < NOW() THEN 'EXPIRED' ELSE 'ACTIVE' END as trial_status
   FROM org_subscriptions
   WHERE organization_id = '[ORG_ID]';
   ```

**Result:** ⏳ Pending

---

### Test 3.3: Admin Trial Management ✅
**Status:** ⏳ READY

**Critical Test - Tests Bug Fix #1**

1. Sign in as founder (use FOUNDER_EMAILS email)
2. Navigate to `/admin/trials`
3. **Expected:** 
   - Page loads successfully (doesn't crash)
   - List of organizations with trials
   - Can view trial status and dates
4. **Verify:**
   - No database errors in logs
   - Table name correction working (`org_members` not `organization_members`)

**Result:** ⏳ Pending

---

## PHASE 4: Billing (15 minutes)

### Test 4.1: Stripe Checkout Flow ✅
**Status:** ⏳ READY

1. Complete onboarding with Basic plan (trial)
2. Navigate to `/app/billing`
3. See trial status banner
4. Click "Upgrade to Pro" (or upgrade plan)
5. **Expected:** Stripe checkout modal appears
6. **Note:** Use Stripe test card: `4242 4242 4242 4242` / `12/34` / `567`
7. **Expected Results:**
   - Payment processed
   - Subscription status updated
   - Redirected to billing page with success message

**Result:** ⏳ Pending

---

## PHASE 6: Admin Console (10 minutes)

### Test 6.1: Founder-Only Access ✅
**Status:** ⏳ READY

**Test with Founder:**
1. Sign in as founder (FOUNDER_EMAILS)
2. Navigate to `/admin`
3. **Expected:** Access granted, admin dashboard loads

**Test with Regular User:**
1. Sign in as regular user (non-founder)
2. Try to navigate to `/admin`
3. **Expected:** Access denied, redirected to `/app`

**Result:** ⏳ Pending

---

### Test 6.2: Admin Functionality ✅
**Status:** ⏳ READY

As founder, verify:
- [ ] `/admin/dashboard` - loads and shows stats
- [ ] `/admin/users` - can view all users
- [ ] `/admin/organizations` - can view all orgs
- [ ] `/admin/trials` - can view trials (Bug Fix #1 verification)
- [ ] No errors in browser console
- [ ] No errors in server logs

**Result:** ⏳ Pending

---

## PHASE 7: Team Invitations (15 minutes)

### Test 7.1: Member Invitation Creation ✅
**Status:** ⏳ READY

**Critical Test - Tests Bug Fix #2**

1. Sign in as organization owner
2. Navigate to `/app/people`
3. Click "Invite Member"
4. Enter email: test-invite@example.com
5. Select role: "Member"
6. Click "Send Invitation"
7. **Expected:**
   - Success message appears
   - Invitation sent notification
   - No database errors

**Database Verification:**
```sql
-- Verify invitation created in correct table
SELECT * FROM team_invitations 
WHERE email = 'test-invite@example.com'
ORDER BY created_at DESC LIMIT 1;

-- Expected columns: token, email, invited_by, expires_at, created_at
```

**Result:** ⏳ Pending

---

### Test 7.2: Invitation Acceptance ✅
**Status:** ⏳ READY

1. Open invitation email (or get link from test)
2. Click "Accept Invitation"
3. If not logged in, sign in
4. **Expected:**
   - Invitation accepted
   - User added to organization
   - Redirect to `/app/dashboard`

**Verification:**
```sql
SELECT * FROM org_members 
WHERE user_id = '[NEW_USER_ID]'
AND organization_id = '[ORG_ID]';
```

**Result:** ⏳ Pending

---

## Summary Checklist

### Authentication (Phase 1)
- [ ] Test 1.1: Founder OAuth ✅
- [ ] Test 1.2: Regular User OAuth ✅
- [ ] Test 1.3: Session Persistence ✅

### Onboarding (Phase 2)
- [ ] Test 2.1: Complete 7-step flow ✅
- [ ] Test 2.2: Resume onboarding ✅

### Trial System (Phase 3)
- [ ] Test 3.1: Auto-activation ✅
- [ ] Test 3.2: Expiration logic ✅
- [ ] Test 3.3: Admin management (Bug Fix #1) ✅

### Billing (Phase 4)
- [ ] Test 4.1: Stripe checkout ✅

### Admin Console (Phase 6)
- [ ] Test 6.1: Founder-only access ✅
- [ ] Test 6.2: Admin functionality ✅

### Invitations (Phase 7)
- [ ] Test 7.1: Create invitation (Bug Fix #2) ✅
- [ ] Test 7.2: Accept invitation ✅

---

## Troubleshooting

### Page Won't Load
- Check browser console for errors
- Check server terminal for errors
- Verify environment variables
- Clear browser cache and cookies

### Database Errors
- Verify Supabase connection
- Check migrations are applied
- Verify RLS policies active
- Check service role key in env

### Authentication Issues
- Verify Google OAuth config
- Check FOUNDER_EMAILS in .env
- Verify auth callback route
- Check session storage

### Need Help?
1. Check [QA_AUDIT_FINDINGS.md](QA_AUDIT_FINDINGS.md) for context
2. Review [QA_TEST_PLAYBOOK.md](QA_TEST_PLAYBOOK.md) for detailed steps
3. Check application logs: `server terminal`
4. Check browser console: `DevTools F12`

---

## Expected Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Auth | 15 min | ⏳ Ready |
| Phase 2: Onboarding | 20 min | ⏳ Ready |
| Phase 3: Trial | 25 min | ⏳ Ready |
| Phase 4: Billing | 15 min | ⏳ Ready |
| Phase 6: Admin | 10 min | ⏳ Ready |
| Phase 7: Invitations | 15 min | ⏳ Ready |
| **Total** | **~2 hours** | ⏳ Ready |

---

## After Testing

Once all tests pass:

1. ✅ Run `npm run build` to verify production build
2. ✅ Deploy to staging environment
3. ✅ Run smoke tests in staging
4. ✅ Deploy to production
5. ✅ Monitor for 24 hours

---

**Start Testing:** `npm run dev` → Open http://localhost:3000 → Begin Phase 1

