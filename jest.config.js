const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/gitnexus/',
    '<rootDir>/.gitnexus/',
    '<rootDir>/tests/cta.spec.ts',
    // ---------------------------------------------------------------
    // Test quarantine — all entries cleared 2026-05-26. The block of
    // historical un-quarantine notes below documents what was fixed
    // and stays as a reference for future quarantine work. Add a new
    // entry above this line ONLY when you cannot fix the underlying
    // breakage in the same PR; quarantining without justification
    // turns CI green at the cost of real coverage.
    // ---------------------------------------------------------------
    // __tests__/api/v1/webhooks-id.test.ts — UN-QUARANTINED 2026-05-26.
    // CSRF middleware (lib/security/csrf.ts) now blocks unsafe methods
    // without an Origin/Referer header; PATCH and DELETE tests were
    // constructing bare Requests so every assertion came back as 500.
    // Updated makeRequest() to attach a matching Origin header. 23/23
    // pass.
    //
    // tests/billing/webhook.test.ts — UN-QUARANTINED 2026-05-26.
    // Same drift as webhook-hardening: next/cache stub + Stripe-22
    // helper-compat additions to the @/lib/billing/stripe mock so
    // existing fixtures (top-level current_period_end / subscription)
    // still flow through. 23/23 pass.
    //
    // __tests__/lib/billing/webhook-hardening.test.ts — UN-QUARANTINED 2026-05-26.
    // Two drift issues fixed in the test file (source was already correct):
    //   * next/cache revalidatePath threw "Invariant: static generation
    //     store missing" — added jest.mock('next/cache') stub.
    //   * Stripe SDK 22 moved Subscription.current_period_end onto items
    //     and removed Invoice.subscription; the webhook route now calls
    //     helpers `subscriptionPeriodEnd` / `invoiceSubscriptionId`.
    //     Test mock extended to expose those helpers reading both the
    //     legacy top-level fixture shapes AND the new nested locations
    //     so existing fixtures continue to flow through. 21/21 pass.
    // __tests__/lib/care-scorecard/scorecard-service.test.ts — UN-QUARANTINED 2026-05-26.
    // Three drift issues fixed:
    //   * trendPercentage asserted on old fake values (5 and -3) but
    //     the source now hard-zeros it per audit v4-021 (no snapshot
    //     history yet).
    //   * Visit schema renamed: scheduled_at/completed_at/duration_minutes
    //     → scheduled_start/actual_start/actual_end. Test fixture
    //     rewritten to provide actual_start/actual_end timestamps that
    //     derive the expected average duration.
    //   * Workload distribution: source filters visits by `staff_id`,
    //     fixture used `assigned_to`. Renamed. 13/13 pass.
    //
    // __tests__/lib/workspace-recovery.test.ts — UN-QUARANTINED 2026-05-26.
    // recoverUserWorkspace started adding a diagnostic `?error=...&
    // reason=<table>` query string to the /auth/signin redirect; three
    // tests still asserted on bare `/auth/signin`. Loosened to
    // startsWith('/auth/signin') so query-shape changes don't break
    // the assertion. 47/47 pass.
    //
    // __tests__/lib/care/ndis-claiming.test.ts — UN-QUARANTINED 2026-05-26.
    // Two fixture issues: `participant_id` was renamed to `client_id`
    // on the visit row (source uses client_id), and the price-guide
    // mock returned data:null for every test (source now refuses
    // claims with no price_guide row). Updated 6 fixtures to provide
    // a valid price_national; 18/18 pass.
    //
    // __tests__/api/trust-packet/generate.test.ts — UN-QUARANTINED 2026-05-26.
    // Source moved from `policies`/`controls` table names to
    // `org_policies`/`org_control_evaluations`; the
    // security_overview.sso_available field was renamed to
    // sso_provisioned (truth-in-advertising: now reads actual SAML
    // config, not just plan tier). Test fixture keys + one assertion
    // updated; 14/14 pass.
    //
    // tests/billing/stripe-client.test.ts — UN-QUARANTINED 2026-05-26.
    // Was asserting against historical prod price IDs that the source
    // no longer ships as defaults. Test fixture updated to mirror the
    // dev placeholders; 12/12 pass.
    //
    // tests/marketing/background-media.test.ts — UN-QUARANTINED
    // 2026-05-26. The strict "every route image must be unique"
    // assertion was over-eager; /compare and /compare/healthmetrics
    // intentionally share the asset until the healthmetrics-specific
    // image is produced. Loosened to allow ≤1 duplicate; 5/5 pass.
    //
    // __tests__/lib/trial/use-feature-usage.test.ts — UN-QUARANTINED
    // 2026-05-26. The plan-limit drift that caused the original
    // failures has been resolved upstream; all 24/24 pass under the
    // current code without modification.
  ],
  modulePathIgnorePatterns: ['<rootDir>/gitnexus/', '<rootDir>/.gitnexus/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    // Components excluded from unit-test coverage — covered via Playwright E2E + BackstopJS visual tests
    '!components/**',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.stories.tsx',
    '!**/*.config.ts',
    '!**/types/**',
  ],
  // Coverage thresholds – ratcheted to current actuals (2026-03-19).
  // Ratcheted to 40% statements after comprehensive test expansion.
  coverageThreshold: {
    global: {
      branches: 34,
      functions: 43,
      lines: 40,
      statements: 40,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@exodus|isomorphic-dompurify|@react-pdf|yoga-layout|restructure)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
