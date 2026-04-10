/**
 * Tests for lib/queue/client.ts — QueueClient
 *
 * Redis-backed job queue with pending/processing/dead states.
 * Two modes tested: with Redis mock, and without Redis (graceful fallback).
 */

jest.mock('server-only', () => ({}));

// ── Redis mock ───────────────────────────────────────────────────────────────

const pipelineResults: any[] = [];
const mockPipeline = {
  set: jest.fn().mockReturnThis(),
  get: jest.fn().mockReturnThis(),
  zadd: jest.fn().mockReturnThis(),
  zrem: jest.fn().mockReturnThis(),
  zcard: jest.fn().mockReturnThis(),
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(pipelineResults),
};

const mockRedisClient: Record<string, jest.Mock> = {
  pipeline: jest.fn(() => mockPipeline),
  get: jest.fn(),
  set: jest.fn(),
  zrange: jest.fn().mockResolvedValue([]),
  zrem: jest.fn().mockResolvedValue(1),
  zadd: jest.fn(),
  zcard: jest.fn().mockResolvedValue(0),
  exists: jest.fn().mockResolvedValue(1),
  incr: jest.fn(),
  expire: jest.fn(),
};

let redisAvailable = true;

jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => (redisAvailable ? mockRedisClient : null)),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  queueLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// We need to mock the queue types
jest.mock('@/lib/queue/types', () => ({
  QUEUE_KEYS: {
    PENDING: 'queue:pending',
    PROCESSING: 'queue:processing',
    DEAD: 'queue:dead',
    JOB_PREFIX: 'queue:job:',
    METRICS_PREFIX: 'queue:metrics:',
  },
  DEFAULT_QUEUE_CONFIG: {
    maxAttempts: 3,
    batchSize: 10,
    jobTtlSeconds: 86400,
    processingTimeoutSeconds: 300,
    baseBackoffMs: 1000,
  },
}));

import { QueueClient } from '@/lib/queue/client';

beforeEach(() => {
  jest.clearAllMocks();
  redisAvailable = true;
  pipelineResults.length = 0;
});

describe('QueueClient', () => {
  describe('enqueue', () => {
    it('enqueues a job with Redis available', async () => {
      const client = new QueueClient();
      const result = await client.enqueue('test-job' as any, { foo: 'bar' });

      expect(result.success).toBe(true);
      expect(result.jobId).toMatch(/^job_/);
      expect(result.scheduledAt).toBeDefined();
      expect(mockPipeline.set).toHaveBeenCalled();
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'queue:pending',
        expect.any(Object),
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('returns failure when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const result = await client.enqueue('test-job' as any, { foo: 'bar' });

      expect(result.success).toBe(false);
      expect(result.jobId).toMatch(/^job_/);
    });

    it('accepts custom scheduledAt', async () => {
      const client = new QueueClient();
      const future = new Date(Date.now() + 60000);
      const result = await client.enqueue(
        'delayed-job' as any,
        {},
        { scheduledAt: future },
      );

      expect(result.success).toBe(true);
      expect(result.scheduledAt).toBe(future.toISOString());
    });

    it('handles pipeline error gracefully', async () => {
      mockPipeline.exec.mockRejectedValueOnce(new Error('Redis down'));
      const client = new QueueClient();
      const result = await client.enqueue('fail-job' as any, {});

      expect(result.success).toBe(false);
    });
  });

  describe('fetchPendingJobs', () => {
    it('returns empty array when no pending jobs', async () => {
      mockRedisClient.zrange.mockResolvedValueOnce([]);
      const client = new QueueClient();
      const jobs = await client.fetchPendingJobs();
      expect(jobs).toEqual([]);
    });

    it('fetches and transitions pending jobs to processing', async () => {
      const mockJob = {
        id: 'job_abc',
        type: 'test',
        state: 'pending',
        payload: {},
        attempts: 0,
        maxAttempts: 3,
        ttlSeconds: 86400,
        createdAt: new Date().toISOString(),
        scheduledAt: new Date().toISOString(),
      };
      mockRedisClient.zrange.mockResolvedValueOnce(['job_abc']);
      mockRedisClient.zrem.mockResolvedValueOnce(1);
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      const jobs = await client.fetchPendingJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0].state).toBe('processing');
      expect(jobs[0].attempts).toBe(1);
    });

    it('returns empty when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const jobs = await client.fetchPendingJobs();
      expect(jobs).toEqual([]);
    });
  });

  describe('completeJob', () => {
    it('marks a job as completed', async () => {
      const mockJob = {
        id: 'job_done',
        type: 'test',
        state: 'processing',
        payload: {},
        attempts: 1,
        maxAttempts: 3,
        ttlSeconds: 86400,
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      await client.completeJob('job_done', { result: 'ok' });

      expect(mockPipeline.zrem).toHaveBeenCalledWith(
        'queue:processing',
        'job_done',
      );
      expect(mockPipeline.expire).toHaveBeenCalled();
      expect(mockPipeline.incr).toHaveBeenCalledWith('queue:metrics:completed');
    });

    it('no-ops when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      await client.completeJob('job_noop');
      // Should not throw
    });
  });

  describe('failJob', () => {
    it('retries job if attempts remain', async () => {
      const mockJob = {
        id: 'job_retry',
        type: 'test',
        state: 'processing',
        payload: {},
        attempts: 1,
        maxAttempts: 3,
        ttlSeconds: 86400,
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      const outcome = await client.failJob('job_retry', 'timeout');

      expect(outcome).toBe('retrying');
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'queue:pending',
        expect.any(Object),
      );
      expect(mockPipeline.incr).toHaveBeenCalledWith('queue:metrics:retried');
    });

    it('moves job to dead letter queue when max attempts reached', async () => {
      const mockJob = {
        id: 'job_dead',
        type: 'test',
        state: 'processing',
        payload: {},
        attempts: 3,
        maxAttempts: 3,
        ttlSeconds: 86400,
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      const outcome = await client.failJob('job_dead', 'max retries exhausted');

      expect(outcome).toBe('dead');
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'queue:dead',
        expect.any(Object),
      );
      expect(mockPipeline.incr).toHaveBeenCalledWith('queue:metrics:dead');
    });

    it('returns dead when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const outcome = await client.failJob('job_noop', 'error');
      expect(outcome).toBe('dead');
    });
  });

  describe('recoverStaleJobs', () => {
    it('returns 0 when no stale jobs', async () => {
      mockRedisClient.zrange.mockResolvedValueOnce([]);
      const client = new QueueClient();
      const recovered = await client.recoverStaleJobs();
      expect(recovered).toBe(0);
    });

    it('returns 0 when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const recovered = await client.recoverStaleJobs();
      expect(recovered).toBe(0);
    });
  });

  describe('getJob', () => {
    it('returns job data', async () => {
      const mockJob = { id: 'job_get', type: 'test', state: 'pending' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      const job = await client.getJob('job_get');
      expect(job).toEqual(mockJob);
    });

    it('returns null when job not found', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      const client = new QueueClient();
      const job = await client.getJob('nonexistent');
      expect(job).toBeNull();
    });

    it('returns null when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const job = await client.getJob('any');
      expect(job).toBeNull();
    });
  });

  describe('getStats', () => {
    it('returns queue stats', async () => {
      pipelineResults.push(5, 2, 1, '100', '10');
      const client = new QueueClient();
      const stats = await client.getStats();

      expect(stats).toEqual({
        pending: 5,
        processing: 2,
        dead: 1,
        totalProcessed: 100,
        totalFailed: 10,
      });
    });

    it('returns zeros when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const stats = await client.getStats();
      expect(stats).toEqual({
        pending: 0,
        processing: 0,
        dead: 0,
        totalProcessed: 0,
        totalFailed: 0,
      });
    });
  });

  describe('listDeadJobs', () => {
    it('returns dead jobs', async () => {
      const mockJob = { id: 'job_dlq', type: 'test', state: 'dead' };
      mockRedisClient.zrange.mockResolvedValueOnce(['job_dlq']);
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockJob));

      const client = new QueueClient();
      const dead = await client.listDeadJobs();
      expect(dead).toHaveLength(1);
      expect(dead[0].state).toBe('dead');
    });

    it('returns empty when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const dead = await client.listDeadJobs();
      expect(dead).toEqual([]);
    });
  });

  describe('retryDeadJob', () => {
    it('requeues a dead job', async () => {
      const deadJob = {
        id: 'job_requeue',
        type: 'test',
        state: 'dead',
        attempts: 3,
        maxAttempts: 3,
        ttlSeconds: 86400,
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(deadJob));

      const client = new QueueClient();
      const result = await client.retryDeadJob('job_requeue');

      expect(result).toBe(true);
      expect(mockPipeline.zrem).toHaveBeenCalledWith(
        'queue:dead',
        'job_requeue',
      );
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'queue:pending',
        expect.any(Object),
      );
    });

    it('returns false for non-dead job', async () => {
      const job = { id: 'job_active', type: 'test', state: 'processing' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(job));

      const client = new QueueClient();
      const result = await client.retryDeadJob('job_active');
      expect(result).toBe(false);
    });

    it('returns false when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const result = await client.retryDeadJob('any');
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredDeadJobs', () => {
    it('cleans up jobs whose keys have expired', async () => {
      mockRedisClient.zrange.mockResolvedValueOnce(['expired_1', 'expired_2']);
      mockRedisClient.exists
        .mockResolvedValueOnce(0) // expired_1 key gone
        .mockResolvedValueOnce(1); // expired_2 still exists

      const client = new QueueClient();
      const cleaned = await client.cleanupExpiredDeadJobs();

      expect(cleaned).toBe(1);
      expect(mockRedisClient.zrem).toHaveBeenCalledWith(
        'queue:dead',
        'expired_1',
      );
    });

    it('returns 0 when Redis not available', async () => {
      redisAvailable = false;
      const client = new QueueClient();
      const cleaned = await client.cleanupExpiredDeadJobs();
      expect(cleaned).toBe(0);
    });
  });

  describe('getQueueClient', () => {
    it('returns a QueueClient instance', () => {
      // Reset the singleton module cache
      jest.resetModules();
      // Re-require to get fresh singleton
      const { getQueueClient: getQC } = require('@/lib/queue/client');
      const client = getQC();
      expect(client).toBeInstanceOf(Object);
      expect(typeof client.enqueue).toBe('function');
    });
  });
});
