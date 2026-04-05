/**
 * Tests for lib/deep-links/link-generator.ts
 */

import {
  generateDeepLink,
  parseDeepLink,
  getMobileRoute,
} from '@/lib/deep-links/link-generator';

describe('generateDeepLink', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('generates link with default base URL', () => {
    const link = generateDeepLink('task', 'abc-123');
    expect(link).toBe('https://app.formaos.com.au/app/tasks/abc-123');
  });

  it('uses NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom.example.com';
    const link = generateDeepLink('task', 'abc-123');
    expect(link).toBe('https://custom.example.com/app/tasks/abc-123');
  });

  it('maps known entity types', () => {
    expect(generateDeepLink('evidence', 'e1')).toContain('/app/evidence/e1');
    expect(generateDeepLink('incident', 'i1')).toContain('/app/incidents/i1');
    expect(generateDeepLink('form', 'f1')).toContain('/app/forms/f1');
    expect(generateDeepLink('care_plan', 'c1')).toContain('/app/care-plans/c1');
  });

  it('falls back to generic path for unknown entity type', () => {
    const link = generateDeepLink('widget', 'w1');
    expect(link).toContain('/app/widget/w1');
  });
});

describe('parseDeepLink', () => {
  it('parses valid deep link', () => {
    const result = parseDeepLink(
      'https://app.formaos.com.au/app/tasks/abc-123',
    );
    expect(result).toEqual({ entityType: 'tasks', entityId: 'abc-123' });
  });

  it('returns null for non-app path', () => {
    expect(parseDeepLink('https://example.com/other/path')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseDeepLink('not a url')).toBeNull();
  });

  it('returns null for too-short path', () => {
    expect(parseDeepLink('https://example.com/app')).toBeNull();
  });
});

describe('getMobileRoute', () => {
  it('returns formaos:// deep link', () => {
    expect(getMobileRoute('task', 'abc-123')).toBe(
      'formaos://app/task/abc-123',
    );
  });
});
