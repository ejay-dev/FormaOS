/**
 * @jest-environment node
 *
 * High-16: Trigger.dev was removed. lib/trigger/client.ts is now a
 * behaviour-preserving stub — both exports are unconditional no-ops.
 * The previous test suite mocked `@trigger.dev/sdk` and exercised the
 * env-gating logic; the SDK is gone, the env-gating is gone, and the
 * test now just asserts the stub contract so callers can rely on it.
 */

jest.mock('server-only', () => ({}));

import {
  isTriggerConfigured,
  triggerTaskIfConfigured,
} from '@/lib/trigger/client';

describe('lib/trigger/client (stub after Trigger.dev removal)', () => {
  it('isTriggerConfigured() always returns false', () => {
    process.env.TRIGGER_SECRET_KEY = 'set';
    process.env.TRIGGER_PROJECT_REF = 'set';
    expect(isTriggerConfigured()).toBe(false);
  });

  it('triggerTaskIfConfigured() always resolves false (callers fall through to inline path)', async () => {
    await expect(
      triggerTaskIfConfigured('report-export-job', { foo: 'bar' }),
    ).resolves.toBe(false);
  });

  it('triggerTaskIfConfigured() never throws even with unusual options', async () => {
    await expect(
      triggerTaskIfConfigured('execute-workflow', { x: 1 }, {
        queue: 'whatever',
        idempotencyKey: ['a', 'b'],
        tags: ['t'],
        delay: '1m',
      }),
    ).resolves.toBe(false);
  });
});
