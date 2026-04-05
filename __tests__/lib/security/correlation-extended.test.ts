/**
 * Tests for lib/security/correlation.ts
 */

import { createCorrelationId } from '@/lib/security/correlation';

describe('createCorrelationId', () => {
  it('returns a valid UUID v4 format', () => {
    const id = createCorrelationId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => createCorrelationId()),
    );
    expect(ids.size).toBe(50);
  });

  it('returns a string', () => {
    expect(typeof createCorrelationId()).toBe('string');
  });
});
