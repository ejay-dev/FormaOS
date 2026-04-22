/**
 * Playwright global teardown — runs once after all tests.
 *
 * Kept minimal on purpose; spec files manage their own per-test cleanup
 * via `e2e/helpers/workspace-seed.ts`. This hook exists so future global
 * cleanup (shared Supabase test data, etc.) has an obvious home.
 */
export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_DEBUG === '1') {
    console.log('[e2e/global-teardown] complete');
  }
}
