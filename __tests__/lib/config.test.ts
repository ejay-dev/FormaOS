/** @jest-environment node */

/**
 * Unit tests for lib/config.ts
 *
 * Tests the APP configuration constant.
 */

import { APP } from '@/lib/config';

describe('APP config', () => {
  it('is defined', () => {
    expect(APP).toBeDefined();
  });

  it('has a name property', () => {
    expect(typeof APP.name).toBe('string');
    expect(APP.name.length).toBeGreaterThan(0);
  });

  it('has a tagline property', () => {
    expect(typeof APP.tagline).toBe('string');
    expect(APP.tagline.length).toBeGreaterThan(0);
  });

  it('has a currency property', () => {
    expect(typeof APP.currency).toBe('string');
    // Should be a valid currency code (3 letters)
    expect(APP.currency).toMatch(/^[A-Z]{3}$/);
  });

  it('has pricing configuration', () => {
    expect(APP.pricing).toBeDefined();
  });
});
