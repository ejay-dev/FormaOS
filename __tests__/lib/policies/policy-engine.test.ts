jest.mock('@/lib/supabase/server', () => {
  const query: Record<string, jest.Mock> = {};
  query.from = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.insert = jest.fn(() => query);
  query.update = jest.fn(() => query);
  query.upsert = jest.fn(() => Promise.resolve({ error: null }));
  query.eq = jest.fn(() => query);
  query.in = jest.fn(() => query);
  query.lte = jest.fn(() => query);
  query.gte = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.single = jest.fn(() => query);
  query.then = jest.fn((r: Function) =>
    r({ data: null, error: null, count: 0 }),
  );

  const client = { from: jest.fn(() => query) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(client),
    __query: query,
    __client: client,
  };
});

import {
  createPolicyVersion,
  submitForApproval,
  recordApprovalDecision,
  publishVersion,
  acknowledgePolicy,
  getAcknowledgmentStatus,
  getPoliciesDueForReview,
  scheduleReview,
} from '@/lib/policies/policy-engine';

function q() {
  return require('@/lib/supabase/server').__query;
}

beforeEach(() => {
  const query = q();
  query.from.mockImplementation(() => query);
  query.select.mockImplementation(() => query);
  query.insert.mockImplementation(() => query);
  query.update.mockImplementation(() => query);
  query.upsert.mockImplementation(() => Promise.resolve({ error: null }));
  query.eq.mockImplementation(() => query);
  query.in.mockImplementation(() => query);
  query.lte.mockImplementation(() => query);
  query.gte.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.single.mockImplementation(() => query);
  query.then.mockImplementation((r: Function) =>
    r({ data: null, error: null, count: 0 }),
  );
  require('@/lib/supabase/server').__client.from.mockImplementation(
    () => query,
  );
});

describe('createPolicyVersion', () => {
  it('inserts version with incremented version number', async () => {
    q()
      .single.mockReturnValueOnce(
        Promise.resolve({ data: { version_number: 2 }, error: null }),
      )
      .mockReturnValueOnce(
        Promise.resolve({
          data: { id: 'v-1', version_number: 3 },
          error: null,
        }),
      );

    const result = await createPolicyVersion('org-1', 'pol-1', {
      title: 'Privacy Policy',
      content: 'Content here',
      createdBy: 'user-1',
    });

    expect(result).toEqual({ id: 'v-1', version_number: 3 });
    expect(q().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        policy_id: 'pol-1',
        version_number: 3,
        status: 'draft',
      }),
    );
  });

  it('starts at version 1 when no existing versions', async () => {
    q()
      .single.mockReturnValueOnce(Promise.resolve({ data: null, error: null }))
      .mockReturnValueOnce(
        Promise.resolve({
          data: { id: 'v-1', version_number: 1 },
          error: null,
        }),
      );

    await createPolicyVersion('org-1', 'pol-1', {
      title: 'New',
      content: 'C',
      createdBy: 'u',
    });
    expect(q().insert).toHaveBeenCalledWith(
      expect.objectContaining({ version_number: 1 }),
    );
  });

  it('throws on insert error', async () => {
    q()
      .single.mockReturnValueOnce(Promise.resolve({ data: null, error: null }))
      .mockReturnValueOnce(
        Promise.resolve({ data: null, error: { message: 'fail' } }),
      );

    await expect(
      createPolicyVersion('org-1', 'p', {
        title: 'X',
        content: 'Y',
        createdBy: 'u',
      }),
    ).rejects.toBeDefined();
  });
});

describe('submitForApproval', () => {
  it('updates version status and creates approval records', async () => {
    await submitForApproval('org-1', 'ver-1', ['a1', 'a2']);
    expect(q().update).toHaveBeenCalledWith({ status: 'pending_approval' });
    expect(q().insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          org_id: 'org-1',
          policy_version_id: 'ver-1',
          approver_id: 'a1',
          decision: 'pending',
        }),
      ]),
    );
  });
});

describe('recordApprovalDecision', () => {
  it('updates approval decision', async () => {
    q().single.mockReturnValueOnce(
      Promise.resolve({ data: { policy_version_id: 'ver-1' }, error: null }),
    );
    q().then.mockImplementation((r: Function) => r({ data: [], error: null }));

    await recordApprovalDecision('org-1', 'app-1', 'approved');
    expect(q().update).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'approved' }),
    );
  });
});

describe('publishVersion', () => {
  it('archives old and publishes new version', async () => {
    q().single.mockReturnValueOnce(
      Promise.resolve({ data: { policy_id: 'pol-1' }, error: null }),
    );
    await publishVersion('org-1', 'ver-2');
    expect(q().update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'archived' }),
    );
    expect(q().update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('throws when version not found', async () => {
    q().single.mockReturnValueOnce(
      Promise.resolve({ data: null, error: null }),
    );
    await expect(publishVersion('org-1', 'bad')).rejects.toThrow(
      'Version not found',
    );
  });
});

describe('acknowledgePolicy', () => {
  it('upserts acknowledgment', async () => {
    await acknowledgePolicy('org-1', 'pol-1', 'ver-1', 'user-1');
    expect(q().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        policy_id: 'pol-1',
        user_id: 'user-1',
      }),
      { onConflict: 'policy_version_id,user_id' },
    );
  });

  it('throws on error', async () => {
    q().upsert.mockReturnValue(
      Promise.resolve({ error: { message: 'conflict' } }),
    );
    await expect(
      acknowledgePolicy('org-1', 'pol-1', 'ver-1', 'user-1'),
    ).rejects.toBeDefined();
  });
});

describe('getPoliciesDueForReview', () => {
  it('queries overdue reviews', async () => {
    q().then.mockImplementation((r: Function) =>
      r({ data: [{ id: '1' }], error: null }),
    );
    const result = await getPoliciesDueForReview('org-1');
    expect(result).toEqual([{ id: '1' }]);
  });
});

describe('scheduleReview', () => {
  it('upserts review schedule', async () => {
    await scheduleReview('org-1', 'pol-1', 'quarterly', ['user-1']);
    expect(q().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        policy_id: 'pol-1',
        review_frequency: 'quarterly',
      }),
      { onConflict: 'id' },
    );
  });

  it('throws on error', async () => {
    q().upsert.mockReturnValue(Promise.resolve({ error: { message: 'fail' } }));
    await expect(
      scheduleReview('org-1', 'pol-1', 'annual', []),
    ).rejects.toBeDefined();
  });
});
