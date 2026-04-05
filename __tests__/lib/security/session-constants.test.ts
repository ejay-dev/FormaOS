/**
 * Tests for lib/security/session-constants.ts
 */

import {
  TRACKED_SESSION_COOKIE,
  TRACKED_SESSION_MAX_AGE,
} from '@/lib/security/session-constants';

describe('session-constants', () => {
  it('exports correct cookie name', () => {
    expect(TRACKED_SESSION_COOKIE).toBe('fo_session');
  });

  it('exports max age of 7 days in seconds', () => {
    expect(TRACKED_SESSION_MAX_AGE).toBe(60 * 60 * 24 * 7);
    expect(TRACKED_SESSION_MAX_AGE).toBe(604800);
  });

  it('max age is a positive number', () => {
    expect(TRACKED_SESSION_MAX_AGE).toBeGreaterThan(0);
  });
});
