/**
 * @jest-environment node
 *
 * High-12: validateCsrfOrigin should let Bearer-authenticated requests
 * through. Cookies and Bearer tokens cannot both authenticate the same
 * request: a Bearer call from a foreign origin will not carry the
 * user's session cookies, so it cannot be a CSRF.
 *
 * This protects /api/v1/* (API key callers) and SCIM (bearer-only)
 * from being incorrectly blocked when CSRF is enforced at middleware.
 */

import { validateCsrfOrigin } from '@/lib/security/csrf';

describe('validateCsrfOrigin — Bearer exemption', () => {
  it('passes a POST with Authorization: Bearer through, even from a foreign origin', () => {
    const req = new Request('https://app.formaos.com.au/api/v1/forms', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example',
        authorization: 'Bearer fos_live_abc123',
      },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('rejects a POST without Bearer from a foreign origin', () => {
    const req = new Request('https://app.formaos.com.au/api/comments', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example',
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('rejects a POST with malformed Authorization header from a foreign origin', () => {
    const req = new Request('https://app.formaos.com.au/api/comments', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example',
        authorization: 'Bearer ', // empty token
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('passes safe methods (GET) without checking origin', () => {
    const req = new Request('https://app.formaos.com.au/api/billing', {
      method: 'GET',
      headers: { origin: 'https://attacker.example' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });
});
