import { certificateExpiryEscalationTemplate } from '@/lib/automation/templates/certificate-expiry-escalation';

describe('certificateExpiryEscalationTemplate', () => {
  it('has correct metadata', () => {
    expect(certificateExpiryEscalationTemplate.id).toBe(
      'certificate-expiry-escalation',
    );
    expect(certificateExpiryEscalationTemplate.name).toBe(
      'Certificate Expiry Escalation',
    );
    expect(certificateExpiryEscalationTemplate.triggerType).toBe(
      'certificate_expiring',
    );
    expect(certificateExpiryEscalationTemplate.estimatedSetupTime).toBe(
      '10 minutes',
    );
  });

  it('targets SOC 2, ISO 27001, and HIPAA', () => {
    expect(certificateExpiryEscalationTemplate.framework).toEqual(
      expect.arrayContaining(['SOC 2', 'ISO 27001', 'HIPAA']),
    );
  });

  it('has correct trigger type in definition', () => {
    expect(certificateExpiryEscalationTemplate.definition.trigger.type).toBe(
      'certificate_expiring',
    );
  });

  it('follows notify → wait → condition flow', () => {
    const steps = certificateExpiryEscalationTemplate.definition.steps;
    expect(steps).toHaveLength(3);
    expect(steps[0].id).toBe('notify-assignee');
    expect(steps[0].type).toBe('action');
    expect(steps[1].id).toBe('wait-seven-days');
    expect(steps[1].type).toBe('delay');
    expect(steps[2].id).toBe('check-renewal');
    expect(steps[2].type).toBe('condition');
  });

  it('has a 7-day delay before renewal check', () => {
    const delay = certificateExpiryEscalationTemplate.definition
      .steps[1] as any;
    expect(delay.duration).toBe('7d');
  });

  it('condition checks trigger.data.renewed', () => {
    const condition = certificateExpiryEscalationTemplate.definition
      .steps[2] as any;
    expect(condition.conditions[0].field).toBe('trigger.data.renewed');
    expect(condition.conditions[0].operator).toBe('eq');
    expect(condition.conditions[0].value).toBe(true);
  });

  it('thenSteps are empty (no action needed if renewed)', () => {
    const condition = certificateExpiryEscalationTemplate.definition
      .steps[2] as any;
    expect(condition.thenSteps).toHaveLength(0);
  });

  it('elseSteps escalate through manager to compliance lead', () => {
    const condition = certificateExpiryEscalationTemplate.definition
      .steps[2] as any;
    const elseIds = condition.elseSteps.map((s: any) => s.id);
    expect(elseIds).toContain('notify-manager');
    expect(elseIds).toContain('wait-three-days');
    expect(elseIds).toContain('final-escalation');
    expect(elseIds).toContain('create-overdue-task');
  });

  it('has a 3-day delay in escalation path', () => {
    const condition = certificateExpiryEscalationTemplate.definition
      .steps[2] as any;
    const delay = condition.elseSteps.find(
      (s: any) => s.id === 'wait-three-days',
    );
    expect(delay.type).toBe('delay');
    expect(delay.duration).toBe('3d');
  });

  it('notify-assignee links to vault page', () => {
    const notify = certificateExpiryEscalationTemplate.definition
      .steps[0] as any;
    expect(notify.config.actionUrl).toBe('/app/vault');
  });

  it('overdue task has high priority', () => {
    const condition = certificateExpiryEscalationTemplate.definition
      .steps[2] as any;
    const task = condition.elseSteps.find(
      (s: any) => s.id === 'create-overdue-task',
    );
    expect(task.config.priority).toBe('high');
  });
});
