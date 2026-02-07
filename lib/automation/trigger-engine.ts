/**
 * Compliance Workflow Trigger Engine
 * Automated task and workflow generation triggered by compliance events
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { updateComplianceScore } from './compliance-score-engine';
import { automationLogger } from '@/lib/observability/structured-logger';

// Maximum recursion depth for trigger chains
const MAX_TRIGGER_DEPTH = 5;

export type TriggerType =
  | 'evidence_expiry'
  | 'policy_review_due'
  | 'control_failed'
  | 'control_incomplete'
  | 'org_onboarding'
  | 'risk_score_change'
  | 'task_overdue'
  | 'certification_expiring';

export interface TriggerEvent {
  type: TriggerType;
  organizationId: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  triggeredAt: Date;
}

export interface AutomationResult {
  tasksCreated: number;
  notificationsSent: number;
  workflowsExecuted: number;
  errors: string[];
}

/**
 * Process trigger events and execute appropriate automations
 * @param event - The trigger event to process
 * @param depth - Current recursion depth (internal use)
 */
export async function processTrigger(
  event: TriggerEvent,
  depth: number = 0
): Promise<AutomationResult> {
  const result: AutomationResult = {
    tasksCreated: 0,
    notificationsSent: 0,
    workflowsExecuted: 0,
    errors: [],
  };

  // Recursion protection
  if (depth >= MAX_TRIGGER_DEPTH) {
    automationLogger.warn('trigger_recursion_limit', {
      eventType: event.type,
      orgId: event.organizationId,
      depth,
    });
    result.errors.push(`Max trigger recursion depth reached (${MAX_TRIGGER_DEPTH})`);
    return result;
  }

  try {
    switch (event.type) {
      case 'evidence_expiry':
        await handleEvidenceExpiry(event, result);
        break;
      case 'policy_review_due':
        await handlePolicyReviewDue(event, result);
        break;
      case 'control_failed':
      case 'control_incomplete':
        await handleControlIssue(event, result);
        break;
      case 'org_onboarding':
        await handleOrgOnboarding(event, result);
        break;
      case 'risk_score_change':
        await handleRiskScoreChange(event, result);
        break;
      case 'task_overdue':
        await handleTaskOverdue(event, result);
        break;
      case 'certification_expiring':
        await handleCertificationExpiring(event, result);
        break;
    }

    // Update compliance score after automation
    await updateComplianceScore(event.organizationId);
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return result;
}

/**
 * Handle evidence expiry trigger
 */
async function handleEvidenceExpiry(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const evidenceId = event.metadata?.evidenceId;

  if (!evidenceId) {
    result.errors.push('Evidence ID missing in metadata');
    return;
  }

  // Get evidence details
  const { data: evidence } = await supabase
    .from('org_evidence')
    .select('*, org_tasks(*)')
    .eq('id', evidenceId)
    .single();

  if (!evidence) {
    result.errors.push('Evidence not found');
    return;
  }

  // Create renewal task
  const { data: task, error } = await supabase
    .from('org_tasks')
    .insert({
      organization_id: event.organizationId,
      title: `Renew Evidence: ${evidence.file_name}`,
      description: `Evidence "${evidence.file_name}" has expired and needs to be renewed.`,
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      linked_policy_id: evidence.org_tasks?.linked_policy_id,
    })
    .select()
    .single();

  if (error) {
    result.errors.push(`Failed to create renewal task: ${error.message}`);
    return;
  }

  result.tasksCreated++;

  // Find compliance officers to notify
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .in('role', ['owner', 'admin', 'compliance_officer']);

  // Create notifications
  if (members) {
    for (const member of members) {
      await supabase.from('org_notifications').insert({
        organization_id: event.organizationId,
        user_id: member.user_id,
        type: 'EVIDENCE_EXPIRED',
        title: 'Evidence Renewal Required',
        message: `Evidence "${evidence.file_name}" has expired. A renewal task has been created.`,
        metadata: { evidenceId, taskId: task.id },
      });
      result.notificationsSent++;
    }
  }
}

/**
 * Handle policy review due trigger
 */
async function handlePolicyReviewDue(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const policyId = event.metadata?.policyId;

  if (!policyId) {
    result.errors.push('Policy ID missing in metadata');
    return;
  }

  // Get policy details
  const { data: policy } = await supabase
    .from('org_policies')
    .select('*')
    .eq('id', policyId)
    .single();

  if (!policy) {
    result.errors.push('Policy not found');
    return;
  }

  // Create review task
  const { data: task, error } = await supabase
    .from('org_tasks')
    .insert({
      organization_id: event.organizationId,
      title: `Review Policy: ${policy.title}`,
      description: `Policy "${policy.title}" is due for scheduled review.`,
      priority: 'standard',
      status: 'pending',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      linked_policy_id: policyId,
    })
    .select()
    .single();

  if (error) {
    result.errors.push(`Failed to create review task: ${error.message}`);
    return;
  }

  result.tasksCreated++;

  // Notify compliance officers
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .in('role', ['owner', 'admin', 'compliance_officer']);

  if (members) {
    for (const member of members) {
      await supabase.from('org_notifications').insert({
        organization_id: event.organizationId,
        user_id: member.user_id,
        type: 'POLICY_REVIEW_DUE',
        title: 'Policy Review Required',
        message: `Policy "${policy.title}" is due for review. A review task has been created.`,
        metadata: { policyId, taskId: task.id },
      });
      result.notificationsSent++;
    }
  }
}

/**
 * Handle control failure or incompletion trigger
 */
async function handleControlIssue(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const controlId = event.metadata?.controlId;
  const status = event.metadata?.status;

  if (!controlId) {
    result.errors.push('Control ID missing in metadata');
    return;
  }

  // Get control details
  const { data: control } = await supabase
    .from('compliance_controls')
    .select('*')
    .eq('id', controlId)
    .single();

  if (!control) {
    result.errors.push('Control not found');
    return;
  }

  const isCritical = event.type === 'control_failed';
  const priority = isCritical ? 'critical' : 'high';

  // Create remediation task
  const { data: task, error } = await supabase
    .from('org_tasks')
    .insert({
      organization_id: event.organizationId,
      title: `${isCritical ? 'Fix Failed Control' : 'Complete Control'}: ${control.title}`,
      description: `Control "${control.title}" ${isCritical ? 'has failed and requires immediate attention' : 'is incomplete and needs to be addressed'}.`,
      priority,
      status: 'pending',
      due_date: new Date(
        Date.now() + (isCritical ? 2 : 7) * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (error) {
    result.errors.push(`Failed to create remediation task: ${error.message}`);
    return;
  }

  result.tasksCreated++;

  // Escalate to owners and admins for critical issues
  const roles = isCritical
    ? ['owner', 'admin']
    : ['owner', 'admin', 'compliance_officer'];

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .in('role', roles);

  if (members) {
    for (const member of members) {
      await supabase.from('org_notifications').insert({
        organization_id: event.organizationId,
        user_id: member.user_id,
        type: isCritical ? 'CONTROL_FAILED' : 'CONTROL_INCOMPLETE',
        title: isCritical ? 'Critical Control Failure' : 'Control Incomplete',
        message: `Control "${control.title}" ${isCritical ? 'has failed' : 'is incomplete'}. A remediation task has been created.`,
        metadata: { controlId, taskId: task.id, status },
      });
      result.notificationsSent++;
    }
  }
}

/**
 * Handle organization onboarding trigger
 */
async function handleOrgOnboarding(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();

  // Create initial onboarding tasks
  const onboardingTasks = [
    {
      title: 'Complete Organization Profile',
      description:
        'Fill in your organization details including industry, team size, and frameworks.',
      priority: 'high',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Review Pre-loaded Policies',
      description:
        'Review and approve the policies that were pre-loaded for your industry.',
      priority: 'standard',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Invite Team Members',
      description:
        'Invite your compliance and operations team members to collaborate.',
      priority: 'standard',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Upload Initial Evidence',
      description:
        'Upload your existing compliance evidence and documentation.',
      priority: 'standard',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const taskData of onboardingTasks) {
    const { error } = await supabase.from('org_tasks').insert({
      organization_id: event.organizationId,
      ...taskData,
      status: 'pending',
    });

    if (error) {
      result.errors.push(
        `Failed to create onboarding task: ${error.message}`
      );
    } else {
      result.tasksCreated++;
    }
  }

  // Notify organization owner
  const { data: owner } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .eq('role', 'owner')
    .single();

  if (owner) {
    await supabase.from('org_notifications').insert({
      organization_id: event.organizationId,
      user_id: owner.user_id,
      type: 'ONBOARDING_STARTED',
      title: 'Welcome to FormaOS!',
      message: `Your onboarding tasks are ready. Complete them to get started with compliance automation.`,
      metadata: { tasksCreated: result.tasksCreated },
    });
    result.notificationsSent++;
  }
}

/**
 * Handle risk score change trigger
 */
async function handleRiskScoreChange(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const { previousRisk, newRisk, score } = event.metadata || {};

  if (!previousRisk || !newRisk) {
    result.errors.push('Risk level data missing in metadata');
    return;
  }

  // Only act on risk increases
  if (
    ['low', 'medium', 'high', 'critical'].indexOf(newRisk) <=
    ['low', 'medium', 'high', 'critical'].indexOf(previousRisk)
  ) {
    return;
  }

  // Create escalation task for high/critical risk
  if (newRisk === 'high' || newRisk === 'critical') {
    const { data: task, error } = await supabase
      .from('org_tasks')
      .insert({
        organization_id: event.organizationId,
        title: `${newRisk === 'critical' ? 'URGENT: ' : ''}Address Compliance Risk`,
        description: `Your compliance risk level has increased to ${newRisk.toUpperCase()} (score: ${score}). Immediate action is required to address compliance gaps.`,
        priority: newRisk === 'critical' ? 'critical' : 'high',
        status: 'pending',
        due_date: new Date(
          Date.now() + (newRisk === 'critical' ? 1 : 3) * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (error) {
      result.errors.push(
        `Failed to create risk escalation task: ${error.message}`
      );
    } else {
      result.tasksCreated++;
    }
  }

  // Notify all admins and owners
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .in('role', ['owner', 'admin']);

  if (members) {
    for (const member of members) {
      await supabase.from('org_notifications').insert({
        organization_id: event.organizationId,
        user_id: member.user_id,
        type: 'RISK_SCORE_CHANGE',
        title: `Compliance Risk Elevated to ${newRisk.toUpperCase()}`,
        message: `Your organization's compliance risk level has increased from ${previousRisk} to ${newRisk}. Score: ${score}`,
        metadata: { previousRisk, newRisk, score },
      });
      result.notificationsSent++;
    }
  }
}

/**
 * Handle task overdue trigger
 */
async function handleTaskOverdue(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const taskId = event.metadata?.taskId;

  if (!taskId) {
    result.errors.push('Task ID missing in metadata');
    return;
  }

  // Get task details
  const { data: task } = await supabase
    .from('org_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task || task.status === 'completed') {
    return;
  }

  // Calculate days overdue
  const daysOverdue = Math.floor(
    (Date.now() - new Date(task.due_date).getTime()) / (24 * 60 * 60 * 1000)
  );

  // Escalate to admins if significantly overdue
  const shouldEscalate = daysOverdue >= 3 || task.priority === 'critical';

  const roles = shouldEscalate
    ? ['owner', 'admin']
    : task.assigned_to
      ? []
      : ['owner', 'admin', 'compliance_officer'];

  // Notify assigned user
  if (task.assigned_to) {
    await supabase.from('org_notifications').insert({
      organization_id: event.organizationId,
      user_id: task.assigned_to,
      type: 'TASK_OVERDUE',
      title: 'Task Overdue',
      message: `Task "${task.title}" is ${daysOverdue} day(s) overdue.`,
      metadata: { taskId, daysOverdue },
    });
    result.notificationsSent++;
  }

  // Escalate if needed
  if (shouldEscalate) {
    const { data: members } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('organization_id', event.organizationId)
      .in('role', roles);

    if (members) {
      for (const member of members) {
        await supabase.from('org_notifications').insert({
          organization_id: event.organizationId,
          user_id: member.user_id,
          type: 'TASK_OVERDUE_ESCALATED',
          title: 'Overdue Task Escalation',
          message: `Critical task "${task.title}" is ${daysOverdue} day(s) overdue and requires immediate attention.`,
          metadata: { taskId, daysOverdue, priority: task.priority },
        });
        result.notificationsSent++;
      }
    }
  }
}

/**
 * Handle certification expiring trigger
 */
async function handleCertificationExpiring(
  event: TriggerEvent,
  result: AutomationResult
) {
  const supabase = createSupabaseAdminClient();
  const certificationId = event.metadata?.certificationId;
  const daysUntilExpiry = event.metadata?.daysUntilExpiry || 30;

  if (!certificationId) {
    result.errors.push('Certification ID missing in metadata');
    return;
  }

  // Get certification details
  const { data: cert } = await supabase
    .from('org_certifications')
    .select('*')
    .eq('id', certificationId)
    .single();

  if (!cert) {
    result.errors.push('Certification not found');
    return;
  }

  // Create renewal task
  const { data: task, error } = await supabase
    .from('org_tasks')
    .insert({
      organization_id: event.organizationId,
      title: `Renew Certification`,
      description: `Certification expires in ${daysUntilExpiry} days. Begin renewal process.`,
      priority: daysUntilExpiry <= 7 ? 'high' : 'standard',
      status: 'pending',
      due_date: new Date(
        Date.now() + Math.max(daysUntilExpiry - 7, 1) * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (error) {
    result.errors.push(`Failed to create renewal task: ${error.message}`);
    return;
  }

  result.tasksCreated++;

  // Notify compliance team
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', event.organizationId)
    .in('role', ['owner', 'admin', 'compliance_officer']);

  if (members) {
    for (const member of members) {
      await supabase.from('org_notifications').insert({
        organization_id: event.organizationId,
        user_id: member.user_id,
        type: 'CERTIFICATION_EXPIRING',
        title: 'Certification Renewal Required',
        message: `A certification expires in ${daysUntilExpiry} days. Renewal task has been created.`,
        metadata: { certificationId, taskId: task.id, daysUntilExpiry },
      });
      result.notificationsSent++;
    }
  }
}
