/**
 * Job Queue Client
 *
 * Persistent job queue backed by Upstash Redis sorted sets.
 * Follows the same graceful-fallback pattern as lib/redis/client.ts:
 * if Redis is not configured the queue operations silently no-op.
 *
 * Redis data structures:
 *   queue:pending      - ZSET  score = scheduledAt (epoch ms)
 *   queue:processing   - ZSET  score = startedAt  (epoch ms)
 *   queue:dead         - ZSET  score = failedAt   (epoch ms)
 *   queue:job:{id}     - HASH  full job data (JSON-serialised fields)
 */

import { getRedisClient } from '@/lib/redis/client';
import {
  type Job,
  type JobType,
  type JobPayload,
  type EnqueueResult,
  type QueueConfig,
  type QueueStats,
  QUEUE_KEYS,
  DEFAULT_QUEUE_CONFIG,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `job_${timestamp}_${random}`;
}

function jobKey(id: string): string {
  return `${QUEUE_KEYS.JOB_PREFIX}${id}`;
}

// ---------------------------------------------------------------------------
// Queue Client
// ---------------------------------------------------------------------------

export class QueueClient {
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  // -----------------------------------------------------------------------
  // Enqueue
  // -----------------------------------------------------------------------

  /**
   * Add a new job to the pending queue.
   *
   * @param type        The job type (determines which handler runs)
   * @param payload     Arbitrary JSON payload for the handler
   * @param options     Optional overrides (scheduledAt, maxAttempts, ttl, orgId)
   */
  async enqueue<T extends JobPayload>(
    type: JobType,
    payload: T,
    options: {
      scheduledAt?: Date;
      maxAttempts?: number;
      ttlSeconds?: number;
      organizationId?: string;
    } = {},
  ): Promise<EnqueueResult> {
    const redis = getRedisClient();

    const id = generateJobId();
    const now = new Date();
    const scheduledAt = options.scheduledAt ?? now;

    if (!redis) {
      console.warn('[Queue] Redis not available - job will not be persisted:', id);
      return { success: false, jobId: id, scheduledAt: scheduledAt.toISOString() };
    }

    const job: Job<T> = {
      id,
      type,
      state: 'pending',
      payload,
      createdAt: now.toISOString(),
      scheduledAt: scheduledAt.toISOString(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.maxAttempts,
      organizationId: options.organizationId,
      ttlSeconds: options.ttlSeconds ?? this.config.jobTtlSeconds,
    };

    try {
      // Store job data in a hash (serialised as a single JSON string for
      // atomicity with Upstash REST - HSET with individual fields also works
      // but a single string keeps the read simpler).
      const pipeline = redis.pipeline();
      pipeline.set(jobKey(id), JSON.stringify(job));
      // Add to the pending sorted set with score = scheduledAt epoch ms
      pipeline.zadd(QUEUE_KEYS.PENDING, {
        score: scheduledAt.getTime(),
        member: id,
      });
      await pipeline.exec();

      console.log(`[Queue] Enqueued job ${id} (${type}) scheduled at ${scheduledAt.toISOString()}`);
      return { success: true, jobId: id, scheduledAt: scheduledAt.toISOString() };
    } catch (error) {
      console.error('[Queue] Failed to enqueue job:', error);
      return { success: false, jobId: id, scheduledAt: scheduledAt.toISOString() };
    }
  }

  // -----------------------------------------------------------------------
  // Fetch pending jobs
  // -----------------------------------------------------------------------

  /**
   * Atomically move up to `batchSize` pending jobs that are due
   * (scheduledAt <= now) into the processing set.
   *
   * Returns the full Job objects for those jobs.
   */
  async fetchPendingJobs(batchSize?: number): Promise<Job[]> {
    const redis = getRedisClient();
    if (!redis) return [];

    const limit = batchSize ?? this.config.batchSize;
    const now = Date.now();

    try {
      // Get job IDs with scheduledAt <= now, ordered by score (earliest first)
      const jobIds = await redis.zrange<string[]>(
        QUEUE_KEYS.PENDING,
        0,
        now,
        { byScore: true, offset: 0, count: limit },
      );

      if (!jobIds || jobIds.length === 0) return [];

      const jobs: Job[] = [];

      for (const id of jobIds) {
        // Atomically move from pending to processing
        const removed = await redis.zrem(QUEUE_KEYS.PENDING, id);
        if (!removed) continue; // Another worker grabbed it

        // Read the full job data
        const raw = await redis.get<string>(jobKey(id));
        if (!raw) continue;

        const job: Job = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job;

        // Update state to processing
        job.state = 'processing';
        job.startedAt = new Date().toISOString();
        job.attempts += 1;

        // Persist the updated state
        const pipeline = redis.pipeline();
        pipeline.set(jobKey(id), JSON.stringify(job));
        pipeline.zadd(QUEUE_KEYS.PROCESSING, {
          score: Date.now(),
          member: id,
        });
        await pipeline.exec();

        jobs.push(job);
      }

      return jobs;
    } catch (error) {
      console.error('[Queue] Failed to fetch pending jobs:', error);
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // Complete / Fail
  // -----------------------------------------------------------------------

  /**
   * Mark a job as completed and schedule it for TTL-based cleanup.
   */
  async completeJob(jobId: string, result?: unknown): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const raw = await redis.get<string>(jobKey(jobId));
      if (!raw) return;

      const job: Job = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job;
      job.state = 'completed';
      job.completedAt = new Date().toISOString();
      job.result = result;

      const pipeline = redis.pipeline();
      pipeline.zrem(QUEUE_KEYS.PROCESSING, jobId);
      pipeline.set(jobKey(jobId), JSON.stringify(job));
      // Set TTL on the job data so it auto-cleans
      pipeline.expire(jobKey(jobId), job.ttlSeconds);
      // Increment metrics
      pipeline.incr(`${QUEUE_KEYS.METRICS_PREFIX}completed`);
      await pipeline.exec();

      console.log(`[Queue] Job ${jobId} completed`);
    } catch (error) {
      console.error(`[Queue] Failed to complete job ${jobId}:`, error);
    }
  }

  /**
   * Mark a job as failed. If retries remain the job is re-queued with
   * exponential backoff; otherwise it is moved to the dead letter queue.
   */
  async failJob(jobId: string, error: string): Promise<'retrying' | 'dead'> {
    const redis = getRedisClient();
    if (!redis) return 'dead';

    try {
      const raw = await redis.get<string>(jobKey(jobId));
      if (!raw) return 'dead';

      const job: Job = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job;
      job.lastError = error;
      job.failedAt = new Date().toISOString();

      // Remove from processing set
      await redis.zrem(QUEUE_KEYS.PROCESSING, jobId);

      if (job.attempts < job.maxAttempts) {
        // Re-queue with exponential backoff
        const backoffMs = this.config.baseBackoffMs * Math.pow(2, job.attempts);
        const nextRun = Date.now() + backoffMs;

        job.state = 'pending';

        const pipeline = redis.pipeline();
        pipeline.set(jobKey(jobId), JSON.stringify(job));
        pipeline.zadd(QUEUE_KEYS.PENDING, {
          score: nextRun,
          member: jobId,
        });
        pipeline.incr(`${QUEUE_KEYS.METRICS_PREFIX}retried`);
        await pipeline.exec();

        console.log(
          `[Queue] Job ${jobId} failed (attempt ${job.attempts}/${job.maxAttempts}), ` +
          `retrying in ${backoffMs}ms`,
        );
        return 'retrying';
      } else {
        // Move to dead letter queue
        job.state = 'dead';

        const pipeline = redis.pipeline();
        pipeline.set(jobKey(jobId), JSON.stringify(job));
        pipeline.zadd(QUEUE_KEYS.DEAD, {
          score: Date.now(),
          member: jobId,
        });
        // Set TTL for dead jobs too
        pipeline.expire(jobKey(jobId), job.ttlSeconds);
        pipeline.incr(`${QUEUE_KEYS.METRICS_PREFIX}dead`);
        await pipeline.exec();

        console.log(
          `[Queue] Job ${jobId} moved to dead letter queue after ${job.attempts} attempts`,
        );
        return 'dead';
      }
    } catch (err) {
      console.error(`[Queue] Failed to record failure for job ${jobId}:`, err);
      return 'dead';
    }
  }

  // -----------------------------------------------------------------------
  // Stale-job recovery
  // -----------------------------------------------------------------------

  /**
   * Find jobs stuck in the processing state longer than the configured
   * timeout and move them back to pending for retry.
   */
  async recoverStaleJobs(): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    const staleThreshold = Date.now() - this.config.processingTimeoutSeconds * 1_000;

    try {
      const staleIds = await redis.zrange<string[]>(
        QUEUE_KEYS.PROCESSING,
        0,
        staleThreshold,
        { byScore: true },
      );

      if (!staleIds || staleIds.length === 0) return 0;

      let recovered = 0;
      for (const id of staleIds) {
        const outcome = await this.failJob(id, 'Processing timeout - job was stale');
        if (outcome === 'retrying') recovered++;
      }

      console.log(`[Queue] Recovered ${recovered} stale jobs`);
      return recovered;
    } catch (error) {
      console.error('[Queue] Failed to recover stale jobs:', error);
      return 0;
    }
  }

  // -----------------------------------------------------------------------
  // Retrieve a single job
  // -----------------------------------------------------------------------

  async getJob(jobId: string): Promise<Job | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const raw = await redis.get<string>(jobKey(jobId));
      if (!raw) return null;
      return typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job;
    } catch (error) {
      console.error(`[Queue] Failed to get job ${jobId}:`, error);
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  async getStats(): Promise<QueueStats> {
    const redis = getRedisClient();

    const empty: QueueStats = {
      pending: 0,
      processing: 0,
      dead: 0,
      totalProcessed: 0,
      totalFailed: 0,
    };

    if (!redis) return empty;

    try {
      const pipeline = redis.pipeline();
      pipeline.zcard(QUEUE_KEYS.PENDING);
      pipeline.zcard(QUEUE_KEYS.PROCESSING);
      pipeline.zcard(QUEUE_KEYS.DEAD);
      pipeline.get(`${QUEUE_KEYS.METRICS_PREFIX}completed`);
      pipeline.get(`${QUEUE_KEYS.METRICS_PREFIX}dead`);
      const results = await pipeline.exec();

      return {
        pending: (results[0] as number) ?? 0,
        processing: (results[1] as number) ?? 0,
        dead: (results[2] as number) ?? 0,
        totalProcessed: Number(results[3]) || 0,
        totalFailed: Number(results[4]) || 0,
      };
    } catch (error) {
      console.error('[Queue] Failed to get queue stats:', error);
      return empty;
    }
  }

  // -----------------------------------------------------------------------
  // Dead letter queue inspection
  // -----------------------------------------------------------------------

  /**
   * List jobs in the dead letter queue, newest first.
   */
  async listDeadJobs(limit = 20): Promise<Job[]> {
    const redis = getRedisClient();
    if (!redis) return [];

    try {
      const ids: string[] = await redis.zrange(
        QUEUE_KEYS.DEAD,
        0,
        limit - 1,
        { rev: true },
      );

      if (!ids || ids.length === 0) return [];

      const jobs: Job[] = [];
      for (const id of ids) {
        const raw = await redis.get<string>(jobKey(id));
        if (raw) {
          jobs.push(typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job);
        }
      }

      return jobs;
    } catch (error) {
      console.error('[Queue] Failed to list dead jobs:', error);
      return [];
    }
  }

  /**
   * Retry a dead job by moving it back to the pending queue
   * and resetting its attempt counter.
   */
  async retryDeadJob(jobId: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const raw = await redis.get<string>(jobKey(jobId));
      if (!raw) return false;

      const job: Job = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Job;
      if (job.state !== 'dead') return false;

      job.state = 'pending';
      job.attempts = 0;
      job.lastError = undefined;
      job.failedAt = undefined;
      job.scheduledAt = new Date().toISOString();

      const pipeline = redis.pipeline();
      pipeline.zrem(QUEUE_KEYS.DEAD, jobId);
      pipeline.set(jobKey(jobId), JSON.stringify(job));
      pipeline.zadd(QUEUE_KEYS.PENDING, {
        score: Date.now(),
        member: jobId,
      });
      await pipeline.exec();

      console.log(`[Queue] Dead job ${jobId} re-queued for retry`);
      return true;
    } catch (error) {
      console.error(`[Queue] Failed to retry dead job ${jobId}:`, error);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Remove expired job data from the dead letter sorted set.
   * (Individual job keys have their own TTL via EXPIRE, but we also
   * need to clean the sorted-set members whose underlying keys have
   * already expired.)
   */
  async cleanupExpiredDeadJobs(): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    try {
      const ids: string[] = await redis.zrange(QUEUE_KEYS.DEAD, 0, -1);
      if (!ids || ids.length === 0) return 0;

      let cleaned = 0;
      for (const id of ids) {
        const exists = await redis.exists(jobKey(id));
        if (!exists) {
          await redis.zrem(QUEUE_KEYS.DEAD, id);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Queue] Cleaned up ${cleaned} expired dead-letter entries`);
      }
      return cleaned;
    } catch (error) {
      console.error('[Queue] Failed to cleanup expired dead jobs:', error);
      return 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _queueClient: QueueClient | null = null;

export function getQueueClient(config?: Partial<QueueConfig>): QueueClient {
  if (!_queueClient) {
    _queueClient = new QueueClient(config);
  }
  return _queueClient;
}
