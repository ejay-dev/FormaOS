/**
 * Tests for lib/tasks/task-engine.ts
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  createTask,
  updateTask,
  assignTask,
  addDependency,
  removeDependency,
  getBlockedTasks,
  getTasksByBoard,
  batchMoveToStatus,
} from '@/lib/tasks/task-engine';

describe('task-engine', () => {
  beforeEach(() => jest.clearAllMocks());

  const fakeTask = {
    id: 't1',
    title: 'Test',
    status: 'todo',
    priority: 'medium',
    organization_id: 'org1',
  };

  describe('createTask', () => {
    it('inserts and returns task', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: fakeTask, error: null }),
      );
      const result = await createTask('org1', { title: 'Test' });
      expect(result).toEqual(fakeTask);
      expect(getClient().from).toHaveBeenCalledWith('org_tasks');
    });

    it('throws on error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      await expect(createTask('org1', { title: 'T' })).rejects.toBeDefined();
    });

    it('uses default priority and status', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: fakeTask, error: null }),
      );
      await createTask('org1', { title: 'T' });
      const insertCall = getClient().from.mock.results[0].value.insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'medium', status: 'todo' }),
      );
    });
  });

  describe('updateTask', () => {
    it('updates and returns task', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { ...fakeTask, title: 'Updated' }, error: null }),
      );
      const result = await updateTask('t1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('throws on error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'err' } }),
      );
      await expect(updateTask('t1', { title: 'X' })).rejects.toBeDefined();
    });
  });

  describe('assignTask', () => {
    it('delegates to updateTask with assignee_id', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: fakeTask, error: null }),
      );
      const result = await assignTask('t1', 'u1');
      expect(result).toBeDefined();
    });
  });

  describe('addDependency', () => {
    it('throws when task depends on itself', async () => {
      await expect(addDependency('t1', 't1')).rejects.toThrow(
        'cannot depend on itself',
      );
    });

    it('throws when cycle detected', async () => {
      // t2 depends on t1 — so adding t1->t2 creates a cycle
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [{ depends_on_task_id: 't1' }],
            error: null,
          });
        return createBuilder({ data: [], error: null });
      });
      await expect(addDependency('t1', 't2')).rejects.toThrow('cycle');
    });

    it('inserts dependency when no cycle', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [], error: null }),
      );
      await expect(addDependency('t1', 't2')).resolves.not.toThrow();
    });

    it('throws on insert error', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: [], error: null }); // cycle check
        return createBuilder({ data: null, error: { message: 'dup' } }); // insert
      });
      await expect(addDependency('t1', 't2')).rejects.toBeDefined();
    });
  });

  describe('removeDependency', () => {
    it('deletes dependency', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      await removeDependency('t1', 't2');
      expect(getClient().from).toHaveBeenCalledWith('task_dependencies');
    });
  });

  describe('getBlockedTasks', () => {
    it('returns empty when no dependencies', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [], error: null }),
      );
      const result = await getBlockedTasks('org1');
      expect(result).toEqual([]);
    });

    it('returns blocked tasks', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [
              {
                task_id: 't1',
                depends_on_task_id: 't2',
                dependency_type: 'blocks',
              },
            ],
            error: null,
          });
        if (callIdx === 2)
          return createBuilder({
            data: [{ id: 't2', status: 'in_progress' }],
            error: null,
          });
        return createBuilder({
          data: [{ id: 't1', ...fakeTask }],
          error: null,
        });
      });
      const result = await getBlockedTasks('org1');
      expect(result).toHaveLength(1);
    });

    it('returns empty when deps are done', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [
              {
                task_id: 't1',
                depends_on_task_id: 't2',
                dependency_type: 'blocks',
              },
            ],
            error: null,
          });
        if (callIdx === 2)
          return createBuilder({
            data: [{ id: 't2', status: 'done' }],
            error: null,
          });
        return createBuilder({ data: [], error: null });
      });
      const result = await getBlockedTasks('org1');
      expect(result).toEqual([]);
    });
  });

  describe('getTasksByBoard', () => {
    it('returns columned tasks', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [
              { ...fakeTask, status: 'todo' },
              { ...fakeTask, id: 't2', status: 'done' },
            ],
            error: null,
          });
        return createBuilder({ data: [], error: null });
      });
      const result = await getTasksByBoard('org1');
      expect(result).toHaveProperty('todo');
      expect(result).toHaveProperty('done');
      expect(result).toHaveProperty('blocked');
    });

    it('applies assignee filter', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [], error: null }),
      );
      await getTasksByBoard('org1', { assigneeId: 'u1' });
      expect(getClient().from).toHaveBeenCalled();
    });

    it('applies priority filter', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [], error: null }),
      );
      await getTasksByBoard('org1', { priority: 'high' });
      expect(getClient().from).toHaveBeenCalled();
    });
  });

  describe('batchMoveToStatus', () => {
    it('updates multiple tasks', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      await batchMoveToStatus(['t1', 't2'], 'done');
      expect(getClient().from).toHaveBeenCalledWith('org_tasks');
    });

    it('throws on error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      await expect(batchMoveToStatus(['t1'], 'done')).rejects.toBeDefined();
    });
  });
});
