/** @jest-environment node */

/**
 * Tests for app/api/admin/audit/run/route.ts
 *
 * This is a large audit route with ~30 check functions across 6 categories.
 * We test the POST handler with each scope and validate check structure.
 */

import { NextResponse } from 'next/server';

// ── fs mock ──────────────────────────────────────────────────────────────────
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockStatSync = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args: any[]) => mockExistsSync(...args),
  readFileSync: (...args: any[]) => mockReadFileSync(...args),
  readdirSync: (...args: any[]) => mockReaddirSync(...args),
  statSync: (...args: any[]) => mockStatSync(...args),
}));

// ── admin access mock ────────────────────────────────────────────────────────
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: jest.fn((err: any) => {
    return NextResponse.json(
      { error: err?.message ?? 'error' },
      { status: 500 },
    );
  }),
}));

// ── Supabase admin mock (for DB checks) ─────────────────────────────────────
function createBuilder(result = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
    'rpc',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder({ data: [{ id: '1' }], error: null })),
    rpc: jest.fn(() =>
      createBuilder({ data: [{ total: 10, rls_enabled: 9 }], error: null }),
    ),
  };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('server-only', () => ({}));

// ── import after mocks ──────────────────────────────────────────────────────
import { POST } from '@/app/api/admin/audit/run/route';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a mock Request with JSON body */
function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/admin/audit/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Setup fs mocks so that file existence/content checks work predictably.
 * We want most checks to pass to exercise all code paths.
 */
function setupFsMocks() {
  // Broadly: say everything exists
  mockExistsSync.mockReturnValue(true);
  mockStatSync.mockReturnValue({ isDirectory: () => true, isFile: () => true });

  // readFileSync: return content based on path patterns
  mockReadFileSync.mockImplementation((p: string) => {
    if (p.includes('next.config')) {
      return `
        contentSecurityPolicy: "script-src 'self'; style-src 'self';"
      `;
    }
    if (p.includes('proxy.ts')) return 'session auth supabase';
    if (p.includes('tsconfig.json'))
      return '{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true } }';
    if (p.includes('package.json'))
      return JSON.stringify({
        dependencies: { next: '16.0.0' },
        devDependencies: {},
      });
    if (p.includes('.env.example')) return '# SUPABASE_URL=xxx\n# Comment';
    if (p.includes('sentry.client.config.ts'))
      return "import '@/lib/sentry/scrub-pii';";
    if (p.includes('sentry.server.config.ts'))
      return "import '@/lib/sentry/scrub-pii';";
    if (p.includes('sentry.edge.config.ts'))
      return "import '@/lib/sentry/scrub-pii';";
    if (p.includes('route.ts')) {
      return `
        import { requireAdminAccess } from '@/app/app/admin/access';
        export async function POST(req: Request) { try { } catch(e) {} }
        const schema = z.object({ name: z.string() });
      `;
    }
    // For walk functions (tsx files with various patterns)
    if (p.endsWith('.tsx')) {
      return `
        import Image from 'next/image';
        aria-label="test" role="button"
        z.object({ name: z.string() })
        export function Component() {}
      `;
    }
    return '';
  });

  // readdirSync: return directory entries
  mockReaddirSync.mockImplementation((dir: string, opts?: any) => {
    if (dir.includes('migrations')) return ['001_init.sql', '002_update.sql'];
    if (dir.includes('workflows')) {
      return ['ci.yml', 'deploy.yml'];
    }
    if (opts?.withFileTypes) {
      return [
        { name: 'page.tsx', isFile: () => true, isDirectory: () => false },
        { name: 'error.tsx', isFile: () => true, isDirectory: () => false },
        { name: 'loading.tsx', isFile: () => true, isDirectory: () => false },
        { name: 'sub', isFile: () => false, isDirectory: () => true },
      ];
    }
    return ['page.tsx', 'error.tsx', 'loading.tsx', 'route.ts'];
  });
}

// ── env vars ─────────────────────────────────────────────────────────────────
const originalEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  setupFsMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.CRON_SECRET = 'cron';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/audit/run', () => {
  it('returns audit results for security scope', async () => {
    const res = await POST(makeRequest({ scope: 'security' }));
    const json = await res.json();

    expect(json.scope).toBe('security');
    expect(json.score).toBeGreaterThanOrEqual(0);
    expect(json.score).toBeLessThanOrEqual(100);
    expect(json.grade).toMatch(/^[A-F]$/);
    expect(Array.isArray(json.checks)).toBe(true);
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.summary).toBeDefined();
    expect(json.summary.total).toBe(json.checks.length);

    // Validate check structure
    for (const check of json.checks) {
      expect(check).toHaveProperty('id');
      expect(check).toHaveProperty('category', 'security');
      expect(check).toHaveProperty('name');
      expect(check).toHaveProperty('status');
      expect(check).toHaveProperty('severity');
      expect(check).toHaveProperty('message');
      expect(check).toHaveProperty('details');
      expect(['pass', 'warn', 'fail', 'info']).toContain(check.status);
    }
  });

  it('returns audit results for frontend scope', async () => {
    const res = await POST(makeRequest({ scope: 'frontend' }));
    const json = await res.json();

    expect(json.scope).toBe('frontend');
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.checks.every((c: any) => c.category === 'frontend')).toBe(true);
  });

  it('returns audit results for backend scope', async () => {
    const res = await POST(makeRequest({ scope: 'backend' }));
    const json = await res.json();

    expect(json.scope).toBe('backend');
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.checks.every((c: any) => c.category === 'backend')).toBe(true);
  });

  it('returns audit results for database scope', async () => {
    const res = await POST(makeRequest({ scope: 'database' }));
    const json = await res.json();

    expect(json.scope).toBe('database');
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.checks.every((c: any) => c.category === 'database')).toBe(true);
  });

  it('returns audit results for api scope', async () => {
    const res = await POST(makeRequest({ scope: 'api' }));
    const json = await res.json();

    expect(json.scope).toBe('api');
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.checks.every((c: any) => c.category === 'api')).toBe(true);
  });

  it('returns audit results for config scope', async () => {
    const res = await POST(makeRequest({ scope: 'config' }));
    const json = await res.json();

    expect(json.scope).toBe('config');
    expect(json.checks.length).toBeGreaterThan(0);
    expect(json.checks.every((c: any) => c.category === 'config')).toBe(true);
  });

  it('returns all categories for full scope', async () => {
    const res = await POST(makeRequest({ scope: 'full' }));
    const json = await res.json();

    expect(json.scope).toBe('full');
    expect(json.checks.length).toBeGreaterThan(10); // full should have many checks
    const categories = [...new Set(json.checks.map((c: any) => c.category))];
    expect(categories).toContain('security');
    expect(categories).toContain('frontend');
    expect(categories).toContain('backend');
    expect(categories).toContain('database');
    expect(categories).toContain('api');
    expect(categories).toContain('config');
  });

  it('defaults to full scope when no scope provided', async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(json.scope).toBe('full');
    expect(json.checks.length).toBeGreaterThan(10);
  });

  it('returns 400 for invalid scope', async () => {
    const res = await POST(makeRequest({ scope: 'invalid' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid scope');
  });

  it('returns 500 when admin access fails', async () => {
    const { requireAdminAccess } = require('@/app/app/admin/access');
    requireAdminAccess.mockRejectedValueOnce(new Error('Forbidden'));

    const res = await POST(makeRequest({ scope: 'security' }));
    expect(res.status).toBe(500);
  });

  it('calculates score and grade correctly', async () => {
    const res = await POST(makeRequest({ scope: 'security' }));
    const json = await res.json();

    // Score is a number 0-100
    expect(typeof json.score).toBe('number');
    expect(json.score).toBeGreaterThanOrEqual(0);
    expect(json.score).toBeLessThanOrEqual(100);

    // Grade maps from score
    if (json.score >= 90) expect(json.grade).toBe('A');
    else if (json.score >= 75) expect(json.grade).toBe('B');
    else if (json.score >= 60) expect(json.grade).toBe('C');
    else if (json.score >= 40) expect(json.grade).toBe('D');
    else expect(json.grade).toBe('F');
  });

  it('includes summary with byCategory breakdown', async () => {
    const res = await POST(makeRequest({ scope: 'full' }));
    const json = await res.json();

    expect(json.summary).toHaveProperty('total');
    expect(json.summary).toHaveProperty('pass');
    expect(json.summary).toHaveProperty('warn');
    expect(json.summary).toHaveProperty('fail');
    expect(json.summary).toHaveProperty('info');
    expect(json.summary).toHaveProperty('byCategory');
    expect(json.summary.total).toBe(
      json.summary.pass +
        json.summary.warn +
        json.summary.fail +
        json.summary.info,
    );
  });

  it('reports missing env vars correctly', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.CRON_SECRET;

    const res = await POST(makeRequest({ scope: 'security' }));
    const json = await res.json();

    const envCheck = json.checks.find((c: any) => c.id === 'sec-env');
    expect(envCheck).toBeDefined();
    expect(envCheck.status).toBe('fail');
    expect(envCheck.severity).toBe('critical');
  });

  it('checks for files that do not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const res = await POST(makeRequest({ scope: 'security' }));
    const json = await res.json();

    // With no files, multiple checks should be warn/fail
    const failOrWarn = json.checks.filter(
      (c: any) => c.status === 'fail' || c.status === 'warn',
    );
    expect(failOrWarn.length).toBeGreaterThan(0);
  });

  it('includes duration in response', async () => {
    const res = await POST(makeRequest({ scope: 'config' }));
    const json = await res.json();

    expect(typeof json.duration).toBe('number');
    expect(json.duration).toBeGreaterThanOrEqual(0);
  });

  it('includes timestamp in response', async () => {
    const res = await POST(makeRequest({ scope: 'config' }));
    const json = await res.json();

    expect(json.timestamp).toBeDefined();
    expect(new Date(json.timestamp).getTime()).not.toBeNaN();
  });
});
