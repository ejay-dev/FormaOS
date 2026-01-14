# FormaOS - Enterprise QA Audit Execution Plan

**Status:** In Progress
**Last Updated:** $(date)
**Scope:** Full system validation (public site → app → admin)
**Goal:** Zero critical issues before production

---

## Phase 1: Authentication & Identity (IN PROGRESS)

### 1.1 OAuth Flow Testing

**Test Case 1.1.1: Google OAuth Success Path**
- [ ] Visit `/auth/signin`
- [ ] Click "Sign in with Google"
- [ ] Authenticate with test@example.com
- [ ] **Expected:** Redirected to onboarding or app
- [ ] **Verify:** Session cookie set, user in database
- [ ] **Status:** NOT TESTED

**Test Case 1.1.2: Founder Google OAuth**
- [ ] Visit `/auth/signin`
- [ ] Click "Sign in with Google"
- [ ] Authenticate with FOUNDER_EMAILS email
- [ ] **Expected:** Redirected to /admin/dashboard immediately
- [ ] **Verify:** Session set, founder role applied
- [ ] **Status:** NOT TESTED

**Test Case 1.1.3: OAuth Code Exchange Failure**
- [ ] Manually craft callback with invalid code
- [ ] **Expected:** Redirect to signin with error message
- [ ] **Verify:** No orphaned auth records created
- [ ] **Status:** NOT TESTED

**Test Case 1.1.4: Missing SUPABASE_SERVICE_ROLE_KEY**
- [ ] Simulate missing env var
- [ ] Attempt OAuth signup
- [ ] **Expected:** Clear error message, no orphaned records
- [ ] **Verify:** Error message mentions configuration
- [ ] **Status:** NOT TESTED

### 1.2 Session Management

**Test Case 1.2.1: Session Persistence**
- [ ] Sign in successfully
- [ ] Close browser/tab
- [ ] Return to app
- [ ] **Expected:** Still authenticated
- [ ] **Status:** NOT TESTED

**Test Case 1.2.2: Session Expiration**
- [ ] Sign in
- [ ] Wait for session expiry (if configured)
- [ ] Try to access /app
- [ ] **Expected:** Redirect to signin
- [ ] **Status:** NOT TESTED

**Test Case 1.2.3: Logout**
- [ ] Sign in
- [ ] Click logout
- [ ] Try to access /app
- [ ] **Expected:** Redirect to signin
- [ ] **Status:** NOT TESTED

---

## Phase 2: Onboarding Flow

### 2.1 New User Signup

**Test Case 2.1.1: Complete Onboarding (7 Steps)**
- [ ] Step 1: Select plan (Basic/Pro/Enterprise)
- [ ] Step 2: Team size selection
- [ ] Step 3: Industry selection
- [ ] Step 4: Framework selection
- [ ] Step 5: Organization setup
- [ ] Step 6: Team invitation (optional)
- [ ] Step 7: Review & complete
- [ ] **Expected:** org_onboarding_status marked complete, redirected to /app
- [ ] **Status:** NOT TESTED

**Test Case 2.1.2: Onboarding with Early Exit**
- [ ] Start onboarding
- [ ] Complete step 3
- [ ] Navigate away (refresh /onboarding)
- [ ] **Expected:** Resume at step 3 (not reset to 1)
- [ ] **Status:** NOT TESTED

**Test Case 2.1.3: Back Button During Onboarding**
- [ ] Start onboarding
- [ ] Progress to step 4
- [ ] Click back
- [ ] **Expected:** Return to step 3 (data preserved)
- [ ] **Status:** NOT TESTED

---

## Phase 3: Trial System

### 3.1 Trial Activation

**Test Case 3.1.1: Trial Auto-Activation on Signup**
- [ ] Complete signup as new user
- [ ] Check org_subscriptions table
- [ ] **Expected:** 
  - status: "trialing"
  - trial_expires_at: NOW + 14 days
  - trial_started_at: NOW
- [ ] **Status:** NOT TESTED

**Test Case 3.1.2: Trial Features Available**
- [ ] Sign in with trial account
- [ ] Visit /app/policies, /app/tasks, etc.
- [ ] **Expected:** All features accessible
- [ ] **Verify:** TrialStatusBanner shows "X days left"
- [ ] **Status:** NOT TESTED

**Test Case 3.1.3: Trial Day 14 Warning**
- [ ] Create org with trial expiring TODAY
- [ ] Sign in
- [ ] Visit dashboard
- [ ] **Expected:** Red banner "Trial expires today"
- [ ] **Verify:** Upgrade CTA prominent
- [ ] **Status:** NOT TESTED

**Test Case 3.1.4: Trial Expired - Features Blocked**
- [ ] Create org with trial expired YESTERDAY
- [ ] Sign in
- [ ] Attempt to access paid-only feature
- [ ] **Expected:** Blocked with "Upgrade required" message
- [ ] **Verify:** Redirect to /app/billing with upgrade prompt
- [ ] **Status:** NOT TESTED

### 3.2 Trial to Paid Conversion

**Test Case 3.2.1: Billing Page Shows Upgrade Option**
- [ ] Sign in with trial account (>3 days remaining)
- [ ] Navigate to /app/billing
- [ ] **Expected:** 
  - Shows trial status
  - "Upgrade to Pro/Enterprise" buttons visible
  - Plan comparison table
- [ ] **Status:** NOT TESTED

**Test Case 3.2.2: Stripe Checkout Integration**
- [ ] Click "Upgrade to Pro"
- [ ] Redirected to Stripe checkout
- [ ] **Expected:** Org name pre-filled
- [ ] **Status:** NOT TESTED

---

## Phase 4: Billing & Stripe Integration

### 4.1 Stripe Subscription Lifecycle

**Test Case 4.1.1: Subscription Creation**
- [ ] Complete paid signup via Stripe
- [ ] Verify org_subscriptions created with:
  - stripe_subscription_id populated
  - stripe_customer_id populated
  - status: "active"
  - current_period_end: 30 days from now
- [ ] **Status:** NOT TESTED

**Test Case 4.1.2: Webhook: invoice.payment_succeeded**
- [ ] Manually trigger webhook simulation
- [ ] Verify org_subscriptions updated
- [ ] **Status:** NOT TESTED

**Test Case 4.1.3: Webhook: customer.subscription.deleted**
- [ ] Cancel subscription in Stripe
- [ ] Verify webhook received
- [ ] Verify org_subscriptions.status = "canceled"
- [ ] **Status:** NOT TESTED

### 4.2 Feature Entitlements

**Test Case 4.2.1: Plan Features Enabled**
- [ ] Create account with Pro plan
- [ ] Check org_entitlements table
- [ ] **Expected:** All Pro features enabled (audit_export, frameworks, etc.)
- [ ] **Status:** NOT TESTED

**Test Case 4.2.2: Plan Downgrade**
- [ ] Downgrade from Pro to Basic
- [ ] **Expected:** org_entitlements updated, Pro-only features disabled
- [ ] **Status:** NOT TESTED

---

## Phase 5: Role-Based Access Control (RBAC)

### 5.1 Role Permissions

**Test Case 5.1.1: Owner Permissions**
- [ ] Create org as Owner
- [ ] Verify can:
  - [ ] Create policies
  - [ ] Manage team
  - [ ] Access billing
  - [ ] Export reports
- [ ] **Status:** NOT TESTED

**Test Case 5.1.2: Admin Permissions**
- [ ] Invite user as Admin
- [ ] Verify can do 5.1.1 except billing
- [ ] **Status:** NOT TESTED

**Test Case 5.1.3: Member Permissions**
- [ ] Invite user as Member
- [ ] Verify can:
  - [ ] View policies
  - [ ] Create tasks (in their scope)
  - [ ] View reports
- [ ] **Verify:** Cannot manage billing/team/delete policies
- [ ] **Status:** NOT TESTED

**Test Case 5.1.4: Viewer Permissions**
- [ ] Invite user as Viewer
- [ ] Verify can only view (read-only)
- [ ] **Status:** NOT TESTED

### 5.2 Cross-Organization Access Control

**Test Case 5.2.1: No Cross-Org Access**
- [ ] Sign in as user in Org A
- [ ] Try to access Org B data
- [ ] **Expected:** 403 Forbidden (RLS policy blocks)
- [ ] **Status:** NOT TESTED

**Test Case 5.2.2: Org Members Isolation**
- [ ] Query org_members for Org B as Org A user
- [ ] **Expected:** Empty result (RLS blocks)
- [ ] **Status:** NOT TESTED

---

## Phase 6: Admin Console

### 6.1 Founder Access Control

**Test Case 6.1.1: Founder Can Access /admin**
- [ ] Sign in as founder
- [ ] Navigate to /admin/dashboard
- [ ] **Expected:** Full access, all pages load
- [ ] **Status:** NOT TESTED

**Test Case 6.1.2: Non-Founder Blocked from /admin**
- [ ] Sign in as regular user
- [ ] Try to access /admin
- [ ] **Expected:** Redirect to /pricing (middleware blocks)
- [ ] **Status:** NOT TESTED

**Test Case 6.1.3: Unauthenticated User Blocked from /admin**
- [ ] Without signing in
- [ ] Navigate to /admin
- [ ] **Expected:** Redirect to /auth/signin
- [ ] **Status:** NOT TESTED

### 6.2 Admin Dashboard Features

**Test Case 6.2.1: Users List**
- [ ] Access /admin/users
- [ ] **Expected:** All users listed with pagination
- [ ] **Status:** NOT TESTED

**Test Case 6.2.2: Organizations List**
- [ ] Access /admin/organizations
- [ ] **Expected:** All orgs listed with stats
- [ ] **Status:** NOT TESTED

**Test Case 6.2.3: Trial Management**
- [ ] Access /admin/trials
- [ ] **Expected:** 
  - Active trials listed
  - Expiring trials highlighted
  - Extend/Expire buttons functional
- [ ] **Status:** NOT TESTED

**Test Case 6.2.4: Billing Dashboard**
- [ ] Access /admin/billing
- [ ] **Expected:** Revenue stats, subscription status
- [ ] **Status:** NOT TESTED

---

## Phase 7: Frontend Performance & UX

### 7.1 Navigation Performance

**Test Case 7.1.1: Sidebar Navigation Speed**
- [ ] Open app, click sidebar items
- [ ] Measure page load time
- [ ] **Expected:** <100ms (with performance optimization)
- [ ] **Status:** NOT TESTED

**Test Case 7.1.2: Route Prefetching**
- [ ] Hover over sidebar items
- [ ] Monitor network tab
- [ ] **Expected:** Routes prefetch on hover
- [ ] **Status:** NOT TESTED

### 7.2 Responsive Design

**Test Case 7.2.1: Mobile Layout**
- [ ] View app on mobile (375px width)
- [ ] **Expected:** Readable, functional
- [ ] **Status:** NOT TESTED

**Test Case 7.2.2: Tablet Layout**
- [ ] View app on tablet (768px width)
- [ ] **Expected:** Readable, functional
- [ ] **Status:** NOT TESTED

---

## Phase 8: Security & Data Integrity

### 8.1 Data Validation

**Test Case 8.1.1: XSS Prevention**
- [ ] Try to inject `<script>` in form fields
- [ ] **Expected:** Sanitized or escaped
- [ ] **Status:** NOT TESTED

**Test Case 8.1.2: SQL Injection Prevention**
- [ ] Try SQL injection in API calls
- [ ] **Expected:** Parameterized queries, no injection
- [ ] **Status:** NOT TESTED

### 8.2 CORS & CSRF Protection

**Test Case 8.2.1: CORS Headers**
- [ ] Check API CORS headers
- [ ] **Expected:** Correctly restricted to app origin
- [ ] **Status:** NOT TESTED

**Test Case 8.2.2: CSRF Token**
- [ ] Submit forms
- [ ] **Expected:** CSRF validation passed
- [ ] **Status:** NOT TESTED

### 8.3 Rate Limiting

**Test Case 8.3.1: Auth Endpoint Rate Limit**
- [ ] Attempt 100+ failed logins
- [ ] **Expected:** Rate limited after N attempts
- [ ] **Status:** NOT TESTED

---

## Phase 9: Error Handling & Edge Cases

### 9.1 Network Failures

**Test Case 9.1.1: API Timeout**
- [ ] Throttle network to timeout a request
- [ ] **Expected:** Graceful error, retry option
- [ ] **Status:** NOT TESTED

**Test Case 9.1.2: No Internet Connection**
- [ ] Go offline mid-request
- [ ] **Expected:** Show connection error
- [ ] **Status:** NOT TESTED

### 9.2 Boundary Conditions

**Test Case 9.2.1: Very Long Org Name**
- [ ] Create org with 1000-char name
- [ ] **Expected:** Truncated/handled gracefully
- [ ] **Status:** NOT TESTED

**Test Case 9.2.2: Large File Upload**
- [ ] Upload 500MB file (if applicable)
- [ ] **Expected:** Error message, not server crash
- [ ] **Status:** NOT TESTED

---

## Issues Found

| ID | Severity | Component | Description | Status | Fix |
|----|----------|-----------|-------------|--------|-----|
| ISSUE-001 | - | - | (None found yet) | - | - |

---

## Summary

**Total Test Cases:** 60
**Completed:** 0
**Passed:** 0
**Failed:** 0
**Blocked:** 0

**Critical Issues:** 0
**Major Issues:** 0
**Minor Issues:** 0

---

## Next Steps

1. Begin Phase 1 testing (Auth & Identity)
2. Document all findings
3. Create fixes for issues
4. Re-test and verify
5. Move to Phase 2

