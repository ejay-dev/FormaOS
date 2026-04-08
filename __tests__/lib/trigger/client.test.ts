jest.mock('server-only', () => ({}));
jest.mock('@trigger.dev/sdk', () => ({
  tasks: {
    trigger: jest.fn(() => Promise.resolve()),
  },
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.restoreAllMocks();
  const { tasks } = require('@trigger.dev/sdk');
  tasks.trigger.mockReset();
  tasks.trigger.mockResolvedValue(undefined);
  process.env = { ...originalEnv };
});
afterAll(() => {
  process.env = originalEnv;
});

import {
  isTriggerConfigured,
  triggerTaskIfConfigured,
} from '@/lib/trigger/client';

describe('isTriggerConfigured', () => {
  it('returns false when env vars missing', () => {
    delete process.env.TRIGGER_SECRET_KEY;
    delete process.env.TRIGGER_PROJECT_REF;
    expect(isTriggerConfigured()).toBe(false);
  });

  it('returns true when both env vars set', () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    expect(isTriggerConfigured()).toBe(true);
  });

  it('returns false for empty strings', () => {
    process.env.TRIGGER_SECRET_KEY = '  ';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    expect(isTriggerConfigured()).toBe(false);
  });
});

describe('triggerTaskIfConfigured', () => {
  it('returns false when not configured', async () => {
    delete process.env.TRIGGER_SECRET_KEY;
    const result = await triggerTaskIfConfigured('report-export-job', {});
    expect(result).toBe(false);
  });

  it('returns false when TRIGGER_DISABLED=1', async () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    process.env.TRIGGER_DISABLED = '1';
    const result = await triggerTaskIfConfigured('report-export-job', {});
    expect(result).toBe(false);
  });

  it('returns false in development without TRIGGER_DEV_ENABLED', async () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    process.env.NODE_ENV = 'development';
    delete process.env.TRIGGER_DEV_ENABLED;
    const result = await triggerTaskIfConfigured('report-export-job', {});
    expect(result).toBe(false);
  });

  it('returns true in production when configured', async () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    process.env.NODE_ENV = 'production';
    delete process.env.TRIGGER_DISABLED;
    const result = await triggerTaskIfConfigured('report-export-job', {
      key: 'val',
    });
    expect(result).toBe(true);
    const { tasks } = require('@trigger.dev/sdk');
    expect(tasks.trigger).toHaveBeenCalledWith(
      'report-export-job',
      { key: 'val' },
      expect.objectContaining({ queue: 'exports' }),
    );
  });

  it('catches trigger error and returns false', async () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    process.env.NODE_ENV = 'production';
    const { tasks } = require('@trigger.dev/sdk');
    tasks.trigger.mockRejectedValue(new Error('network error'));
    const result = await triggerTaskIfConfigured('report-export-job', {});
    expect(result).toBe(false);
  });

  it('returns true in dev with TRIGGER_DEV_ENABLED=1', async () => {
    process.env.TRIGGER_SECRET_KEY = 'secret';
    process.env.TRIGGER_PROJECT_REF = 'proj';
    process.env.NODE_ENV = 'development';
    process.env.TRIGGER_DEV_ENABLED = '1';
    const result = await triggerTaskIfConfigured('report-export-job', {});
    expect(result).toBe(true);
  });
});
