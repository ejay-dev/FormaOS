---
name: formaos-testing
description: Run and write tests for FormaOS — unit tests (Jest), E2E tests (Playwright), accessibility tests (Axe/Pa11y), performance tests (Lighthouse), compliance tests, and security tests. Use when writing new tests, debugging test failures, understanding test infrastructure, or running the QA pipeline.
---

# FormaOS Testing & QA Engineering

## Architecture Overview

- **Unit/Integration:** Jest 30 with jsdom (440 tests, 45 suites)
- **E2E:** Playwright (50+ specs, 5 browser targets)
- **Accessibility:** Axe Core + Pa11y
- **Performance:** Lighthouse CI
- **Compliance:** GDPR + SOC 2 checks
- **Security:** Security baseline verification
- **CI:** GitHub Actions (10+ workflows)

## Key Files & Directories

| Area | Path |
|------|------|
| Unit/integration tests | `__tests__/` (50+ suites) |
| E2E tests | `e2e/` (50+ specs) |
| Jest config | `jest.config.js` |
| Playwright config | `playwright.config.ts` |
| QA pipeline CI | `.github/workflows/qa-pipeline.yml` |
| Security scan CI | `.github/workflows/security-scan.yml` |
| Compliance CI | `.github/workflows/compliance-testing.yml` |
| Accessibility CI | `.github/workflows/accessibility-testing.yml` |
| Performance CI | `.github/workflows/performance-check.yml` |
| Visual regression CI | `.github/workflows/visual-regression.yml` |

## Test Commands

```bash
# Unit & Integration
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# E2E
npm run test:e2e          # Full Playwright suite

# Quick Validation
npm run qa:smoke          # Smoke tests only
npm run qa:full           # Full QA pipeline (all tests)
npm run qa:a11y           # Accessibility tests

# Specialized
npm run test:lighthouse   # Performance metrics
npm run test:a11y         # Accessibility (Axe + Pa11y)
npm run test:compliance:all  # GDPR + SOC 2 compliance checks
npm run test:security     # Security baseline

# Pre-deploy
npm run type-check        # TypeScript (must be zero errors)
npm run lint              # ESLint
npm run build             # Next.js build
```

## Workflow

### Writing Unit Tests
1. Create test file in `__tests__/` mirroring source path (e.g., `__tests__/lib/billing.test.ts`)
2. Use Jest + jsdom environment
3. Mock Supabase client, Stripe, external services
4. Test business logic, not framework behavior
5. Follow existing test patterns in `__tests__/`
6. Run: `npm run test -- --testPathPattern=your-test`

### Writing E2E Tests
1. Create spec file in `e2e/` (e.g., `e2e/my-feature.spec.ts`)
2. Playwright runs against 5 targets: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
3. Use existing page helpers and selectors
4. Set timeouts: 120s per test, 10s per expect
5. Screenshots + video captured on failure
6. CI retries: 2 attempts
7. Run: `npx playwright test e2e/my-feature.spec.ts`

### Debugging Test Failures
1. Check test output for assertion details
2. For E2E: check screenshots/videos in `test-results/`
3. For flaky tests: check for timing issues, add `waitFor` conditions
4. For CI failures: check GitHub Actions logs
5. Verify environment variables are set for test env

## Playwright Browser Targets

| Project | Device |
|---------|--------|
| chromium | Desktop Chrome |
| firefox | Desktop Firefox |
| webkit | Desktop Safari |
| mobile-chrome | Pixel 5 |
| mobile-safari | iPhone 12 |

## Coverage Thresholds (Current Baseline)

- Lines: 4%+
- Functions: 5%+
- Note: These are baseline thresholds — aim higher for critical paths (auth, billing, compliance)

## Rules

- **Zero TypeScript errors** — `npm run type-check` must pass clean
- **E2E tests must work across all 5 browser targets**
- **Never skip tests in CI** — fix the test, don't skip it
- **Mock external services** (Stripe, Supabase, Resend) in unit tests
- **E2E tests should test user journeys**, not implementation details
- **Smoke tests (`qa:smoke`)** are the minimum bar before deploy
- **Full QA (`qa:full`)** should pass before major releases
- **Accessibility tests** must pass — FormaOS serves healthcare/care sectors
- **Compliance tests** must pass for SOC 2 and GDPR certification
