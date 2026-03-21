import {
  ROLE_OPTIONS,
  getDefaultRoleOptionId,
  getRoleOptionById,
  isReadOnlyPersonaRole,
  resolveRoleSelectionOutcome,
} from '@/lib/onboarding/journey';

describe('onboarding journey helpers', () => {
  it('defines all supported onboarding personas', () => {
    expect(ROLE_OPTIONS.map((option) => option.role)).toEqual([
      'owner',
      'admin',
      'member',
      'viewer',
    ]);
  });

  it('resolves full-setup personas to step 5', () => {
    const ownerOutcome = resolveRoleSelectionOutcome('employer', ['hipaa']);
    const adminOutcome = resolveRoleSelectionOutcome('compliance_lead', ['soc2']);

    expect(ownerOutcome).toMatchObject({
      nextStep: 5,
      completedSteps: [4],
      redirectPath: '/onboarding?step=5',
      frameworksToPersist: null,
    });
    expect(ownerOutcome?.option.role).toBe('owner');

    expect(adminOutcome).toMatchObject({
      nextStep: 5,
      completedSteps: [4],
      redirectPath: '/onboarding?step=5',
      frameworksToPersist: null,
    });
    expect(adminOutcome?.option.role).toBe('admin');
  });

  it('fast-tracks member personas and preserves existing frameworks', () => {
    const outcome = resolveRoleSelectionOutcome('employee', ['hipaa', 'hipaa', 'gdpr']);

    expect(outcome).toMatchObject({
      nextStep: 7,
      completedSteps: [4, 5, 6],
      redirectPath: '/onboarding?step=7&fast_track=1&persona=member',
      frameworksToPersist: ['hipaa', 'gdpr'],
    });
    expect(outcome?.option.role).toBe('member');
  });

  it('fast-tracks viewer personas with default frameworks when none exist', () => {
    const outcome = resolveRoleSelectionOutcome('external_auditor', []);

    expect(outcome).toMatchObject({
      nextStep: 7,
      completedSteps: [4, 5, 6],
      redirectPath: '/onboarding?step=7&fast_track=1&persona=viewer',
      frameworksToPersist: ['iso27001'],
    });
    expect(outcome?.option.role).toBe('viewer');
  });

  it('returns null for unknown role selections', () => {
    expect(resolveRoleSelectionOutcome('not-a-role', ['soc2'])).toBeNull();
    expect(getRoleOptionById('not-a-role')).toBeUndefined();
  });

  it('maps stored roles back to the right default onboarding option', () => {
    expect(getDefaultRoleOptionId('owner')).toBe('employer');
    expect(getDefaultRoleOptionId('admin')).toBe('compliance_lead');
    expect(getDefaultRoleOptionId('member')).toBe('employee');
    expect(getDefaultRoleOptionId('viewer')).toBe('external_auditor');
    expect(getDefaultRoleOptionId(null)).toBe('employer');
  });

  it('treats viewer personas as read-only from either role or query state', () => {
    expect(isReadOnlyPersonaRole('viewer', null)).toBe(true);
    expect(isReadOnlyPersonaRole('member', 'viewer')).toBe(true);
    expect(isReadOnlyPersonaRole('member', 'member')).toBe(false);
  });
});
