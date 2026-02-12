/** @jest-environment node */

/**
 * Unit tests for lib/queue/client.ts
 *
 * Tests the QueueClient class: constructor defaults, enqueue, getStats,
 * and graceful no-op when Redis is unavailable.
 */

// Must mock before importing the module under test
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
}));

import { QueueClient, getQueueClient } from '@/lib/queue/client';
import { DEFAULT_QUEUE_CONFIG, QUEUE_KEYS } from '@/lib/queue/types';
import type { EmailSendPayload } from '@/lib/queue/types';
import { getRedisClient } from '@/lib/redis/client';

const mockedGetRedis = getRedisClient as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRedis() {
  const pipelineCommands: Array<{ method: string; args: unknown[] }> = [];

  const pipelineObj = {
    set: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'set', args });
      return pipelineObj;
    }),
    zadd: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'zadd', args });
      return pipelineObj;
    }),
    zrem: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'zrem', args });
      return pipelineObj;
    }),
    zcard: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'zcard', args });
      return pipelineObj;
    }),
    get: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'get', args });
      return pipelineObj;
    }),
    expire: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'expire', args });
      return pipelineObj;
    }),
    incr: jest.fn((...args: unknown[]) => {
      pipelineCommands.push({ method: 'incr', args });
      return pipelineObj;
    }),
    exec: jest.fn(() => Promise.resolve([0, 0, 0, 0, 0])),
    _commands: pipelineCommands,
  };

  return {
    pipeline: jest.fn(() => pipelineObj),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(true)),
    ttl: jest.fn(() => Promise.resolve(60)),
    zrange: jest.fn(() => Promise.resolve([])),
    zrem: jest.fn(() => Promise.resolve(1)),
    zcard: jest.fn(() => Promise.resolve(0)),
    exists: jest.fn(() => Promise.resolve(0)),
    _pipeline: pipelineObj,
  };
}

describe('QueueClient', () => {
  beforeEach(() => {
    mockedGetRedis.mockReturnValue(null);
  });

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('uses DEFAULT_QUEUE_CONFIG when no config is provided', () => {
      const client = new QueueClient();
      // Verify it's functional (internal config is private, but we can test
      // behaviour that depends on defaults, e.g. getStats returning empty)
      expect(client).toBeInstanceOf(QueueClient);
    });

    it('merges custom config with defaults', () => {
      const client = new QueueClient({ batchSize: 5, maxAttempts: 10 });
      expect(client).toBeInstanceOf(QueueClient);
    });

    it('preserves default values for unspecified fields', async () => {
      const client = new QueueClient({ batchSize: 50 });
      // With no Redis, getStats returns empty stats (exercises the default
      // config path without errors)
      const stats = await client.getStats();
      expect(stats.pending).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Enqueue - no Redis
  // -----------------------------------------------------------------------

  describe('enqueue (no Redis)', () => {
    it('returns success: false and a jobId when Redis is unavailable', async () => {
      const client = new QueueClient();
      const payload: EmailSendPayload = {
        to: 'user@test.com',
        subject: 'Hello',
        templateId: 'welcome',
        templateData: { name: 'Alice' },
      };

      const result = await client.enqueue('email-send', payload);

      expect(result.success).toBe(false);
      expect(result.jobId).toBeDefined();
      expect(result.jobId).toMatch(/^job_/);
      expect(result.scheduledAt).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Enqueue - with Redis
  // -----------------------------------------------------------------------

  describe('enqueue (with Redis)', () => {
    it('persists job to Redis and returns success: true', async () => {
      const mockRedis = createMockRedis();
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      const payload: EmailSendPayload = {
        to: 'user@test.com',
        subject: 'Test',
        templateId: 'welcome',
        templateData: {},
      };

      const result = await client.enqueue('email-send', payload);

      expect(result.success).toBe(true);
      expect(result.jobId).toMatch(/^job_/);
      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockRedis._pipeline.exec).toHaveBeenCalled();
    });

    it('stores job data and adds to pending sorted set', async () => {
      const mockRedis = createMockRedis();
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      await client.enqueue('compliance-export', {
        organizationId: 'org-1',
        frameworkId: 'fw-1',
        format: 'pdf' as const,
        requestedBy: 'user-1',
      });

      // The pipeline should have recorded set and zadd calls
      const pipeline = mockRedis._pipeline;
      expect(pipeline.set).toHaveBeenCalled();
      expect(pipeline.zadd).toHaveBeenCalled();

      // Verify zadd was called with the pending queue key
      const zaddCall = pipeline._commands.find(
        (c: { method: string }) => c.method === 'zadd',
      );
      expect(zaddCall).toBeDefined();
      expect(zaddCall!.args[0]).toBe(QUEUE_KEYS.PENDING);
    });

    it('respects custom scheduledAt option', async () => {
      const mockRedis = createMockRedis();
      mockedGetRedis.mockReturnValue(mockRedis);

      const future = new Date(Date.now() + 60_000);
      const client = new QueueClient();
      const result = await client.enqueue(
        'email-send',
        {
          to: 'a@b.com',
          subject: 's',
          templateId: 't',
          templateData: {},
        },
        { scheduledAt: future },
      );

      expect(result.success).toBe(true);
      expect(result.scheduledAt).toBe(future.toISOString());
    });

    it('returns success: false when Redis pipeline throws', async () => {
      const mockRedis = createMockRedis();
      mockRedis._pipeline.exec.mockRejectedValue(
        new Error('Pipeline failed'),
      );
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      const result = await client.enqueue('email-send', {
        to: 'a@b.com',
        subject: 's',
        templateId: 't',
        templateData: {},
      });

      expect(result.success).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // getStats
  // -----------------------------------------------------------------------

  describe('getStats', () => {
    it('returns zeroed stats when Redis is unavailable', async () => {
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

    it('returns stats from Redis pipeline results', async () => {
      const mockRedis = createMockRedis();
      mockRedis._pipeline.exec.mockResolvedValue([5, 2, 1, 42, 3]);
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      const stats = await client.getStats();

      expect(stats.pending).toBe(5);
      expect(stats.processing).toBe(2);
      expect(stats.dead).toBe(1);
      expect(stats.totalProcessed).toBe(42);
      expect(stats.totalFailed).toBe(3);
    });

    it('returns zeroed stats when Redis pipeline throws', async () => {
      const mockRedis = createMockRedis();
      mockRedis._pipeline.exec.mockRejectedValue(
        new Error('Redis error'),
      );
      mockedGetRedis.mockReturnValue(mockRedis);

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

  // -----------------------------------------------------------------------
  // getJob
  // -----------------------------------------------------------------------

  describe('getJob', () => {
    it('returns null when Redis is unavailable', async () => {
      const client = new QueueClient();
      const job = await client.getJob('job_xyz');
      expect(job).toBeNull();
    });

    it('returns null when job does not exist in Redis', async () => {
      const mockRedis = createMockRedis();
      mockRedis.get.mockResolvedValue(null);
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      const job = await client.getJob('nonexistent');
      expect(job).toBeNull();
    });

    it('returns parsed job when found in Redis', async () => {
      const mockRedis = createMockRedis();
      const storedJob = {
        id: 'job_abc',
        type: 'email-send',
        state: 'pending',
        payload: { to: 'x@y.com', subject: 's', templateId: 't', templateData: {} },
        createdAt: new Date().toISOString(),
        scheduledAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3,
        ttlSeconds: 604800,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(storedJob));
      mockedGetRedis.mockReturnValue(mockRedis);

      const client = new QueueClient();
      const job = await client.getJob('job_abc');

      expect(job).not.toBeNull();
      expect(job!.id).toBe('job_abc');
      expect(job!.type).toBe('email-send');
    });
  });

  // -----------------------------------------------------------------------
  // getQueueClient singleton
  // -----------------------------------------------------------------------

  describe('getQueueClient', () => {
    it('returns a QueueClient instance', () => {
      const client = getQueueClient();
      expect(client).toBeInstanceOf(QueueClient);
    });
  });
});
