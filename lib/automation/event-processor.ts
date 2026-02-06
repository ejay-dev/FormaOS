/**
 * Automation Event Processor
 * Monitors database changes and triggers appropriate automation workflows
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processTrigger, type TriggerEvent } from './trigger-engine';
import { updateComplianceScore } from './compliance-score-engine';

export type EventType =
  | 'evidence_uploaded'
  | 'evidence_verified'
  | 'evidence_rejected'
  | 'control_status_updated'
  | 'task_completed'
  | 'task_created'
  | 'subscription_activated'
  | 'onboarding_completed';

export interface DatabaseEvent {
  type: EventType;
  organizationId: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Process database event and trigger automation if needed
 */
export async function processEvent(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  console.log(`[Event Processor] Processing ${event.type} for org ${event.organizationId}`);

  try {
    switch (event.type) {
      case 'evidence_uploaded':
        return await handleEvidenceUploaded(event);

      case 'evidence_verified':
      case 'evidence_rejected':
        return await handleEvidenceStatusChange(event);

      case 'control_status_updated':
        return await handleControlStatusUpdate(event);

      case 'task_completed':
        return await handleTaskCompleted(event);

      case 'task_created':
        return await handleTaskCreated(event);

      case 'subscription_activated':
      case 'onboarding_completed':
        return await handleSubscriptionOrOnboarding(event);

      default:
        return { triggered: false };
    }
  } catch (error) {
    console.error(`[Event Processor] Error processing event:`, error);
    return { triggered: false };
  }
}

/**
 * Handle evidence upload event
 */
async function handleEvidenceUploaded(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  // Update compliance score when evidence is uploaded
  await updateComplianceScore(event.organizationId);

  // Check if evidence is linked to a task
  const supabase = createSupabaseAdminClient();
  const { data: evidence } = await supabase
    .from('org_evidence')
    .select('*, org_tasks(*)')
    .eq('id', event.entityId)
    .single();

  if (evidence?.org_tasks && evidence.org_tasks.status !== 'completed') {
    // Auto-complete evidence upload tasks
    await supabase
      .from('org_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', evidence.org_tasks.id);

    // Log audit event
    await supabase.from('org_audit_events').insert({
      organization_id: event.organizationId,
      actor_user_id: evidence.uploaded_by,
      entity_type: 'task',
      entity_id: evidence.org_tasks.id,
      action_type: 'UPDATE',
      after_state: { status: 'completed' },
      reason: 'Evidence uploaded - task auto-completed',
    });
  }

  return { triggered: true };
}

/**
 * Handle evidence verification/rejection
 */
async function handleEvidenceStatusChange(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  const wasVerified = event.type === 'evidence_verified';

  // Update compliance score
  await updateComplianceScore(event.organizationId);

  const supabase = createSupabaseAdminClient();

  // Update linked control evidence status
  await supabase
    .from('control_evidence')
    .update({
      approval_status: wasVerified ? 'approved' : 'rejected',
    })
    .eq('evidence_id', event.entityId);

  // If rejected, trigger remediation workflow
  if (!wasVerified) {
    const { data: evidence } = await supabase
      .from('org_evidence')
      .select('*')
      .eq('id', event.entityId)
      .single();

    if (evidence) {
      const triggerEvent: TriggerEvent = {
        type: 'evidence_expiry',
        organizationId: event.organizationId,
        entityId: event.entityId,
        entityType: 'evidence',
        metadata: {
          evidenceId: event.entityId,
          fileName: evidence.file_name,
          reason: 'Evidence rejected - replacement required',
        },
        triggeredAt: new Date(),
      };

      const result = await processTrigger(triggerEvent);
      return { triggered: true, result };
    }
  }

  return { triggered: true };
}

/**
 * Handle control status update
 */
async function handleControlStatusUpdate(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  const { newStatus, previousStatus } = event.metadata || {};

  // Update compliance score
  await updateComplianceScore(event.organizationId);

  // Trigger automation for failed or at-risk controls
  if (newStatus === 'non_compliant' && newStatus !== previousStatus) {
    const triggerEvent: TriggerEvent = {
      type: 'control_failed',
      organizationId: event.organizationId,
      entityId: event.entityId,
      entityType: 'control',
      metadata: {
        controlId: event.entityId,
        status: newStatus,
        previousStatus,
      },
      triggeredAt: new Date(),
    };

    const result = await processTrigger(triggerEvent);
    return { triggered: true, result };
  }

  if (newStatus === 'at_risk' && newStatus !== previousStatus) {
    const triggerEvent: TriggerEvent = {
      type: 'control_incomplete',
      organizationId: event.organizationId,
      entityId: event.entityId,
      entityType: 'control',
      metadata: {
        controlId: event.entityId,
        status: newStatus,
        previousStatus,
      },
      triggeredAt: new Date(),
    };

    const result = await processTrigger(triggerEvent);
    return { triggered: true, result };
  }

  return { triggered: false };
}

/**
 * Handle task completion
 */
async function handleTaskCompleted(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  const supabase = createSupabaseAdminClient();

  // Update compliance score
  await updateComplianceScore(event.organizationId);

  // Check if task is recurring - next instance should auto-generate
  const { data: task } = await supabase
    .from('org_tasks')
    .select('*')
    .eq('id', event.entityId)
    .single();

  if (!task) {
    return { triggered: false };
  }

  // If task is recurring and not already handled, generate next instance
  if (task.is_recurring && task.recurrence_days) {
    const nextDueDate = new Date(
      Date.now() + task.recurrence_days * 24 * 60 * 60 * 1000
    );

    const { error } = await supabase.from('org_tasks').insert({
      organization_id: event.organizationId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'pending',
      due_date: nextDueDate.toISOString(),
      assigned_to: task.assigned_to,
      linked_policy_id: task.linked_policy_id,
      linked_asset_id: task.linked_asset_id,
      is_recurring: true,
      recurrence_days: task.recurrence_days,
      entity_id: task.entity_id,
    });

    if (!error) {
      console.log(
        `[Event Processor] Generated next recurring task for ${task.title}`
      );
    }
  }

  // Check if task completion triggers policy review cycle
  if (task.linked_policy_id) {
    const { data: policy } = await supabase
      .from('org_policies')
      .select('*')
      .eq('id', task.linked_policy_id)
      .single();

    if (policy && task.title.includes('Review Policy')) {
      // Update policy last_updated_at
      await supabase
        .from('org_policies')
        .update({
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', policy.id);
    }
  }

  return { triggered: true };
}

/**
 * Handle task creation
 */
async function handleTaskCreated(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  // Update compliance score to reflect new task
  await updateComplianceScore(event.organizationId);

  return { triggered: true };
}

/**
 * Handle subscription activation or onboarding completion
 */
async function handleSubscriptionOrOnboarding(
  event: DatabaseEvent
): Promise<{ triggered: boolean; result?: any }> {
  if (event.type === 'onboarding_completed') {
    const triggerEvent: TriggerEvent = {
      type: 'org_onboarding',
      organizationId: event.organizationId,
      triggeredAt: new Date(),
    };

    const result = await processTrigger(triggerEvent);
    return { triggered: true, result };
  }

  return { triggered: false };
}

/**
 * Monitor compliance score changes and trigger risk alerts
 */
export async function monitorComplianceScoreChanges(
  organizationId: string,
  previousScore?: { score: number; riskLevel: string }
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Get current score
  const { data: currentEval } = await supabase
    .from('org_control_evaluations')
    .select('compliance_score, details')
    .eq('organization_id', organizationId)
    .single();

  if (!currentEval || !previousScore) {
    return;
  }

  const currentRisk = currentEval.details?.riskLevel || 'medium';
  const previousRisk = previousScore.riskLevel;

  // If risk level changed, trigger alert
  if (currentRisk !== previousRisk) {
    const triggerEvent: TriggerEvent = {
      type: 'risk_score_change',
      organizationId,
      metadata: {
        previousRisk,
        newRisk: currentRisk,
        score: currentEval.compliance_score,
      },
      triggeredAt: new Date(),
    };

    await processTrigger(triggerEvent);
  }
}
