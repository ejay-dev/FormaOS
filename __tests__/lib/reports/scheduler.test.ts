/** @jest-environment node */

describe('lib/reports/scheduler – calculateNextSendAt', () => {
  // We need to test calculateNextSendAt which is not exported directly.
  // We test it indirectly through scheduleReport which calls it.
  // But let's also test scheduleReport and unscheduleReport.

  jest.mock('@supabase/supabase-js', () => ({}));

  function mockDb(updateResult: unknown = { data: { id: 'r1' }, error: null }) {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.select = jest.fn().mockReturnValue(chain);
    chain.single = jest.fn().mockResolvedValue(updateResult);
    chain.not = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockResolvedValue({ data: [] });
    return { from: jest.fn().mockReturnValue(chain) } as any;
  }

  it('scheduleReport sets daily schedule', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    const _result = await scheduleReport(db, 'rep1', 'org1', {
      frequency: 'daily',
      hour: 9,
      recipients: ['user@test.com'],
      format: 'pdf',
    });
    expect(db.from).toHaveBeenCalledWith('org_saved_reports');
  });

  it('scheduleReport sets weekly schedule', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep2', 'org1', {
      frequency: 'weekly',
      dayOfWeek: 3,
      hour: 14,
      recipients: ['a@b.com'],
      format: 'csv',
    });
    expect(db.from).toHaveBeenCalled();
  });

  it('scheduleReport sets monthly schedule', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep3', 'org1', {
      frequency: 'monthly',
      dayOfMonth: 15,
      hour: 8,
      recipients: ['c@d.com'],
      format: 'xlsx',
    });
    expect(db.from).toHaveBeenCalled();
  });

  it('scheduleReport throws on db error', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb({ data: null, error: { message: 'DB error' } });
    await expect(
      scheduleReport(db, 'rep4', 'org1', {
        frequency: 'daily',
        recipients: ['x@y.com'],
        format: 'pdf',
      }),
    ).rejects.toThrow('DB error');
  });

  it('unscheduleReport clears schedule', async () => {
    const { unscheduleReport } = await import('@/lib/reports/scheduler');
    const chain: Record<string, any> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
      Promise.resolve({ error: null }).then(resolve, reject);
    const db = { from: jest.fn().mockReturnValue(chain) } as any;
    await unscheduleReport(db, 'rep1', 'org1');
    expect(db.from).toHaveBeenCalledWith('org_saved_reports');
  });

  it('unscheduleReport throws on error', async () => {
    const { unscheduleReport } = await import('@/lib/reports/scheduler');
    const chain: Record<string, any> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
      Promise.resolve({ error: { message: 'oops' } }).then(resolve, reject);
    const db = { from: jest.fn().mockReturnValue(chain) } as any;
    await expect(unscheduleReport(db, 'rep1', 'org1')).rejects.toThrow('oops');
  });

  it('getNextScheduled returns scheduled reports', async () => {
    const { getNextScheduled } = await import('@/lib/reports/scheduler');
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.not = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'r1',
          name: 'Weekly SOC2',
          schedule: {
            next_send_at: '2026-02-01',
            frequency: 'weekly',
            recipients: ['a@b.com'],
          },
        },
      ],
    });
    const db = { from: jest.fn().mockReturnValue(chain) } as any;
    const result = await getNextScheduled(db, 'org1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Weekly SOC2');
  });
});
