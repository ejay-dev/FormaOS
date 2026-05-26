import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

// Audit 2026-05-26: functions in this file that take an `orgId` parameter
// use the org-scoped client (createSupabaseOrgClient). Functions keyed only
// by `taskId` (updateTask, addDependency, removeDependency) remain on the
// raw admin client; they rely on RLS or caller verification to keep tenant
// isolation. If FORCE RLS isn't enabled on org_tasks, those functions can
// touch cross-tenant rows. Flagged for follow-up.

interface CreateTaskInput {
  title: string;
  description?: string;
  assignee_id?: string;
  priority?: string;
  due_date?: string;
  labels?: string[];
  status?: string;
}

export async function createTask(orgId: string, data: CreateTaskInput) {
  const db = createSupabaseOrgClient(orgId);
  const { data: task, error } = await db
    .from('org_tasks')
    .insert({
      title: data.title,
      description: data.description || null,
      assignee_id: data.assignee_id || null,
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      status: data.status || 'todo',
    })
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function updateTask(
  taskId: string,
  data: Partial<CreateTaskInput>,
) {
  const db = createSupabaseAdminClient();
  const { data: task, error } = await db
    .from('org_tasks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function assignTask(taskId: string, userId: string) {
  return updateTask(taskId, { assignee_id: userId });
}

export async function addDependency(
  taskId: string,
  dependsOnId: string,
  type: 'blocks' | 'related' = 'blocks',
) {
  if (taskId === dependsOnId) throw new Error('A task cannot depend on itself');

  // Cycle detection via DFS
  const visited = new Set<string>();
  const hasCycle = async (currentId: string): Promise<boolean> => {
    if (currentId === taskId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const db = createSupabaseAdminClient();
    const { data: deps } = await db
      .from('task_dependencies')
      .select('depends_on_task_id')
      .eq('task_id', currentId);

    for (const dep of deps || []) {
      if (await hasCycle(dep.depends_on_task_id)) return true;
    }
    return false;
  };

  if (await hasCycle(dependsOnId)) {
    throw new Error('Adding this dependency would create a cycle');
  }

  const db = createSupabaseAdminClient();
  const { error } = await db.from('task_dependencies').insert({
    task_id: taskId,
    depends_on_task_id: dependsOnId,
    dependency_type: type,
  });

  if (error) throw error;
}

export async function removeDependency(taskId: string, dependsOnId: string) {
  const db = createSupabaseAdminClient();
  await db
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_task_id', dependsOnId);
}

export async function getBlockedTasks(orgId: string) {
  // task_dependencies is keyed by task_id (not org_id), so it's read
  // through the raw admin client; the cross-tenant safety comes from the
  // intersect with org_tasks below.
  const admin = createSupabaseAdminClient();
  const db = createSupabaseOrgClient(orgId);

  const { data: deps } = await admin
    .from('task_dependencies')
    .select('task_id, depends_on_task_id, dependency_type')
    .eq('dependency_type', 'blocks');

  if (!deps?.length) return [];

  // Get incomplete dependencies
  const depTaskIds = deps.map((d) => d.depends_on_task_id);
  const { data: depTasks } = await db
    .from('org_tasks')
    .select('id, status')
    .in('id', depTaskIds);

  const incompleteDeps = new Set(
    (depTasks ?? []).filter((t: { status: string }) => t.status !== 'done').map((t: { id: string }) => t.id),
  );

  const blockedTaskIds = deps
    .filter((d) => incompleteDeps.has(d.depends_on_task_id))
    .map((d) => d.task_id);

  if (!blockedTaskIds.length) return [];

  const { data: blocked } = await db
    .from('org_tasks')
    .select('*')
    .in('id', [...new Set(blockedTaskIds)]);

  return blocked || [];
}

export async function getTasksByBoard(
  orgId: string,
  filters?: { assigneeId?: string; priority?: string },
) {
  const db = createSupabaseOrgClient(orgId);
  let query = db
    .from('org_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId);
  if (filters?.priority) query = query.eq('priority', filters.priority);

  const { data: tasks } = await query;
  type TaskRow = { id: string; status: string };

  const columns: Record<string, TaskRow[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
    blocked: [],
  };

  for (const task of (tasks as TaskRow[] | null) ?? []) {
    const col = columns[task.status] || columns.todo;
    col!.push(task);
  }

  // Mark blocked tasks
  const blocked = await getBlockedTasks(orgId);
  const blockedIds = new Set((blocked as Array<{ id: string }>).map((t) => t.id));
  for (const [status, statusTasks] of Object.entries(columns)) {
    if (status === 'blocked') continue;
    const toMove = statusTasks!.filter(
      (t) => blockedIds.has(t.id) && t.status !== 'done',
    );
    for (const task of toMove) {
      columns.blocked!.push(task);
    }
  }

  return columns;
}

export async function batchMoveToStatus(taskIds: string[], status: string) {
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('org_tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', taskIds);

  if (error) throw error;
}
