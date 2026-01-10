"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { revalidatePath } from "next/cache";
import { notifySelf, createNotification } from "@/app/app/actions/notifications";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function createTask(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Organization membership not found");
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  const dueDate = formData.get("dueDate") as string;
  const recurrenceDays = parseInt(formData.get("recurrenceDays") as string) || 0;
  const patientId = (formData.get("patientId") as string) || null;

  if (patientId) {
    const { data: patient, error: patientError } = await supabase
      .from("org_patients")
      .select("id")
      .eq("id", patientId)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (patientError || !patient) {
      throw new Error("Patient not found");
    }
  }

  const { error, data: newTask } = await supabase
    .from("org_tasks")
    .insert({
      organization_id: membership.organization_id,
      title,
      priority,
      due_date: dueDate,
      status: "pending",
      assigned_to: user.id,
      is_recurring: recurrenceDays > 0,
      recurrence_days: recurrenceDays,
      patient_id: patientId,
    })
    .select()
    .single();

  if (error) throw new Error(`Task Creation Failed: ${error.message}`);

  await logActivity(membership.organization_id, "CREATE_TASK" as any, {
    resourceName: title,
    event: "Task created manually",
    priority,
    taskId: newTask.id,
  });

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "task",
    entityId: newTask.id,
    actionType: "TASK_CREATED",
    afterState: {
      title,
      priority,
      due_date: dueDate,
      assigned_to: user.id,
    },
    reason: "task_create",
  });

  await notifySelf({
    organizationId: membership.organization_id,
    type: "TASK_CREATED",
    title: "Task Created",
    body: title,
    actionUrl: "/app/tasks",
    metadata: {
      taskId: newTask.id,
      priority,
      dueDate,
      isRecurring: recurrenceDays > 0,
      recurrenceDays,
    },
  });

  revalidatePath("/app/tasks");
  return { success: true };
}

async function completeTaskCore(supabase: any, taskId: string, user: any) {
  const permissionCtx = await requirePermission("EDIT_CONTROLS");
  const { data: task } = await supabase
    .from("org_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("organization_id", permissionCtx.orgId)
    .single();

  if (!task) throw new Error("Task not found");
  if (task.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const { error: updateError } = await supabase
    .from("org_tasks")
    .update({ status: "completed" })
    .eq("id", taskId)
    .eq("organization_id", task.organization_id);

  if (updateError) throw updateError;

  await logActivity(task.organization_id, "COMPLETE_TASK" as any, {
    resourceName: task.title,
    event: "Task marked as complete",
    taskId,
  });

  await logAuditEvent({
    organizationId: task.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "task",
    entityId: taskId,
    actionType: "TASK_COMPLETED",
    beforeState: { status: task.status ?? null },
    afterState: { status: "completed" },
    reason: "task_complete",
  });

  await notifySelf({
    organizationId: task.organization_id,
    type: "TASK_COMPLETED",
    title: "Task Completed",
    body: task.title,
    actionUrl: "/app/tasks",
    metadata: { taskId },
  });

  if (task.is_recurring && task.recurrence_days > 0) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + task.recurrence_days);

    const { data: nextTask } = await supabase
      .from("org_tasks")
      .insert({
        organization_id: task.organization_id,
        title: task.title,
        priority: task.priority,
        due_date: nextDueDate.toISOString(),
        status: "pending",
        assigned_to: task.assigned_to,
        is_recurring: true,
        recurrence_days: task.recurrence_days,
        linked_policy_id: task.linked_policy_id,
        linked_asset_id: task.linked_asset_id,
      })
      .select()
      .single();

    if (nextTask) {
      await logActivity(task.organization_id, "CREATE_TASK" as any, {
        resourceName: task.title,
        event: "Recurring task auto-generated",
        taskId: nextTask.id,
      });

      // 🔔 Admin-level: notify assigned user (not self)
      await createNotification({
        organizationId: task.organization_id,
        userId: task.assigned_to,
        type: "TASK_RECURRING",
        title: "Recurring Task Generated",
        body: task.title,
        actionUrl: "/app/tasks",
        metadata: {
          taskId: nextTask.id,
          sourceTaskId: taskId,
          dueDate: nextDueDate.toISOString(),
        },
      });
    }
  }

  revalidatePath("/app/tasks");
}
