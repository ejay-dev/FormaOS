/** @jest-environment node */

jest.mock('@/app/app/admin/access', () => ({
  requireFounderAccess: jest.fn(),
}));

jest.mock('@/lib/control-plane/server', () => ({
  getAdminControlPlaneSnapshot: jest.fn(),
  readAdminStreamVersion: jest.fn(),
  resolveControlPlaneEnvironment: jest.fn(() => 'production'),
}));

import { GET } from '@/app/api/admin/control-plane/stream/route';
import { requireFounderAccess } from '@/app/app/admin/access';

describe('/api/admin/control-plane/stream permissions', () => {
  const requireFounderAccessMock = requireFounderAccess as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-founders from opening admin stream', async () => {
    requireFounderAccessMock.mockRejectedValue(new Error('Forbidden'));

    const response = await GET(
      new Request('http://localhost/api/admin/control-plane/stream'),
    );

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('forbidden');
  });
});
