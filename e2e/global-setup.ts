import { config } from 'dotenv';

/**
 * Playwright global setup — runs once before all tests.
 *
 * Keep this minimal: load `.env.local` so specs see the same vars local
 * dev does, and surface missing/placeholder secrets up-front so the run
 * fails fast with a clear message instead of dozens of flaky auth errors.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: '.env.local' });

  const baseUrl =
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.PLAYWRIGHT_APP_BASE ||
    'http://localhost:3000';
  process.env.PLAYWRIGHT_BASE_URL = baseUrl;

  // Supabase env vars are only required by auth-gated specs. Marketing
  // Playwright jobs on CI run without them, so don't block the suite here
  // — individual specs that need Supabase should guard themselves.
  if (process.env.CI && process.env.E2E_REQUIRE_SUPABASE === '1') {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
      throw new Error(
        `[e2e/global-setup] Missing required env vars on CI: ${missing.join(', ')}`,
      );
    }
  }

  if (process.env.E2E_DEBUG === '1') {
    console.log(`[e2e/global-setup] baseURL=${baseUrl}`);
  }
}
