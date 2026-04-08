jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        count: null,
      })),
    })),
  })),
}));
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
}));

import {
  getActorId,
  getStringParam,
  getBooleanParam,
  getArrayParam,
  sanitizeLikeQuery,
  buildIlikePattern,
  createInvitationToken,
} from '@/lib/api/v1-helpers';

describe('getActorId', () => {
  it('returns userId when present', () => {
    expect(getActorId({ userId: 'u1', apiKeyId: 'k1' } as any)).toBe('u1');
  });

  it('returns apiKeyId when no userId', () => {
    expect(getActorId({ apiKeyId: 'k1' } as any)).toBe('k1');
  });

  it('returns system when neither provided', () => {
    expect(getActorId({} as any)).toBe('system');
  });
});

describe('getStringParam', () => {
  it('returns trimmed string value', () => {
    const params = new URLSearchParams('name= hello ');
    expect(getStringParam(params, 'name')).toBe('hello');
  });

  it('returns null for missing keys', () => {
    const params = new URLSearchParams();
    expect(getStringParam(params, 'name')).toBeNull();
  });

  it('returns null for empty strings', () => {
    const params = new URLSearchParams('name=  ');
    expect(getStringParam(params, 'name')).toBeNull();
  });
});

describe('getBooleanParam', () => {
  it('returns true for "true"', () => {
    const params = new URLSearchParams('active=true');
    expect(getBooleanParam(params, 'active')).toBe(true);
  });

  it('returns true for "1"', () => {
    const params = new URLSearchParams('active=1');
    expect(getBooleanParam(params, 'active')).toBe(true);
  });

  it('returns false for "false"', () => {
    const params = new URLSearchParams('active=false');
    expect(getBooleanParam(params, 'active')).toBe(false);
  });

  it('returns false for "0"', () => {
    const params = new URLSearchParams('active=0');
    expect(getBooleanParam(params, 'active')).toBe(false);
  });

  it('returns null for missing key', () => {
    expect(getBooleanParam(new URLSearchParams(), 'x')).toBeNull();
  });

  it('returns null for unrecognized value', () => {
    const params = new URLSearchParams('active=maybe');
    expect(getBooleanParam(params, 'active')).toBeNull();
  });
});

describe('getArrayParam', () => {
  it('splits comma-separated values', () => {
    const params = new URLSearchParams('tags=a,b,c');
    expect(getArrayParam(params, 'tags')).toEqual(['a', 'b', 'c']);
  });

  it('trims and filters empty items', () => {
    const params = new URLSearchParams('tags= a , , b ');
    expect(getArrayParam(params, 'tags')).toEqual(['a', 'b']);
  });

  it('returns empty array for missing key', () => {
    expect(getArrayParam(new URLSearchParams(), 'tags')).toEqual([]);
  });
});

describe('sanitizeLikeQuery', () => {
  it('strips % and _ characters', () => {
    expect(sanitizeLikeQuery('%test_query%')).toBe('testquery');
  });

  it('trims whitespace', () => {
    expect(sanitizeLikeQuery('  hello  ')).toBe('hello');
  });
});

describe('buildIlikePattern', () => {
  it('wraps sanitized value in %', () => {
    expect(buildIlikePattern('test')).toBe('%test%');
  });

  it('strips dangerous chars from pattern', () => {
    expect(buildIlikePattern('%drop_table%')).toBe('%droptable%');
  });
});

describe('createInvitationToken', () => {
  it('returns a hex string', () => {
    const token = createInvitationToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
