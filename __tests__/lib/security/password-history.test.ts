/**
 * Tests for lib/security/password-history.ts
 * hashPasswordForHistory is pure; isPasswordReused/recordPasswordHistory use Supabase.
 */

function chain(data: any = null, extra: Record<string, any> = {}) {
  const result = { data, error: null, ...extra };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop in result) return (result as any)[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

import {
  hashPasswordForHistory,
  isPasswordReused,
  recordPasswordHistory,
} from '@/lib/security/password-history';

beforeEach(() => {
  mockFrom.mockReset();
});

describe('hashPasswordForHistory', () => {
  it('returns a 64-char hex SHA-256 hash', () => {
    const hash = hashPasswordForHistory('MyP@ssword1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    const h1 = hashPasswordForHistory('same');
    const h2 = hashPasswordForHistory('same');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different passwords', () => {
    const h1 = hashPasswordForHistory('pass-a');
    const h2 = hashPasswordForHistory('pass-b');
    expect(h1).not.toBe(h2);
  });
});

describe('isPasswordReused', () => {
  it('returns true when password hash matched in history', async () => {
    const targetHash = hashPasswordForHistory('reused-password');
    mockFrom.mockReturnValue(chain([{ password_hash: targetHash }]));
    const result = await isPasswordReused('user-1', 'reused-password');
    expect(result).toBe(true);
  });

  it('returns false when no match in history', async () => {
    mockFrom.mockReturnValue(chain([{ password_hash: 'different-hash' }]));
    const result = await isPasswordReused('user-1', 'new-password');
    expect(result).toBe(false);
  });

  it('returns false on DB error', async () => {
    mockFrom.mockReturnValue(chain(null, { error: { message: 'fail' } }));
    const result = await isPasswordReused('user-1', 'any-password');
    expect(result).toBe(false);
  });

  it('returns false when history is empty', async () => {
    mockFrom.mockReturnValue(chain([]));
    const result = await isPasswordReused('user-1', 'any-password');
    expect(result).toBe(false);
  });
});

describe('recordPasswordHistory', () => {
  it('inserts a record (does not throw)', async () => {
    mockFrom.mockReturnValue(chain(null));
    await expect(
      recordPasswordHistory('user-1', 'new-password'),
    ).resolves.not.toThrow();
    expect(mockFrom).toHaveBeenCalledWith('password_history');
  });

  it('logs error on failure but does not throw', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFrom.mockReturnValue(
      chain(null, { error: { message: 'insert failed' } }),
    );
    await expect(
      recordPasswordHistory('user-1', 'new-password'),
    ).resolves.not.toThrow();
    consoleSpy.mockRestore();
  });
});
