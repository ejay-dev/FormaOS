/** @jest-environment node */

import { generateExportToken, verifyExportToken } from '@/lib/security/export-tokens';

describe('export tokens', () => {
  const jobId = 'job-123';
  const userId = 'user-456';
  const orgId = 'org-789';

  beforeEach(() => {
    process.env.EXPORT_TOKEN_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.EXPORT_TOKEN_SECRET;
  });

  it('verifies a valid token', () => {
    const token = generateExportToken(jobId, userId, orgId, 1);
    const payload = verifyExportToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.jobId).toBe(jobId);
    expect(payload?.userId).toBe(userId);
    expect(payload?.orgId).toBe(orgId);
  });

  it('rejects a tampered token', () => {
    const token = generateExportToken(jobId, userId, orgId, 1);
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');

    const payload = verifyExportToken(tampered);
    expect(payload).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = generateExportToken(jobId, userId, orgId, -1);
    const payload = verifyExportToken(token);
    expect(payload).toBeNull();
  });
});
