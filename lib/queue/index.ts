/**
 * Job Queue - Barrel Export
 *
 * Persistent job queue backed by Upstash Redis sorted sets with
 * retry logic, exponential backoff, and dead letter queue.
 *
 * Quick start:
 *   import { getQueueClient, processQueueJobs } from '@/lib/queue';
 *
 *   // Enqueue a job
 *   const queue = getQueueClient();
 *   await queue.enqueue('email-send', { to: '...', subject: '...' });
 *
 *   // Process pending jobs (called from cron / API route)
 *   const result = await processQueueJobs();
 */

// Types
export type {
  Job,
  JobType,
  JobState,
  JobPayload,
  JobHandler,
  JobHandlerMap,
  ComplianceExportPayload,
  ReportExportPayload,
  EmailSendPayload,
  WebhookDeliveryPayload,
  AutomationTriggerPayload,
  EnqueueResult,
  ProcessResult,
  QueueStats,
  QueueConfig,
} from './types';

export { QUEUE_KEYS, DEFAULT_QUEUE_CONFIG } from './types';

// Client
export { QueueClient, getQueueClient } from './client';

// Processor
export {
  QueueProcessor,
  getDefaultProcessor,
  processQueueJobs,
} from './processor';
