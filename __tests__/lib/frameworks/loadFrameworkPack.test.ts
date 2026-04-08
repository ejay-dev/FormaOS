/**
 * Tests for lib/frameworks/loadFrameworkPack.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  stat: jest.fn(),
  readFile: jest.fn(),
}));
jest.mock('yaml', () => ({
  parse: jest.fn((s: string) => JSON.parse(s)),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const fs = require('fs/promises');

import { loadFrameworkPack } from '@/lib/frameworks/loadFrameworkPack';

const validPack = {
  framework: {
    name: 'Test Framework',
    slug: 'test-fw',
    version: '1.0',
    description: 'Test',
    is_active: true,
  },
  domains: [{ name: 'Domain A', description: 'D1', sort_order: 0 }],
  controls: [
    { code: 'C1', title: 'Control 1', domain: 'domain_a', description: 'Desc' },
  ],
  mappings: [],
};

beforeEach(() => jest.clearAllMocks());

describe('loadFrameworkPack', () => {
  it('loads from inline object', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          }); // framework upsert
        if (callCount === 2)
          return createBuilder({
            data: { id: 'd1', name: 'Domain A' },
            error: null,
          }); // domain upsert
        return createBuilder({ data: { id: 'c1' }, error: null }); // control upsert
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await loadFrameworkPack(validPack);
    expect(result.ok).toBe(true);
    expect(result.frameworkSlug).toBe('test-fw');
  });

  it('returns error for invalid pack', async () => {
    const result = await loadFrameworkPack('not valid json at all {{{');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for missing framework key', async () => {
    const result = await loadFrameworkPack(JSON.stringify({ domains: [] }));
    expect(result.ok).toBe(false);
  });

  it('returns error for missing name/slug', async () => {
    const result = await loadFrameworkPack(
      JSON.stringify({ framework: { name: '' } }),
    );
    expect(result.ok).toBe(false);
  });

  it('handles dryRun mode', async () => {
    const result = await loadFrameworkPack(validPack, { dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.frameworkId).toBe('dry-run');
  });

  it('loads from file path string', async () => {
    fs.stat.mockResolvedValue({ isFile: () => true });
    fs.readFile.mockResolvedValue(JSON.stringify(validPack));

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({
            data: { id: 'd1', name: 'Domain A' },
            error: null,
          });
        return createBuilder({ data: { id: 'c1' }, error: null });
      }),
    });

    const result = await loadFrameworkPack('/path/to/pack.json');
    expect(result.ok).toBe(true);
  });

  it('parses string content as JSON when starts with {', async () => {
    fs.stat.mockRejectedValue(new Error('not a file'));

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({
            data: { id: 'd1', name: 'Domain A' },
            error: null,
          });
        return createBuilder({ data: { id: 'c1' }, error: null });
      }),
    });

    const result = await loadFrameworkPack(JSON.stringify(validPack));
    expect(result.ok).toBe(true);
  });

  it('loads from path object', async () => {
    fs.readFile.mockResolvedValue(JSON.stringify(validPack));

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({
            data: { id: 'd1', name: 'Domain A' },
            error: null,
          });
        return createBuilder({ data: { id: 'c1' }, error: null });
      }),
    });

    const result = await loadFrameworkPack({ path: '/path/to/pack.yaml' });
    expect(result.ok).toBe(true);
  });

  it('returns error when framework upsert fails', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'upsert fail' } }),
      ),
    });

    const result = await loadFrameworkPack(validPack);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Failed to upsert framework');
  });

  it('warns when domain upsert fails', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          });
        return createBuilder({ data: null, error: { message: 'domain fail' } });
      }),
    });

    const result = await loadFrameworkPack(validPack);
    expect(result.ok).toBe(true);
    expect(result.warnings!.length).toBeGreaterThan(0);
  });

  it('skips domains with no name', async () => {
    const pack = {
      ...validPack,
      domains: [{ name: '', description: 'Empty' }],
    };

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { id: 'fw1', slug: 'test-fw' },
            error: null,
          });
        return createBuilder({ data: { id: 'c1' }, error: null });
      }),
    });

    const result = await loadFrameworkPack(pack);
    expect(result.ok).toBe(true);
    expect(
      result.warnings!.some((w: string) => w.includes('missing name')),
    ).toBe(true);
  });

  it('handles pack with no domains or controls', async () => {
    const minimalPack = {
      framework: { name: 'Minimal', slug: 'minimal', version: '1.0' },
    };
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { id: 'fw1', slug: 'minimal' }, error: null }),
      ),
    });

    const result = await loadFrameworkPack(minimalPack);
    expect(result.ok).toBe(true);
    expect(result.domainsUpserted).toBe(0);
    expect(result.controlsUpserted).toBe(0);
  });

  it('uses custom logger', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });

    await loadFrameworkPack(validPack, { logger });
    expect(logger.error).toHaveBeenCalled();
  });
});
