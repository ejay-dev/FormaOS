/**
 * Automation Server Actions
 * Expose automation engine functionality to the application
 */

'use server';

import { requirePermission } from './rbac';
import {
  calculateComplianceScore,
  updateComplianceScore,
} from '@/lib/automation/compliance-score-engine';
import {
  processTrigger,
  type TriggerEvent,
  type TriggerType,
} from '@/lib/automation/trigger-engine';
import {
  processEvent,
  type DatabaseEvent,
  type EventType,
} from '@/lib/automation/event-processor';
import {
  runScheduledAutomation,
  runScheduledCheck,
} from '@/lib/automation/scheduled-processor';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { actionError, isNextInternalError } from "@/lib/actions/safe";

/**
 * Get current compliance score for organization
 */
export async function getComplianceScore() {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const score = await calculateComplianceScore(orgId);
  return score;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Manually trigger compliance score recalculation
 */
export async function recalculateComplianceScore() {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const score = await updateComplianceScore(orgId);
  return score;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Manually trigger an automation workflow
 */
export async function triggerAutomation(
  triggerType: TriggerType,
  metadata?: Record<string, any>,
) {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const event: TriggerEvent = {
    type: triggerType,
    organizationId: orgId,
    metadata,
    triggeredAt: new Date(),
  };

  const result = await processTrigger(event);
  return result;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Process a database event (called from other actions)
 */
export async function triggerDatabaseEvent(
  eventType: EventType,
  entityId: string,
  entityType: string,
  metadata?: Record<string, any>,
) {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const event: DatabaseEvent = {
    type: eventType,
    organizationId: orgId,
    entityId,
    entityType,
    metadata,
    timestamp: new Date(),
  };

  const result = await processEvent(event);
  return result;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Get automation execution history
 */
export async function getAutomationHistory(limit: number = 50) {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('org_workflow_executions')
    .select(
      'id, workflow_id, trigger_event, status, actions_executed, executed_at, error_message',
    )
    .eq('organization_id', orgId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch automation history: ${error.message}`);
  }

  return (
    data?.map(
      (item: {
        id: string;
        workflow_id: string;
        trigger_event: string;
        status: string;
        actions_executed: number;
        executed_at: string;
        error_message: string | null;
      }) => ({
        id: item.id,
        workflowId: item.workflow_id,
        trigger: item.trigger_event,
        status: item.status,
        actionsExecuted: item.actions_executed,
        executedAt: item.executed_at,
        errorMessage: item.error_message,
      }),
    ) || []
  );
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Get active automation workflows
 */
export async function getActiveWorkflows() {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('org_workflows')
    .select('id, name, trigger, enabled, conditions, actions')
    .eq('organization_id', orgId)
    .eq('enabled', true);

  if (error) {
    throw new Error(`Failed to fetch workflows: ${error.message}`);
  }

  return data || [];
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Admin-only: Run scheduled automation checks
 */
export async function runScheduledChecks() {
  try {
  // Admin permission required
  const { role } = await requirePermission('VIEW_CONTROLS');

  if (role !== 'OWNER' && role !== 'COMPLIANCE_OFFICER') {
    throw new Error('Admin permission required');
  }

  const result = await runScheduledAutomation();
  return result;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Admin-only: Run specific scheduled check
 */
export async function runSpecificCheck(
  checkType: 'evidence' | 'policies' | 'tasks' | 'certifications' | 'scores',
) {
  try {
  const { role } = await requirePermission('VIEW_CONTROLS');

  if (role !== 'OWNER' && role !== 'COMPLIANCE_OFFICER') {
    throw new Error('Admin permission required');
  }

  const result = await runScheduledCheck(checkType);
  return result;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Get compliance score summary for dashboard
 */
export async function getComplianceSummary() {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('org_control_evaluations')
    .select('compliance_score, status, details, last_evaluated_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!data) {
    // If no evaluation exists, calculate it
    const score = await updateComplianceScore(orgId);
    return {
      score: score.overallScore,
      riskLevel: score.riskLevel,
      lastUpdated: score.calculatedAt.toISOString(),
      breakdown: {
        controls: score.controlsScore,
        evidence: score.evidenceScore,
        tasks: score.tasksScore,
        policies: score.policiesScore,
      },
    };
  }

  return {
    score: data.compliance_score || 0,
    riskLevel: data.details?.riskLevel || 'medium',
    lastUpdated: data.last_evaluated_at || new Date().toISOString(),
    breakdown: {
      controls: data.details?.controlsScore || 0,
      evidence: data.details?.evidenceScore || 0,
      tasks: data.details?.tasksScore || 0,
      policies: data.details?.policiesScore || 0,
    },
  };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Get automation statistics
 */
export async function getAutomationStats() {
  try {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  // Get workflow counts
  const { count: totalWorkflows } = await supabase
    .from('org_workflows')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { count: activeWorkflows } = await supabase
    .from('org_workflows')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('enabled', true);

  // Get execution stats
  const { count: totalExecutions } = await supabase
    .from('org_workflow_executions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { count: successfulExecutions } = await supabase
    .from('org_workflow_executions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'success');

  const { count: failedExecutions } = await supabase
    .from('org_workflow_executions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'failed');

  // Get last execution date
  const { data: lastExecution } = await supabase
    .from('org_workflow_executions')
    .select('executed_at')
    .eq('organization_id', orgId)
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    totalWorkflows: totalWorkflows || 0,
    activeWorkflows: activeWorkflows || 0,
    totalExecutions: totalExecutions || 0,
    successfulExecutions: successfulExecutions || 0,
    failedExecutions: failedExecutions || 0,
    lastExecutionDate: lastExecution?.executed_at,
  };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
