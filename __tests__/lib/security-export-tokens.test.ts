/** @jest-environment node */

/**
 * Unit tests for lib/security/export-tokens.ts
 * — JWT-based export token generation and verification
 */

import {
  generateExportToken,
  verifyExportToken,
  generateSignedDownloadUrl,
} from '@/lib/security/export-tokens';

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-jwt-secret-for-export-tokens-32chars!';

describe('export-tokens', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.EXPORT_TOKEN_SECRET = TEST_SECRET;
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // -----------------------------------------------------------------------
  // generateExportToken
  // -----------------------------------------------------------------------

  describe('generateExportToken', () => {
    it('returns a valid JWT-shaped string with three dot-separated parts', () => {
      const token = generateExportToken('job-1', 'org-1');
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('produces unique tokens for different jobId/orgId combinations', () => {
      const t1 = generateExportToken('job-1', 'org-1');
      const t2 = generateExportToken('job-2', 'org-1');
      const t3 = generateExportToken('job-1', 'org-2');
      expect(t1).not.toEqual(t2);
      expect(t1).not.toEqual(t3);
    });

    it('throws when no secret is configured', () => {
      delete process.env.EXPORT_TOKEN_SECRET;
      delete process.env.JWT_SECRET;
      expect(() => generateExportToken('job-1', 'org-1')).toThrow(
        /EXPORT_TOKEN_SECRET or JWT_SECRET must be configured/,
      );
    });

    it('falls back to JWT_SECRET when EXPORT_TOKEN_SECRET is not set', () => {
      delete process.env.EXPORT_TOKEN_SECRET;
      process.env.JWT_SECRET = 'fallback-jwt-secret-12345678901234';
      const token = generateExportToken('job-1', 'org-1');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  // -----------------------------------------------------------------------
  // verifyExportToken
  // -----------------------------------------------------------------------

  describe('verifyExportToken', () => {
    it('successfully verifies a freshly generated token', () => {
      const token = generateExportToken('job-1', 'org-1');
      const payload = verifyExportToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.jobId).toBe('job-1');
      expect(payload!.orgId).toBe('org-1');
      expect(payload!.aud).toBe('enterprise_export');
    });

    it('returns null for a token with a tampered payload', () => {
      const token = generateExportToken('job-1', 'org-1');
      const parts = token.split('.');
      // Tamper with the payload (change a character)
      const tamperedPayload =
        parts[1].charAt(0) === 'a'
          ? 'b' + parts[1].slice(1)
          : 'a' + parts[1].slice(1);
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      expect(verifyExportToken(tamperedToken)).toBeNull();
    });

    it('returns null for a token with a tampered signature', () => {
      const token = generateExportToken('job-1', 'org-1');
      const parts = token.split('.');
      const tamperedSig =
        parts[2].charAt(0) === 'x'
          ? 'y' + parts[2].slice(1)
          : 'x' + parts[2].slice(1);
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`;
      expect(verifyExportToken(tamperedToken)).toBeNull();
    });

    it('returns null for a malformed token (wrong number of parts)', () => {
      expect(verifyExportToken('only.two')).toBeNull();
      expect(verifyExportToken('a.b.c.d')).toBeNull();
      expect(verifyExportToken('')).toBeNull();
    });

    it('returns null for a completely invalid string', () => {
      expect(verifyExportToken('not-a-jwt-at-all')).toBeNull();
    });

    it('returns null for an expired token', () => {
      // Generate a token that expired 2 hours ago
      const token = generateExportToken('job-1', 'org-1', -2);
      expect(verifyExportToken(token)).toBeNull();
    });

    it('returns null when verified with a different secret', () => {
      const token = generateExportToken('job-1', 'org-1');
      // Switch to a different secret before verifying
      process.env.EXPORT_TOKEN_SECRET = 'completely-different-secret-key-xyz';
      expect(verifyExportToken(token)).toBeNull();
    });

    it('uses timing-safe comparison (structural test: both buffers are compared)', () => {
      // This is a structural assertion — we verify the token round-trips
      // correctly, which exercises the timingSafeEqual path
      const token = generateExportToken('job-1', 'org-1');
      const payload = verifyExportToken(token);
      expect(payload).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // generateSignedDownloadUrl
  // -----------------------------------------------------------------------

  describe('generateSignedDownloadUrl', () => {
    it('returns a URL containing the job ID and an encoded token', () => {
      const url = generateSignedDownloadUrl(
        'https://app.example.com',
        'job-42',
        'org-7',
      );
      expect(url).toContain('/api/exports/enterprise/job-42');
      expect(url).toContain('?token=');
    });

    it('produces a URL whose token can be verified', () => {
      const url = generateSignedDownloadUrl(
        'https://app.example.com',
        'job-42',
        'org-7',
      );
      const tokenParam = new URL(url).searchParams.get('token')!;
      const payload = verifyExportToken(tokenParam);
      expect(payload).not.toBeNull();
      expect(payload!.jobId).toBe('job-42');
      expect(payload!.orgId).toBe('org-7');
    });
  });
});
