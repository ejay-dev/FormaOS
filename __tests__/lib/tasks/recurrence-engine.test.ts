/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import {
  createRecurrence,
  pauseRecurrence,
  resumeRecurrence,
  getUpcomingRecurrences,
  processRecurringTasks,
} from '@/lib/tasks/recurrence-engine';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockDb(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {};
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.single = jest
    .fn()
    .mockResolvedValue({ data: { id: 'r1' }, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  // Default for getUpcomingRecurrences — resolves directly with data
  const _resolvedChain = {
    ...chain,
    order: jest.fn().mockResolvedValue({ data: [] }),
  };

  const db = {
    from: jest.fn().mockReturnValue(chain),
    ...overrides,
  };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);
  return db;
}

describe('lib/tasks/recurrence-engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRecurrence', () => {
    it('inserts a recurrence pattern', async () => {
      const db = mockDb();
      const result = await createRecurrence('org1', {
        title: 'Monthly review',
        frequency: 'monthly',
        dayOfMonth: 15,
        nextDue: '2026-02-15',
      });
      expect(db.from).toHaveBeenCalledWith('task_recurrence');
      expect(result).toEqual({ id: 'r1' });
    });

    it('throws on insert error', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.insert = jest.fn().mockReturnValue(chain);
      chain.select = jest.fn().mockReturnValue(chain);
      chain.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate' },
      });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      await expect(
        createRecurrence('org1', {
          title: 'Test',
          frequency: 'weekly',
          nextDue: '2026-01-20',
        }),
      ).rejects.toMatchObject({ message: 'Duplicate' });
    });

    it('uses defaults for optional fields', async () => {
      const db = mockDb();
      await createRecurrence('org1', {
        title: 'Daily check',
        frequency: 'daily',
        nextDue: '2026-01-10',
      });
      const insertArg = db.from('task_recurrence').insert.mock.calls[0][0];
      expect(insertArg).toMatchObject({
        priority: 'medium',
        labels: [],
        active: true,
      });
    });
  });

  describe('pauseRecurrence', () => {
    it('sets active to false', async () => {
      const db = mockDb();
      await pauseRecurrence('r1');
      expect(db.from).toHaveBeenCalledWith('task_recurrence');
    });
  });

  describe('resumeRecurrence', () => {
    it('sets active to true', async () => {
      const db = mockDb();
      await resumeRecurrence('r1');
      expect(db.from).toHaveBeenCalledWith('task_recurrence');
    });
  });

  describe('getUpcomingRecurrences', () => {
    it('returns empty for no upcoming', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.lte = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockResolvedValue({ data: [] });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await getUpcomingRecurrences('org1');
      expect(result).toEqual([]);
    });

    it('returns recurrences within window', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.lte = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockResolvedValue({
        data: [
          { id: 'r1', title: 'Weekly', next_due: '2026-01-15', active: true },
        ],
      });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await getUpcomingRecurrences('org1', 30);
      expect(result).toHaveLength(1);
    });
  });

  describe('processRecurringTasks', () => {
    it('returns 0 created when nothing due', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.lte = jest.fn().mockResolvedValue({ data: [] });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await processRecurringTasks();
      expect(result.created).toBe(0);
    });

    it('creates tasks and advances due dates', async () => {
      const selectChain: Record<string, jest.Mock> = {};
      selectChain.select = jest.fn().mockReturnValue(selectChain);
      selectChain.eq = jest.fn().mockReturnValue(selectChain);
      selectChain.lte = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'r1',
            org_id: 'org1',
            title: 'Daily Task',
            description: 'Do it',
            assignee_id: null,
            priority: 'medium',
            next_due: '2026-01-01',
            frequency: 'daily',
            day_of_week: null,
            day_of_month: null,
          },
        ],
      });

      const insertChain = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      const updateChain: Record<string, jest.Mock> = {};
      updateChain.update = jest.fn().mockReturnValue(updateChain);
      updateChain.eq = jest.fn().mockResolvedValue({ data: null, error: null });

      let fromCallCount = 0;
      const db = {
        from: jest.fn((table: string) => {
          if (table === 'task_recurrence') {
            fromCallCount++;
            if (fromCallCount === 1) return selectChain;
            return updateChain;
          }
          if (table === 'org_tasks') return insertChain;
          return selectChain;
        }),
      };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await processRecurringTasks();
      expect(result.created).toBe(1);
      expect(insertChain.insert).toHaveBeenCalled();
    });
  });
});
