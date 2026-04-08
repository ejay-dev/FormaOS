import { evidenceReviewCycleTemplate } from '@/lib/automation/templates/evidence-review-cycle';

describe('evidenceReviewCycleTemplate', () => {
  it('has correct metadata', () => {
    expect(evidenceReviewCycleTemplate.id).toBe('evidence-review-cycle');
    expect(evidenceReviewCycleTemplate.name).toBe('Evidence Review Cycle');
    expect(evidenceReviewCycleTemplate.triggerType).toBe('evidence_uploaded');
    expect(evidenceReviewCycleTemplate.estimatedSetupTime).toBe('12 minutes');
  });

  it('targets SOC 2 and ISO 27001', () => {
    expect(evidenceReviewCycleTemplate.framework).toEqual(
      expect.arrayContaining(['SOC 2', 'ISO 27001']),
    );
  });

  it('has correct trigger type in definition', () => {
    expect(evidenceReviewCycleTemplate.definition.trigger.type).toBe(
      'evidence_uploaded',
    );
  });

  it('follows assign → approval → condition flow', () => {
    const steps = evidenceReviewCycleTemplate.definition.steps;
    expect(steps).toHaveLength(3);
    expect(steps[0].id).toBe('assign-review-task');
    expect(steps[0].type).toBe('action');
    expect(steps[1].id).toBe('review-approval');
    expect(steps[1].type).toBe('approval');
    expect(steps[2].id).toBe('apply-review-result');
    expect(steps[2].type).toBe('condition');
  });

  it('approval step has 5-day timeout with escalation', () => {
    const approval = evidenceReviewCycleTemplate.definition.steps[1] as any;
    expect(approval.timeout).toBe('5d');
    expect(approval.onTimeout).toBe('escalate');
  });

  it('thenSteps update control and recalculate score', () => {
    const condition = evidenceReviewCycleTemplate.definition.steps[2] as any;
    const thenIds = condition.thenSteps.map((s: any) => s.id);
    expect(thenIds).toContain('update-control-status');
    expect(thenIds).toContain('recalculate-score');
  });

  it('elseSteps notify uploader and create remediation', () => {
    const condition = evidenceReviewCycleTemplate.definition.steps[2] as any;
    const elseIds = condition.elseSteps.map((s: any) => s.id);
    expect(elseIds).toContain('notify-uploader');
    expect(elseIds).toContain('create-remediation-task');
  });

  it('condition checks approval result', () => {
    const condition = evidenceReviewCycleTemplate.definition.steps[2] as any;
    expect(condition.conditions[0].field).toBe(
      'steps.review-approval.approved',
    );
    expect(condition.conditions[0].value).toBe(true);
  });
});
