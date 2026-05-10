/**
 * Tests for lib/compliance/evaluators/register.ts — bootstrap that wires the
 * per-control evaluators into the registry.
 */

import {
  registerAllEvaluators,
  resetRegistrationState,
  REGISTERED_EVALUATOR_KEYS,
} from '@/lib/compliance/evaluators/register';
import {
  clearRegistry,
  hasEvaluator,
  listEvaluators,
} from '@/lib/compliance/evaluators';

describe('register.ts — evaluator bootstrap', () => {
  beforeEach(() => {
    clearRegistry();
    resetRegistrationState();
  });

  it('registers every declared evaluator', () => {
    registerAllEvaluators();
    for (const key of REGISTERED_EVALUATOR_KEYS) {
      const [framework, code] = key.split('/');
      expect(
        hasEvaluator(
          framework as 'soc2' | 'iso27001',
          code,
        ),
      ).toBe(true);
    }
    expect(listEvaluators().length).toBe(REGISTERED_EVALUATOR_KEYS.length);
  });

  it('is idempotent on repeated calls', () => {
    registerAllEvaluators();
    registerAllEvaluators();
    expect(listEvaluators().length).toBe(REGISTERED_EVALUATOR_KEYS.length);
  });

  it('exposes the registered keys for documentation/discovery', () => {
    expect(REGISTERED_EVALUATOR_KEYS).toContain('soc2/CC6.1');
    expect(REGISTERED_EVALUATOR_KEYS).toContain('soc2/CC6.7');
  });
});
