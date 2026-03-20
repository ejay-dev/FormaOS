/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({}));
jest.mock('@/lib/provisioning/ensure-provisioning', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  careOpsLogger: { info: jest.fn(), error: jest.fn() },
}));

import {
  deriveOnboardingStep,
  isOnboardingComplete,
  type OnboardingSnapshot,
} from '@/lib/provisioning/workspace-recovery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(
  overrides: Partial<OnboardingSnapshot> = {},
): OnboardingSnapshot {
  return {
    hasPlan: true,
    hasIndustry: true,
    hasFrameworks: true,
    hasRole: true,
    onboardingCompleted: true,
    storedStep: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveOnboardingStep
// ---------------------------------------------------------------------------

describe('deriveOnboardingStep', () => {
  describe('missing fields return the earliest incomplete step', () => {
    it('returns 2 when hasPlan is false', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasPlan: false }))).toBe(2);
    });

    it('returns 3 when hasIndustry is false (plan present)', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasIndustry: false }))).toBe(3);
    });

    it('returns 4 when hasRole is false (plan + industry present)', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasRole: false }))).toBe(4);
    });

    it('returns 5 when hasFrameworks is false (plan + industry + role present)', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasFrameworks: false }))).toBe(5);
    });
  });

  describe('priority order: plan > industry > role > frameworks', () => {
    it('returns 2 when nothing is set', () => {
      expect(
        deriveOnboardingStep(
          makeSnapshot({
            hasPlan: false,
            hasIndustry: false,
            hasRole: false,
            hasFrameworks: false,
          }),
        ),
      ).toBe(2);
    });

    it('returns 3 when only plan is set', () => {
      expect(
        deriveOnboardingStep(
          makeSnapshot({
            hasIndustry: false,
            hasRole: false,
            hasFrameworks: false,
          }),
        ),
      ).toBe(3);
    });

    it('returns 4 when plan + industry set but role + frameworks missing', () => {
      expect(
        deriveOnboardingStep(
          makeSnapshot({
            hasRole: false,
            hasFrameworks: false,
          }),
        ),
      ).toBe(4);
    });
  });

  describe('all fields present: uses storedStep with clamping', () => {
    it('defaults to step 1 when storedStep is null', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: null }))).toBe(1);
    });

    it('returns storedStep when within valid range', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 3 }))).toBe(3);
    });

    it('returns 1 for storedStep of 1', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 1 }))).toBe(1);
    });

    it('returns 7 for storedStep of 7', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 7 }))).toBe(7);
    });

    it('clamps storedStep below 1 to 1', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 0 }))).toBe(1);
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: -5 }))).toBe(1);
    });

    it('clamps storedStep above 7 to 7', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 8 }))).toBe(7);
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 100 }))).toBe(7);
    });

    it('truncates floating-point storedStep values', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 3.9 }))).toBe(3);
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: 6.1 }))).toBe(6);
    });

    it('returns 1 for NaN storedStep', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: NaN }))).toBe(1);
    });

    it('returns 1 for Infinity storedStep', () => {
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: Infinity }))).toBe(1);
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: -Infinity }))).toBe(1);
    });
  });

  describe('missing field takes precedence over storedStep', () => {
    it('returns 2 for missing plan even with storedStep 6', () => {
      expect(
        deriveOnboardingStep(makeSnapshot({ hasPlan: false, storedStep: 6 })),
      ).toBe(2);
    });

    it('returns 5 for missing frameworks even with storedStep 7', () => {
      expect(
        deriveOnboardingStep(
          makeSnapshot({ hasFrameworks: false, storedStep: 7 }),
        ),
      ).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// isOnboardingComplete
// ---------------------------------------------------------------------------

describe('isOnboardingComplete', () => {
  it('returns true when all flags are true', () => {
    expect(isOnboardingComplete(makeSnapshot())).toBe(true);
  });

  it('returns false when onboardingCompleted is false', () => {
    expect(
      isOnboardingComplete(makeSnapshot({ onboardingCompleted: false })),
    ).toBe(false);
  });

  it('returns false when hasPlan is false', () => {
    expect(isOnboardingComplete(makeSnapshot({ hasPlan: false }))).toBe(false);
  });

  it('returns false when hasIndustry is false', () => {
    expect(isOnboardingComplete(makeSnapshot({ hasIndustry: false }))).toBe(
      false,
    );
  });

  it('returns false when hasFrameworks is false', () => {
    expect(isOnboardingComplete(makeSnapshot({ hasFrameworks: false }))).toBe(
      false,
    );
  });

  it('returns false when hasRole is false', () => {
    expect(isOnboardingComplete(makeSnapshot({ hasRole: false }))).toBe(false);
  });

  it('returns false when only onboardingCompleted is true but data flags are false', () => {
    expect(
      isOnboardingComplete(
        makeSnapshot({
          hasPlan: false,
          hasIndustry: false,
          hasFrameworks: false,
          hasRole: false,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when all data flags are true but onboardingCompleted is false', () => {
    expect(
      isOnboardingComplete(makeSnapshot({ onboardingCompleted: false })),
    ).toBe(false);
  });

  it('returns false when a single field is missing among otherwise complete data', () => {
    const fields: (keyof OnboardingSnapshot)[] = [
      'hasPlan',
      'hasIndustry',
      'hasFrameworks',
      'hasRole',
      'onboardingCompleted',
    ];

    for (const field of fields) {
      const snapshot = makeSnapshot({ [field]: false });
      expect(isOnboardingComplete(snapshot)).toBe(false);
    }
  });

  it('ignores storedStep value entirely', () => {
    expect(isOnboardingComplete(makeSnapshot({ storedStep: null }))).toBe(true);
    expect(isOnboardingComplete(makeSnapshot({ storedStep: 0 }))).toBe(true);
    expect(isOnboardingComplete(makeSnapshot({ storedStep: 99 }))).toBe(true);
  });
});
