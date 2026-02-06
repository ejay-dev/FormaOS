/**
 * Automation Server Actions
 * Expose automation engine functionality to the application
 */

'use server';

import { requirePermission } from './rbac';
import {
  calculateComplianceScore,
  updateComplianceScore,
  type ComplianceScoreResult,
} from '@/lib/automation/compliance-score-engine';
import {
  processTrigger,
  type TriggerEvent,
  type TriggerType,
  type AutomationResult,
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

/**
 * Get current compliance score for organization
 */
export async function getComplianceScore(): Promise<ComplianceScoreResult> {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const score = await calculateComplianceScore(orgId);
  return score;
}

/**
 * Manually trigger compliance score recalculation
 */
export async function recalculateComplianceScore(): Promise<ComplianceScoreResult> {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const score = await updateComplianceScore(orgId);
  return score;
}

/**
 * Manually trigger an automation workflow
 */
export async function triggerAutomation(
  triggerType: TriggerType,
  metadata?: Record<string, any>
): Promise<AutomationResult> {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const event: TriggerEvent = {
    type: triggerType,
    organizationId: orgId,
    metadata,
    triggeredAt: new Date(),
  };

  const result = await processTrigger(event);
  return result;
}

/**
 * Process a database event (called from other actions)
 */
export async function triggerDatabaseEvent(
  eventType: EventType,
  entityId: string,
  entityType: string,
  metadata?: Record<string, any>
): Promise<{ triggered: boolean }> {
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
}

/**
 * Get automation execution history
 */
export async function getAutomationHistory(
  limit: number = 50
): Promise<
  Array<{
    id: string;
    workflowId: string;
    trigger: string;
    status: string;
    actionsExecuted: number;
    executedAt: string;
    errorMessage?: string;
  }>
> {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('org_workflow_executions')
    .select(
      'id, workflow_id, trigger_event, status, actions_executed, executed_at, error_message'
    )
    .eq('organization_id', orgId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch automation history: ${error.message}`);
  }

  return (
    data?.map((item) => ({
      id: item.id,
      workflowId: item.workflow_id,
      trigger: item.trigger_event,
      status: item.status,
      actionsExecuted: item.actions_executed,
      executedAt: item.executed_at,
      errorMessage: item.error_message,
    })) || []
  );
}

/**
 * Get active automation workflows
 */
export async function getActiveWorkflows(): Promise<
  Array<{
    id: string;
    name: string;
    trigger: string;
    enabled: boolean;
    conditions: any[];
    actions: any[];
  }>
> {
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
}

/**
 * Admin-only: Run scheduled automation checks
 */
export async function runScheduledChecks(): Promise<{
  checksRun: number;
  triggersExecuted: number;
  errors: string[];
}> {
  // Admin permission required
  const { role } = await requirePermission('VIEW_CONTROLS');

  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Admin permission required');
  }

  const result = await runScheduledAutomation();
  return result;
}

/**
 * Admin-only: Run specific scheduled check
 */
export async function runSpecificCheck(
  checkType: 'evidence' | 'policies' | 'tasks' | 'certifications' | 'scores'
): Promise<any> {
  const { role } = await requirePermission('VIEW_CONTROLS');

  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Admin permission required');
  }

  const result = await runScheduledCheck(checkType);
  return result;
}

/**
 * Get compliance score summary for dashboard
 */
export async function getComplianceSummary(): Promise<{
  score: number;
  riskLevel: string;
  lastUpdated: string;
  breakdown: {
    controls: number;
    evidence: number;
    tasks: number;
    policies: number;
  };
}> {
  const { orgId } = await requirePermission('VIEW_CONTROLS');

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('org_control_evaluations')
    .select('compliance_score, status, details, last_evaluated_at')
    .eq('organization_id', orgId)
    .single();

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
}

/**
 * Get automation statistics
 */
export async function getAutomationStats(): Promise<{
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionDate?: string;
}> {
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
    .single();

  return {
    totalWorkflows: totalWorkflows || 0,
    activeWorkflows: activeWorkflows || 0,
    totalExecutions: totalExecutions || 0,
    successfulExecutions: successfulExecutions || 0,
    failedExecutions: failedExecutions || 0,
    lastExecutionDate: lastExecution?.executed_at,
  };
}
