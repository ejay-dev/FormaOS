/**
 * Tests for lib/security/password-history.ts — hashPasswordForHistory (pure)
 */

import crypto from 'crypto';
import { hashPasswordForHistory } from '@/lib/security/password-history';

describe('hashPasswordForHistory', () => {
  it('returns a SHA-256 hex string', () => {
    const result = hashPasswordForHistory('MyP@ssword123');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns same hash for same password', () => {
    const a = hashPasswordForHistory('test');
    const b = hashPasswordForHistory('test');
    expect(a).toBe(b);
  });

  it('returns different hash for different passwords', () => {
    const a = hashPasswordForHistory('password1');
    const b = hashPasswordForHistory('password2');
    expect(a).not.toBe(b);
  });

  it('matches Node crypto SHA-256', () => {
    const password = 'verifyMe!';
    const expected = crypto.createHash('sha256').update(password).digest('hex');
    expect(hashPasswordForHistory(password)).toBe(expected);
  });

  it('handles empty string', () => {
    const result = hashPasswordForHistory('');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('handles unicode characters', () => {
    const result = hashPasswordForHistory('pässwörd™');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
