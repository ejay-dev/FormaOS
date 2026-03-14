jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  connectIntegration,
  listAvailableIntegrations,
  testIntegration,
} from '@/lib/integrations/manager';

const createAdminMock = createSupabaseAdminClient as jest.MockedFunction<
  typeof createSupabaseAdminClient
>;

function createQueryStub(result: { data?: unknown; error?: { message?: string } } = {}) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => ({
      data: result.data ?? null,
      error: result.error ?? null,
    })),
    single: jest.fn(async () => ({
      data: result.data ?? null,
      error: result.error ?? null,
    })),
  };

  return builder;
}

describe('integrations manager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the integration catalog', () => {
    const catalog = listAvailableIntegrations();

    expect(catalog.map((item) => item.id)).toEqual([
      'slack',
      'teams',
      'jira',
      'linear',
      'google_drive',
      'webhook_relay',
    ]);
  });

  it('rejects connect requests with missing required config', async () => {
    await expect(
      connectIntegration({
        orgId: 'org_123',
        type: 'slack',
        config: {},
        actorUserId: 'user_123',
      }),
    ).rejects.toThrow('Missing required config fields: webhook_url');
  });

  it('reports disconnected integrations as not connected', async () => {
    createAdminMock.mockReturnValue({
      from: jest.fn(() => createQueryStub({ data: null })),
    } as any);

    await expect(testIntegration('org_123', 'slack')).resolves.toEqual({
      ok: false,
      message: 'Integration not connected',
    });
  });

  it('validates decoded config fields before declaring health', async () => {
    createAdminMock.mockReturnValue({
      from: jest.fn(() =>
        createQueryStub({
          data: {
            provider: 'jira',
            config: {
              cloud_id: 'cloud_123',
              access_token: '',
              project_key: 'COMP',
              issue_type_id: '10001',
            },
          },
        }),
      ),
    } as any);

    const result = await testIntegration('org_123', 'jira');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('access_token');
  });
});
