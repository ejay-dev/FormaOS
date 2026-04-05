/**
 * Tests for lib/security/session-security.ts
 * Covers pure functions only: generateSessionToken, generateDeviceFingerprint,
 *         extractClientIP, hashSessionToken
 */

// Mock Supabase admin (imported by module but not used by pure functions)
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/security/event-logger', () => ({
  dispatchSecurityEventEnhanced: jest.fn(),
}));

import {
  generateSessionToken,
  generateDeviceFingerprint,
  extractClientIP,
  hashSessionToken,
} from '@/lib/security/session-security';

describe('generateSessionToken', () => {
  it('returns a non-empty string', () => {
    const token = generateSessionToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateSessionToken()),
    );
    expect(tokens.size).toBe(50);
  });

  it('uses URL-safe base64 characters', () => {
    const token = generateSessionToken();
    // Should not contain + / or trailing =
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('generateDeviceFingerprint', () => {
  it('returns a 16-char hex string', () => {
    const fp = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
    expect(fp).toHaveLength(16);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it('produces same hash for same inputs', () => {
    const fp1 = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
    const fp2 = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
    expect(fp1).toBe(fp2);
  });

  it('produces different hash for different user agents', () => {
    const fp1 = generateDeviceFingerprint('Chrome/120', 'en-US', 'gzip');
    const fp2 = generateDeviceFingerprint('Firefox/121', 'en-US', 'gzip');
    expect(fp1).not.toBe(fp2);
  });

  it('handles missing optional parameters', () => {
    const fp = generateDeviceFingerprint('Mozilla/5.0');
    expect(fp).toHaveLength(16);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });
});

describe('extractClientIP', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(extractClientIP(headers)).toBe('1.2.3.4');
  });

  it('uses x-real-ip when x-forwarded-for absent', () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.1' });
    expect(extractClientIP(headers)).toBe('10.0.0.1');
  });

  it('uses cf-connecting-ip as fallback', () => {
    const headers = new Headers({ 'cf-connecting-ip': '192.168.1.1' });
    expect(extractClientIP(headers)).toBe('192.168.1.1');
  });

  it('returns 0.0.0.0 when no IP headers present', () => {
    const headers = new Headers();
    expect(extractClientIP(headers)).toBe('0.0.0.0');
  });

  it('trims whitespace from IP', () => {
    const headers = new Headers({ 'x-forwarded-for': '  1.2.3.4 , 5.6.7.8' });
    expect(extractClientIP(headers)).toBe('1.2.3.4');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
    });
    expect(extractClientIP(headers)).toBe('1.1.1.1');
  });
});

describe('hashSessionToken', () => {
  it('throws when crypto.subtle is unavailable (jsdom)', async () => {
    // jsdom does not provide crypto.subtle, so hashSessionToken must throw
    await expect(hashSessionToken('test-token')).rejects.toThrow(
      'crypto.subtle is not available',
    );
  });
});
