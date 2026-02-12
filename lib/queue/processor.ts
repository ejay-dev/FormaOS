/**
 * Job Queue Processor
 *
 * Fetches pending jobs from the Redis-backed queue, dispatches them to
 * registered handlers, and manages retry / dead-letter-queue lifecycle.
 *
 * Usage:
 *   const processor = new QueueProcessor();
 *   processor.registerHandler('email-send', async (job) => { ... });
 *   const result = await processor.processJobs();
 */

import { getQueueClient } from './client';
import type {
  Job,
  JobHandler,
  JobHandlerMap,
  JobType,
  ProcessResult,
  QueueConfig,
} from './types';

export class QueueProcessor {
  private handlers: JobHandlerMap = {};
  private queueClient;

  constructor(config?: Partial<QueueConfig>) {
    this.queueClient = getQueueClient(config);
  }

  // -----------------------------------------------------------------------
  // Handler registration
  // -----------------------------------------------------------------------

  /**
   * Register a handler function for a specific job type.
   * When the processor encounters a job of this type it will invoke the handler.
   */
  registerHandler<T extends JobType>(type: T, handler: JobHandler): void {
    this.handlers[type] = handler;
  }

  /**
   * Register multiple handlers at once.
   */
  registerHandlers(handlers: JobHandlerMap): void {
    for (const [type, handler] of Object.entries(handlers)) {
      if (handler) {
        this.handlers[type as JobType] = handler;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Process loop
  // -----------------------------------------------------------------------

  /**
   * Process a batch of pending jobs.
   *
   * 1. Recover any stale jobs stuck in processing.
   * 2. Fetch due pending jobs (up to batchSize).
   * 3. Execute each job's handler.
   * 4. Mark as completed or failed accordingly.
   * 5. Clean up expired dead-letter entries.
   */
  async processJobs(batchSize?: number): Promise<ProcessResult> {
    const result: ProcessResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      movedToDead: 0,
      errors: [],
    };

    try {
      // Step 1: recover stale jobs
      const recovered = await this.queueClient.recoverStaleJobs();
      if (recovered > 0) {
        console.log(`[QueueProcessor] Recovered ${recovered} stale jobs`);
      }

      // Step 2: fetch due pending jobs
      const jobs = await this.queueClient.fetchPendingJobs(batchSize);

      if (jobs.length === 0) {
        return result;
      }

      console.log(`[QueueProcessor] Processing ${jobs.length} jobs`);

      // Step 3: execute each job
      for (const job of jobs) {
        result.processed++;

        try {
          await this.executeJob(job);
          result.succeeded++;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown handler error';

          result.failed++;
          result.errors.push(`Job ${job.id} (${job.type}): ${errorMsg}`);

          const outcome = await this.queueClient.failJob(job.id, errorMsg);
          if (outcome === 'dead') {
            result.movedToDead++;
          }
        }
      }

      // Step 4: cleanup expired dead-letter entries (best-effort)
      await this.queueClient.cleanupExpiredDeadJobs().catch(() => {});

      console.log(
        `[QueueProcessor] Batch complete: ${result.succeeded} succeeded, ` +
        `${result.failed} failed, ${result.movedToDead} moved to DLQ`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown processor error';
      result.errors.push(msg);
      console.error('[QueueProcessor] Fatal processing error:', error);
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // Single job execution
  // -----------------------------------------------------------------------

  private async executeJob(job: Job): Promise<void> {
    const handler = this.handlers[job.type];

    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    console.log(
      `[QueueProcessor] Executing job ${job.id} (${job.type}) ` +
      `attempt ${job.attempts}/${job.maxAttempts}`,
    );

    const startTime = Date.now();

    try {
      const result = await handler(job);
      const duration = Date.now() - startTime;

      await this.queueClient.completeJob(job.id, result);

      console.log(
        `[QueueProcessor] Job ${job.id} completed in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[QueueProcessor] Job ${job.id} failed after ${duration}ms:`,
        error,
      );
      throw error; // Re-throw so the caller can handle retry/DLQ
    }
  }
}

// ---------------------------------------------------------------------------
// Default handlers (no-ops that log -- real implementations should be
// registered by the consuming code before calling processJobs)
// ---------------------------------------------------------------------------

const defaultHandlers: JobHandlerMap = {
  'compliance-export': async (job) => {
    console.log(`[Handler:compliance-export] Processing job ${job.id}`, job.payload);
    // Actual implementation would invoke the compliance export pipeline
    return { status: 'exported' };
  },

  'report-export': async (job) => {
    console.log(`[Handler:report-export] Processing job ${job.id}`, job.payload);
    // Actual implementation would generate the report
    return { status: 'exported' };
  },

  'email-send': async (job) => {
    console.log(`[Handler:email-send] Processing job ${job.id}`, job.payload);
    // Actual implementation would call Resend / email service
    return { status: 'sent' };
  },

  'webhook-delivery': async (job) => {
    console.log(`[Handler:webhook-delivery] Processing job ${job.id}`, job.payload);
    // Actual implementation would make the HTTP request
    return { status: 'delivered' };
  },

  'automation-trigger': async (job) => {
    console.log(`[Handler:automation-trigger] Processing job ${job.id}`, job.payload);
    // Actual implementation would invoke the trigger engine
    return { status: 'triggered' };
  },
};

// ---------------------------------------------------------------------------
// Convenience: create a processor with default (stub) handlers
// ---------------------------------------------------------------------------

let _defaultProcessor: QueueProcessor | null = null;

export function getDefaultProcessor(): QueueProcessor {
  if (!_defaultProcessor) {
    _defaultProcessor = new QueueProcessor();
    _defaultProcessor.registerHandlers(defaultHandlers);
  }
  return _defaultProcessor;
}

/**
 * Process pending queue jobs using the default processor.
 * Designed to be called from cron / API routes.
 */
export async function processQueueJobs(
  batchSize?: number,
): Promise<ProcessResult> {
  const processor = getDefaultProcessor();
  return processor.processJobs(batchSize);
}
