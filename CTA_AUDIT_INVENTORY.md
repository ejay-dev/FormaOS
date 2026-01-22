# CTA Button Inventory & Audit

## 1. HOME PAGE CTAs

### Hero Section

- **Button**: "Start Free Trial"
  - **Component**: HomePageContent.tsx
  - **Current Handler**: `<AnimatedLink href="/auth/signup?plan=pro">`
  - **Expected Destination**: /auth/signup
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Request Demo"
  - **Component**: HomePageContent.tsx
  - **Current Handler**: `<AnimatedLink href="/contact">`
  - **Expected Destination**: /contact
  - **Status**: ⏳ NEEDS TESTING

### Final CTA Section

- **Button**: "Start Free Trial"
  - **Component**: HomePageContent.tsx (bottom section)
  - **Current Handler**: `<AnimatedLink href="/auth/signup?plan=pro">`
  - **Expected Destination**: /auth/signup
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Request Demo"
  - **Component**: HomePageContent.tsx (bottom section)
  - **Current Handler**: `<AnimatedLink href="/contact">`
  - **Expected Destination**: /contact
  - **Status**: ⏳ NEEDS TESTING

## 2. HEADER CTAs

- **Button**: "Login"
  - **Component**: HeaderCTA.tsx
  - **Current Handler**: `<Link href="/auth/signin">`
  - **Expected Destination**: /auth/signin
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Plans"
  - **Component**: HeaderCTA.tsx
  - **Current Handler**: `<Link href="/pricing">`
  - **Expected Destination**: /pricing
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Start Free"
  - **Component**: HeaderCTA.tsx
  - **Current Handler**: `<Link href="/auth/signup">`
  - **Expected Destination**: /auth/signup
  - **Status**: ⏳ NEEDS TESTING

## 3. MOBILE NAV CTAs

- **Button**: "Login"
  - **Component**: MobileNav.tsx
  - **Current Handler**: `<Link href="/auth/signin">`
  - **Expected Destination**: /auth/signin
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Start Free Trial"
  - **Component**: MobileNav.tsx
  - **Current Handler**: `<Link href="/auth/signup?plan=pro">`
  - **Expected Destination**: /auth/signup
  - **Status**: ⏳ NEEDS TESTING

## 4. FOOTER CTAs

- **Button**: "Start Free Trial"
  - **Component**: Footer.tsx
  - **Current Handler**: `<Link href="/auth/signup">`
  - **Expected Destination**: /auth/signup
  - **Status**: ⏳ NEEDS TESTING

- **Button**: "Request Demo"
  - **Component**: Footer.tsx
  - **Current Handler**: `<Link href="/contact">`
  - **Expected Destination**: /contact
  - **Status**: ⏳ NEEDS TESTING

## 5. PRICING PAGE CTAs

⏳ TO BE INVENTORIED

## 6. PRODUCT PAGE CTAs

⏳ TO BE INVENTORIED

## 7. INDUSTRIES PAGE CTAs

⏳ TO BE INVENTORIED

## 8. SECURITY PAGE CTAs

⏳ TO BE INVENTORIED

---

## Testing Plan

1. Test each CTA with browser automation
2. Verify destination page loads correctly
3. Check for crashes or errors
4. Verify auth-aware routing (logged in vs logged out)
5. Document any failures with root cause
