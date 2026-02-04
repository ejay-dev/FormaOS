# Manual Browser Test Results (2026-01-17)

Site base: https://www.formaos.com.au
App base: https://app.formaos.com.au

## 1.1 Header Nav
- PASS: Header link /
- PASS: Header link /product
- PASS: Header link /industries
- PASS: Header link /security
- PASS: Header link /pricing
- PASS: Header link /about
- PASS: Header link /contact

## 1.2 Header CTA
- FAIL: Login -> /auth/signin (page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**https://app.formaos.com.au/auth/signin" until "load"
  navigated to "https://www.formaos.com.au/"
  navigated to "https://www.formaos.com.au/auth/signin"
============================================================)
- PASS: Plans -> /pricing
- FAIL: Start Free -> /auth/signup?plan=pro (page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**https://app.formaos.com.au/auth/signup?plan=pro" until "load"
  navigated to "https://www.formaos.com.au/"
  navigated to "https://www.formaos.com.au/auth/signup?plan=pro"
============================================================)

## 1.3 Mobile Nav
- PASS: Menu item Home
- PASS: Menu item Product
- PASS: Menu item Industries
- PASS: Menu item Security
- PASS: Menu item Pricing
- PASS: Menu item About
- PASS: Menu item Contact
- PASS: Navigate to /about

## 2.1 Homepage CTAs
- PASS: Start Free Trial CTA (count=1)
- PASS: Request Demo CTA (count=5)
- PASS: Explore Platform Architecture (count=2)
- PASS: Explore All Industries (count=2)
- PASS: Security Architecture (count=3)

## 2.2 Product
- PASS: /product contains /auth/signup (count=2)
- PASS: /product contains /auth/signup?plan=pro (count=1)

## 2.3 Industries
- PASS: /industries contains /auth/signup (count=3)
- PASS: /industries contains /auth/signup?plan=pro (count=1)

## 2.4 Security
- PASS: /security contains /auth/signup (count=3)
- PASS: /security contains /auth/signup?plan=pro (count=1)

## 2.5 Pricing
- PASS: /pricing contains /auth/signup (count=4)
- PASS: /pricing contains /contact (count=6)

## 2.6 About
- PASS: Page loads

## 2.7 Contact
- PASS: Form displays (count=1)

## 4.5 Unauth Protected
- PASS: Visit /app -> /auth/signin
- PASS: Visit /app/tasks -> /auth/signin
- PASS: Visit /admin -> /auth/signin

## 4.1 OAuth root
- FAIL: Redirect /?code= -> /auth/callback (URL=https://app.formaos.com.au/?code=test&state=test)

## 4.2 /auth redirect
- PASS: Visit /auth -> /auth/signin

## 3.1 Signup Email
- FAIL: Submit signup (No confirmation message)

## 3.3 Existing Login
- FAIL: Login redirect /app (page.waitForURL: net::ERR_NETWORK_CHANGED
=========================== logs ===========================
waiting for navigation to "**/app" until "load"
============================================================)

## 4.3 Logged-in auth
- FAIL: Visit /auth/signin -> /app (page.goto: Navigation to "https://app.formaos.com.au/auth/signin" is interrupted by another navigation to "chrome-error://chromewebdata/"
Call log:
  - navigating to "https://app.formaos.com.au/auth/signin", waiting until "domcontentloaded"
)

## 4.6 Non-founder admin
- FAIL: Visit /admin -> /unauthorized (page.goto: Navigation to "https://app.formaos.com.au/admin" is interrupted by another navigation to "https://app.formaos.com.au/auth/signin"
Call log:
  - navigating to "https://app.formaos.com.au/admin", waiting until "domcontentloaded"
)

## 5.2 Staff
- FAIL: Login redirects to /app/staff (URL=https://app.formaos.com.au/auth/signin)
- FAIL: Staff restrictions (page.goto: net::ERR_ABORTED at https://app.formaos.com.au/app/policies
Call log:
  - navigating to "https://app.formaos.com.au/app/policies", waiting until "domcontentloaded"
)

## 7.1 Errors
- PASS: 404 page
- PASS: /unauthorized page
