/**
 * Automation Integration Helpers
 * Functions to integrate automation with existing server actions
 */

import { processEvent, type EventType } from './event-processor';
import { updateComplianceScore } from './compliance-score-engine';

/**
 * Trigger automation after evidence upload
 */
export async function onEvidenceUploaded(
  organizationId: string,
  evidenceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await processEvent({
      type: 'evidence_uploaded',
      organizationId,
      entityId: evidenceId,
      entityType: 'evidence',
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing evidence upload:', error);
    // Don't throw - automation failures shouldn't block main flow
  }
}

/**
 * Trigger automation after evidence verification
 */
export async function onEvidenceVerified(
  organizationId: string,
  evidenceId: string,
  verified: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await processEvent({
      type: verified ? 'evidence_verified' : 'evidence_rejected',
      organizationId,
      entityId: evidenceId,
      entityType: 'evidence',
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing evidence verification:', error);
  }
}

/**
 * Trigger automation after control status update
 */
export async function onControlStatusUpdated(
  organizationId: string,
  controlId: string,
  newStatus: string,
  previousStatus?: string
): Promise<void> {
  try {
    await processEvent({
      type: 'control_status_updated',
      organizationId,
      entityId: controlId,
      entityType: 'control',
      metadata: { newStatus, previousStatus },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing control status update:', error);
  }
}

/**
 * Trigger automation after task completion
 */
export async function onTaskCompleted(
  organizationId: string,
  taskId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await processEvent({
      type: 'task_completed',
      organizationId,
      entityId: taskId,
      entityType: 'task',
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing task completion:', error);
  }
}

/**
 * Trigger automation after task creation
 */
export async function onTaskCreated(
  organizationId: string,
  taskId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await processEvent({
      type: 'task_created',
      organizationId,
      entityId: taskId,
      entityType: 'task',
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing task creation:', error);
  }
}

/**
 * Trigger automation after subscription activation
 */
export async function onSubscriptionActivated(
  organizationId: string,
  subscriptionId: string
): Promise<void> {
  try {
    await processEvent({
      type: 'subscription_activated',
      organizationId,
      entityId: subscriptionId,
      entityType: 'subscription',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing subscription activation:', error);
  }
}

/**
 * Trigger automation after onboarding completion
 */
export async function onOnboardingCompleted(
  organizationId: string
): Promise<void> {
  try {
    await processEvent({
      type: 'onboarding_completed',
      organizationId,
      entityId: organizationId,
      entityType: 'organization',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Automation] Error processing onboarding completion:', error);
  }
}

/**
 * Update compliance score and check for risk changes
 * Safe to call frequently - caches results
 */
export async function updateComplianceScoreAndCheckRisk(
  organizationId: string
): Promise<void> {
  try {
    await updateComplianceScore(organizationId);
  } catch (error) {
    console.error('[Automation] Error updating compliance score:', error);
  }
}

/**
 * Batch update compliance scores for multiple organizations
 */
export async function batchUpdateComplianceScores(
  organizationIds: string[]
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (const orgId of organizationIds) {
    try {
      await updateComplianceScore(orgId);
      succeeded++;
    } catch (error) {
      console.error(`[Automation] Error updating score for org ${orgId}:`, error);
      failed++;
    }
  }

  return { succeeded, failed };
}
