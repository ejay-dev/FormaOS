/** @jest-environment node */

import { GET } from '@/app/api/version/route';

describe('GET /api/version', () => {
  it('returns version, status, and builtAt', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.version).toBe('1.0.0');
    expect(body.status).toBe('ok');
    expect(typeof body.builtAt).toBe('string');
  });

  it('sets no-store cache header', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });
});
