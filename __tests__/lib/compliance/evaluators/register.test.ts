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

  it('R10 Phase 2 — registers all 25 NDIS controls (Core + Verification + Specialist)', () => {
    const ndisKeys = [
      'ndis/NDIS-1.1', 'ndis/NDIS-1.2', 'ndis/NDIS-1.3', 'ndis/NDIS-1.4', 'ndis/NDIS-1.5',
      'ndis/NDIS-2.1', 'ndis/NDIS-2.2', 'ndis/NDIS-2.3', 'ndis/NDIS-2.4', 'ndis/NDIS-2.5',
      'ndis/NDIS-2.6', 'ndis/NDIS-2.7', 'ndis/NDIS-2.8',
      'ndis/NDIS-3.1', 'ndis/NDIS-3.2', 'ndis/NDIS-3.3', 'ndis/NDIS-3.4', 'ndis/NDIS-3.5',
      'ndis/NDIS-4.1', 'ndis/NDIS-4.2',
      'ndis/NDIS-V.1', 'ndis/NDIS-V.2', 'ndis/NDIS-M.1', 'ndis/NDIS-M.2', 'ndis/NDIS-W.1',
    ];
    expect(ndisKeys).toHaveLength(25);
    for (const key of ndisKeys) {
      expect(REGISTERED_EVALUATOR_KEYS).toContain(key);
    }
  });
});
