/**
 * @jest-environment node
 */

// ---------------------------------------------------------------------------
// Supabase builder helper (thenable chain)
// ---------------------------------------------------------------------------
function createBuilder(result = { data: null, error: null } as any) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
    'rpc',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => {
  const c = {
    from: jest.fn(() => createBuilder()),
    rpc: jest.fn(() => createBuilder()),
  };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __client: c,
  };
});

jest.mock('@/lib/provisioning/ensure-provisioning', () => ({
  ensureUserProvisioning: jest
    .fn()
    .mockResolvedValue({ ok: true, actions: [] }),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  careOpsLogger: { info: jest.fn(), error: jest.fn() },
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  deriveOnboardingStep,
  isOnboardingComplete,
  recoverUserWorkspace,
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
      expect(deriveOnboardingStep(makeSnapshot({ hasIndustry: false }))).toBe(
        3,
      );
    });

    it('returns 4 when hasRole is false (plan + industry present)', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasRole: false }))).toBe(4);
    });

    it('returns 5 when hasFrameworks is false (plan + industry + role present)', () => {
      expect(deriveOnboardingStep(makeSnapshot({ hasFrameworks: false }))).toBe(
        5,
      );
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
      expect(deriveOnboardingStep(makeSnapshot({ storedStep: Infinity }))).toBe(
        1,
      );
      expect(
        deriveOnboardingStep(makeSnapshot({ storedStep: -Infinity })),
      ).toBe(1);
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

// ---------------------------------------------------------------------------
// recoverUserWorkspace
// ---------------------------------------------------------------------------

describe('recoverUserWorkspace', () => {
  const {
    ensureUserProvisioning,
  } = require('@/lib/provisioning/ensure-provisioning');

  beforeEach(() => {
    jest.clearAllMocks();
    ensureUserProvisioning.mockResolvedValue({ ok: true, actions: [] });
  });

  function setupChain(tables: Record<string, any>) {
    const _callIdx = 0;
    const tableBuilders: Record<string, ReturnType<typeof createBuilder>> = {};
    for (const [table, result] of Object.entries(tables)) {
      tableBuilders[table] = createBuilder(result);
    }
    getClient().from.mockImplementation((table: string) => {
      if (tableBuilders[table]) return tableBuilders[table];
      return createBuilder();
    });
  }

  const orgId = 'org-111';
  const userId = 'user-222';

  it('returns /auth/signin when membership is missing', async () => {
    setupChain({
      org_members: { data: [], error: null },
    });
    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(false);
    expect(result.nextPath).toBe('/auth/signin');
    expect(result.missingRecords).toContain('org_members');
  });

  it('returns /auth/signin when org_members query errors', async () => {
    setupChain({
      org_members: { data: null, error: { message: 'db error' } },
    });
    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(false);
    expect(result.nextPath).toBe('/auth/signin');
  });

  it('returns /auth/signin when organization is missing', async () => {
    const _callNum = 0;
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'owner' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });
    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(false);
    expect(result.nextPath).toBe('/auth/signin');
    expect(result.missingRecords).toContain('organizations');
  });

  it('returns /app when onboarding is fully complete', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'admin' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Test Org',
            plan_key: 'pro',
            industry: 'healthcare',
            frameworks: ['soc2', 'hipaa'],
            onboarding_completed: true,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 7,
            completed_steps: [1, 2, 3, 4, 5, 6, 7],
            completed_at: '2024-01-01',
          },
          error: null,
        });
      return createBuilder();
    });
    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(true);
    expect(result.nextPath).toBe('/app');
    expect(result.onboardingComplete).toBe(true);
    expect(result.organizationId).toBe(orgId);
  });

  it('returns /onboarding?step=N when onboarding is incomplete', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'member' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Test Org',
            plan_key: 'basic',
            industry: null,
            frameworks: null,
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({ data: [], error: null });
      if (table === 'org_onboarding_status')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(true);
    expect(result.nextPath).toBe('/onboarding?step=3');
    expect(result.onboardingComplete).toBe(false);
    expect(result.onboardingStep).toBe(3);
  });

  it('backfills role when membership has null role', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: null }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'pro',
            industry: 'finance',
            frameworks: ['soc2'],
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({
      userId,
      userEmail: 'a@b.com',
      source: 'test',
    });
    expect(result.actions).toContain('role_backfilled');
  });

  it('promotes onboarding flag when status is marked complete but flag is false', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'owner' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'enterprise',
            industry: 'tech',
            frameworks: ['iso27001'],
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 7,
            completed_steps: [1, 2, 3, 4, 5, 6, 7],
            completed_at: '2024-06-01',
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.actions).toContain('onboarding_flag_promoted');
    expect(result.onboardingComplete).toBe(true);
    expect(result.nextPath).toBe('/app');
  });

  it('creates onboarding_status when none exists', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'member' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: null,
            industry: null,
            frameworks: null,
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({ data: [], error: null });
      if (table === 'org_onboarding_status')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.actions).toContain('onboarding_status_created');
  });

  it('falls back to rpc_bootstrap_user when provisioning fails', async () => {
    ensureUserProvisioning.mockResolvedValue({
      ok: false,
      actions: ['attempted'],
    });
    getClient().rpc.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'admin' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'basic',
            industry: 'edu',
            frameworks: ['gdpr'],
            onboarding_completed: true,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 7,
            completed_steps: [7],
            completed_at: '2024-01-01',
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.actions).toContain('rpc_bootstrap_user');
    expect(result.ok).toBe(true);
  });

  it('picks highest-role membership when multiple exist', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [
            { organization_id: 'org-low', role: 'member' },
            { organization_id: orgId, role: 'owner' },
          ],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Primary',
            plan_key: 'pro',
            industry: 'healthcare',
            frameworks: ['hipaa'],
            onboarding_completed: true,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 7,
            completed_steps: [7],
            completed_at: '2024-01-01',
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.organizationId).toBe(orgId);
  });

  it('backfills frameworks from org_frameworks when organization.frameworks is null', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'admin' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'pro',
            industry: 'tech',
            frameworks: null,
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({
          data: [{ framework_slug: 'soc2' }, { framework_slug: 'iso27001' }],
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.actions).toContain(
      'frameworks_backfilled_from_org_frameworks',
    );
  });

  it('reports missing plan, industry, frameworks in missingRecords', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'member' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Empty Org',
            plan_key: null,
            industry: null,
            frameworks: null,
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({ data: [], error: null });
      if (table === 'org_onboarding_status')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.missingRecords).toContain('organizations.plan_key');
    expect(result.missingRecords).toContain('organizations.industry');
    expect(result.missingRecords).toContain('organizations.frameworks');
  });

  it('repairs onboarding step when stored step differs', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'member' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'basic',
            industry: 'health',
            frameworks: null,
            onboarding_completed: false,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({ data: [], error: null });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 2,
            completed_steps: [],
            completed_at: null,
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    // Missing frameworks → step 5, but stored step is 2, so it should repair
    expect(result.actions).toContain('onboarding_step_repaired');
    expect(result.onboardingStep).toBe(5);
  });

  it('repairs onboarding_completed flag when flag is true but snapshot says incomplete', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'member' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: null,
            industry: null,
            frameworks: null,
            onboarding_completed: true,
          },
          error: null,
        });
      if (table === 'org_frameworks')
        return createBuilder({ data: [], error: null });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 2,
            completed_steps: [],
            completed_at: null,
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.actions).toContain('onboarding_flag_repaired');
  });

  it('still returns ok when ensureUserProvisioning throws', async () => {
    ensureUserProvisioning.mockRejectedValue(new Error('boom'));

    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ organization_id: orgId, role: 'admin' }],
          error: null,
        });
      if (table === 'organizations')
        return createBuilder({
          data: {
            id: orgId,
            name: 'Org',
            plan_key: 'pro',
            industry: 'tech',
            frameworks: ['soc2'],
            onboarding_completed: true,
          },
          error: null,
        });
      if (table === 'org_onboarding_status')
        return createBuilder({
          data: {
            organization_id: orgId,
            current_step: 7,
            completed_steps: [7],
            completed_at: '2024-01-01',
          },
          error: null,
        });
      return createBuilder();
    });

    const result = await recoverUserWorkspace({ userId, source: 'test' });
    expect(result.ok).toBe(true);
    expect(result.nextPath).toBe('/app');
  });
});
