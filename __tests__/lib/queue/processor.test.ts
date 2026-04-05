/**
 * Tests for lib/queue/processor.ts
 * Job queue processor — handler registration, batch processing, default handlers
 */

// ── mocks ────────────────────────────────────────────────
jest.mock('server-only', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  queueLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockRecoverStaleJobs = jest.fn().mockResolvedValue(0);
const mockFetchPendingJobs = jest.fn().mockResolvedValue([]);
const mockCompleteJob = jest.fn().mockResolvedValue(undefined);
const mockFailJob = jest.fn().mockResolvedValue('retry');
const mockCleanupExpiredDeadJobs = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/queue/client', () => ({
  getQueueClient: jest.fn(() => ({
    recoverStaleJobs: mockRecoverStaleJobs,
    fetchPendingJobs: mockFetchPendingJobs,
    completeJob: mockCompleteJob,
    failJob: mockFailJob,
    cleanupExpiredDeadJobs: mockCleanupExpiredDeadJobs,
  })),
}));

// ── imports ─────────────────────────────────────────────
import {
  QueueProcessor,
  getDefaultProcessor,
  processQueueJobs,
} from '@/lib/queue/processor';

// ── suite ───────────────────────────────────────────────
describe('QueueProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecoverStaleJobs.mockResolvedValue(0);
    mockFetchPendingJobs.mockResolvedValue([]);
    mockCompleteJob.mockResolvedValue(undefined);
    mockFailJob.mockResolvedValue('retry');
    mockCleanupExpiredDeadJobs.mockResolvedValue(undefined);
  });

  describe('registerHandler / registerHandlers', () => {
    it('registers a single handler', () => {
      const processor = new QueueProcessor();
      const handler = jest.fn();
      processor.registerHandler('email-send', handler);
      // No error means it worked (private field — tested via processJobs)
    });

    it('registers multiple handlers at once', () => {
      const processor = new QueueProcessor();
      processor.registerHandlers({
        'email-send': jest.fn(),
        'webhook-delivery': jest.fn(),
      });
    });
  });

  describe('processJobs', () => {
    it('returns zero-result when no pending jobs', async () => {
      const processor = new QueueProcessor();
      const result = await processor.processJobs();
      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('recovers stale jobs first', async () => {
      mockRecoverStaleJobs.mockResolvedValue(3);
      const processor = new QueueProcessor();
      await processor.processJobs();
      expect(mockRecoverStaleJobs).toHaveBeenCalled();
    });

    it('processes a successful job', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 'done' });
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j1',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
      ]);

      const processor = new QueueProcessor();
      processor.registerHandler('email-send', handler);
      const result = await processor.processJobs();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockCompleteJob).toHaveBeenCalledWith('j1', { status: 'done' });
    });

    it('processes a failed job and records failure', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('handler fail'));
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j2',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
      ]);

      const processor = new QueueProcessor();
      processor.registerHandler('email-send', handler);
      const result = await processor.processJobs();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockFailJob).toHaveBeenCalledWith('j2', 'handler fail');
    });

    it('moves job to dead letter when failJob returns dead', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('dead'));
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j3',
          type: 'email-send',
          payload: {},
          attempts: 3,
          maxAttempts: 3,
        },
      ]);
      mockFailJob.mockResolvedValue('dead');

      const processor = new QueueProcessor();
      processor.registerHandler('email-send', handler);
      const result = await processor.processJobs();

      expect(result.movedToDead).toBe(1);
    });

    it('throws for unregistered job type', async () => {
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j4',
          type: 'unknown-type',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
      ]);

      const processor = new QueueProcessor();
      const result = await processor.processJobs();

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('No handler registered');
    });

    it('processes multiple jobs in a batch', async () => {
      const handler = jest.fn().mockResolvedValue({ ok: true });
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j5',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
        {
          id: 'j6',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
        {
          id: 'j7',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
      ]);

      const processor = new QueueProcessor();
      processor.registerHandler('email-send', handler);
      const result = await processor.processJobs(10);

      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(3);
    });

    it('cleans up expired dead jobs after processing', async () => {
      const processor = new QueueProcessor();
      mockFetchPendingJobs.mockResolvedValue([]);
      await processor.processJobs();
      // cleanup is only called when there's at least one job processed,
      // but it's best-effort. Let's test with a job:
      const handler = jest.fn().mockResolvedValue({ ok: true });
      mockFetchPendingJobs.mockResolvedValue([
        {
          id: 'j8',
          type: 'email-send',
          payload: {},
          attempts: 1,
          maxAttempts: 3,
        },
      ]);

      const proc2 = new QueueProcessor();
      proc2.registerHandler('email-send', handler);
      await proc2.processJobs();
      expect(mockCleanupExpiredDeadJobs).toHaveBeenCalled();
    });

    it('handles fatal processing error gracefully', async () => {
      mockRecoverStaleJobs.mockRejectedValue(new Error('redis down'));
      const processor = new QueueProcessor();
      const result = await processor.processJobs();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultProcessor', () => {
    it('returns a singleton processor', () => {
      const p1 = getDefaultProcessor();
      const p2 = getDefaultProcessor();
      expect(p1).toBe(p2);
    });
  });

  describe('processQueueJobs', () => {
    it('delegates to default processor', async () => {
      mockFetchPendingJobs.mockResolvedValue([]);
      const result = await processQueueJobs();
      expect(result.processed).toBe(0);
    });

    it('accepts batch size', async () => {
      mockFetchPendingJobs.mockResolvedValue([]);
      const result = await processQueueJobs(5);
      expect(result.processed).toBe(0);
    });
  });
});
