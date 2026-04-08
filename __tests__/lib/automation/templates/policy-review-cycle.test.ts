import { policyReviewCycleTemplate } from '@/lib/automation/templates/policy-review-cycle';

describe('policyReviewCycleTemplate', () => {
  it('has correct metadata', () => {
    expect(policyReviewCycleTemplate.id).toBe('policy-review-cycle');
    expect(policyReviewCycleTemplate.name).toBe('Policy Review Cycle');
    expect(policyReviewCycleTemplate.triggerType).toBe('policy_review_due');
    expect(policyReviewCycleTemplate.estimatedSetupTime).toBe('11 minutes');
  });

  it('targets SOC 2, ISO 27001, and HIPAA', () => {
    expect(policyReviewCycleTemplate.framework).toEqual(
      expect.arrayContaining(['SOC 2', 'ISO 27001', 'HIPAA']),
    );
  });

  it('has definition with correct trigger', () => {
    expect(policyReviewCycleTemplate.definition.trigger.type).toBe(
      'policy_review_due',
    );
  });

  it('follows notify → task → wait → condition flow', () => {
    const steps = policyReviewCycleTemplate.definition.steps;
    expect(steps[0].id).toBe('notify-owner');
    expect(steps[0].type).toBe('action');
    expect(steps[1].id).toBe('create-review-task');
    expect(steps[1].type).toBe('action');
    expect(steps[2].id).toBe('wait-fourteen-days');
    expect(steps[2].type).toBe('delay');
    expect(steps[3].id).toBe('policy-review-check');
    expect(steps[3].type).toBe('condition');
  });

  it('has a 14-day delay', () => {
    const delay = policyReviewCycleTemplate.definition.steps[2] as any;
    expect(delay.duration).toBe('14d');
  });

  it('thenSteps update policy version and notify staff', () => {
    const condition = policyReviewCycleTemplate.definition.steps[3] as any;
    const thenIds = condition.thenSteps.map((s: any) => s.id);
    expect(thenIds).toContain('update-policy-version');
    expect(thenIds).toContain('notify-staff');
    expect(thenIds).toContain('create-ack-task');
  });

  it('elseSteps escalate to manager', () => {
    const condition = policyReviewCycleTemplate.definition.steps[3] as any;
    expect(condition.elseSteps).toHaveLength(1);
    expect(condition.elseSteps[0].id).toBe('policy-escalation');
  });

  it('create-review-task has high priority', () => {
    const task = policyReviewCycleTemplate.definition.steps[1] as any;
    expect(task.config.priority).toBe('high');
  });
});
