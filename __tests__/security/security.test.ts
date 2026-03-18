/**
 * Security Test Suite
 *
 * Tests for enterprise security controls:
 * - Authentication & MFA enforcement
 * - Password security
 * - Session security
 * - API validation
 */

import crypto from 'crypto';
import {
  validatePasswordStrength,
  checkPasswordBreached,
  validatePassword,
} from '@/lib/security/password-security';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
import {
  hashSessionToken,
  generateSessionToken,
  generateDeviceFingerprint,
  extractClientIP,
} from '@/lib/security/session-security';
import {
  emailSchema,
  uuidSchema,
  safeStringSchema,
  orgNameSchema,
  validateBody,
  formatZodError,
} from '@/lib/security/api-validation';
import { hashPasswordForHistory } from '@/lib/security/password-history';
import { z } from 'zod';

// ============================================
// Password Security Tests
// ============================================

describe('Password Security', () => {
  describe('validatePasswordStrength', () => {
    it('rejects passwords shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 12 characters',
      );
    });

    it('rejects passwords without uppercase letters', () => {
      const result = validatePasswordStrength('lowercaseonly123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter',
      );
    });

    it('rejects passwords without lowercase letters', () => {
      const result = validatePasswordStrength('UPPERCASEONLY123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter',
      );
    });

    it('rejects passwords without numbers', () => {
      const result = validatePasswordStrength('NoNumbersHere!!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number',
      );
    });

    it('rejects passwords without special characters', () => {
      const result = validatePasswordStrength('NoSpecialChars123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character',
      );
    });

    it('rejects common password patterns', () => {
      const result = validatePasswordStrength('Password123456!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password contains a common pattern');
    });

    it('accepts strong passwords', () => {
      const result = validatePasswordStrength('MyStr0ng!P@ssw0rd#2024');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('assigns higher scores to longer passwords', () => {
      const short = validatePasswordStrength('Short1!Aa@bb');
      const long = validatePasswordStrength('VeryLongAndSecure1!Password2024');
      expect(long.score).toBeGreaterThan(short.score);
    });
  });

  describe('checkPasswordBreached', () => {
    it('handles API failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkPasswordBreached('testpassword');
      expect(result.breached).toBe(false);
      expect(result.count).toBe(0);
    });

    it('detects breached passwords when hash suffix matches', async () => {
      const password = 'P@ssword123!Secure';
      const sha1 = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();
      const suffix = sha1.slice(5);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => `${suffix}:42\nOTHERHASH:5`,
      } as Response);

      const result = await checkPasswordBreached(password);
      expect(result.breached).toBe(true);
      expect(result.count).toBe(42);
    });
  });

  describe('validatePassword', () => {
    it('rejects breached passwords', async () => {
      const password = 'P@ssword123!Secure';
      const sha1 = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();
      const suffix = sha1.slice(5);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => `${suffix}:99`,
      } as Response);

      const result = await validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.breached).toBe(true);
    });
  });
});

// ============================================
// MFA Enforcement Tests
// ============================================

describe('MFA Enforcement', () => {
  describe('roleRequiresMFA', () => {
    it('requires MFA for owner role', () => {
      expect(roleRequiresMFA('owner')).toBe(true);
      expect(roleRequiresMFA('OWNER')).toBe(true);
    });

    it('requires MFA for admin role', () => {
      expect(roleRequiresMFA('admin')).toBe(true);
    });

    it('requires MFA for compliance officer', () => {
      expect(roleRequiresMFA('COMPLIANCE_OFFICER')).toBe(true);
    });

    it('requires MFA for manager', () => {
      expect(roleRequiresMFA('MANAGER')).toBe(true);
    });

    it('does not require MFA for viewer role', () => {
      expect(roleRequiresMFA('viewer')).toBe(false);
    });

    it('does not require MFA for member role', () => {
      expect(roleRequiresMFA('member')).toBe(false);
    });
  });
});

// ============================================
// Session Security Tests
// ============================================

describe('Session Security', () => {
  describe('hashSessionToken', () => {
    it('produces consistent hashes', async () => {
      const token = 'test-token-123';
      const hash1 = await hashSessionToken(token);
      const hash2 = await hashSessionToken(token);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different tokens', async () => {
      const hash1 = await hashSessionToken('token-1');
      const hash2 = await hashSessionToken('token-2');
      expect(hash1).not.toBe(hash2);
    });

    it('produces 64-character hex strings', async () => {
      const hash = await hashSessionToken('any-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateSessionToken', () => {
    it('generates unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSessionToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('generates URL-safe tokens', () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('produces consistent fingerprints for same inputs', () => {
      const fp1 = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
      const fp2 = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
      expect(fp1).toBe(fp2);
    });

    it('produces different fingerprints for different inputs', () => {
      const fp1 = generateDeviceFingerprint('Mozilla/5.0', 'en-US', 'gzip');
      const fp2 = generateDeviceFingerprint('Chrome/120.0', 'de-DE', 'br');
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('extractClientIP', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('extracts IP from x-real-ip header', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '192.168.1.2');
      expect(extractClientIP(headers)).toBe('192.168.1.2');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.1');
      headers.set('x-real-ip', '192.168.1.2');
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('returns 0.0.0.0 when no IP headers present', () => {
      const headers = new Headers();
      expect(extractClientIP(headers)).toBe('0.0.0.0');
    });
  });
});

// ============================================
// API Validation Tests
// ============================================

describe('API Validation', () => {
  describe('emailSchema', () => {
    it('accepts valid emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('USER@DOMAIN.COM').success).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('missing@domain').success).toBe(false);
    });

    it('lowercases and trims emails', () => {
      const result = emailSchema.parse('  USER@EXAMPLE.COM  ');
      expect(result).toBe('user@example.com');
    });
  });

  describe('uuidSchema', () => {
    it('accepts valid UUIDs', () => {
      expect(
        uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success,
      ).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('550e8400-e29b-41d4').success).toBe(false);
    });
  });

  describe('safeStringSchema', () => {
    it('rejects script tags', () => {
      const result = safeStringSchema.safeParse(
        '<script>alert("xss")</script>',
      );
      expect(result.success).toBe(false);
    });

    it('rejects SQL injection patterns', () => {
      expect(safeStringSchema.safeParse('SELECT * FROM users--').success).toBe(
        false,
      );
      expect(safeStringSchema.safeParse('1; DROP TABLE users').success).toBe(
        false,
      );
    });

    it('rejects command injection patterns', () => {
      expect(safeStringSchema.safeParse('$(rm -rf /)').success).toBe(false);
      expect(safeStringSchema.safeParse('`id`').success).toBe(false);
    });

    it('accepts normal text', () => {
      expect(
        safeStringSchema.safeParse('Hello, this is normal text!').success,
      ).toBe(true);
    });
  });

  describe('orgNameSchema', () => {
    it('accepts valid organization names', () => {
      expect(orgNameSchema.safeParse('Acme Corp').success).toBe(true);
      expect(orgNameSchema.safeParse('My-Company.Inc').success).toBe(true);
    });

    it('rejects names that are too short', () => {
      expect(orgNameSchema.safeParse('A').success).toBe(false);
    });

    it('rejects names with invalid characters', () => {
      expect(orgNameSchema.safeParse('Company<script>').success).toBe(false);
      expect(orgNameSchema.safeParse('Org; DROP TABLE').success).toBe(false);
    });
  });

  describe('formatZodError', () => {
    it('formats errors correctly', () => {
      const schema = z.object({
        email: emailSchema,
        name: z.string().min(1),
      });

      const result = schema.safeParse({ email: 'invalid', name: '' });
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.message).toBe('Validation failed');
        expect(formatted.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateBody', () => {
    it('rejects invalid JSON body', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Request;

      const result = await validateBody(request, z.object({}));
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// Password History Tests
// ============================================

describe('Password History', () => {
  it('creates stable hashes for the same password', () => {
    const hash1 = hashPasswordForHistory('SecurePassword!123');
    const hash2 = hashPasswordForHistory('SecurePassword!123');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ============================================
// Additional Security Checks
// ============================================

describe('Security Invariants', () => {
  it('rejects weak passwords by default', () => {
    const weakPasswords = [
      'password',
      '123456',
      'qwerty123',
      'admin',
      'letmein',
    ];

    for (const password of weakPasswords) {
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
    }
  });

  it('session tokens have sufficient entropy', () => {
    const tokens = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(generateSessionToken());
    }

    // Check all tokens are at least 32 bytes (256 bits) when decoded
    for (const token of tokens) {
      // base64url encoding: 4 characters = 3 bytes
      // 32 bytes = ~43 characters
      expect(token.length).toBeGreaterThanOrEqual(42);
    }
  });
});
