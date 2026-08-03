'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/app/app/actions/audit';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  notifySelf,
  createNotification,
} from '@/app/app/actions/notifications';
import {
  getUserOrgMembership,
  hasPermission,
  requirePermission,
} from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { normalizeTaskPriority } from '@/lib/tasks/priority';
import { insertOrgTaskCompat } from '@/lib/tasks/persistence';
import { actionError, isNextInternalError } from "@/lib/actions/safe";
import {
  normaliseTaskStatus,
  TASK_STATUS_LABELS,
} from '@/components/tasks/task-status';

export async function createTask(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const permissionCtx = await requirePermission('EDIT_CONTROLS');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) throw new Error('Organization membership not found');
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error('Organization mismatch.');
  }

  const title = (formData.get('title') as string) || '';
  const priority = normalizeTaskPriority(
    formData.get('priority') as string | null,
  );
  const dueDateRaw = (formData.get('dueDate') as string) || '';
  const dueDate = dueDateRaw.trim() === '' ? null : dueDateRaw;
  const recurrenceDays =
    parseInt(formData.get('recurrenceDays') as string) || 0;
  const patientId = (formData.get('patientId') as string) || null;

  if (patientId) {
    const { data: patient, error: patientError } = await supabase
      .from('org_patients')
      .select('id')
      .eq('id', patientId)
      .eq('organization_id', membership.organization_id)
      .maybeSingle();

    if (patientError || !patient) {
      throw new Error('Patient not found');
    }
  }

  const { data: newTask, payload: insertedTask } = await insertOrgTaskCompat(
    supabase,
    {
      organization_id: membership.organization_id,
      title,
      priority,
      due_date: dueDate,
      status: 'pending',
      assigned_to: user.id,
      is_recurring: recurrenceDays > 0,
      recurrence_days: recurrenceDays,
      patient_id: patientId,
    },
    { returning: 'single' },
  );

  if (!newTask)
    throw new Error('Task Creation Failed: task row was not returned');

  const taskId = newTask.id as string;

  const storedRecurrenceDays =
    typeof insertedTask.recurrence_days === 'number'
      ? insertedTask.recurrence_days
      : 0;
  const recurrenceEnabled = insertedTask.is_recurring === true;

  await logActivity(membership.organization_id, 'CREATE_TASK', {
    resourceName: title,
    event: 'Task created manually',
    priority,
    taskId,
  });

  await logProductActivity(
    membership.organization_id,
    user.id,
    'created',
    {
      type: 'task',
      id: taskId,
      name: title,
      path: '/app/tasks',
    },
    {
      priority,
      dueDate,
      recurrenceDays: storedRecurrenceDays,
    },
  );

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: 'task',
    entityId: taskId,
    actionType: 'TASK_CREATED',
    afterState: {
      title,
      priority,
      due_date: dueDate,
      assigned_to: user.id,
    },
    reason: 'task_create',
  });

  await notifySelf({
    organizationId: membership.organization_id,
    type: 'TASK_CREATED',
    title: 'Task Created',
    body: title,
    actionUrl: '/app/tasks',
    metadata: {
      taskId,
      priority,
      dueDate,
      isRecurring: recurrenceEnabled,
      recurrenceDays: storedRecurrenceDays,
    },
  });

  revalidatePath('/app/tasks');
  return;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

async function _completeTaskCore(supabase: any, taskId: string, user: any) {
  const permissionCtx = await requirePermission('EDIT_CONTROLS');
  const { data: task } = await supabase
    .from('org_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('organization_id', permissionCtx.orgId)
    .maybeSingle();

  if (!task) throw new Error('Task not found');
  if (task.organization_id !== permissionCtx.orgId) {
    throw new Error('Organization mismatch.');
  }

  const { error: updateError } = await supabase
    .from('org_tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .eq('organization_id', task.organization_id);

  if (updateError) throw updateError;

  await logActivity(task.organization_id, 'COMPLETE_TASK', {
    resourceName: task.title,
    event: 'Task marked as complete',
    taskId,
  });

  await logProductActivity(
    task.organization_id,
    user.id,
    'completed',
    {
      type: 'task',
      id: taskId,
      name: task.title,
      path: '/app/tasks',
    },
    {
      previousStatus: task.status ?? null,
      nextStatus: 'completed',
    },
  );

  await logAuditEvent({
    organizationId: task.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: 'task',
    entityId: taskId,
    actionType: 'TASK_COMPLETED',
    beforeState: { status: task.status ?? null },
    afterState: { status: 'completed' },
    reason: 'task_complete',
  });

  await notifySelf({
    organizationId: task.organization_id,
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    body: task.title,
    actionUrl: '/app/tasks',
    metadata: { taskId },
  });

  if (task.is_recurring && task.recurrence_days > 0) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + task.recurrence_days);

    const { data: nextTask } = await insertOrgTaskCompat(
      supabase,
      {
        organization_id: task.organization_id,
        title: task.title,
        priority: task.priority,
        due_date: nextDueDate.toISOString(),
        status: 'pending',
        assigned_to: task.assigned_to,
        is_recurring: true,
        recurrence_days: task.recurrence_days,
        linked_policy_id: task.linked_policy_id,
        linked_asset_id: task.linked_asset_id,
      },
      { returning: 'single' },
    );

    if (nextTask) {
      const nextTaskId = nextTask.id as string;
      await logActivity(task.organization_id, 'CREATE_TASK', {
        resourceName: task.title,
        event: 'Recurring task auto-generated',
        taskId: nextTaskId,
      });

      await logProductActivity(
        task.organization_id,
        user.id,
        'created',
        {
          type: 'task',
          id: nextTaskId,
          name: task.title,
          path: '/app/tasks',
        },
        {
          sourceTaskId: taskId,
          recurring: true,
          dueDate: nextDueDate.toISOString(),
        },
      );

      // 🔔 Admin-level: notify assigned user (not self)
      await createNotification({
        organizationId: task.organization_id,
        userId: task.assigned_to,
        type: 'TASK_RECURRING',
        title: 'Recurring Task Generated',
        body: task.title,
        actionUrl: '/app/tasks',
        metadata: {
          taskId: nextTask.id,
          sourceTaskId: taskId,
          dueDate: nextDueDate.toISOString(),
        },
      });
    }
  }

  revalidatePath('/app/tasks');
  revalidatePath('/app');
  revalidateTag('onboarding-checklist', 'default');
}

export async function completeTask(taskId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    if (!taskId) throw new Error('Task ID required');

    await _completeTaskCore(supabase, taskId, user);
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Moves a task to another status. Backs the board's drag-and-drop, so the
 * caller needs the outcome to decide whether to keep or revert its optimistic
 * move — every failure path returns `{ success: false, error }` rather than
 * throwing.
 */
export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    if (!taskId) throw new Error('Task ID required');

    const nextStatus = normaliseTaskStatus(status);

    // Role is checked here first only so a blocked user reads a sentence
    // instead of a permission key; requirePermission below still runs, and
    // with it the billing read-only gate every other write goes through.
    const membership = await getUserOrgMembership();
    if (!hasPermission(membership.role, 'EDIT_CONTROLS')) {
      throw new Error(
        'Your role cannot change task status. Ask an owner or compliance officer.',
      );
    }

    // Completion runs the shared path so recurrence, notifications and the
    // onboarding checklist behave the same however the task was completed.
    if (nextStatus === 'completed') {
      await _completeTaskCore(supabase, taskId, user);
      return { success: true as const, status: nextStatus };
    }

    const permissionCtx = await requirePermission('EDIT_CONTROLS');

    const { data: task } = await supabase
      .from('org_tasks')
      .select('id, title, status')
      .eq('id', taskId)
      .eq('organization_id', permissionCtx.orgId)
      .maybeSingle();

    if (!task) throw new Error('Task not found');

    const previousStatus = (task.status as string | null) ?? null;
    if (normaliseTaskStatus(previousStatus) === nextStatus) {
      return { success: true as const, status: nextStatus };
    }

    const { error: updateError } = await supabase
      .from('org_tasks')
      .update({ status: nextStatus })
      .eq('id', taskId)
      .eq('organization_id', permissionCtx.orgId);

    if (updateError) throw updateError;

    await logProductActivity(
      permissionCtx.orgId,
      user.id,
      'updated',
      {
        type: 'task',
        id: taskId,
        name: task.title as string,
        path: '/app/tasks',
      },
      {
        previousStatus,
        nextStatus,
        statusLabel: TASK_STATUS_LABELS[nextStatus],
      },
    );

    await logAuditEvent({
      organizationId: permissionCtx.orgId,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: 'task',
      entityId: taskId,
      actionType: 'TASK_STATUS_CHANGED',
      beforeState: { status: previousStatus },
      afterState: { status: nextStatus },
      reason: 'task_status_change',
    });

    revalidatePath('/app/tasks');
    revalidatePath('/app/tasks/board');
    revalidatePath('/app/tasks/calendar');

    return { success: true as const, status: nextStatus };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
