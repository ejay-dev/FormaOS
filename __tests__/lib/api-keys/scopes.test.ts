/**
 * Tests for lib/api-keys/scopes.ts
 */

import {
  API_KEY_SCOPES,
  READ_ONLY_API_KEY_SCOPES,
  isApiKeyScope,
  normalizeApiKeyScopes,
  hasRequiredScopes,
} from '@/lib/api-keys/scopes';

describe('API_KEY_SCOPES', () => {
  it('contains expected scopes', () => {
    expect(API_KEY_SCOPES).toContain('tasks:read');
    expect(API_KEY_SCOPES).toContain('compliance:read');
    expect(API_KEY_SCOPES).toContain('webhooks:manage');
  });
});

describe('READ_ONLY_API_KEY_SCOPES', () => {
  it('only contains :read scopes', () => {
    for (const scope of READ_ONLY_API_KEY_SCOPES) {
      expect(scope).toMatch(/:read$/);
    }
  });

  it('does not contain :write or :manage scopes', () => {
    for (const scope of READ_ONLY_API_KEY_SCOPES) {
      expect(scope).not.toMatch(/:write$/);
      expect(scope).not.toMatch(/:manage$/);
    }
  });
});

describe('isApiKeyScope', () => {
  it('returns true for valid scope', () => {
    expect(isApiKeyScope('tasks:read')).toBe(true);
  });

  it('returns false for invalid scope', () => {
    expect(isApiKeyScope('banana:eat')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isApiKeyScope('')).toBe(false);
  });
});

describe('normalizeApiKeyScopes', () => {
  it('removes duplicates', () => {
    const result = normalizeApiKeyScopes([
      'tasks:read',
      'tasks:read',
      'tasks:write',
    ]);
    expect(result).toEqual(['tasks:read', 'tasks:write']);
  });

  it('filters out invalid scopes', () => {
    const result = normalizeApiKeyScopes(['tasks:read', 'invalid:scope']);
    expect(result).toEqual(['tasks:read']);
  });

  it('sorts results', () => {
    const result = normalizeApiKeyScopes([
      'tasks:write',
      'compliance:read',
      'audit:read',
    ]);
    expect(result).toEqual(['audit:read', 'compliance:read', 'tasks:write']);
  });

  it('handles empty iterable', () => {
    expect(normalizeApiKeyScopes([])).toEqual([]);
  });
});

describe('hasRequiredScopes', () => {
  it('returns true when all required scopes are granted', () => {
    expect(
      hasRequiredScopes(['tasks:read', 'tasks:write'], ['tasks:read']),
    ).toBe(true);
  });

  it('returns false when a required scope is missing', () => {
    expect(
      hasRequiredScopes(['tasks:read'], ['tasks:read', 'tasks:write']),
    ).toBe(false);
  });

  it('returns true for empty required scopes', () => {
    expect(hasRequiredScopes(['tasks:read'], [])).toBe(true);
  });

  // v4-014: scope implications keep existing keys working while the
  // new narrower scopes (forms:*, tasks:delete, api_keys:manage) ship.
  it('compliance:write implies forms:write', () => {
    expect(hasRequiredScopes(['compliance:write'], ['forms:write'])).toBe(true);
  });

  it('compliance:write implies tasks:delete', () => {
    expect(hasRequiredScopes(['compliance:write'], ['tasks:delete'])).toBe(
      true,
    );
  });

  it('compliance:read does NOT imply forms:write', () => {
    expect(hasRequiredScopes(['compliance:read'], ['forms:write'])).toBe(false);
  });

  it('webhooks:manage does NOT imply api_keys:manage', () => {
    // The whole point of the v4-014 split — api_keys:manage is a
    // distinct security boundary from webhook endpoint management.
    expect(hasRequiredScopes(['webhooks:manage'], ['api_keys:manage'])).toBe(
      false,
    );
  });

  it('tasks:write implies tasks:read but not tasks:delete', () => {
    expect(hasRequiredScopes(['tasks:write'], ['tasks:read'])).toBe(true);
    expect(hasRequiredScopes(['tasks:write'], ['tasks:delete'])).toBe(false);
  });

  it('forms:write implies forms:read', () => {
    expect(hasRequiredScopes(['forms:write'], ['forms:read'])).toBe(true);
  });
});

describe('audit-v4-014: catalog additions', () => {
  it('exposes api_keys:manage', () => {
    expect(isApiKeyScope('api_keys:manage')).toBe(true);
  });

  it('exposes forms:read and forms:write', () => {
    expect(isApiKeyScope('forms:read')).toBe(true);
    expect(isApiKeyScope('forms:write')).toBe(true);
  });

  it('exposes tasks:delete', () => {
    expect(isApiKeyScope('tasks:delete')).toBe(true);
  });

  it('exposes compliance:write', () => {
    expect(isApiKeyScope('compliance:write')).toBe(true);
  });

  it('exposes ai:read', () => {
    expect(isApiKeyScope('ai:read')).toBe(true);
  });
});
