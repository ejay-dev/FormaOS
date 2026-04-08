jest.mock('@/lib/supabase/server', () => {
  const query: Record<string, jest.Mock> = {};
  query.from = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.insert = jest.fn(() => query);
  query.update = jest.fn(() => query);
  query.upsert = jest.fn(() => Promise.resolve({ error: null }));
  query.eq = jest.fn(() => query);
  query.lte = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.single = jest.fn(() => query);
  query.then = jest.fn((r: Function) => r({ data: null, error: null }));

  const client = { from: jest.fn(() => query) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(client),
    __query: query,
    __client: client,
  };
});

import {
  getDefaultFeatures,
  getFeatureToggles,
  updateFeatureToggle,
  getBranding,
  updateBranding,
  exportOrgData,
} from '@/lib/settings/settings-engine';

function getQ() {
  return require('@/lib/supabase/server').__query;
}
function getClient() {
  return require('@/lib/supabase/server').__client;
}

beforeEach(() => {
  const query = getQ();
  query.from.mockImplementation(() => query);
  query.select.mockImplementation(() => query);
  query.insert.mockImplementation(() => query);
  query.update.mockImplementation(() => query);
  query.upsert.mockImplementation(() => Promise.resolve({ error: null }));
  query.eq.mockImplementation(() => query);
  query.lte.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.single.mockImplementation(() => query);
  query.then.mockImplementation((r: Function) =>
    r({ data: null, error: null }),
  );
  getClient().from.mockImplementation(() => query);
});

describe('getDefaultFeatures', () => {
  it('returns feature map with ai_assistant', () => {
    const features = getDefaultFeatures();
    expect(features.ai_assistant).toBeDefined();
    expect(features.ai_assistant.default).toBe(true);
  });

  it('includes care_plans feature', () => {
    const features = getDefaultFeatures();
    expect(features.care_plans).toEqual({
      label: 'Care Plans',
      description: 'NDIS/disability care plan management',
      default: false,
    });
  });

  it('has at least 10 features', () => {
    expect(Object.keys(getDefaultFeatures()).length).toBeGreaterThanOrEqual(10);
  });
});

describe('getFeatureToggles', () => {
  it('merges defaults with saved toggles', async () => {
    getQ().then.mockImplementation((r: Function) =>
      r({
        data: [{ feature_key: 'ai_assistant', enabled: false }],
        error: null,
      }),
    );
    const toggles = await getFeatureToggles('org-1');
    expect(toggles.ai_assistant).toBe(false);
    expect(toggles.care_plans).toBe(false);
    expect(toggles.incidents).toBe(true);
  });

  it('uses defaults when no saved data', async () => {
    getQ().then.mockImplementation((r: Function) =>
      r({ data: [], error: null }),
    );
    const toggles = await getFeatureToggles('org-1');
    expect(toggles.ai_assistant).toBe(true);
  });
});

describe('updateFeatureToggle', () => {
  it('upserts feature toggle', async () => {
    await updateFeatureToggle('org-1', 'ai_assistant', false);
    expect(getQ().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        feature_key: 'ai_assistant',
        enabled: false,
      }),
      { onConflict: 'org_id,feature_key' },
    );
  });

  it('throws on error', async () => {
    getQ().upsert.mockReturnValue(
      Promise.resolve({ error: { message: 'db err' } }),
    );
    await expect(updateFeatureToggle('org-1', 'x', true)).rejects.toBeDefined();
  });
});

describe('getBranding', () => {
  it('returns branding data', async () => {
    getQ().single.mockReturnValue(
      Promise.resolve({
        data: { logo_url: 'https://img.com/logo.png' },
        error: null,
      }),
    );
    const result = await getBranding('org-1');
    expect(result).toEqual({ logo_url: 'https://img.com/logo.png' });
  });
});

describe('updateBranding', () => {
  it('upserts branding record', async () => {
    await updateBranding('org-1', {
      logoUrl: 'https://img.com/new.png',
      primaryColor: '#ff0000',
    });
    expect(getQ().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        logo_url: 'https://img.com/new.png',
        primary_color: '#ff0000',
      }),
      { onConflict: 'org_id' },
    );
  });
});

describe('exportOrgData', () => {
  it('gathers all org data tables', async () => {
    getQ().then.mockImplementation((r: Function) =>
      r({ data: [{ id: '1' }], error: null }),
    );
    const result = await exportOrgData('org-1');
    expect(result.orgId).toBe('org-1');
    expect(result.exportedAt).toBeDefined();
    expect(result.counts.controls).toBe(1);
    expect(result.data.controls).toEqual([{ id: '1' }]);
  });
});
