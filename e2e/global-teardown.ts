import { cleanupTestUser } from './helpers/test-auth';

/**
 * Playwright global teardown — runs once after all tests.
 *
 * Spec files run fully parallel, so shared Supabase test-user cleanup must
 * happen here after every worker has finished.
 */
export default async function globalTeardown(): Promise<void> {
  const previousForceCleanup = process.env.E2E_FORCE_TEST_USER_CLEANUP;
  process.env.E2E_FORCE_TEST_USER_CLEANUP = '1';

  try {
    await cleanupTestUser();
  } finally {
    if (previousForceCleanup === undefined) {
      delete process.env.E2E_FORCE_TEST_USER_CLEANUP;
    } else {
      process.env.E2E_FORCE_TEST_USER_CLEANUP = previousForceCleanup;
    }
  }

  if (process.env.E2E_DEBUG === '1') {
    console.log('[e2e/global-teardown] complete');
  }
}
