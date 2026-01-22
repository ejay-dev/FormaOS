# FORMAOS COMPREHENSIVE BROWSER TEST CHECKLIST

**Date:** January 17, 2026  
**Test Type:** Manual Node-Wire Verification  
**Tester:** ******\_\_\_******  
**Browser:** ******\_\_\_******  
**Date Tested:** ******\_\_\_******

---

## 🎯 TEST OBJECTIVE

Verify every single node (page) and wire (navigation link) in the FormaOS platform works correctly after applying navigation fixes.

---

## 📋 SECTION 1: PUBLIC WEBSITE NAVIGATION (Logged Out)

### Test Environment Setup

- [ ] Open browser in incognito/private mode
- [ ] Clear all cookies and cache
- [ ] Navigate to homepage: `http://localhost:3000` or production URL
- [ ] Confirm you are logged out (no user session)

### 1.1 Header Navigation Links (Desktop)

**Starting Point:** Homepage (/)

| #   | Link       | Expected Destination | Status          | Notes                       |
| --- | ---------- | -------------------- | --------------- | --------------------------- |
| 1   | Home       | /                    | ⬜ Pass ⬜ Fail |                             |
| 2   | Product    | /product             | ⬜ Pass ⬜ Fail |                             |
| 3   | Industries | /industries          | ⬜ Pass ⬜ Fail |                             |
| 4   | Security   | /security            | ⬜ Pass ⬜ Fail |                             |
| 5   | Pricing    | /pricing             | ⬜ Pass ⬜ Fail |                             |
| 6   | **About**  | **/about**           | ⬜ Pass ⬜ Fail | **NEW - Verify this works** |
| 7   | Contact    | /contact             | ⬜ Pass ⬜ Fail |                             |

**Verification Steps for Each Link:**

1. Click the link
2. Verify URL changes to expected destination
3. Verify page loads without errors
4. Verify page content displays correctly
5. Check browser console for errors (F12)

### 1.2 Header CTA Buttons (Desktop)

**Starting Point:** Homepage (/)

| #   | Button         | Expected Destination      | Status          | Notes                          |
| --- | -------------- | ------------------------- | --------------- | ------------------------------ |
| 1   | Login          | /auth/signin              | ⬜ Pass ⬜ Fail |                                |
| 2   | Plans          | /pricing                  | ⬜ Pass ⬜ Fail |                                |
| 3   | **Start Free** | **/auth/signup?plan=pro** | ⬜ Pass ⬜ Fail | **UPDATED - Verify ?plan=pro** |

**Special Verification for "Start Free":**

1. Click "Start Free" button
2. Check URL bar - should show: `/auth/signup?plan=pro`
3. Verify `?plan=pro` parameter is present
4. Open browser DevTools → Network tab
5. Verify plan parameter is sent to backend

### 1.3 Mobile Navigation (Responsive)

**Test Device:** Mobile or resize browser to < 768px width

| #   | Action                   | Expected Result                       | Status          | Notes       |
| --- | ------------------------ | ------------------------------------- | --------------- | ----------- |
| 1   | Click hamburger menu     | Menu opens                            | ⬜ Pass ⬜ Fail |             |
| 2   | Verify all links visible | All 7 links present                   | ⬜ Pass ⬜ Fail |             |
| 3   | Click Home               | Navigate to /                         | ⬜ Pass ⬜ Fail |             |
| 4   | Click Product            | Navigate to /product                  | ⬜ Pass ⬜ Fail |             |
| 5   | Click Industries         | Navigate to /industries               | ⬜ Pass ⬜ Fail |             |
| 6   | Click Security           | Navigate to /security                 | ⬜ Pass ⬜ Fail |             |
| 7   | Click Pricing            | Navigate to /pricing                  | ⬜ Pass ⬜ Fail |             |
| 8   | **Click About**          | **Navigate to /about**                | ⬜ Pass ⬜ Fail | **NEW**     |
| 9   | Click Contact            | Navigate to /contact                  | ⬜ Pass ⬜ Fail |             |
| 10  | Click Login              | Navigate to /auth/signin              | ⬜ Pass ⬜ Fail |             |
| 11  | **Click Start Free**     | **Navigate to /auth/signup?plan=pro** | ⬜ Pass ⬜ Fail | **UPDATED** |

---

## 📋 SECTION 2: PAGE-SPECIFIC CTAs

### 2.1 Homepage CTAs

**Starting Point:** Homepage (/)

| #   | CTA Location         | Button Text                     | Expected Destination  | Status          | Notes            |
| --- | -------------------- | ------------------------------- | --------------------- | --------------- | ---------------- |
| 1   | Hero section         | "Start Free Trial"              | /auth/signup?plan=pro | ⬜ Pass ⬜ Fail |                  |
| 2   | Hero section         | "Request Demo"                  | /contact              | ⬜ Pass ⬜ Fail |                  |
| 3   | Connected System     | "Explore Platform Architecture" | /product              | ⬜ Pass ⬜ Fail |                  |
| 4   | Lifecycle section    | "Explore Platform Architecture" | /product              | ⬜ Pass ⬜ Fail |                  |
| 5   | Capabilities section | "View All Features"             | /product              | ⬜ Pass ⬜ Fail |                  |
| 6   | Industries section   | "Explore All Industries"        | /industries           | ⬜ Pass ⬜ Fail |                  |
| 7   | Security section     | "Security Architecture"         | /security             | ⬜ Pass ⬜ Fail |                  |
| 8   | Final CTA            | "Start Free Trial"              | /auth/signup?plan=pro | ⬜ Pass ⬜ Fail | Verify ?plan=pro |
| 9   | Final CTA            | "Request Demo"                  | /contact              | ⬜ Pass ⬜ Fail |                  |

### 2.2 Product Page CTAs

**Starting Point:** /product

| #   | CTA                             | Expected Destination  | Status          | Notes |
| --- | ------------------------------- | --------------------- | --------------- | ----- |
| 1   | "Get Started" (if present)      | /auth/signup          | ⬜ Pass ⬜ Fail |       |
| 2   | "Start Free Trial" (if present) | /auth/signup?plan=pro | ⬜ Pass ⬜ Fail |       |

### 2.3 Industries Page CTAs

**Starting Point:** /industries

| #   | CTA                | Expected Destination | Status          | Notes |
| --- | ------------------ | -------------------- | --------------- | ----- |
| 1   | "Start Free Trial" | /auth/signup         | ⬜ Pass ⬜ Fail |       |

### 2.4 Security Page CTAs

**Starting Point:** /security

| #   | CTA                | Expected Destination | Status          | Notes |
| --- | ------------------ | -------------------- | --------------- | ----- |
| 1   | "Start Free Trial" | /auth/signup         | ⬜ Pass ⬜ Fail |       |

### 2.5 Pricing Page CTAs

**Starting Point:** /pricing

| #   | CTA                              | Expected Destination | Status          | Notes |
| --- | -------------------------------- | -------------------- | --------------- | ----- |
| 1   | "Start Free" (Starter plan)      | /auth/signup         | ⬜ Pass ⬜ Fail |       |
| 2   | "Start Free" (Professional plan) | /auth/signup         | ⬜ Pass ⬜ Fail |       |
| 3   | "Contact Sales" (Enterprise)     | /contact             | ⬜ Pass ⬜ Fail |       |

### 2.6 About Page (NEW)

**Starting Point:** /about

| #   | Test               | Expected Result      | Status          | Notes |
| --- | ------------------ | -------------------- | --------------- | ----- |
| 1   | Page loads         | No errors            | ⬜ Pass ⬜ Fail |       |
| 2   | Content displays   | All sections visible | ⬜ Pass ⬜ Fail |       |
| 3   | Navigation works   | Can navigate away    | ⬜ Pass ⬜ Fail |       |
| 4   | CTAs work (if any) | Navigate correctly   | ⬜ Pass ⬜ Fail |       |

### 2.7 Contact Page

**Starting Point:** /contact

| #   | Test            | Expected Result      | Status          | Notes |
| --- | --------------- | -------------------- | --------------- | ----- |
| 1   | Form displays   | Contact form visible | ⬜ Pass ⬜ Fail |       |
| 2   | Form submission | Success message      | ⬜ Pass ⬜ Fail |       |

---

## 📋 SECTION 3: AUTH FLOWS

### 3.1 New User Signup (Email)

**Starting Point:** /auth/signup

| #   | Step           | Action                   | Expected Result            | Status          | Notes |
| --- | -------------- | ------------------------ | -------------------------- | --------------- | ----- |
| 1   | Load page      | Navigate to /auth/signup | Page loads                 | ⬜ Pass ⬜ Fail |       |
| 2   | Enter email    | Type test email          | Field accepts input        | ⬜ Pass ⬜ Fail |       |
| 3   | Enter password | Type password            | Field accepts input        | ⬜ Pass ⬜ Fail |       |
| 4   | Submit form    | Click signup             | Processing starts          | ⬜ Pass ⬜ Fail |       |
| 5   | Email sent     | Check for message        | "Check your email" message | ⬜ Pass ⬜ Fail |       |
| 6   | Email received | Check inbox              | Confirmation email arrives | ⬜ Pass ⬜ Fail |       |
| 7   | Click link     | Click confirmation       | Redirect to app            | ⬜ Pass ⬜ Fail |       |

### 3.2 New User Signup (Google OAuth)

**Starting Point:** /auth/signup

| #   | Step             | Action                      | Expected Result    | Status          | Notes |
| --- | ---------------- | --------------------------- | ------------------ | --------------- | ----- |
| 1   | Load page        | Navigate to /auth/signup    | Page loads         | ⬜ Pass ⬜ Fail |       |
| 2   | Click Google     | Click "Sign up with Google" | Google OAuth popup | ⬜ Pass ⬜ Fail |       |
| 3   | Select account   | Choose Google account       | Account selected   | ⬜ Pass ⬜ Fail |       |
| 4   | Grant permission | Click "Allow"               | Permission granted | ⬜ Pass ⬜ Fail |       |
| 5   | Callback         | Redirect to /auth/callback  | Processing         | ⬜ Pass ⬜ Fail |       |
| 6   | Onboarding       | Redirect to /onboarding     | Onboarding page    | ⬜ Pass ⬜ Fail |       |
| 7   | Complete         | Finish onboarding           | Redirect to /app   | ⬜ Pass ⬜ Fail |       |

### 3.3 Existing User Login (Email)

**Starting Point:** /auth/signin

| #   | Step           | Action                   | Expected Result     | Status          | Notes |
| --- | -------------- | ------------------------ | ------------------- | --------------- | ----- |
| 1   | Load page      | Navigate to /auth/signin | Page loads          | ⬜ Pass ⬜ Fail |       |
| 2   | Enter email    | Type existing email      | Field accepts input | ⬜ Pass ⬜ Fail |       |
| 3   | Enter password | Type password            | Field accepts input | ⬜ Pass ⬜ Fail |       |
| 4   | Submit         | Click login              | Processing starts   | ⬜ Pass ⬜ Fail |       |
| 5   | Redirect       | After auth               | Redirect to /app    | ⬜ Pass ⬜ Fail |       |
| 6   | Dashboard      | Load dashboard           | Dashboard displays  | ⬜ Pass ⬜ Fail |       |

### 3.4 Existing User Login (Google OAuth)

**Starting Point:** /auth/signin

| #   | Step           | Action                      | Expected Result    | Status          | Notes |
| --- | -------------- | --------------------------- | ------------------ | --------------- | ----- |
| 1   | Load page      | Navigate to /auth/signin    | Page loads         | ⬜ Pass ⬜ Fail |       |
| 2   | Click Google   | Click "Sign in with Google" | Google OAuth popup | ⬜ Pass ⬜ Fail |       |
| 3   | Select account | Choose Google account       | Account selected   | ⬜ Pass ⬜ Fail |       |
| 4   | Callback       | Redirect to /auth/callback  | Processing         | ⬜ Pass ⬜ Fail |       |
| 5   | Redirect       | After auth                  | Redirect to /app   | ⬜ Pass ⬜ Fail |       |
| 6   | Dashboard      | Load dashboard              | Dashboard displays | ⬜ Pass ⬜ Fail |       |

### 3.5 Founder Login

**Starting Point:** /auth/signin

| #   | Step                | Action                   | Expected Result          | Status          | Notes    |
| --- | ------------------- | ------------------------ | ------------------------ | --------------- | -------- |
| 1   | Load page           | Navigate to /auth/signin | Page loads               | ⬜ Pass ⬜ Fail |          |
| 2   | Enter founder email | Type founder email       | Field accepts input      | ⬜ Pass ⬜ Fail |          |
| 3   | Enter password      | Type password            | Field accepts input      | ⬜ Pass ⬜ Fail |          |
| 4   | Submit              | Click login              | Processing starts        | ⬜ Pass ⬜ Fail |          |
| 5   | Redirect            | After auth               | **Redirect to /admin**   | ⬜ Pass ⬜ Fail | NOT /app |
| 6   | Admin console       | Load admin               | Admin dashboard displays | ⬜ Pass ⬜ Fail |          |

---

## 📋 SECTION 4: MIDDLEWARE REDIRECTS

### 4.1 OAuth Code at Root

| #   | Test           | Action                             | Expected Result            | Status          | Notes |
| --- | -------------- | ---------------------------------- | -------------------------- | --------------- | ----- |
| 1   | OAuth redirect | Navigate to /?code=test&state=test | Redirect to /auth/callback | ⬜ Pass ⬜ Fail |       |

### 4.2 /auth Without Path

| #   | Test          | Action            | Expected Result          | Status          | Notes |
| --- | ------------- | ----------------- | ------------------------ | --------------- | ----- |
| 1   | Auth redirect | Navigate to /auth | Redirect to /auth/signin | ⬜ Pass ⬜ Fail |       |

### 4.3 Logged-In User at Auth Pages

**Prerequisites:** Must be logged in as regular user

| #   | Test         | Action                   | Expected Result  | Status          | Notes |
| --- | ------------ | ------------------------ | ---------------- | --------------- | ----- |
| 1   | Visit signin | Navigate to /auth/signin | Redirect to /app | ⬜ Pass ⬜ Fail |       |
| 2   | Visit signup | Navigate to /auth/signup | Redirect to /app | ⬜ Pass ⬜ Fail |       |

### 4.4 Logged-In Founder at Auth Pages

**Prerequisites:** Must be logged in as founder

| #   | Test         | Action                   | Expected Result    | Status          | Notes |
| --- | ------------ | ------------------------ | ------------------ | --------------- | ----- |
| 1   | Visit signin | Navigate to /auth/signin | Redirect to /admin | ⬜ Pass ⬜ Fail |       |
| 2   | Visit signup | Navigate to /auth/signup | Redirect to /admin | ⬜ Pass ⬜ Fail |       |

### 4.5 Unauthenticated at Protected Routes

**Prerequisites:** Must be logged out

| #   | Test             | Action                 | Expected Result          | Status          | Notes |
| --- | ---------------- | ---------------------- | ------------------------ | --------------- | ----- |
| 1   | Visit /app       | Navigate to /app       | Redirect to /auth/signin | ⬜ Pass ⬜ Fail |       |
| 2   | Visit /app/tasks | Navigate to /app/tasks | Redirect to /auth/signin | ⬜ Pass ⬜ Fail |       |
| 3   | Visit /admin     | Navigate to /admin     | Redirect to /auth/signin | ⬜ Pass ⬜ Fail |       |

### 4.6 Non-Founder at Admin Routes

**Prerequisites:** Must be logged in as regular user (not founder)

| #   | Test               | Action                   | Expected Result           | Status          | Notes |
| --- | ------------------ | ------------------------ | ------------------------- | --------------- | ----- |
| 1   | Visit /admin       | Navigate to /admin       | Redirect to /unauthorized | ⬜ Pass ⬜ Fail |       |
| 2   | Visit /admin/users | Navigate to /admin/users | Redirect to /unauthorized | ⬜ Pass ⬜ Fail |       |

---

## 📋 SECTION 5: APP NAVIGATION (Authenticated User)

**Prerequisites:** Must be logged in as regular user with active subscription

### 5.1 Main Dashboard Navigation

**Starting Point:** /app

| #   | Link      | Expected Destination | Status          | Notes               |
| --- | --------- | -------------------- | --------------- | ------------------- |
| 1   | Dashboard | /app                 | ⬜ Pass ⬜ Fail |                     |
| 2   | Tasks     | /app/tasks           | ⬜ Pass ⬜ Fail |                     |
| 3   | Evidence  | /app/evidence        | ⬜ Pass ⬜ Fail |                     |
| 4   | Vault     | /app/vault           | ⬜ Pass ⬜ Fail |                     |
| 5   | Policies  | /app/policies        | ⬜ Pass ⬜ Fail | Manager+ only       |
| 6   | Team      | /app/team            | ⬜ Pass ⬜ Fail | Manager+ only       |
| 7   | Workflows | /app/workflows       | ⬜ Pass ⬜ Fail | Manager+ only       |
| 8   | Audit     | /app/audit           | ⬜ Pass ⬜ Fail | Compliance Officer+ |
| 9   | Reports   | /app/reports         | ⬜ Pass ⬜ Fail | Manager+ only       |
| 10  | Billing   | /app/billing         | ⬜ Pass ⬜ Fail | Owner only          |
| 11  | Settings  | /app/settings        | ⬜ Pass ⬜ Fail |                     |
| 12  | Profile   | /app/profile         | ⬜ Pass ⬜ Fail |                     |

### 5.2 Staff User Restrictions

**Prerequisites:** Must be logged in as staff user

| #   | Test                 | Action                     | Expected Result        | Status          | Notes   |
| --- | -------------------- | -------------------------- | ---------------------- | --------------- | ------- |
| 1   | Login as staff       | Login                      | Redirect to /app/staff | ⬜ Pass ⬜ Fail |         |
| 2   | Try /app/policies    | Navigate to /app/policies  | Redirect to /app/staff | ⬜ Pass ⬜ Fail |         |
| 3   | Try /app/team        | Navigate to /app/team      | Redirect to /app/staff | ⬜ Pass ⬜ Fail |         |
| 4   | Try /app/workflows   | Navigate to /app/workflows | Redirect to /app/staff | ⬜ Pass ⬜ Fail |         |
| 5   | Try /app/billing     | Navigate to /app/billing   | Redirect to /app/staff | ⬜ Pass ⬜ Fail |         |
| 6   | Access /app/tasks    | Navigate to /app/tasks     | Page loads             | ⬜ Pass ⬜ Fail | Allowed |
| 7   | Access /app/evidence | Navigate to /app/evidence  | Page loads             | ⬜ Pass ⬜ Fail | Allowed |

---

## 📋 SECTION 6: ADMIN CONSOLE (Founder Only)

**Prerequisites:** Must be logged in as founder

### 6.1 Admin Navigation

**Starting Point:** /admin

| #   | Link          | Expected Destination | Status          | Notes |
| --- | ------------- | -------------------- | --------------- | ----- |
| 1   | Dashboard     | /admin               | ⬜ Pass ⬜ Fail |       |
| 2   | Users         | /admin/users         | ⬜ Pass ⬜ Fail |       |
| 3   | Organizations | /admin/orgs          | ⬜ Pass ⬜ Fail |       |
| 4   | Billing       | /admin/billing       | ⬜ Pass ⬜ Fail |       |
| 5   | Trials        | /admin/trials        | ⬜ Pass ⬜ Fail |       |
| 6   | Features      | /admin/features      | ⬜ Pass ⬜ Fail |       |
| 7   | Security      | /admin/security      | ⬜ Pass ⬜ Fail |       |
| 8   | System        | /admin/system        | ⬜ Pass ⬜ Fail |       |
| 9   | Audit         | /admin/audit         | ⬜ Pass ⬜ Fail |       |
| 10  | Support       | /admin/support       | ⬜ Pass ⬜ Fail |       |
| 11  | Revenue       | /admin/revenue       | ⬜ Pass ⬜ Fail |       |
| 12  | Health        | /admin/health        | ⬜ Pass ⬜ Fail |       |

---

## 📋 SECTION 7: ERROR PAGES

### 7.1 Error Page Tests

| #   | Test              | Action                    | Expected Result   | Status          | Notes |
| --- | ----------------- | ------------------------- | ----------------- | --------------- | ----- |
| 1   | 404 page          | Navigate to /nonexistent  | 404 page displays | ⬜ Pass ⬜ Fail |       |
| 2   | 404 home link     | Click "Go Home"           | Redirect to /     | ⬜ Pass ⬜ Fail |       |
| 3   | Unauthorized      | Navigate to /unauthorized | Unauthorized page | ⬜ Pass ⬜ Fail |       |
| 4   | Unauthorized home | Click "Go Home"           | Redirect to /     | ⬜ Pass ⬜ Fail |       |

---

## 📋 SECTION 8: CROSS-BROWSER TESTING

### 8.1 Browser Compatibility

Repeat critical tests in each browser:

| Browser | Version | Navigation Works | CTAs Work       | Auth Works      | Status |
| ------- | ------- | ---------------- | --------------- | --------------- | ------ |
| Chrome  | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail | ⬜ Pass ⬜ Fail |        |
| Firefox | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail | ⬜ Pass ⬜ Fail |        |
| Safari  | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail | ⬜ Pass ⬜ Fail |        |
| Edge    | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail | ⬜ Pass ⬜ Fail |        |

### 8.2 Mobile Browser Testing

| Device           | Browser | Navigation Works | CTAs Work       | Status |
| ---------------- | ------- | ---------------- | --------------- | ------ |
| iOS Safari       | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail |        |
| Chrome Mobile    | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail |        |
| Samsung Internet | **\_**  | ⬜ Pass ⬜ Fail  | ⬜ Pass ⬜ Fail |        |

---

## 📊 TEST SUMMARY

### Overall Results

- **Total Tests:** **\_**
- **Passed:** **\_**
- **Failed:** **\_**
- **Skipped:** **\_**
- **Pass Rate:** **\_**%

### Critical Issues Found

| #   | Issue | Severity                      | Page/Flow | Notes |
| --- | ----- | ----------------------------- | --------- | ----- |
| 1   |       | ⬜ Critical ⬜ Major ⬜ Minor |           |       |
| 2   |       | ⬜ Critical ⬜ Major ⬜ Minor |           |       |
| 3   |       | ⬜ Critical ⬜ Major ⬜ Minor |           |       |

### Recommendations

1.
2.
3.

---

## ✅ SIGN-OFF

**Tester Name:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Signature:** ******\_\_\_******

**Approval:** ⬜ Approved for Production ⬜ Requires Fixes

---

**Document Status:** Ready for Testing  
**Last Updated:** January 17, 2026
