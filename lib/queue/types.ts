/**
 * Job Queue Type Definitions
 *
 * Persistent job queue backed by Upstash Redis sorted sets.
 * Supports retry with exponential backoff, TTL-based cleanup,
 * and dead letter queue for failed jobs.
 */

// ---------------------------------------------------------------------------
// Job types
// ---------------------------------------------------------------------------

export type JobType =
  | 'compliance-export'
  | 'report-export'
  | 'enterprise-export'
  | 'email-send'
  | 'webhook-delivery'
  | 'automation-trigger';

// ---------------------------------------------------------------------------
// Job states
// ---------------------------------------------------------------------------

export type JobState =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'dead';

// ---------------------------------------------------------------------------
// Job payloads (per-type)
// ---------------------------------------------------------------------------

export interface ComplianceExportPayload {
  /** Compliance export job ID in `compliance_export_jobs`. */
  jobId?: string;
  organizationId: string;
  frameworkId: string;
  format: 'pdf' | 'csv' | 'json';
  requestedBy: string;
}

export interface ReportExportPayload {
  /** Report export job ID in `report_export_jobs`. */
  jobId?: string;
  organizationId: string;
  reportType: string;
  dateRange?: { start: string; end: string };
  requestedBy: string;
}

export interface EnterpriseExportPayload {
  /** Enterprise export job ID in `enterprise_export_jobs`. */
  jobId: string;
  organizationId: string;
  requestedBy: string;
}

export interface EmailSendPayload {
  to: string | string[];
  subject: string;
  templateId: string;
  templateData: Record<string, unknown>;
}

export interface WebhookDeliveryPayload {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body: Record<string, unknown>;
  organizationId: string;
}

export interface AutomationTriggerPayload {
  triggerType: string;
  organizationId: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

export type JobPayload =
  | ComplianceExportPayload
  | ReportExportPayload
  | EnterpriseExportPayload
  | EmailSendPayload
  | WebhookDeliveryPayload
  | AutomationTriggerPayload;

// ---------------------------------------------------------------------------
// Job record (stored in Redis hash)
// ---------------------------------------------------------------------------

export interface Job<T extends JobPayload = JobPayload> {
  id: string;
  type: JobType;
  state: JobState;
  payload: T;
  /** ISO timestamp when the job was created */
  createdAt: string;
  /** ISO timestamp when the job is scheduled to run (used as sorted-set score) */
  scheduledAt: string;
  /** ISO timestamp when the job started processing */
  startedAt?: string;
  /** ISO timestamp when the job completed */
  completedAt?: string;
  /** ISO timestamp when the job failed for the last time */
  failedAt?: string;
  /** Number of times this job has been attempted */
  attempts: number;
  /** Maximum number of attempts before moving to dead letter queue */
  maxAttempts: number;
  /** Last error message */
  lastError?: string;
  /** Job result (arbitrary JSON) */
  result?: unknown;
  /** Organization context for multi-tenant isolation */
  organizationId?: string;
  /** TTL in seconds after which completed/dead jobs are cleaned up */
  ttlSeconds: number;
}

// ---------------------------------------------------------------------------
// Queue configuration
// ---------------------------------------------------------------------------

export interface QueueConfig {
  /** Maximum number of jobs to process in a single batch */
  batchSize: number;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay (ms) for exponential backoff: delay = baseDelay * 2^attempt */
  baseBackoffMs: number;
  /** TTL in seconds for completed/dead jobs (default: 7 days) */
  jobTtlSeconds: number;
  /** How long (seconds) a job can remain in processing before it's considered stale */
  processingTimeoutSeconds: number;
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  batchSize: 10,
  maxAttempts: 3,
  baseBackoffMs: 1_000,
  jobTtlSeconds: 7 * 24 * 60 * 60, // 7 days
  processingTimeoutSeconds: 5 * 60, // 5 minutes
};

// ---------------------------------------------------------------------------
// Redis key constants
// ---------------------------------------------------------------------------

export const QUEUE_KEYS = {
  /** Sorted set: score = scheduledAt (epoch ms) */
  PENDING: 'queue:pending',
  /** Sorted set: score = startedAt (epoch ms) */
  PROCESSING: 'queue:processing',
  /** Sorted set: score = failedAt (epoch ms) */
  DEAD: 'queue:dead',
  /** Hash key prefix for individual job data */
  JOB_PREFIX: 'queue:job:',
  /** Counter for queue metrics */
  METRICS_PREFIX: 'queue:metrics:',
} as const;

// ---------------------------------------------------------------------------
// Queue operation results
// ---------------------------------------------------------------------------

export interface EnqueueResult {
  success: boolean;
  jobId: string;
  scheduledAt: string;
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  movedToDead: number;
  errors: string[];
}

export interface QueueStats {
  pending: number;
  processing: number;
  dead: number;
  totalProcessed: number;
  totalFailed: number;
}

// ---------------------------------------------------------------------------
// Job handler type
// ---------------------------------------------------------------------------

export type JobHandler<T extends JobPayload = JobPayload> = (
  job: Job<T>,
) => Promise<unknown>;

export type JobHandlerMap = {
  [K in JobType]?: JobHandler;
};
