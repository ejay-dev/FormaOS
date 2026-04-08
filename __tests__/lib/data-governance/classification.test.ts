import {
  inferClassificationForField,
  AUTO_CLASSIFICATION_RULES,
} from '@/lib/data-governance/classification';

jest.mock('@/lib/supabase/admin', () => {
  const q: Record<string, jest.Mock> = {};
  q.from = jest.fn(() => q);
  q.select = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.upsert = jest.fn(() => Promise.resolve({ error: null }));
  q.then = jest.fn((r: Function) => r({ data: [], error: null }));
  return { createSupabaseAdminClient: () => q, __q: q };
});

import {
  listClassifications,
  upsertClassifications,
  generateClassificationReport,
} from '@/lib/data-governance/classification';

function getQ() {
  return require('@/lib/supabase/admin').__q;
}

beforeEach(() => jest.clearAllMocks());

describe('inferClassificationForField', () => {
  it('classifies email fields as confidential', () => {
    const result = inferClassificationForField('user_email');
    expect(result.level).toBe('confidential');
    expect(result.reason).toContain('contact');
  });

  it('classifies phone fields as confidential', () => {
    expect(inferClassificationForField('mobile_number').level).toBe(
      'confidential',
    );
  });

  it('classifies SSN/TFN as restricted', () => {
    expect(inferClassificationForField('ssn').level).toBe('restricted');
    expect(inferClassificationForField('tfn').level).toBe('restricted');
    expect(inferClassificationForField('tax_id').level).toBe('restricted');
  });

  it('classifies DOB as confidential', () => {
    expect(inferClassificationForField('date_of_birth').level).toBe(
      'confidential',
    );
  });

  it('classifies address fields as confidential', () => {
    expect(inferClassificationForField('street_address').level).toBe(
      'confidential',
    );
    expect(inferClassificationForField('postcode').level).toBe('confidential');
  });

  it('classifies financial data as restricted', () => {
    expect(inferClassificationForField('bank_account').level).toBe(
      'restricted',
    );
    expect(inferClassificationForField('card_number').level).toBe('restricted');
  });

  it('classifies secrets as restricted', () => {
    expect(inferClassificationForField('password_hash').level).toBe(
      'restricted',
    );
    expect(inferClassificationForField('api_token').level).toBe('restricted');
    expect(inferClassificationForField('private_key').level).toBe('restricted');
  });

  it('classifies name/department/title as internal', () => {
    expect(inferClassificationForField('department').level).toBe('internal');
    expect(inferClassificationForField('job_title').level).toBe('internal');
    expect(inferClassificationForField('display_name').level).toBe('internal');
  });

  it('classifies unknown fields as public', () => {
    const result = inferClassificationForField('created_at');
    expect(result.level).toBe('public');
    expect(result.reason).toContain('No sensitive');
  });

  it('classifies passport as restricted', () => {
    expect(inferClassificationForField('passport_number').level).toBe(
      'restricted',
    );
  });

  it('classifies drivers_license as restricted', () => {
    expect(inferClassificationForField('drivers_license').level).toBe(
      'restricted',
    );
  });
});

describe('AUTO_CLASSIFICATION_RULES', () => {
  it('has at least 6 rules', () => {
    expect(AUTO_CLASSIFICATION_RULES.length).toBeGreaterThanOrEqual(6);
  });
});

describe('listClassifications', () => {
  it('queries with correct org_id', async () => {
    const q = getQ();
    q.then.mockImplementation((r: Function) =>
      r({ data: [{ id: '1', level: 'public' }], error: null }),
    );
    const result = await listClassifications('org-1');
    expect(q.from).toHaveBeenCalledWith('data_classifications');
    expect(q.eq).toHaveBeenCalledWith('org_id', 'org-1');
    expect(result).toEqual([{ id: '1', level: 'public' }]);
  });

  it('throws on error', async () => {
    const q = getQ();
    q.then.mockImplementation((r: Function) =>
      r({ data: null, error: { message: 'db error' } }),
    );
    await expect(listClassifications('org-1')).rejects.toThrow('db error');
  });
});

describe('upsertClassifications', () => {
  it('upserts entries correctly', async () => {
    const q = getQ();
    await upsertClassifications('org-1', [
      { resource_type: 'users', field_name: 'email', level: 'confidential' },
    ]);
    expect(q.from).toHaveBeenCalledWith('data_classifications');
    expect(q.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          org_id: 'org-1',
          resource_type: 'users',
          field_name: 'email',
          level: 'confidential',
          source: 'manual',
        }),
      ]),
      { onConflict: 'org_id,resource_type,field_name' },
    );
  });

  it('throws on error', async () => {
    const q = getQ();
    q.upsert.mockResolvedValue({ error: { message: 'conflict' } });
    await expect(
      upsertClassifications('org-1', [
        { resource_type: 'x', field_name: 'y', level: 'public' },
      ]),
    ).rejects.toThrow('conflict');
  });
});

describe('generateClassificationReport', () => {
  it('generates breakdown from classifications', async () => {
    const q = getQ();
    q.then.mockImplementation((r: Function) =>
      r({
        data: [
          { level: 'public' },
          { level: 'confidential' },
          { level: 'confidential' },
        ],
        error: null,
      }),
    );
    const report = await generateClassificationReport('org-1');
    expect(report.totalFields).toBe(3);
    expect(report.breakdown).toEqual({ public: 1, confidential: 2 });
    expect(report.generatedAt).toBeDefined();
  });
});
