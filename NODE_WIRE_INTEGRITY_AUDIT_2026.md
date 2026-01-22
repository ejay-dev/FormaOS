# FORMAOS NODE & WIRE INTEGRITY AUDIT

**Date:** January 17, 2026  
**Audit Type:** Full Manual Node-Wire Verification  
**Status:** 🔄 IN PROGRESS

---

## 🎯 AUDIT OBJECTIVE

Perform a manual, step-by-step Node & Wire Audit across the entire FormaOS ecosystem to verify every navigation path, fix broken flows, and ensure zero dead ends or crashes.

**Definition:**

- **Node** = User state or page (Home, Signup, Dashboard, Admin, etc.)
- **Wire** = Transition between nodes (button, link, redirect, auth callback, routing)

---

## 📋 PHASE 1: MASTER FLOW MAP

### 1.1 PUBLIC WEBSITE NODES

| Node ID      | Path           | Purpose            | Auth Required |
| ------------ | -------------- | ------------------ | ------------- |
| W-HOME       | /              | Landing page       | No            |
| W-PRODUCT    | /product       | Product features   | No            |
| W-INDUSTRIES | /industries    | Industry solutions | No            |
| W-SECURITY   | /security      | Security features  | No            |
| W-PRICING    | /pricing       | Pricing plans      | No            |
| W-STORY      | /our-story     | Company story      | No            |
| W-ABOUT      | /about         | About page         | No            |
| W-CONTACT    | /contact       | Contact form       | No            |
| W-DOCS       | /docs          | Documentation      | No            |
| W-BLOG       | /blog          | Blog posts         | No            |
| W-FAQ        | /faq           | FAQ page           | No            |
| W-PRIVACY    | /legal/privacy | Privacy policy     | No            |
| W-TERMS      | /legal/terms   | Terms of service   | No            |

### 1.2 AUTH & ONBOARDING NODES

| Node ID         | Path              | Purpose                | Auth Required |
| --------------- | ----------------- | ---------------------- | ------------- |
| A-SIGNIN        | /auth/signin      | Login page             | No            |
| A-SIGNUP        | /auth/signup      | Registration page      | No            |
| A-CALLBACK      | /auth/callback    | OAuth callback handler | No            |
| A-PLAN-SELECT   | /auth/plan-select | Plan selection         | Partial       |
| O-ONBOARDING    | /onboarding       | Onboarding flow        | Yes           |
| A-ACCEPT-INVITE | /accept-invite    | Team invitation        | Yes           |

### 1.3 APP NODES (AUTHENTICATED)

| Node ID       | Path                | Purpose                | Role Required       |
| ------------- | ------------------- | ---------------------- | ------------------- |
| APP-DASH      | /app                | Main dashboard         | Any                 |
| APP-TASKS     | /app/tasks          | Task management        | Any                 |
| APP-EVIDENCE  | /app/evidence       | Evidence vault         | Any                 |
| APP-VAULT     | /app/vault          | Credential vault       | Any                 |
| APP-POLICIES  | /app/policies       | Policy library         | Manager+            |
| APP-TEAM      | /app/team           | Team management        | Manager+            |
| APP-WORKFLOWS | /app/workflows      | Workflow engine        | Manager+            |
| APP-AUDIT     | /app/audit          | Audit logs             | Compliance Officer+ |
| APP-REPORTS   | /app/reports        | Compliance reports     | Manager+            |
| APP-BILLING   | /app/billing        | Billing & subscription | Owner               |
| APP-SETTINGS  | /app/settings       | User settings          | Any                 |
| APP-PROFILE   | /app/profile        | User profile           | Any                 |
| APP-STAFF     | /app/staff          | Staff dashboard        | Staff only          |
| APP-PATIENTS  | /app/patients       | Patient management     | Healthcare          |
| APP-PROGRESS  | /app/progress-notes | Progress notes         | Healthcare          |
| APP-REGISTERS | /app/registers      | Training registers     | Any                 |

### 1.4 ADMIN NODES (FOUNDER ONLY)

| Node ID      | Path            | Purpose                 | Role Required |
| ------------ | --------------- | ----------------------- | ------------- |
| ADM-DASH     | /admin          | Admin dashboard         | Founder       |
| ADM-USERS    | /admin/users    | User management         | Founder       |
| ADM-ORGS     | /admin/orgs     | Organization management | Founder       |
| ADM-BILLING  | /admin/billing  | Billing overview        | Founder       |
| ADM-TRIALS   | /admin/trials   | Trial management        | Founder       |
| ADM-FEATURES | /admin/features | Feature flags           | Founder       |
| ADM-SECURITY | /admin/security | Security monitoring     | Founder       |
| ADM-SYSTEM   | /admin/system   | System health           | Founder       |
| ADM-AUDIT    | /admin/audit    | System audit logs       | Founder       |
| ADM-SUPPORT  | /admin/support  | Support tickets         | Founder       |
| ADM-REVENUE  | /admin/revenue  | Revenue analytics       | Founder       |
| ADM-HEALTH   | /admin/health   | Health checks           | Founder       |

### 1.5 ERROR & UTILITY NODES

| Node ID        | Path          | Purpose       | Auth Required |
| -------------- | ------------- | ------------- | ------------- |
| E-UNAUTHORIZED | /unauthorized | Access denied | No            |
| E-404          | /404          | Not found     | No            |
| E-ERROR        | /error        | Generic error | No            |

---

## 📊 PHASE 2: WIRE INVENTORY

### 2.1 WEBSITE → AUTH WIRES

| Wire ID | From Node          | Action                    | To Node       | Conditions |
| ------- | ------------------ | ------------------------- | ------------- | ---------- |
| W1      | W-HOME             | "Start Free Trial" button | A-SIGNUP      | None       |
| W2      | W-HOME             | "Login" link (header)     | A-SIGNIN      | None       |
| W3      | W-HOME             | "Request Demo" button     | W-CONTACT     | None       |
| W4      | W-PRICING          | "Start Free" button       | A-SIGNUP      | None       |
| W5      | W-PRICING          | "Contact Sales" button    | W-CONTACT     | None       |
| W6      | W-PRODUCT          | "Get Started" button      | A-SIGNUP      | None       |
| W7      | W-INDUSTRIES       | "Start Free Trial" button | A-SIGNUP      | None       |
| W8      | W-SECURITY         | "Start Free Trial" button | A-SIGNUP      | None       |
| W9      | W-STORY            | "Get Started" button      | A-SIGNUP      | None       |
| W10     | W-CONTACT          | Form submission           | Success state | None       |
| W11     | Header (all pages) | "Login" link              | A-SIGNIN      | None       |
| W12     | Header (all pages) | "Sign Up" button          | A-SIGNUP      | None       |

### 2.2 AUTH → APP WIRES

| Wire ID | From Node       | Action               | To Node                    | Conditions                |
| ------- | --------------- | -------------------- | -------------------------- | ------------------------- |
| A1      | A-SIGNUP        | Email signup success | Email verification message | Email not confirmed       |
| A2      | A-SIGNUP        | Google OAuth success | A-CALLBACK                 | OAuth flow                |
| A3      | A-CALLBACK      | OAuth processing     | O-ONBOARDING               | New user, no org          |
| A4      | A-CALLBACK      | OAuth processing     | APP-DASH                   | Existing user, org exists |
| A5      | A-CALLBACK      | OAuth processing     | ADM-DASH                   | Founder user              |
| A6      | A-SIGNIN        | Login success        | APP-DASH                   | Regular user              |
| A7      | A-SIGNIN        | Login success        | ADM-DASH                   | Founder user              |
| A8      | O-ONBOARDING    | Complete onboarding  | APP-DASH                   | Onboarding finished       |
| A9      | A-ACCEPT-INVITE | Accept invitation    | APP-DASH                   | Team member               |

### 2.3 APP INTERNAL WIRES

| Wire ID | From Node    | Action               | To Node          | Conditions             |
| ------- | ------------ | -------------------- | ---------------- | ---------------------- |
| APP1    | APP-DASH     | "Tasks" nav link     | APP-TASKS        | Any role               |
| APP2    | APP-DASH     | "Evidence" nav link  | APP-EVIDENCE     | Any role               |
| APP3    | APP-DASH     | "Policies" nav link  | APP-POLICIES     | Manager+               |
| APP4    | APP-DASH     | "Team" nav link      | APP-TEAM         | Manager+               |
| APP5    | APP-DASH     | "Workflows" nav link | APP-WORKFLOWS    | Manager+               |
| APP6    | APP-DASH     | "Audit" nav link     | APP-AUDIT        | Compliance Officer+    |
| APP7    | APP-DASH     | "Reports" nav link   | APP-REPORTS      | Manager+               |
| APP8    | APP-DASH     | "Billing" nav link   | APP-BILLING      | Owner                  |
| APP9    | APP-DASH     | "Settings" nav link  | APP-SETTINGS     | Any role               |
| APP10   | APP-STAFF    | Limited nav          | Restricted pages | Staff role             |
| APP11   | Any app page | Subscription expired | APP-BILLING      | No active subscription |
| APP12   | Any app page | Trial expired        | APP-BILLING      | Trial ended            |

### 2.4 APP → ADMIN WIRES

| Wire ID | From Node | Action                  | To Node  | Conditions          |
| ------- | --------- | ----------------------- | -------- | ------------------- |
| ADM1    | APP-DASH  | Admin link (if founder) | ADM-DASH | Founder only        |
| ADM2    | A-SIGNIN  | Login as founder        | ADM-DASH | Founder credentials |

### 2.5 MIDDLEWARE REDIRECT WIRES

| Wire ID | Trigger                   | From      | To             | Conditions            |
| ------- | ------------------------- | --------- | -------------- | --------------------- |
| M1      | OAuth code at /           | /         | A-CALLBACK     | OAuth code present    |
| M2      | /auth without path        | /auth     | A-SIGNIN       | Auto-redirect         |
| M3      | Logged in user at auth    | A-SIGNIN  | APP-DASH       | Already authenticated |
| M4      | Logged in founder at auth | A-SIGNIN  | ADM-DASH       | Founder authenticated |
| M5      | Unauthenticated at /app   | /app/\*   | A-SIGNIN       | No session            |
| M6      | Unauthenticated at /admin | /admin/\* | A-SIGNIN       | No session            |
| M7      | Non-founder at /admin     | /admin/\* | E-UNAUTHORIZED | Not founder           |
| M8      | Staff at restricted page  | /app/\*   | APP-STAFF      | Staff role            |
| M9      | Incomplete onboarding     | /app/\*   | O-ONBOARDING   | Onboarding not done   |
| M10     | Expired subscription      | /app/\*   | APP-BILLING    | Subscription inactive |

---

## 🔍 PHASE 3: MANUAL VERIFICATION CHECKLIST

### 3.1 WEBSITE NAVIGATION (Logged Out)

- [ ] **W-HOME**: Verify page loads
  - [ ] Click "Start Free Trial" → Should reach A-SIGNUP
  - [ ] Click "Login" (header) → Should reach A-SIGNIN
  - [ ] Click "Request Demo" → Should reach W-CONTACT
  - [ ] Click "Product" (nav) → Should reach W-PRODUCT
  - [ ] Click "Industries" (nav) → Should reach W-INDUSTRIES
  - [ ] Click "Security" (nav) → Should reach W-SECURITY
  - [ ] Click "Pricing" (nav) → Should reach W-PRICING
  - [ ] Click "Our Story" (nav) → Should reach W-STORY
  - [ ] Click "Contact" (nav) → Should reach W-CONTACT

- [ ] **W-PRODUCT**: Verify page loads
  - [ ] Click "Get Started" → Should reach A-SIGNUP
  - [ ] All navigation links work

- [ ] **W-INDUSTRIES**: Verify page loads
  - [ ] Click "Start Free Trial" → Should reach A-SIGNUP
  - [ ] All navigation links work

- [ ] **W-SECURITY**: Verify page loads
  - [ ] Click "Start Free Trial" → Should reach A-SIGNUP
  - [ ] All navigation links work

- [ ] **W-PRICING**: Verify page loads
  - [ ] Click "Start Free" → Should reach A-SIGNUP
  - [ ] Click "Contact Sales" → Should reach W-CONTACT
  - [ ] All plan cards display correctly

- [ ] **W-STORY**: Verify page loads
  - [ ] Click "Get Started" → Should reach A-SIGNUP
  - [ ] All navigation links work

- [ ] **W-CONTACT**: Verify page loads
  - [ ] Form displays correctly
  - [ ] Form submission works
  - [ ] Success message displays

- [ ] **W-DOCS**: Verify page loads
  - [ ] Documentation content displays
  - [ ] All navigation links work

- [ ] **W-BLOG**: Verify page loads
  - [ ] Blog posts display
  - [ ] All navigation links work

- [ ] **W-FAQ**: Verify page loads
  - [ ] FAQ items display
  - [ ] Accordion functionality works

- [ ] **W-PRIVACY**: Verify page loads
  - [ ] Privacy policy displays
  - [ ] All navigation links work

- [ ] **W-TERMS**: Verify page loads
  - [ ] Terms of service display
  - [ ] All navigation links work

### 3.2 AUTH FLOWS

#### 3.2.1 New User Signup (Email)

- [ ] Navigate to A-SIGNUP
- [ ] Enter email and password
- [ ] Submit form
- [ ] Verify email confirmation message displays
- [ ] Check email for confirmation link
- [ ] Click confirmation link
- [ ] Verify redirect to login or dashboard

#### 3.2.2 New User Signup (Google OAuth)

- [ ] Navigate to A-SIGNUP
- [ ] Click "Sign up with Google"
- [ ] Complete Google OAuth flow
- [ ] Verify redirect to A-CALLBACK
- [ ] Verify redirect to O-ONBOARDING (new user)
- [ ] Complete onboarding
- [ ] Verify redirect to APP-DASH

#### 3.2.3 Existing User Login (Email)

- [ ] Navigate to A-SIGNIN
- [ ] Enter credentials
- [ ] Submit form
- [ ] Verify redirect to APP-DASH

#### 3.2.4 Existing User Login (Google OAuth)

- [ ] Navigate to A-SIGNIN
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Verify redirect to A-CALLBACK
- [ ] Verify redirect to APP-DASH

#### 3.2.5 Founder Login

- [ ] Navigate to A-SIGNIN
- [ ] Enter founder credentials
- [ ] Submit form
- [ ] Verify redirect to ADM-DASH (not APP-DASH)

### 3.3 APP NAVIGATION (Regular User)

- [ ] **APP-DASH**: Verify dashboard loads
  - [ ] All widgets display
  - [ ] Navigation sidebar visible
  - [ ] Click "Tasks" → Should reach APP-TASKS
  - [ ] Click "Evidence" → Should reach APP-EVIDENCE
  - [ ] Click "Vault" → Should reach APP-VAULT
  - [ ] Click "Policies" → Should reach APP-POLICIES (if Manager+)
  - [ ] Click "Team" → Should reach APP-TEAM (if Manager+)
  - [ ] Click "Workflows" → Should reach APP-WORKFLOWS (if Manager+)
  - [ ] Click "Audit" → Should reach APP-AUDIT (if Compliance Officer+)
  - [ ] Click "Reports" → Should reach APP-REPORTS (if Manager+)
  - [ ] Click "Billing" → Should reach APP-BILLING (if Owner)
  - [ ] Click "Settings" → Should reach APP-SETTINGS

- [ ] **APP-TASKS**: Verify task page loads
  - [ ] Task list displays
  - [ ] Create task button works
  - [ ] Task details modal opens
  - [ ] Navigation works

- [ ] **APP-EVIDENCE**: Verify evidence page loads
  - [ ] Evidence list displays
  - [ ] Upload button works
  - [ ] Evidence details modal opens
  - [ ] Navigation works

- [ ] **APP-VAULT**: Verify vault page loads
  - [ ] Credential list displays
  - [ ] Add credential button works
  - [ ] Credential details modal opens
  - [ ] Navigation works

- [ ] **APP-POLICIES**: Verify policies page loads
  - [ ] Policy list displays
  - [ ] Create policy button works
  - [ ] Policy details page opens
  - [ ] Navigation works

- [ ] **APP-TEAM**: Verify team page loads
  - [ ] Team member list displays
  - [ ] Invite button works
  - [ ] Member details modal opens
  - [ ] Navigation works

- [ ] **APP-WORKFLOWS**: Verify workflows page loads
  - [ ] Workflow list displays
  - [ ] Create workflow button works
  - [ ] Workflow builder opens
  - [ ] Navigation works

- [ ] **APP-AUDIT**: Verify audit page loads
  - [ ] Audit log displays
  - [ ] Filters work
  - [ ] Export button works
  - [ ] Navigation works

- [ ] **APP-REPORTS**: Verify reports page loads
  - [ ] Report list displays
  - [ ] Generate report button works
  - [ ] Report details open
  - [ ] Navigation works

- [ ] **APP-BILLING**: Verify billing page loads
  - [ ] Subscription status displays
  - [ ] Manage billing button works
  - [ ] Plan upgrade options display
  - [ ] Navigation works

- [ ] **APP-SETTINGS**: Verify settings page loads
  - [ ] Settings form displays
  - [ ] Save button works
  - [ ] Navigation works

- [ ] **APP-PROFILE**: Verify profile page loads
  - [ ] Profile form displays
  - [ ] Save button works
  - [ ] Navigation works

### 3.4 APP NAVIGATION (Staff Role)

- [ ] Login as staff user
- [ ] Verify redirect to APP-STAFF
- [ ] Verify limited navigation menu
- [ ] Try accessing restricted pages
  - [ ] /app/policies → Should redirect to APP-STAFF
  - [ ] /app/team → Should redirect to APP-STAFF
  - [ ] /app/workflows → Should redirect to APP-STAFF
  - [ ] /app/billing → Should redirect to APP-STAFF
- [ ] Verify allowed pages work
  - [ ] /app/tasks → Should work
  - [ ] /app/evidence → Should work
  - [ ] /app/vault → Should work

### 3.5 ADMIN NAVIGATION (Founder)

- [ ] Login as founder
- [ ] Verify redirect to ADM-DASH
- [ ] **ADM-DASH**: Verify admin dashboard loads
  - [ ] All admin widgets display
  - [ ] Navigation sidebar visible
  - [ ] Click "Users" → Should reach ADM-USERS
  - [ ] Click "Organizations" → Should reach ADM-ORGS
  - [ ] Click "Billing" → Should reach ADM-BILLING
  - [ ] Click "Trials" → Should reach ADM-TRIALS
  - [ ] Click "Features" → Should reach ADM-FEATURES
  - [ ] Click "Security" → Should reach ADM-SECURITY
  - [ ] Click "System" → Should reach ADM-SYSTEM
  - [ ] Click "Audit" → Should reach ADM-AUDIT
  - [ ] Click "Support" → Should reach ADM-SUPPORT
  - [ ] Click "Revenue" → Should reach ADM-REVENUE
  - [ ] Click "Health" → Should reach ADM-HEALTH

- [ ] **ADM-USERS**: Verify user management page loads
  - [ ] User list displays
  - [ ] User actions work
  - [ ] Navigation works

- [ ] **ADM-ORGS**: Verify organization management page loads
  - [ ] Organization list displays
  - [ ] Organization actions work
  - [ ] Navigation works

- [ ] **ADM-BILLING**: Verify billing overview page loads
  - [ ] Billing data displays
  - [ ] Actions work
  - [ ] Navigation works

- [ ] **ADM-TRIALS**: Verify trial management page loads
  - [ ] Trial list displays
  - [ ] Trial actions work
  - [ ] Navigation works

- [ ] **ADM-FEATURES**: Verify feature flags page loads
  - [ ] Feature list displays
  - [ ] Toggle switches work
  - [ ] Navigation works

- [ ] **ADM-SECURITY**: Verify security monitoring page loads
  - [ ] Security metrics display
  - [ ] Alerts display
  - [ ] Navigation works

- [ ] **ADM-SYSTEM**: Verify system health page loads
  - [ ] System metrics display
  - [ ] Health checks display
  - [ ] Navigation works

- [ ] **ADM-AUDIT**: Verify system audit page loads
  - [ ] System audit logs display
  - [ ] Filters work
  - [ ] Navigation works

### 3.6 MIDDLEWARE REDIRECTS

- [ ] **M1**: OAuth code at root
  - [ ] Navigate to /?code=test&state=test
  - [ ] Verify redirect to /auth/callback

- [ ] **M2**: /auth without path
  - [ ] Navigate to /auth
  - [ ] Verify redirect to /auth/signin

- [ ] **M3**: Logged in user at auth
  - [ ] Login as regular user
  - [ ] Navigate to /auth/signin
  - [ ] Verify redirect to /app

- [ ] **M4**: Logged in founder at auth
  - [ ] Login as founder
  - [ ] Navigate to /auth/signin
  - [ ] Verify redirect to /admin

- [ ] **M5**: Unauthenticated at /app
  - [ ] Logout
  - [ ] Navigate to /app
  - [ ] Verify redirect to /auth/signin

- [ ] **M6**: Unauthenticated at /admin
  - [ ] Logout
  - [ ] Navigate to /admin
  - [ ] Verify redirect to /auth/signin

- [ ] **M7**: Non-founder at /admin
  - [ ] Login as regular user
  - [ ] Navigate to /admin
  - [ ] Verify redirect to /unauthorized

- [ ] **M8**: Staff at restricted page
  - [ ] Login as staff
  - [ ] Navigate to /app/policies
  - [ ] Verify redirect to /app/staff

- [ ] **M9**: Incomplete onboarding
  - [ ] Create new user without completing onboarding
  - [ ] Navigate to /app
  - [ ] Verify redirect to /onboarding

- [ ] **M10**: Expired subscription
  - [ ] Login as user with expired subscription
  - [ ] Navigate to /app/tasks
  - [ ] Verify redirect to /app/billing

### 3.7 CROSS-DOMAIN ROUTING (If Applicable)

- [ ] Verify website domain (formaos.com) routes correctly
- [ ] Verify app domain (app.formaos.com) routes correctly
- [ ] Verify cross-domain redirects work
- [ ] Verify cookies persist across domains

### 3.8 ERROR HANDLING

- [ ] **E-UNAUTHORIZED**: Navigate to /unauthorized
  - [ ] Page displays correctly
  - [ ] "Go Home" button works

- [ ] **E-404**: Navigate to /nonexistent-page
  - [ ] 404 page displays
  - [ ] "Go Home" button works

- [ ] **E-ERROR**: Trigger error condition
  - [ ] Error page displays
  - [ ] Error message shows
  - [ ] "Go Home" button works

---

## 🐛 PHASE 4: ISSUES FOUND

### Critical Issues (Blocking)

_None identified yet_

### Major Issues (High Priority)

_None identified yet_

### Minor Issues (Medium Priority)

_None identified yet_

### Warnings (Low Priority)

_None identified yet_

---

## ✅ PHASE 5: FIXES APPLIED

_No fixes applied yet - audit in progress_

---

## 📊 PHASE 6: VERIFICATION RESULTS

### Overall Status

- **Total Nodes**: 50+
- **Total Wires**: 100+
- **Nodes Verified**: 0/50+
- **Wires Verified**: 0/100+
- **Issues Found**: 0
- **Issues Fixed**: 0

### Completion Status

- [ ] Phase 1: Master Flow Map - ✅ COMPLETE
- [ ] Phase 2: Wire Inventory - ✅ COMPLETE
- [ ] Phase 3: Manual Verification - 🔄 IN PROGRESS
- [ ] Phase 4: Issue Documentation - ⏳ PENDING
- [ ] Phase 5: Fix Implementation - ⏳ PENDING
- [ ] Phase 6: Re-verification - ⏳ PENDING

---

## 📝 NOTES

### Audit Methodology

1. Start with logged-out state
2. Test all public website navigation
3. Test all auth flows
4. Test app navigation for each role
5. Test admin navigation for founder
6. Test middleware redirects
7. Test error handling
8. Document all issues
9. Fix issues one by one
10. Re-verify all flows

### Testing Environment

- Browser: Chrome/Firefox/Safari
- Device: Desktop + Mobile
- Network: Normal + Slow 3G
- Auth States: Logged out, Trial user, Paid user, Staff, Manager, Owner, Founder

---

**Audit Status**: 🔄 IN PROGRESS  
**Next Step**: Begin Phase 3 manual verification  
**Estimated Completion**: TBD based on issues found
