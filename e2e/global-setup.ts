import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import {
  getTestCredentials,
  createPasswordSession,
  createMagicLinkSession,
} from './helpers/test-auth';
import type { Session } from '@supabase/supabase-js';

const SESSION_CACHE_PATH = path.join(
  process.cwd(),
  'test-results',
  'e2e-session-cache.json',
);

/**
 * Playwright global setup — runs once before all tests.
 *
 * - Loads `.env.local` so specs see the same vars local dev does.
 * - Pre-warms a single Supabase session and writes it to disk so every
 *   worker process can reuse it without hitting Supabase auth individually.
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
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
      throw new Error(
        `[e2e/global-setup] Missing required env vars on CI: ${missing.join(', ')}`,
      );
    }
  }

  // Pre-warm a single session so individual spec files don't each hit
  // Supabase independently. Workers read the cached session from disk.
  // Cap the total pre-warm time so a slow Supabase doesn't stall the run.
  await Promise.race([
    prewarmSession(),
    new Promise<void>((resolve) => setTimeout(resolve, 30_000)),
  ]);

  if (process.env.E2E_DEBUG === '1') {
    console.log(`[e2e/global-setup] baseURL=${baseUrl}`);
  }
}

async function prewarmSession(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) return;

  // Skip if a fresh cached session already exists (< 45 min old)
  try {
    const existing = JSON.parse(fs.readFileSync(SESSION_CACHE_PATH, 'utf8'));
    const expiresAt = (existing?.expires_at ?? 0) * 1000;
    if (expiresAt > Date.now() + 45 * 60 * 1000) {
      console.log('[e2e/global-setup] Reusing existing pre-warmed session.');
      return;
    }
  } catch {
    // No cached session yet — create one below
  }

  // Dynamically import to avoid hard-wiring Supabase into global setup

  let creds: { email: string; password: string };
  try {
    creds = await getTestCredentials();
  } catch (err) {
    console.warn('[e2e/global-setup] Could not resolve test credentials:', err);
    return;
  }

  let session: Session | null = null;
  try {
    session = await createPasswordSession(creds.email, creds.password);
  } catch {
    try {
      session = await createMagicLinkSession(creds.email);
    } catch (err2) {
      console.warn(
        '[e2e/global-setup] Session pre-warm failed (tests will auth individually):',
        err2,
      );
      return;
    }
  }

  if (session) {
    fs.mkdirSync(path.dirname(SESSION_CACHE_PATH), { recursive: true });
    fs.writeFileSync(SESSION_CACHE_PATH, JSON.stringify(session, null, 2));
    console.log(
      `[e2e/global-setup] Session pre-warmed, expires at ${new Date((session.expires_at ?? 0) * 1000).toISOString()}`,
    );
  }
}
