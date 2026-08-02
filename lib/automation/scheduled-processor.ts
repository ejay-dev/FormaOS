/**
 * Scheduled Automation Processor
 * Periodic checks for evidence expiry, policy reviews, overdue tasks, etc.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processTrigger, type TriggerEvent } from './trigger-engine';
import { updateComplianceScore } from './compliance-score-engine';
import { runBillingReconciliation } from '@/lib/billing/nightly-reconciliation';
import { scanAllForEntitlementDrift } from '@/lib/billing/entitlement-drift-detector';
import { automationLogger } from '@/lib/observability/structured-logger';

/**
 * Run all scheduled automation checks
 */
export async function runScheduledAutomation(): Promise<{
  checksRun: number;
  triggersExecuted: number;
  errors: string[];
}> {
  automationLogger.info('scheduled_checks_started');

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
      billingCheck,
      entitlementCheck,
    ] = await Promise.allSettled([
      checkExpiringEvidence(),
      checkPolicyReviews(),
      checkOverdueTasks(),
      checkExpiringCertifications(),
      updateAllComplianceScores(),
      runBillingReconciliationJob(),
      runEntitlementDriftCheck(),
    ]);

    // Aggregate results
    const checkResults = [
      evidenceCheck,
      policyCheck,
      taskCheck,
      certCheck,
      scoreCheck,
      billingCheck,
      entitlementCheck,
    ];

    for (const result of checkResults) {
      results.checksRun++;
      if (result.status === 'fulfilled' && result.value) {
        results.triggersExecuted += result.value.triggersExecuted || 0;
        if (result.value.errors) {
          results.errors.push(...result.value.errors);
        }
      } else if (result.status === 'rejected') {
        results.errors.push(result.reason?.message || 'Unknown error in check');
      }
    }

    automationLogger.info('scheduled_checks_completed', {
      checksRun: results.checksRun,
      triggersExecuted: results.triggersExecuted,
    });
  } catch (error) {
    automationLogger.error(
      'scheduled_checks_fatal',
      error instanceof Error ? error : new Error(String(error)),
    );
    results.errors.push(
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  return results;
}

// PostgREST caps every select at its `max_rows` setting and truncates the
// response silently, so marker lookups are walked in explicit ordered pages and
// their filter lists are chunked to keep the request URL bounded.
const MARKER_PAGE_SIZE = 500;
const MARKER_FILTER_CHUNK_SIZE = 100;

// The overdue check only considers tasks that crossed their due date recently.
// Without the window it would replay the entire historic backlog at every
// organization on its first run.
const OVERDUE_LOOKBACK_DAYS = 7;
const MAX_OVERDUE_TASKS_PER_RUN = 200;
const OVERDUE_TRIGGER_CONCURRENCY = 10;

function chunkValues<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

/**
 * De-duplication marker for the nightly checks below.
 *
 * The checks used to gate on `renewal_task_created` / `review_task_created` /
 * `escalation_sent` marker columns, which exist on none of these tables in
 * production. Each trigger handler in trigger-engine.ts instead writes an
 * org_notifications row carrying the source record id in `data`, so that row is
 * what tells us a record has already been processed.
 */
async function alreadyNotifiedIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  types: string[],
  dataKey: string,
  orgIds: string[],
): Promise<Set<string>> {
  const seen = new Set<string>();
  const uniqueOrgIds = Array.from(new Set(orgIds));

  if (uniqueOrgIds.length === 0) {
    return seen;
  }

  for (const orgChunk of chunkValues(uniqueOrgIds, MARKER_FILTER_CHUNK_SIZE)) {
    for (let offset = 0; ; offset += MARKER_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('org_notifications')
        .select('id, data')
        .in('type', types)
        .in('org_id', orgChunk)
        .order('id', { ascending: true })
        .range(offset, offset + MARKER_PAGE_SIZE - 1);

      if (error) {
        throw new Error(
          `Error fetching ${types.join('/')} notifications: ${error.message}`,
        );
      }

      const rows = (data ?? []) as Array<{
        id: string;
        data: Record<string, unknown> | null;
      }>;

      for (const row of rows) {
        const value = row.data?.[dataKey];
        if (typeof value === 'string') {
          seen.add(value);
        }
      }

      if (rows.length < MARKER_PAGE_SIZE) break;
    }
  }

  return seen;
}

/**
 * Second de-duplication marker, for the checks whose handler creates a task
 * before it writes any notification.
 *
 * The notification write can legitimately fail — org_notifications.user_id is
 * NOT NULL and an organization may have no owner, admin or compliance officer —
 * and the notification marker alone would then let the next run create another
 * task for the same record, every night, forever. The handlers build these
 * titles verbatim from the source record, so an existing task with that title
 * is the marker for the side effect that actually happened first.
 *
 * Keyed on org_tasks.entity_id, which trigger-engine.ts stamps with the source
 * record id. Titles are NOT unique — production has 79 colliding
 * (organization_id, file_name) pairs — so a title-keyed marker silently
 * suppresses genuinely distinct records.
 *
 * Returns the set of `${organization_id}::${entity_id}` pairs that already exist.
 */
async function existingTaskEntityIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: Array<{ organizationId: string; entityId: string }>,
): Promise<Set<string>> {
  const seen = new Set<string>();

  if (rows.length === 0) {
    return seen;
  }

  for (const batch of chunkValues(rows, MARKER_FILTER_CHUNK_SIZE)) {
    const orgIds = Array.from(new Set(batch.map((row) => row.organizationId)));
    const entityIds = Array.from(new Set(batch.map((row) => row.entityId)));

    for (let offset = 0; ; offset += MARKER_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('org_tasks')
        .select('id, organization_id, entity_id')
        .in('organization_id', orgIds)
        .in('entity_id', entityIds)
        .order('id', { ascending: true })
        .range(offset, offset + MARKER_PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Error fetching existing tasks: ${error.message}`);
      }

      const found = (data ?? []) as Array<{
        id: string;
        organization_id: string;
        entity_id: string | null;
      }>;

      for (const task of found) {
        if (task.entity_id) seen.add(`${task.organization_id}::${task.entity_id}`);
      }

      if (found.length < MARKER_PAGE_SIZE) break;
    }
  }

  return seen;
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
    .eq('verification_status', 'verified');

  if (error) {
    results.errors.push(`Error fetching expiring evidence: ${error.message}`);
    return results;
  }

  if (!expiringEvidence || expiringEvidence.length === 0) {
    return results;
  }

  // Only evidence we haven't already raised a renewal for.
  let notified: Set<string>;
  try {
    notified = await alreadyNotifiedIds(
      supabase,
      ['EVIDENCE_EXPIRED'],
      'evidenceId',
      expiringEvidence.map(
        (evidence: { organization_id: string }) => evidence.organization_id,
      ),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching notifications',
    );
    return results;
  }

  const notNotifiedEvidence = expiringEvidence.filter(
    (evidence: { id: string }) => !notified.has(evidence.id),
  );

  if (notNotifiedEvidence.length === 0) {
    return results;
  }

  // handleEvidenceExpiry titles its renewal task `Renew Evidence: <file_name>`.
  let renewalTasks: Set<string>;
  try {
    renewalTasks = await existingTaskEntityIds(
      supabase,
      notNotifiedEvidence.map((evidence: { organization_id: string; id: string }) => ({
        organizationId: evidence.organization_id,
        entityId: evidence.id,
      })),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching existing tasks',
    );
    return results;
  }

  const pendingEvidence = notNotifiedEvidence.filter(
    (evidence: { organization_id: string; id: string }) =>
      !renewalTasks.has(`${evidence.organization_id}::${evidence.id}`),
  );

  if (pendingEvidence.length === 0) {
    return results;
  }

  automationLogger.info('expiring_evidence_found', {
    count: pendingEvidence.length,
  });

  // Trigger renewal for each
  for (const evidence of pendingEvidence) {
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

      const outcome = await processTrigger(triggerEvent);
      results.triggersExecuted++;

      if (outcome.errors.length > 0) {
        results.errors.push(
          ...outcome.errors.map(
            (message) => `Evidence ${evidence.id}: ${message}`,
          ),
        );
      }
    } catch (err) {
      results.errors.push(
        `Failed to process evidence ${evidence.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
    .select('id, organization_id, title, updated_at')
    .or(`updated_at.lt.${reviewThreshold.toISOString()},updated_at.is.null`)
    .in('status', ['published', 'approved']);

  if (error) {
    results.errors.push(`Error fetching policies for review: ${error.message}`);
    return results;
  }

  if (!policiesDueReview || policiesDueReview.length === 0) {
    return results;
  }

  // Only policies we haven't already raised a review for.
  let notified: Set<string>;
  try {
    notified = await alreadyNotifiedIds(
      supabase,
      ['POLICY_REVIEW_DUE'],
      'policyId',
      policiesDueReview.map(
        (policy: { organization_id: string }) => policy.organization_id,
      ),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching notifications',
    );
    return results;
  }

  const notNotifiedPolicies = policiesDueReview.filter(
    (policy: { id: string }) => !notified.has(policy.id),
  );

  if (notNotifiedPolicies.length === 0) {
    return results;
  }

  // handlePolicyReviewDue stamps its review task with entity_id = policy id.
  let reviewTasks: Set<string>;
  try {
    reviewTasks = await existingTaskEntityIds(
      supabase,
      notNotifiedPolicies.map((policy: { organization_id: string; id: string }) => ({
        organizationId: policy.organization_id,
        entityId: policy.id,
      })),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching existing tasks',
    );
    return results;
  }

  const pendingPolicies = notNotifiedPolicies.filter(
    (policy: { organization_id: string; id: string }) =>
      !reviewTasks.has(`${policy.organization_id}::${policy.id}`),
  );

  if (pendingPolicies.length === 0) {
    return results;
  }

  automationLogger.info('policies_due_review_found', {
    count: pendingPolicies.length,
  });

  for (const policy of pendingPolicies) {
    try {
      const triggerEvent: TriggerEvent = {
        type: 'policy_review_due',
        organizationId: policy.organization_id,
        entityId: policy.id,
        entityType: 'policy',
        metadata: {
          policyId: policy.id,
          title: policy.title,
          lastUpdated: policy.updated_at,
        },
        triggeredAt: new Date(),
      };

      const outcome = await processTrigger(triggerEvent);
      results.triggersExecuted++;

      if (outcome.errors.length > 0) {
        results.errors.push(
          ...outcome.errors.map((message) => `Policy ${policy.id}: ${message}`),
        );
      }
    } catch (err) {
      results.errors.push(
        `Failed to process policy ${policy.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
  const overdueSince = new Date(now);
  overdueSince.setDate(overdueSince.getDate() - OVERDUE_LOOKBACK_DAYS);

  // Find tasks that went overdue inside the lookback window, newest first, so a
  // long-standing backlog can never be escalated in a single run.
  const { data: overdueTasks, error } = await supabase
    .from('org_tasks')
    .select('id, organization_id, title, due_date, priority, assigned_to')
    .eq('status', 'pending')
    .lt('due_date', now.toISOString())
    .gte('due_date', overdueSince.toISOString())
    .order('due_date', { ascending: false })
    .limit(MAX_OVERDUE_TASKS_PER_RUN);

  if (error) {
    results.errors.push(`Error fetching overdue tasks: ${error.message}`);
    return results;
  }

  if (!overdueTasks || overdueTasks.length === 0) {
    return results;
  }

  // Only tasks we haven't already escalated.
  let notified: Set<string>;
  try {
    notified = await alreadyNotifiedIds(
      supabase,
      ['TASK_OVERDUE', 'TASK_OVERDUE_ESCALATED'],
      'taskId',
      overdueTasks.map(
        (task: { organization_id: string }) => task.organization_id,
      ),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching notifications',
    );
    return results;
  }

  const pendingTasks = overdueTasks.filter(
    (task: { id: string }) => !notified.has(task.id),
  );

  if (pendingTasks.length === 0) {
    return results;
  }

  automationLogger.info('overdue_tasks_found', { count: pendingTasks.length });

  for (const batch of chunkValues(pendingTasks, OVERDUE_TRIGGER_CONCURRENCY)) {
    await Promise.all(
      batch.map(
        async (task: {
          id: string;
          organization_id: string;
          title: string;
          due_date: string;
          priority: string | null;
          assigned_to: string | null;
        }) => {
          try {
            const daysOverdue = Math.floor(
              (now.getTime() - new Date(task.due_date).getTime()) /
                (24 * 60 * 60 * 1000),
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

            const outcome = await processTrigger(triggerEvent);
            results.triggersExecuted++;

            if (outcome.errors.length > 0) {
              results.errors.push(
                ...outcome.errors.map(
                  (message) => `Task ${task.id}: ${message}`,
                ),
              );
            }
          } catch (err) {
            results.errors.push(
              `Failed to process task ${task.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
          }
        },
      ),
    );
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
    .eq('status', 'issued');

  if (error) {
    results.errors.push(`Error fetching certifications: ${error.message}`);
    return results;
  }

  if (!expiringCerts || expiringCerts.length === 0) {
    return results;
  }

  // Assume certifications are valid for 1 year
  const expiringWithinThreshold = expiringCerts.filter(
    (cert: {
      id: string;
      organization_id: string;
      framework_id: string;
      issued_at: string;
    }) => {
      const issuedDate = new Date(cert.issued_at);
      const expiryDate = new Date(issuedDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      return expiryDate <= expiryThreshold;
    },
  );

  // Only certifications we haven't already raised a renewal for.
  let notified: Set<string>;
  try {
    notified = await alreadyNotifiedIds(
      supabase,
      ['CERTIFICATION_EXPIRING'],
      'certificationId',
      expiringWithinThreshold.map(
        (cert: { organization_id: string }) => cert.organization_id,
      ),
    );
  } catch (err) {
    results.errors.push(
      err instanceof Error ? err.message : 'Unknown error fetching notifications',
    );
    return results;
  }

  const pendingCerts = expiringWithinThreshold.filter(
    (cert: { id: string }) => !notified.has(cert.id),
  );

  automationLogger.info('expiring_certifications_found', {
    count: pendingCerts.length,
  });

  for (const cert of pendingCerts) {
    try {
      const issuedDate = new Date(cert.issued_at);
      const expiryDate = new Date(issuedDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
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

      const outcome = await processTrigger(triggerEvent);
      results.triggersExecuted++;

      if (outcome.errors.length > 0) {
        results.errors.push(
          ...outcome.errors.map(
            (message) => `Certification ${cert.id}: ${message}`,
          ),
        );
      }
    } catch (err) {
      results.errors.push(
        `Failed to process certification ${cert.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
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

  automationLogger.info('compliance_scores_updating', {
    orgCount: orgs.length,
  });

  // Update scores in batches
  const batchSize = 10;
  for (let i = 0; i < orgs.length; i += batchSize) {
    const batch = orgs.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (org: { id: string }) => {
        try {
          // Get previous score
          const { data: prevEval } = await supabase
            .from('org_control_evaluations')
            .select('compliance_score, details')
            .eq('organization_id', org.id)
            .maybeSingle();

          // Update score
          await updateComplianceScore(org.id);
          results.triggersExecuted++;

          // Check for risk level changes
          if (prevEval?.details?.riskLevel) {
            const { data: currentEval } = await supabase
              .from('org_control_evaluations')
              .select('details, compliance_score')
              .eq('organization_id', org.id)
              .maybeSingle();

            if (
              currentEval &&
              currentEval.details?.riskLevel !== prevEval.details.riskLevel
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

              const outcome = await processTrigger(triggerEvent);

              if (outcome.errors.length > 0) {
                results.errors.push(
                  ...outcome.errors.map(
                    (message) => `Org ${org.id}: ${message}`,
                  ),
                );
              }
            }
          }
        } catch (err) {
          results.errors.push(
            `Failed to update score for org ${org.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }),
    );
  }

  return results;
}

/**
 * Run billing reconciliation job
 */
async function runBillingReconciliationJob(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const results = { triggersExecuted: 0, errors: [] as string[] };

  try {
    automationLogger.info('billing_reconciliation_started');
    const reconciliation = await runBillingReconciliation();

    results.triggersExecuted = reconciliation.autoFixed;
    results.errors.push(...reconciliation.errors);

    automationLogger.info('billing_reconciliation_completed', {
      checked: reconciliation.checked,
      discrepancies: reconciliation.discrepancies.length,
      autoFixed: reconciliation.autoFixed,
      duration: reconciliation.duration,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.errors.push(`Billing reconciliation failed: ${error}`);
    automationLogger.error(
      'billing_reconciliation_failed',
      err instanceof Error ? err : new Error(error),
    );
  }

  return results;
}

/**
 * Run entitlement drift check
 */
async function runEntitlementDriftCheck(): Promise<{
  triggersExecuted: number;
  errors: string[];
}> {
  const results = { triggersExecuted: 0, errors: [] as string[] };

  try {
    automationLogger.info('entitlement_drift_check_started');
    const driftScan = await scanAllForEntitlementDrift({
      autoFix: true,
      limit: 500,
    });

    results.triggersExecuted = driftScan.autoFixed;
    results.errors.push(...driftScan.errors);

    automationLogger.info('entitlement_drift_check_completed', {
      scanned: driftScan.scanned,
      withDrift: driftScan.withDrift,
      autoFixed: driftScan.autoFixed,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.errors.push(`Entitlement drift check failed: ${error}`);
    automationLogger.error(
      'entitlement_drift_check_failed',
      err instanceof Error ? err : new Error(error),
    );
  }

  return results;
}

/**
 * Run specific scheduled check by type
 */
export async function runScheduledCheck(
  checkType: 'evidence' | 'policies' | 'tasks' | 'certifications' | 'scores',
): Promise<{ triggersExecuted: number; errors: string[] }> {
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
