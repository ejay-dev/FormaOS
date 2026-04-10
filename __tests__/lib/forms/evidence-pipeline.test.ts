/** @jest-environment node */

describe('lib/forms/evidence-pipeline', () => {
  function mockDb(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.single = jest.fn();
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);

    const db = {
      from: jest.fn((table: string) => {
        if (table === 'org_form_submissions') {
          const subChain: Record<string, jest.Mock> = {};
          subChain.select = jest.fn().mockReturnValue(subChain);
          subChain.eq = jest.fn().mockReturnValue(subChain);
          subChain.single = jest.fn().mockResolvedValue({
            data: {
              id: 'sub1',
              form_id: 'frm1',
              form: { id: 'frm1', title: 'Security Questionnaire' },
              respondent_name: 'John',
              respondent_email: 'john@test.com',
              created_at: '2026-01-15T00:00:00Z',
              ...((overrides.submission ?? {}) as Record<string, unknown>),
            },
            error: null,
          });
          subChain.update = jest.fn().mockReturnValue(subChain);
          return subChain;
        }
        if (table === 'control_evidence') {
          const evChain: Record<string, jest.Mock> = {};
          evChain.insert = jest.fn().mockReturnValue(evChain);
          evChain.select = jest.fn().mockReturnValue(evChain);
          evChain.single = jest.fn().mockResolvedValue({
            data: { id: 'ev1', title: 'Security Questionnaire — John' },
            error: overrides.evidenceError ?? null,
          });
          return evChain;
        }
        if (table === 'org_forms') {
          const formChain: Record<string, jest.Mock> = {};
          formChain.select = jest.fn().mockReturnValue(formChain);
          formChain.eq = jest.fn().mockReturnValue(formChain);
          formChain.single = jest.fn().mockResolvedValue({
            data: overrides.form ?? {
              settings: { evidence_mapping: [{ control_id: 'ctrl1' }] },
            },
            error: null,
          });
          return formChain;
        }
        return chain;
      }),
    };
    return db;
  }

  it('links submission to evidence', async () => {
    const { linkSubmissionToEvidence } =
      await import('@/lib/forms/evidence-pipeline');
    const db = mockDb();
    const result = await linkSubmissionToEvidence(
      db as any,
      'sub1',
      'org1',
      'ctrl1',
      'user1',
    );
    expect(result.id).toBe('ev1');
  });

  it('throws when submission not found', async () => {
    const { linkSubmissionToEvidence } =
      await import('@/lib/forms/evidence-pipeline');
    const db = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }),
    };

    await expect(
      linkSubmissionToEvidence(db as any, 'bad', 'org1', 'ctrl1', 'user1'),
    ).rejects.toBeDefined();
  });

  it('autoMapSubmission maps to all controls', async () => {
    const { autoMapSubmission } = await import('@/lib/forms/evidence-pipeline');
    const db = mockDb({
      form: {
        settings: {
          evidence_mapping: [{ control_id: 'ctrl1' }, { control_id: 'ctrl2' }],
        },
      },
    });

    const results = await autoMapSubmission(
      db as any,
      'frm1',
      'sub1',
      'org1',
      'user1',
    );
    expect(results).toBeTruthy();
    expect(results!.length).toBe(2);
  });

  it('autoMapSubmission returns null when no mappings', async () => {
    const { autoMapSubmission } = await import('@/lib/forms/evidence-pipeline');
    const db = mockDb({ form: { settings: {} } });

    const results = await autoMapSubmission(
      db as any,
      'frm1',
      'sub1',
      'org1',
      'user1',
    );
    expect(results).toBeNull();
  });

  it('autoMapSubmission returns null when form not found', async () => {
    const { autoMapSubmission } = await import('@/lib/forms/evidence-pipeline');
    const db = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }),
    };

    const results = await autoMapSubmission(
      db as any,
      'frm1',
      'sub1',
      'org1',
      'user1',
    );
    expect(results).toBeNull();
  });
});
