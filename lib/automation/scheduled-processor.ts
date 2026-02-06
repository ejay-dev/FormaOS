/**
 * Scheduled Automation Processor
 * Periodic checks for evidence expiry, policy reviews, overdue tasks, etc.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processTrigger, type TriggerEvent } from './trigger-engine';
import { updateComplianceScore } from './compliance-score-engine';

/**
 * Run all scheduled automation checks
 */
export async function runScheduledAutomation(): Promise<{
  checksRun: number;
  triggersExecuted: number;
  errors: string[];
}> {
  console.log('[Scheduled Automation] Starting scheduled checks...');

  const results = {
    checksRun: 0,
    triggersExecuted: 0,
    errors: [] as string[],
  };

  try {
    // Run all checks in parallel
    const [
      evidenceCheck,
      policyCheck,
      taskCheck,
      certCheck,
      scoreCheck,
    ] = await Promise.allSettled([
      checkExpiringEvidence(),
      checkPolicyReviews(),
      checkOverdueTasks(),
      checkExpiringCertifications(),
      updateAllComplianceScores(),
    ]);

    // Aggregate results
    const checkResults = [
      evidenceCheck,
      policyCheck,
      taskCheck,
      certCheck,
      scoreCheck,
    ];

    for (const result of checkResults) {
      results.checksRun++;
      if (result.status === 'fulfilled' && result.value) {
        results.triggersExecuted += result.value.triggersExecuted || 0;
        if (result.value.errors) {
          results.errors.push(...result.value.errors);
        }
      } else if (result.status === 'rejected') {
        results.errors.push(
          result.reason?.message || 'Unknown error in check'
        );
      }
    }

    console.log(
      `[Scheduled Automation] Completed: ${results.checksRun} checks, ${results.triggersExecuted} triggers`
    );
  } catch (error) {
    console.error('[Scheduled Automation] Fatal error:', error);
    results.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return results;
}

/**
 * Check for expiring evidence and trigger renewal tasks
 */
async function checkExpiringEvidence(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const results = { triggersExecuted: 0, errors: [] as string[] };

  // Define expiry window (evidence created > 90 days ago)
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() - 90);

  // Find evidence approaching expiry
  const { data: expiringEvidence, error } = await supabase
    .from('org_evidence')
    .select('id, organization_id, file_name, created_at')
    .lt('created_at', expiryThreshold.toISOString())
    .eq('verification_status', 'verified')
    .is('renewal_task_created', null); // Only if we haven't already created a renewal task

  if (error) {
    results.errors.push(`Error fetching expiring evidence: ${error.message}`);
    return results;
  }

  if (!expiringEvidence || expiringEvidence.length === 0) {
    return results;
  }

  console.log(
    `[Scheduled] Found ${expiringEvidence.length} expiring evidence items`
  );

  // Trigger renewal for each
  for (const evidence of expiringEvidence) {
    try {
      const triggerEvent: TriggerEvent = {
        type: 'evidence_expiry',
        organizationId: evidence.organization_id,
        entityId: evidence.id,
        entityType: 'evidence',
        metadata: {
          evidenceId: evidence.id,
          fileName: evidence.file_name,
          createdAt: evidence.created_at,
        },
        triggeredAt: new Date(),
      };

      await processTrigger(triggerEvent);
      results.triggersExecuted++;

      // Mark evidence as having a renewal task created
      await supabase
        .from('org_evidence')
        .update({ renewal_task_created: true })
        .eq('id', evidence.id);
    } catch (err) {
      results.errors.push(
        `Failed to process evidence ${evidence.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return results;
}

/**
 * Check for policies due for review
 */
async function checkPolicyReviews(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const results = { triggersExecuted: 0, errors: [] as string[] };

  // Policies not reviewed in 180 days
  const reviewThreshold = new Date();
  reviewThreshold.setDate(reviewThreshold.getDate() - 180);

  const { data: policiesDueReview, error } = await supabase
    .from('org_policies')
    .select('id, organization_id, title, last_updated_at')
    .or(`last_updated_at.lt.${reviewThreshold.toISOString()},last_updated_at.is.null`)
    .in('status', ['published', 'approved'])
    .is('review_task_created', null);

  if (error) {
    results.errors.push(`Error fetching policies for review: ${error.message}`);
    return results;
  }

  if (!policiesDueReview || policiesDueReview.length === 0) {
    return results;
  }

  console.log(
    `[Scheduled] Found ${policiesDueReview.length} policies due for review`
  );

  for (const policy of policiesDueReview) {
    try {
      const triggerEvent: TriggerEvent = {
        type: 'policy_review_due',
        organizationId: policy.organization_id,
        entityId: policy.id,
        entityType: 'policy',
        metadata: {
          policyId: policy.id,
          title: policy.title,
          lastUpdated: policy.last_updated_at,
        },
        triggeredAt: new Date(),
      };

      await processTrigger(triggerEvent);
      results.triggersExecuted++;

      // Mark policy as having review task created
      await supabase
        .from('org_policies')
        .update({ review_task_created: true })
        .eq('id', policy.id);
    } catch (err) {
      results.errors.push(
        `Failed to process policy ${policy.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return results;
}

/**
 * Check for overdue tasks and trigger escalations
 */
async function checkOverdueTasks(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const results = { triggersExecuted: 0, errors: [] as string[] };

  const now = new Date();

  // Find overdue tasks
  const { data: overdueTasks, error } = await supabase
    .from('org_tasks')
    .select('id, organization_id, title, due_date, priority, assigned_to')
    .eq('status', 'pending')
    .lt('due_date', now.toISOString())
    .is('escalation_sent', null);

  if (error) {
    results.errors.push(`Error fetching overdue tasks: ${error.message}`);
    return results;
  }

  if (!overdueTasks || overdueTasks.length === 0) {
    return results;
  }

  console.log(`[Scheduled] Found ${overdueTasks.length} overdue tasks`);

  for (const task of overdueTasks) {
    try {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(task.due_date).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      const triggerEvent: TriggerEvent = {
        type: 'task_overdue',
        organizationId: task.organization_id,
        entityId: task.id,
        entityType: 'task',
        metadata: {
          taskId: task.id,
          title: task.title,
          daysOverdue,
          priority: task.priority,
          assignedTo: task.assigned_to,
        },
        triggeredAt: new Date(),
      };

      await processTrigger(triggerEvent);
      results.triggersExecuted++;

      // Mark task as having escalation sent
      await supabase
        .from('org_tasks')
        .update({ escalation_sent: true })
        .eq('id', task.id);
    } catch (err) {
      results.errors.push(
        `Failed to process task ${task.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return results;
}

/**
 * Check for expiring certifications
 */
async function checkExpiringCertifications(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const results = { triggersExecuted: 0, errors: [] as string[] };

  // Check for certifications expiring in 30 days
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + 30);

  const { data: expiringCerts, error } = await supabase
    .from('org_certifications')
    .select('id, organization_id, framework_id, issued_at')
    .eq('status', 'issued')
    .is('renewal_task_created', null);

  if (error) {
    results.errors.push(
      `Error fetching certifications: ${error.message}`
    );
    return results;
  }

  if (!expiringCerts || expiringCerts.length === 0) {
    return results;
  }

  // Assume certifications are valid for 1 year
  const expiringWithinThreshold = expiringCerts.filter((cert) => {
    const issuedDate = new Date(cert.issued_at);
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate <= expiryThreshold;
  });

  console.log(
    `[Scheduled] Found ${expiringWithinThreshold.length} expiring certifications`
  );

  for (const cert of expiringWithinThreshold) {
    try {
      const issuedDate = new Date(cert.issued_at);
      const expiryDate = new Date(issuedDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      const triggerEvent: TriggerEvent = {
        type: 'certification_expiring',
        organizationId: cert.organization_id,
        entityId: cert.id,
        entityType: 'certification',
        metadata: {
          certificationId: cert.id,
          frameworkId: cert.framework_id,
          daysUntilExpiry,
        },
        triggeredAt: new Date(),
      };

      await processTrigger(triggerEvent);
      results.triggersExecuted++;

      // Mark certification as having renewal task created
      await supabase
        .from('org_certifications')
        .update({ renewal_task_created: true })
        .eq('id', cert.id);
    } catch (err) {
      results.errors.push(
        `Failed to process certification ${cert.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return results;
}

/**
 * Update compliance scores for all organizations
 */
async function updateAllComplianceScores(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const results = { triggersExecuted: 0, errors: [] as string[] };

  // Get all active organizations
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('onboarding_completed', true);

  if (error) {
    results.errors.push(`Error fetching organizations: ${error.message}`);
    return results;
  }

  if (!orgs || orgs.length === 0) {
    return results;
  }

  console.log(`[Scheduled] Updating scores for ${orgs.length} organizations`);

  // Update scores in batches
  const batchSize = 10;
  for (let i = 0; i < orgs.length; i += batchSize) {
    const batch = orgs.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (org) => {
        try {
          // Get previous score
          const { data: prevEval } = await supabase
            .from('org_control_evaluations')
            .select('compliance_score, details')
            .eq('organization_id', org.id)
            .single();

          // Update score
          await updateComplianceScore(org.id);
          results.triggersExecuted++;

          // Check for risk level changes
          if (prevEval?.details?.riskLevel) {
            const { data: currentEval } = await supabase
              .from('org_control_evaluations')
              .select('details, compliance_score')
              .eq('organization_id', org.id)
              .single();

            if (
              currentEval?.details?.riskLevel !==
              prevEval.details.riskLevel
            ) {
              const triggerEvent: TriggerEvent = {
                type: 'risk_score_change',
                organizationId: org.id,
                metadata: {
                  previousRisk: prevEval.details.riskLevel,
                  newRisk: currentEval.details.riskLevel,
                  score: currentEval.compliance_score,
                },
                triggeredAt: new Date(),
              };

              await processTrigger(triggerEvent);
            }
          }
        } catch (err) {
          results.errors.push(
            `Failed to update score for org ${org.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      })
    );
  }

  return results;
}

/**
 * Run specific scheduled check by type
 */
export async function runScheduledCheck(
  checkType:
    | 'evidence'
    | 'policies'
    | 'tasks'
    | 'certifications'
    | 'scores'
): Promise<any> {
  switch (checkType) {
    case 'evidence':
      return await checkExpiringEvidence();
    case 'policies':
      return await checkPolicyReviews();
    case 'tasks':
      return await checkOverdueTasks();
    case 'certifications':
      return await checkExpiringCertifications();
    case 'scores':
      return await updateAllComplianceScores();
    default:
      throw new Error(`Unknown check type: ${checkType}`);
  }
}
