/**
 * Branch coverage for lib/control-plane/server.ts
 * Covers: resolveControlPlaneEnvironment, normalizer functions, helper functions
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
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
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/control-plane/defaults', () => ({
  ADMIN_AUTOMATION_ACTIONS: [],
  DEFAULT_CONTROL_ENVIRONMENT: 'production',
  DEFAULT_RUNTIME_MARKETING: {},
  DEFAULT_RUNTIME_OPS: {},
  DEFAULT_RUNTIME_VERSION: '0',
}));
jest.mock('@/lib/control-plane/flags', () => ({
  evaluateFeatureDecision: jest.fn(() => ({ enabled: true, variant: null })),
}));

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  resolveControlPlaneEnvironment,
  readRuntimeVersion,
  touchRuntimeVersion,
} from '@/lib/control-plane/server';

beforeEach(() => jest.clearAllMocks());

describe('resolveControlPlaneEnvironment', () => {
  it('returns production for "production"', () => {
    expect(resolveControlPlaneEnvironment('production')).toBe('production');
  });

  it('returns preview for "preview"', () => {
    expect(resolveControlPlaneEnvironment('preview')).toBe('preview');
  });

  it('returns development for "development"', () => {
    expect(resolveControlPlaneEnvironment('development')).toBe('development');
  });

  it('returns default for null', () => {
    expect(resolveControlPlaneEnvironment(null)).toBe('production');
  });

  it('returns default for undefined', () => {
    expect(resolveControlPlaneEnvironment(undefined)).toBe('production');
  });

  it('returns default for unknown string', () => {
    expect(resolveControlPlaneEnvironment('staging')).toBe('production');
  });
});

describe('readRuntimeVersion', () => {
  it('returns version from settings', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { value: { value: '12345' } }, error: null }),
      ),
    });
    const version = await readRuntimeVersion('production');
    expect(version).toBe('12345');
  });

  it('returns default when no data', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const version = await readRuntimeVersion('production');
    expect(version).toBe('0');
  });

  it('returns default when value is not string', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { value: { value: 123 } }, error: null }),
      ),
    });
    const version = await readRuntimeVersion('production');
    expect(version).toBe('0');
  });

  it('returns default for empty string value', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { value: { value: ' ' } }, error: null }),
      ),
    });
    const version = await readRuntimeVersion('production');
    expect(version).toBe('0');
  });
});

describe('touchRuntimeVersion', () => {
  it('upserts version and returns next version', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const version = await touchRuntimeVersion('production', 'user-1');
    expect(version).toBeDefined();
    expect(Number(version)).toBeGreaterThan(0);
  });

  it('works without actorUserId', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const version = await touchRuntimeVersion('development');
    expect(version).toBeDefined();
  });
});
