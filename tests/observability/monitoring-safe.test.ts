/** @jest-environment node */

jest.mock('@/lib/observability/structured-logger', () => {
  const actual = jest.requireActual('@/lib/observability/structured-logger');
  return {
    ...actual,
    logStructured: jest.fn(),
  };
});

import { withJobMonitoring, withMonitoring } from '@/lib/observability/api-wrapper';
import { enterpriseMonitor } from '@/lib/observability/enterprise-monitor';
import { logStructured } from '@/lib/observability/structured-logger';

describe('monitoring safety', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not throw when monitoring or logging fails on success', async () => {
    jest.spyOn(enterpriseMonitor, 'trackAPICall').mockImplementation(() => {
      throw new Error('monitor failure');
    });
    (logStructured as jest.Mock).mockImplementation(() => {
      throw new Error('log failure');
    });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockImplementationOnce(() => 0).mockImplementationOnce(() => 600);

    const result = await withMonitoring('api', 'health/check', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('rethrows the original error even if monitoring fails', async () => {
    jest.spyOn(enterpriseMonitor, 'trackAPICall').mockImplementation(() => {
      throw new Error('monitor failure');
    });
    (logStructured as jest.Mock).mockImplementation(() => {
      throw new Error('log failure');
    });

    await expect(
      withMonitoring('api', 'health/fail', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
  });

  it('does not throw when job monitoring fails', async () => {
    jest.spyOn(enterpriseMonitor, 'trackBackgroundJob').mockImplementation(() => {
      throw new Error('monitor failure');
    });
    (logStructured as jest.Mock).mockImplementation(() => {
      throw new Error('log failure');
    });

    const result = await withJobMonitoring('test_job', async () => 'ok');
    expect(result).toBe('ok');
  });
});
