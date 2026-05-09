/**
 * check-env.js Vercel preview tolerance
 *
 * The previous behavior hard-failed every Vercel preview build that didn't
 * have every "required" env var scoped to the Preview environment. That
 * caused all four blocker PR previews to fail at prebuild time even though
 * the production build was healthy.
 *
 * The contract:
 *   - Vercel preview + missing required env  → warn, exit 0
 *   - Vercel preview + exposed public secret → hard-fail, exit 1
 *   - Vercel production + missing env        → hard-fail, exit 1
 *   - Local + missing env (no .env.local)    → hard-fail, exit 1
 */

import { spawnSync } from 'child_process';
import path from 'path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-env.js');

function runCheckEnv(env: Record<string, string>) {
  // Start from a clean slate so the host shell's vars don't leak in. The
  // script reads .env.local, which is fine — we just need to control the
  // Vercel/CI-marker variables explicitly.
  const result = spawnSync('node', [SCRIPT], {
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      ...env,
    },
    encoding: 'utf8',
  });
  return {
    code: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('scripts/check-env.js — Vercel preview tolerance', () => {
  it('warns but does not fail on Vercel preview when a required key is empty', () => {
    const { code, stderr } = runCheckEnv({
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      CHECK_ENV_STRICT: '1',
      // Force a missing required key — empty string is treated as missing.
      SUPABASE_SERVICE_ROLE_KEY: '',
    });
    expect(code).toBe(0);
    expect(stderr).toMatch(/Vercel Preview build is missing/);
    expect(stderr).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(stderr).toMatch(/Preview.*environment checkbox/);
  });

  it('hard-fails on Vercel production when a required key is missing', () => {
    const { code, stderr } = runCheckEnv({
      VERCEL: '1',
      VERCEL_ENV: 'production',
      CHECK_ENV_STRICT: '1',
      SUPABASE_SERVICE_ROLE_KEY: '',
    });
    expect(code).toBe(1);
    expect(stderr).toMatch(/Missing required environment variables/);
    expect(stderr).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('hard-fails on Vercel preview when a forbidden public secret is exposed', () => {
    const { code, stderr } = runCheckEnv({
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      CHECK_ENV_STRICT: '1',
      // This must NEVER pass — exposing service-role as NEXT_PUBLIC is a
      // critical leak, regardless of which Vercel env we're in.
      NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'leaked',
    });
    expect(code).toBe(1);
    expect(stderr).toMatch(/Forbidden public secrets detected/);
    expect(stderr).toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });
});
