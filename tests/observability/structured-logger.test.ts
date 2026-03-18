/** @jest-environment node */

import { logStructured } from '@/lib/observability/structured-logger';

describe('structured logger', () => {
  it('does not throw on BigInt metadata', () => {
    expect(() => {
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'info',
        domain: 'api',
        action: 'test_bigint',
        metadata: { value: BigInt(123) },
      });
    }).not.toThrow();
  });
});
