/**
 * Tests for lib/compliance/control-deduplication.ts
 * Covers: buildMasterControlMappings, getMasterControlWithMappings,
 *         getFrameworksSatisfiedByControl, isControlDeduplicated
 */

const mockRpc = jest.fn();
const mockFromFn = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: (...args: any[]) => mockFromFn(...args),
    rpc: mockRpc,
  }),
}));

import {
  buildMasterControlMappings,
  getMasterControlWithMappings,
  getFrameworksSatisfiedByControl,
  isControlDeduplicated,
} from '@/lib/compliance/control-deduplication';

/** Creates a fully-chainable proxy that resolves to { data } */
function chain(data: any) {
  const c: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return (resolve: Function) => resolve({ data });
        if (prop === 'data') return data;
        if (['maybeSingle', 'single'].includes(prop as string))
          return () => Promise.resolve({ data });
        if (prop === 'upsert')
          return () => Promise.resolve({ data: null, error: null });
        return (..._args: any[]) => c;
      },
    },
  );
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- buildMasterControlMappings ---

describe('buildMasterControlMappings', () => {
  it('returns error when no controls found', async () => {
    mockFromFn.mockReturnValue(chain(null));
    const result = await buildMasterControlMappings();
    expect(result).toEqual({
      ok: false,
      created: 0,
      error: 'No controls found',
    });
  });

  it('creates master controls for unique titles', async () => {
    const controls = [
      {
        id: 'fc-1',
        control_code: 'CC1.1',
        title: 'Access Control',
        summary_description: 'Control access',
        default_risk_level: 'high',
        framework_id: 'fw-1',
        frameworks: { slug: 'soc2', name: 'SOC 2' },
      },
    ];

    mockFromFn.mockImplementation((table: string) => {
      if (table === 'framework_controls') return chain(controls);
      return chain(null);
    });
    mockRpc.mockResolvedValue({ data: 'master-1' });

    const result = await buildMasterControlMappings();
    expect(result.ok).toBe(true);
    expect(result.created).toBe(1);
  });

  it('deduplicates controls with same normalized title', async () => {
    const controls = [
      {
        id: 'fc-1',
        control_code: 'CC1.1',
        title: 'Access Control',
        summary_description: 'desc 1',
        default_risk_level: 'high',
        framework_id: 'fw-1',
        frameworks: { slug: 'soc2', name: 'SOC 2' },
      },
      {
        id: 'fc-2',
        control_code: 'A.9.1',
        title: 'access control',
        summary_description: 'desc 2',
        default_risk_level: 'medium',
        framework_id: 'fw-2',
        frameworks: { slug: 'iso27001', name: 'ISO 27001' },
      },
    ];

    mockFromFn.mockImplementation((table: string) => {
      if (table === 'framework_controls') return chain(controls);
      return chain(null);
    });
    mockRpc.mockResolvedValue({ data: 'master-1' });

    const result = await buildMasterControlMappings();
    expect(result.ok).toBe(true);
    expect(result.created).toBe(2);
  });

  it('handles errors gracefully', async () => {
    mockFromFn.mockImplementation(() => {
      throw new Error('DB down');
    });
    const result = await buildMasterControlMappings();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('DB down');
  });

  it('defaults risk_level to medium when null', async () => {
    const controls = [
      {
        id: 'fc-1',
        control_code: 'CC1.1',
        title: 'Test Control',
        summary_description: null,
        default_risk_level: null,
        framework_id: 'fw-1',
        frameworks: { slug: 'soc2', name: 'SOC 2' },
      },
    ];

    mockFromFn.mockImplementation((table: string) => {
      if (table === 'framework_controls') return chain(controls);
      return chain(null);
    });
    mockRpc.mockResolvedValue({ data: 'master-1' });

    await buildMasterControlMappings();
    expect(mockRpc).toHaveBeenCalledWith('find_or_create_master_control', {
      p_title: 'Test Control',
      p_description: null,
      p_risk_level: 'medium',
    });
  });
});

// --- getMasterControlWithMappings ---

describe('getMasterControlWithMappings', () => {
  it('returns null when master control not found', async () => {
    mockFromFn.mockReturnValue(chain(null));
    const result = await getMasterControlWithMappings('non-existent');
    expect(result).toBeNull();
  });

  it('returns master control with framework mappings', async () => {
    const masterData = {
      id: 'mc-1',
      control_code: 'MC-001',
      title: 'Access Control',
      description: 'Control access to systems',
      risk_level: 'high',
    };
    const mappingsData = [
      {
        framework_control: [
          {
            control_code: 'CC6.1',
            framework: [{ slug: 'soc2', name: 'SOC 2' }],
          },
        ],
      },
    ];

    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? chain(masterData) : chain(mappingsData);
    });

    const result = await getMasterControlWithMappings('mc-1');
    expect(result).toEqual({
      id: 'mc-1',
      control_code: 'MC-001',
      title: 'Access Control',
      description: 'Control access to systems',
      risk_level: 'high',
      frameworks: [{ slug: 'soc2', name: 'SOC 2', controlCode: 'CC6.1' }],
    });
  });

  it('returns empty frameworks when no mappings exist', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? chain({
            id: 'mc-1',
            control_code: 'MC-001',
            title: 'Test',
            description: null,
            risk_level: 'low',
          })
        : chain([]);
    });

    const result = await getMasterControlWithMappings('mc-1');
    expect(result?.frameworks).toEqual([]);
  });
});

// --- isControlDeduplicated ---

describe('isControlDeduplicated', () => {
  it('returns not deduplicated when no mapping exists', async () => {
    mockFromFn.mockReturnValue(chain(null));
    const result = await isControlDeduplicated('fc-1');
    expect(result).toEqual({ deduplicated: false, frameworks: [] });
  });

  it('returns deduplicated true when mapped across multiple frameworks', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ master_control_id: 'mc-1' });
      return chain([
        {
          framework_control: [{ framework: [{ slug: 'soc2', name: 'SOC 2' }] }],
        },
        {
          framework_control: [
            {
              framework: [{ slug: 'iso27001', name: 'ISO 27001' }],
            },
          ],
        },
      ]);
    });

    const result = await isControlDeduplicated('fc-1');
    expect(result.deduplicated).toBe(true);
    expect(result.frameworks).toContain('SOC 2');
    expect(result.frameworks).toContain('ISO 27001');
  });

  it('returns deduplicated false when only one framework', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ master_control_id: 'mc-1' });
      return chain([
        {
          framework_control: [{ framework: [{ slug: 'soc2', name: 'SOC 2' }] }],
        },
      ]);
    });

    const result = await isControlDeduplicated('fc-1');
    expect(result.deduplicated).toBe(false);
    expect(result.frameworks).toEqual(['SOC 2']);
  });
});

// --- getFrameworksSatisfiedByControl ---

describe('getFrameworksSatisfiedByControl', () => {
  it('returns intersection of mapped and enabled frameworks', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chain([
          { framework_control: [{ framework: [{ slug: 'soc2' }] }] },
          { framework_control: [{ framework: [{ slug: 'iso27001' }] }] },
          { framework_control: [{ framework: [{ slug: 'hipaa' }] }] },
        ]);
      }
      return chain([{ framework_slug: 'soc2' }, { framework_slug: 'hipaa' }]);
    });

    const result = await getFrameworksSatisfiedByControl('org-1', 'mc-1');
    expect(result).toContain('soc2');
    expect(result).toContain('hipaa');
    expect(result).not.toContain('iso27001');
  });

  it('returns empty array when no mappings exist', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain(null);
      return chain([{ framework_slug: 'soc2' }]);
    });

    const result = await getFrameworksSatisfiedByControl('org-1', 'mc-1');
    expect(result).toEqual([]);
  });

  it('returns empty when no frameworks enabled', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return chain([
          { framework_control: [{ framework: [{ slug: 'soc2' }] }] },
        ]);
      return chain([]);
    });

    const result = await getFrameworksSatisfiedByControl('org-1', 'mc-1');
    expect(result).toEqual([]);
  });

  it('deduplicates framework slugs', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chain([
          { framework_control: [{ framework: [{ slug: 'soc2' }] }] },
          { framework_control: [{ framework: [{ slug: 'soc2' }] }] },
        ]);
      }
      return chain([{ framework_slug: 'soc2' }]);
    });

    const result = await getFrameworksSatisfiedByControl('org-1', 'mc-1');
    expect(result).toEqual(['soc2']);
  });
});
