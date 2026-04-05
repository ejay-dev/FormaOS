/**
 * Tests for lib/security/session-security.ts — pure functions
 */

// Polyfill crypto.subtle for jsdom (not available by default)
import { webcrypto } from 'crypto';
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

import {
  generateSessionToken,
  hashSessionToken,
  generateDeviceFingerprint,
  extractClientIP,
} from '@/lib/security/session-security';

describe('generateSessionToken', () => {
  it('returns a string', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
  });

  it('returns a non-empty token', () => {
    expect(generateSessionToken().length).toBeGreaterThan(10);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => generateSessionToken()),
    );
    expect(tokens.size).toBe(100);
  });

  it('uses base64url encoding (no +, /, = chars)', () => {
    const token = generateSessionToken();
    expect(token).not.toMatch(/[+/=]/);
  });
});

describe('hashSessionToken', () => {
  it('returns a hex string', async () => {
    const hash = await hashSessionToken('test-token');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('returns a 64-char SHA-256 hash', async () => {
    const hash = await hashSessionToken('my-token');
    expect(hash.length).toBe(64);
  });

  it('returns same hash for same input', async () => {
    const a = await hashSessionToken('same-token');
    const b = await hashSessionToken('same-token');
    expect(a).toBe(b);
  });

  it('returns different hash for different input', async () => {
    const a = await hashSessionToken('token-a');
    const b = await hashSessionToken('token-b');
    expect(a).not.toBe(b);
  });
});

describe('generateDeviceFingerprint', () => {
  it('returns a string', () => {
    const fp = generateDeviceFingerprint('Mozilla/5.0');
    expect(typeof fp).toBe('string');
  });

  it('returns a 16-char hex fingerprint', () => {
    const fp = generateDeviceFingerprint('Mozilla/5.0');
    expect(fp.length).toBe(16);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it('same inputs produce same fingerprint', () => {
    const a = generateDeviceFingerprint('UA', 'en-US', 'gzip');
    const b = generateDeviceFingerprint('UA', 'en-US', 'gzip');
    expect(a).toBe(b);
  });

  it('different user agents produce different fingerprints', () => {
    const a = generateDeviceFingerprint('Chrome/100');
    const b = generateDeviceFingerprint('Firefox/110');
    expect(a).not.toBe(b);
  });

  it('handles undefined optional params', () => {
    const fp = generateDeviceFingerprint('UA');
    expect(fp.length).toBe(16);
  });

  it('handles empty string user agent', () => {
    const fp = generateDeviceFingerprint('');
    expect(fp.length).toBe(16);
  });
});

describe('extractClientIP', () => {
  it('extracts IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(extractClientIP(headers)).toBe('1.2.3.4');
  });

  it('extracts IP from x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.1' });
    expect(extractClientIP(headers)).toBe('10.0.0.1');
  });

  it('extracts IP from cf-connecting-ip', () => {
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.50' });
    expect(extractClientIP(headers)).toBe('203.0.113.50');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
    });
    expect(extractClientIP(headers)).toBe('1.1.1.1');
  });

  it('returns 0.0.0.0 when no headers present', () => {
    const headers = new Headers();
    expect(extractClientIP(headers)).toBe('0.0.0.0');
  });

  it('trims whitespace from IP', () => {
    const headers = new Headers({ 'x-real-ip': '  10.0.0.1  ' });
    expect(extractClientIP(headers)).toBe('10.0.0.1');
  });
});
