/**
 * Compliance Workflow Trigger Engine
 * Automated task and workflow generation triggered by compliance events
 */

import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { updateComplianceScore } from './compliance-score-engine';
import { automationLogger } from '@/lib/observability/structured-logger';
import { insertOrgTaskCompat } from '@/lib/tasks/persistence';

// Maximum recursion depth for trigger chains
const MAX_TRIGGER_DEPTH = 5;

export type TriggerType =
  | 'evidence_expiry'
  | 'policy_review_due'
  | 'control_failed'
  | 'control_incomplete'
  | 'org_onboarding'
  | 'onboarding_milestone'
  | 'industry_configured'
  | 'frameworks_provisioned'
  | 'industry_pack_applied'
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
 * org_notifications is (id, org_id, user_id, type, title, body, data, read_at,
 * created_at). The org column is stamped by the org-scoped client; there is no
 * `organization_id`, `message` or `metadata` column on the table.
 */
async function insertNotification(
  supabase: ReturnType<typeof createSupabaseOrgClient>,
  result: AutomationResult,
  payload: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from('org_notifications').insert(payload);

  if (error) {
    result.errors.push(
      `Failed to create ${payload.type} notification: ${error.message}`,
    );
    return;
  }

  result.notificationsSent++;
}

/**
 * Process trigger events and execute appropriate automations
 * @param event - The trigger event to process
 * @param depth - Current recursion depth (internal use)
 */
export async function processTrigger(
  event: TriggerEvent,
  depth: number = 0,
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
    result.errors.push(
      `Max trigger recursion depth reached (${MAX_TRIGGER_DEPTH})`,
    );
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
      case 'onboarding_milestone':
        await handleOnboardingMilestone(event, result);
        break;
      case 'industry_configured':
        await handleIndustryConfigured(event, result);
        break;
      case 'frameworks_provisioned':
        await handleFrameworksProvisioned(event, result);
        break;
      case 'industry_pack_applied':
        await handleIndustryPackApplied(event, result);
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
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  return result;
}

/**
 * Handle evidence expiry trigger
 */
async function handleEvidenceExpiry(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
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
    .maybeSingle();

  if (!evidence) {
    result.errors.push('Evidence not found');
    return;
  }

  // Create renewal task
  let task: { id: string } | null = null;
  try {
    const inserted = await insertOrgTaskCompat(
      supabase,
      {
        organization_id: event.organizationId,
        // entity_id is the precise dedupe key the nightly sweep in
        // scheduled-processor.ts uses to tell whether this record already has a
        // task. Titles are not unique — production has 79 (organization_id,
        // file_name) collisions — so keying on the title alone silently
        // suppresses distinct records.
        entity_id: evidence.id,
        title: `Renew Evidence: ${evidence.file_name}`,
        description: `Evidence "${evidence.file_name}" has expired and needs to be renewed.`,
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        linked_policy_id: evidence.org_tasks?.linked_policy_id,
      },
      { returning: 'single' },
    );
    task = inserted.data as { id: string } | null;
  } catch (error) {
    result.errors.push(
      `Failed to create renewal task: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    return;
  }

  if (!task?.id) {
    result.errors.push('Failed to create renewal task: task row was not returned');
    return;
  }

  result.tasksCreated++;

  // Find compliance officers to notify
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .in('role', ['owner', 'admin', 'compliance_officer']);

  // Create notifications
  if (members) {
    for (const member of members) {
      await insertNotification(supabase, result, {
        user_id: member.user_id,
        type: 'EVIDENCE_EXPIRED',
        title: 'Evidence Renewal Required',
        body: `Evidence "${evidence.file_name}" has expired. A renewal task has been created.`,
        data: { evidenceId, taskId: task.id },
      });
    }
  }
}

/**
 * Handle policy review due trigger
 */
async function handlePolicyReviewDue(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
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
    .maybeSingle();

  if (!policy) {
    result.errors.push('Policy not found');
    return;
  }

  // Create review task
  let task: { id: string } | null = null;
  try {
    const inserted = await insertOrgTaskCompat(
      supabase,
      {
        organization_id: event.organizationId,
        entity_id: policyId,
        title: `Review Policy: ${policy.title}`,
        description: `Policy "${policy.title}" is due for scheduled review.`,
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        linked_policy_id: policyId,
      },
      { returning: 'single' },
    );
    task = inserted.data as { id: string } | null;
  } catch (error) {
    result.errors.push(
      `Failed to create review task: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    return;
  }

  if (!task?.id) {
    result.errors.push('Failed to create review task: task row was not returned');
    return;
  }

  result.tasksCreated++;

  // Notify compliance officers
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .in('role', ['owner', 'admin', 'compliance_officer']);

  if (members) {
    for (const member of members) {
      await insertNotification(supabase, result, {
        user_id: member.user_id,
        type: 'POLICY_REVIEW_DUE',
        title: 'Policy Review Required',
        body: `Policy "${policy.title}" is due for review. A review task has been created.`,
        data: { policyId, taskId: task.id },
      });
    }
  }
}

/**
 * Handle control failure or incompletion trigger
 */
async function handleControlIssue(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
  const controlId = event.metadata?.controlId;
  const status = event.metadata?.status;

  if (!controlId) {
    result.errors.push('Control ID missing in metadata');
    return;
  }

  // compliance_controls is a global catalog (not tenant-scoped). Use the
  // raw admin client for this lookup; tenant isolation comes from the
  // surrounding org-scoped writes that follow.
  const { data: control } = await supabase.unsafeAdmin()
    .from('compliance_controls')
    .select('*')
    .eq('id', controlId)
    .maybeSingle();

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
        Date.now() + (isCritical ? 2 : 7) * 24 * 60 * 60 * 1000,
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
    .in('role', roles);

  if (members) {
    for (const member of members) {
      await insertNotification(supabase, result, {
        user_id: member.user_id,
        type: isCritical ? 'CONTROL_FAILED' : 'CONTROL_INCOMPLETE',
        title: isCritical ? 'Critical Control Failure' : 'Control Incomplete',
        body: `Control "${control.title}" ${isCritical ? 'has failed' : 'is incomplete'}. A remediation task has been created.`,
        data: { controlId, taskId: task.id, status },
      });
    }
  }
}

/**
 * Handle organization onboarding trigger
 * Enhanced with industry awareness and milestone tracking
 */
async function handleOrgOnboarding(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);

  // Get organization details for industry-specific setup
  const { data: org } = await supabase
    .from('organizations')
    .select('industry, name')
    .eq('id', event.organizationId)
    .maybeSingle();

  const industry = org?.industry || 'other';

  automationLogger.info('onboarding_started', {
    orgId: event.organizationId,
    industry,
    metadata: event.metadata,
  });

  // Create initial onboarding tasks (industry-aware)
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
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Invite Team Members',
      description:
        'Invite your compliance and operations team members to collaborate.',
      priority: 'medium',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Upload Initial Evidence',
      description:
        'Upload your existing compliance evidence and documentation.',
      priority: 'medium',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const taskData of onboardingTasks) {
    try {
      await insertOrgTaskCompat(supabase, {
        organization_id: event.organizationId,
        ...taskData,
        status: 'pending',
      });
      result.tasksCreated++;
    } catch (error) {
      result.errors.push(
        `Failed to create onboarding task: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  // Notify organization owner
  const { data: owner } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('role', 'owner')
    .maybeSingle();

  if (owner) {
    await insertNotification(supabase, result, {
      user_id: owner.user_id,
      type: 'ONBOARDING_STARTED',
      title: 'Welcome to FormaOS!',
      body: `Your onboarding tasks are ready. Complete them to get started with compliance automation.`,
      data: { tasksCreated: result.tasksCreated, industry },
    });
  }

  automationLogger.info('onboarding_automation_completed', {
    orgId: event.organizationId,
    tasksCreated: result.tasksCreated,
    notificationsSent: result.notificationsSent,
  });
}

/**
 * Handle onboarding milestone trigger
 * Tracks progress through onboarding phases
 */
async function handleOnboardingMilestone(
  event: TriggerEvent,
  _result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
  const milestone = event.metadata?.milestone || 'unknown';

  automationLogger.info('onboarding_milestone_reached', {
    orgId: event.organizationId,
    milestone,
  });

  // Update org onboarding status
  await supabase
    .from('org_onboarding_status')
    .update({
      last_milestone: milestone,
      last_milestone_at: new Date().toISOString(),
    });
}

/**
 * Handle industry configuration trigger
 * Fired when organization selects their industry
 */
async function handleIndustryConfigured(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
  const industry = event.metadata?.industry;

  automationLogger.info('industry_configured', {
    orgId: event.organizationId,
    industry,
  });

  // Check if industry pack was already applied
  const { data: org } = await supabase
    .from('organizations')
    .select('industry')
    .eq('id', event.organizationId)
    .maybeSingle();

  if (org?.industry && org.industry !== 'other') {
    // Industry pack should trigger compliance scoring
    await updateComplianceScore(event.organizationId);
    result.workflowsExecuted++;
  }
}

/**
 * Handle frameworks provisioned trigger
 * Fired after framework controls are provisioned
 */
async function handleFrameworksProvisioned(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
  const frameworks = event.metadata?.frameworks || [];

  automationLogger.info('frameworks_provisioned', {
    orgId: event.organizationId,
    frameworks,
    count: frameworks.length,
  });

  // Create reminder task for control completion
  try {
    await insertOrgTaskCompat(supabase, {
      organization_id: event.organizationId,
      title: 'Complete Framework Controls',
      description: `Your ${frameworks.length} framework(s) have been provisioned. Start completing controls to improve your compliance score.`,
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    result.tasksCreated++;
  } catch {
    // Best-effort task creation; scoring and notifications continue.
  }

  // Trigger initial compliance scoring
  await updateComplianceScore(event.organizationId);
  result.workflowsExecuted++;

  // Notify about framework activation
  const { data: owner } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('role', 'owner')
    .maybeSingle();

  if (owner) {
    await insertNotification(supabase, result, {
      user_id: owner.user_id,
      type: 'FRAMEWORKS_ACTIVATED',
      title: 'Compliance Frameworks Activated',
      body: `${frameworks.length} framework(s) have been provisioned and are ready for control completion.`,
      data: { frameworks },
    });
  }
}

/**
 * Handle industry pack applied trigger
 * Fired after industry-specific policies, tasks, and assets are created
 */
async function handleIndustryPackApplied(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
  const industry = event.metadata?.industry;
  const packName = event.metadata?.packName;

  automationLogger.info('industry_pack_applied', {
    orgId: event.organizationId,
    industry,
    packName,
  });

  // Update compliance score after industry pack application
  await updateComplianceScore(event.organizationId);
  result.workflowsExecuted++;

  // Notify about industry pack activation
  const { data: owner } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('role', 'owner')
    .maybeSingle();

  if (owner) {
    await insertNotification(supabase, result, {
      user_id: owner.user_id,
      type: 'INDUSTRY_PACK_APPLIED',
      title: 'Industry Pack Activated',
      body: `${packName || 'Industry-specific'} resources have been added to your organization.`,
      data: { industry, packName },
    });
  }
}

/**
 * Handle risk score change trigger
 */
async function handleRiskScoreChange(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
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
    try {
      await insertOrgTaskCompat(supabase, {
        organization_id: event.organizationId,
        title: `${newRisk === 'critical' ? 'URGENT: ' : ''}Address Compliance Risk`,
        description: `Your compliance risk level has increased to ${newRisk.toUpperCase()} (score: ${score}). Immediate action is required to address compliance gaps.`,
        priority: newRisk === 'critical' ? 'critical' : 'high',
        status: 'pending',
        due_date: new Date(
          Date.now() + (newRisk === 'critical' ? 1 : 3) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
      result.tasksCreated++;
    } catch (error) {
      result.errors.push(
        `Failed to create risk escalation task: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  // Notify all admins and owners
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .in('role', ['owner', 'admin']);

  if (members) {
    for (const member of members) {
      await insertNotification(supabase, result, {
        user_id: member.user_id,
        type: 'RISK_SCORE_CHANGE',
        title: `Compliance Risk Elevated to ${newRisk.toUpperCase()}`,
        body: `Your organization's compliance risk level has increased from ${previousRisk} to ${newRisk}. Score: ${score}`,
        data: { previousRisk, newRisk, score },
      });
    }
  }
}

/**
 * Handle task overdue trigger
 */
async function handleTaskOverdue(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
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
    .maybeSingle();

  if (!task || task.status === 'completed') {
    return;
  }

  // Calculate days overdue
  const daysOverdue = Math.floor(
    (Date.now() - new Date(task.due_date).getTime()) / (24 * 60 * 60 * 1000),
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
    await insertNotification(supabase, result, {
      user_id: task.assigned_to,
      type: 'TASK_OVERDUE',
      title: 'Task Overdue',
      body: `Task "${task.title}" is ${daysOverdue} day(s) overdue.`,
      data: { taskId, daysOverdue },
    });
  }

  // Escalate if needed
  if (shouldEscalate) {
    const { data: members } = await supabase
      .from('org_members')
      .select('user_id')
      .in('role', roles);

    if (members) {
      for (const member of members) {
        await insertNotification(supabase, result, {
          user_id: member.user_id,
          type: 'TASK_OVERDUE_ESCALATED',
          title: 'Overdue Task Escalation',
          body: `Critical task "${task.title}" is ${daysOverdue} day(s) overdue and requires immediate attention.`,
          data: { taskId, daysOverdue, priority: task.priority },
        });
      }
    }
  }
}

/**
 * Handle certification expiring trigger
 */
async function handleCertificationExpiring(
  event: TriggerEvent,
  result: AutomationResult,
) {
  const supabase = createSupabaseOrgClient(event.organizationId);
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
    .maybeSingle();

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
        Date.now() + Math.max(daysUntilExpiry - 7, 1) * 24 * 60 * 60 * 1000,
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
    .in('role', ['owner', 'admin', 'compliance_officer']);

  if (members) {
    for (const member of members) {
      await insertNotification(supabase, result, {
        user_id: member.user_id,
        type: 'CERTIFICATION_EXPIRING',
        title: 'Certification Renewal Required',
        body: `A certification expires in ${daysUntilExpiry} days. Renewal task has been created.`,
        data: { certificationId, taskId: task.id, daysUntilExpiry },
      });
    }
  }
}
