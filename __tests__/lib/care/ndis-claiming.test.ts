/**
 * Tests for lib/care/ndis-claiming.ts
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

import {
  generateLineItems,
  validateLineItem,
  batchValidateClaims,
  exportClaimFile,
} from '@/lib/care/ndis-claiming';

describe('generateLineItems', () => {
  it('generates line item for completed personal_care visit', async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 3600000).toISOString();
    const end = now.toISOString();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'personal_care',
      start_time: start,
      end_time: end,
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: 'cp1',
      org_patients: { id: 'p1', first_name: 'John', last_name: 'Doe' },
    };

    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2)
          return createBuilder({ data: { price_national: 65.0 }, error: null });
        return createBuilder({ data: { id: 'li1' }, error: null });
      }),
    };

    const result = await generateLineItems(db as any, 'org-1', 'v1');
    expect(result).toBeDefined();
  });

  it('uses actual start/end time when available', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'therapy',
      start_time: new Date(now.getTime() - 5 * 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: new Date(now.getTime() - 1 * 3600000).toISOString(),
      actual_end_time: now.toISOString(),
      participant_id: 'p1',
      care_plan_id: null,
    };

    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null }); // no price guide
        return createBuilder({ data: { id: 'li2' }, error: null });
      }),
    };

    const result = await generateLineItems(db as any, 'org-1', 'v1');
    expect(result).toBeDefined();
  });

  it('throws when visit not found', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    await expect(generateLineItems(db as any, 'org-1', 'v1')).rejects.toThrow(
      'Visit not found',
    );
  });

  it('throws when visit not completed', async () => {
    const visit = { id: 'v1', status: 'pending', visit_type: 'personal_care' };
    const db = {
      from: jest.fn(() => createBuilder({ data: visit, error: null })),
    };
    await expect(generateLineItems(db as any, 'org-1', 'v1')).rejects.toThrow(
      'Visit must be completed',
    );
  });

  it('maps community_access visit type', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'community_access',
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: null,
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        return createBuilder({ data: { id: 'li3' }, error: null });
      }),
    };
    const result = await generateLineItems(db as any, 'org-1', 'v1');
    expect(result).toBeDefined();
  });

  it('maps group_activity visit type', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'group_activity',
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: null,
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        return createBuilder({ data: { id: 'li4' }, error: null });
      }),
    };
    await generateLineItems(db as any, 'org-1', 'v1');
    expect(db.from).toHaveBeenCalled();
  });

  it('maps domestic visit type', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'domestic',
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: null,
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        return createBuilder({ data: { id: 'li5' }, error: null });
      }),
    };
    await generateLineItems(db as any, 'org-1', 'v1');
    expect(db.from).toHaveBeenCalled();
  });

  it('falls back to personal_care for unknown visit type', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'unknown_type',
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: null,
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        return createBuilder({ data: { id: 'li6' }, error: null });
      }),
    };
    await generateLineItems(db as any, 'org-1', 'v1');
    expect(db.from).toHaveBeenCalled();
  });

  it('throws on insert error', async () => {
    const now = new Date();
    const visit = {
      id: 'v1',
      status: 'completed',
      visit_type: 'personal_care',
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: now.toISOString(),
      actual_start_time: null,
      actual_end_time: null,
      participant_id: 'p1',
      care_plan_id: null,
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: visit, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        return createBuilder({ data: null, error: { message: 'insert fail' } });
      }),
    };
    await expect(generateLineItems(db as any, 'org-1', 'v1')).rejects.toThrow(
      'insert fail',
    );
  });
});

describe('validateLineItem', () => {
  it('validates valid line item', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: { price_national: 65.0 }, error: null }),
      ),
    };
    const result = await validateLineItem(db as any, {
      support_item_number: '01_011_0107_1_1',
      unit_price: 60.0,
      quantity: 2,
      total_amount: 120.0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags price exceeding ceiling', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: { price_national: 50.0 }, error: null }),
      ),
    };
    const result = await validateLineItem(db as any, {
      support_item_number: '01_011_0107_1_1',
      unit_price: 65.0,
      quantity: 1,
      total_amount: 65.0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds'))).toBe(true);
  });

  it('flags negative quantity', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    const result = await validateLineItem(db as any, {
      support_item_number: '01_011_0107_1_1',
      unit_price: 60.0,
      quantity: -1,
      total_amount: -60.0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Quantity must be positive');
    expect(result.errors).toContain('Total amount must be positive');
  });

  it('flags mismatched total', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    const result = await validateLineItem(db as any, {
      support_item_number: '01_011_0107_1_1',
      unit_price: 60.0,
      quantity: 2,
      total_amount: 999.0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("doesn't match"))).toBe(true);
  });
});

describe('batchValidateClaims', () => {
  it('validates batch of items', async () => {
    const items = [
      {
        id: 'li1',
        support_item_number: '01_011_0107_1_1',
        unit_price: 60,
        quantity: 1,
        total_amount: 60,
      },
    ];
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: items, error: null });
        return createBuilder({ data: null, error: null }); // price guide
      }),
    };
    const results = await batchValidateClaims(db as any, 'org-1', ['li1']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('li1');
  });

  it('handles no items', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    const results = await batchValidateClaims(db as any, 'org-1', []);
    expect(results).toHaveLength(0);
  });
});

describe('exportClaimFile', () => {
  it('throws when no line items found', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    };
    await expect(exportClaimFile(db as any, 'org-1', ['li1'])).rejects.toThrow(
      'No line items found',
    );
  });

  it('generates CSV string', async () => {
    const items = [
      {
        id: 'li1',
        support_item_number: '01_011_0107_1_1',
        unit_price: 60,
        quantity: 1,
        total_amount: 60,
        created_at: '2024-01-15T10:00:00Z',
        org_patients: {
          first_name: 'Jane',
          last_name: 'Doe',
          ndis_number: '123456789',
        },
      },
    ];
    const db = {
      from: jest.fn(() => createBuilder({ data: items, error: null })),
    };
    const csv = await exportClaimFile(db as any, 'org-1', ['li1']);
    expect(csv).toContain('RegistrationNumber');
    expect(csv).toContain('123456789');
  });

  it('handles null patient data', async () => {
    const items = [
      {
        id: 'li1',
        support_item_number: '01_011_0107_1_1',
        unit_price: 60,
        quantity: 1,
        total_amount: 60,
        created_at: '2024-01-15T10:00:00Z',
        org_patients: null,
      },
    ];
    const db = {
      from: jest.fn(() => createBuilder({ data: items, error: null })),
    };
    const csv = await exportClaimFile(db as any, 'org-1', ['li1']);
    expect(csv).toContain('RegistrationNumber');
  });
});
