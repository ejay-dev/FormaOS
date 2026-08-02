/** @jest-environment node */

describe('lib/reports/scheduler – calculateNextSendAt', () => {
  // calculateNextSendAt is not exported; it is exercised through
  // scheduleReport, whose update() payload carries the computed
  // schedule.next_send_at. Asserting that value is the only way this suite
  // covers the daily/weekly/monthly date arithmetic — asserting merely that
  // db.from was called leaves every off-by-one invisible.

  jest.mock('@supabase/supabase-js', () => ({}));

  function mockDb(updateResult: unknown = { data: { id: 'r1' }, error: null }) {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.select = jest.fn().mockReturnValue(chain);
    chain.single = jest.fn().mockResolvedValue(updateResult);
    chain.not = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockResolvedValue({ data: [] });
    return { from: jest.fn().mockReturnValue(chain), chain } as any;
  }

  /** The `schedule` object written by scheduleReport. */
  function scheduleWrittenTo(db: any) {
    return db.chain.update.mock.calls[0][0].schedule;
  }

  const NOW = new Date('2026-03-10T12:00:00'); // a Tuesday (getDay() === 2), local time

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('scheduleReport sets daily schedule for later today when the hour is still ahead', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep1', 'org1', {
      frequency: 'daily',
      hour: 18,
      recipients: ['user@test.com'],
      format: 'pdf',
    });

    expect(db.from).toHaveBeenCalledWith('org_saved_reports');
    const schedule = scheduleWrittenTo(db);
    expect(schedule).toMatchObject({
      frequency: 'daily',
      hour: 18,
      timezone: 'UTC',
      recipients: ['user@test.com'],
      format: 'pdf',
    });
    const next = new Date(schedule.next_send_at);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(10); // still today
    expect(next.getHours()).toBe(18);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
  });

  it('rolls the daily schedule to tomorrow once the send hour has passed', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep1', 'org1', {
      frequency: 'daily',
      hour: 9, // already gone at 12:00
      recipients: ['user@test.com'],
      format: 'pdf',
    });

    const next = new Date(scheduleWrittenTo(db).next_send_at);
    expect(next.getDate()).toBe(11);
    expect(next.getHours()).toBe(9);
  });

  it('defaults the send hour to 08:00 when none is supplied', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep1', 'org1', {
      frequency: 'daily',
      recipients: ['user@test.com'],
      format: 'pdf',
    });

    const schedule = scheduleWrittenTo(db);
    expect(schedule.hour).toBe(8);
    expect(new Date(schedule.next_send_at).getHours()).toBe(8);
  });

  it('scheduleReport sets weekly schedule on the requested weekday', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep2', 'org1', {
      frequency: 'weekly',
      dayOfWeek: 3, // Wednesday; today is Tuesday
      hour: 14,
      recipients: ['a@b.com'],
      format: 'csv',
    });

    const schedule = scheduleWrittenTo(db);
    expect(schedule).toMatchObject({
      frequency: 'weekly',
      day_of_week: 3,
      hour: 14,
      format: 'csv',
    });
    const next = new Date(schedule.next_send_at);
    // (3 - 2 + 7) % 7 = 1 day out.
    expect(next.getDate()).toBe(11);
    expect(next.getDay()).toBe(3);
    expect(next.getHours()).toBe(14);
  });

  it('defaults the weekly schedule to Monday', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep2', 'org1', {
      frequency: 'weekly',
      hour: 14,
      recipients: ['a@b.com'],
      format: 'csv',
    });

    const next = new Date(scheduleWrittenTo(db).next_send_at);
    expect(next.getDay()).toBe(1); // Monday
    expect(next.getDate()).toBe(16); // (1 - 2 + 7) % 7 = 6 days out
  });

  it('pushes a weekly schedule targeting today a full week out', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep2', 'org1', {
      frequency: 'weekly',
      dayOfWeek: 2, // today (Tuesday)
      hour: 18, // …and the hour has not passed yet
      recipients: ['a@b.com'],
      format: 'csv',
    });

    const next = new Date(scheduleWrittenTo(db).next_send_at);
    // `(dayOfWeek - now.getDay() + 7) % 7 || 7` turns "0 days out" into 7,
    // so today's still-future 18:00 slot is skipped. Pinned deliberately —
    // see the scheduler note in the audit; changing it must break this test.
    expect(next.getDate()).toBe(17);
    expect(next.getDay()).toBe(2);
  });

  it('scheduleReport sets monthly schedule on the requested day of next month', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep3', 'org1', {
      frequency: 'monthly',
      dayOfMonth: 15,
      hour: 8,
      recipients: ['c@d.com'],
      format: 'xlsx',
    });

    const schedule = scheduleWrittenTo(db);
    expect(schedule).toMatchObject({
      frequency: 'monthly',
      day_of_month: 15,
      hour: 8,
      format: 'xlsx',
    });
    const next = new Date(schedule.next_send_at);
    // now.getMonth() + 1 — this month's still-future 15th is skipped.
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(8);
  });

  it('marks the report as scheduled and scopes the update to the org', async () => {
    const { scheduleReport } = await import('@/lib/reports/scheduler');
    const db = mockDb();
    await scheduleReport(db, 'rep1', 'org1', {
      frequency: 'daily',
      recipients: ['user@test.com'],
      format: 'pdf',
    });

    expect(db.chain.update.mock.calls[0][0]).toMatchObject({
      type: 'scheduled',
      updated_at: expect.any(String),
    });
    expect(db.chain.eq).toHaveBeenCalledWith('id', 'rep1');
    // org_saved_reports carries the tenant on org_id (verified against prod).
    expect(db.chain.eq).toHaveBeenCalledWith('org_id', 'org1');
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
    // Leaving `schedule` populated would keep the cron firing.
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'custom', schedule: null }),
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'rep1');
    expect(chain.eq).toHaveBeenCalledWith('org_id', 'org1');
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
    expect(result).toEqual([
      {
        id: 'r1',
        name: 'Weekly SOC2',
        nextSendAt: '2026-02-01',
        frequency: 'weekly',
        recipients: ['a@b.com'],
      },
    ]);
    expect(chain.eq).toHaveBeenCalledWith('org_id', 'org1');
    expect(chain.eq).toHaveBeenCalledWith('type', 'scheduled');
    expect(chain.not).toHaveBeenCalledWith('schedule', 'is', null);
  });

  it('getNextScheduled defaults recipients to an empty list', async () => {
    const { getNextScheduled } = await import('@/lib/reports/scheduler');
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.not = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockResolvedValue({
      data: [{ id: 'r2', name: 'No recipients', schedule: {} }],
    });
    const db = { from: jest.fn().mockReturnValue(chain) } as any;
    const result = await getNextScheduled(db, 'org1');
    expect(result[0].recipients).toEqual([]);
    expect(result[0].nextSendAt).toBeUndefined();
  });
});
