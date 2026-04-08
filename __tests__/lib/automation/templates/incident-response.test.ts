import { incidentResponseTemplate } from '@/lib/automation/templates/incident-response';

describe('incidentResponseTemplate', () => {
  it('has correct metadata', () => {
    expect(incidentResponseTemplate.id).toBe('incident-response');
    expect(incidentResponseTemplate.name).toBe('Incident Response');
    expect(incidentResponseTemplate.triggerType).toBe('incident_created');
    expect(incidentResponseTemplate.estimatedSetupTime).toBe('15 minutes');
  });

  it('targets SOC 2 and ISO 27001 frameworks', () => {
    expect(incidentResponseTemplate.framework).toEqual(
      expect.arrayContaining(['SOC 2', 'ISO 27001']),
    );
  });

  it('applies to all industries', () => {
    expect(incidentResponseTemplate.industry).toContain('all');
  });

  it('has a definition with steps', () => {
    const { definition } = incidentResponseTemplate;
    expect(definition.name).toBe('Incident Response');
    expect(definition.trigger.type).toBe('incident_created');
    expect(definition.steps.length).toBeGreaterThanOrEqual(1);
  });

  it('starts with a severity condition check', () => {
    const step = incidentResponseTemplate.definition.steps[0];
    expect(step.id).toBe('severity-check');
    expect(step.type).toBe('condition');
  });

  it('checks for critical / sev1 severity', () => {
    const step = incidentResponseTemplate.definition.steps[0] as any;
    expect(step.conditions[0].field).toBe('trigger.data.severity');
    expect(step.conditions[0].operator).toBe('in');
    expect(step.conditions[0].value).toEqual(['critical', 'sev1']);
  });

  it('has thenSteps for critical path including notify-admins and war room', () => {
    const step = incidentResponseTemplate.definition.steps[0] as any;
    const thenIds = step.thenSteps.map((s: any) => s.id);
    expect(thenIds).toContain('notify-admins');
    expect(thenIds).toContain('create-war-room');
    expect(thenIds).toContain('assign-incident-lead');
    expect(thenIds).toContain('parallel-investigation');
    expect(thenIds).toContain('schedule-48h-review');
  });

  it('has parallel investigation branch', () => {
    const step = incidentResponseTemplate.definition.steps[0] as any;
    const parallel = step.thenSteps.find(
      (s: any) => s.id === 'parallel-investigation',
    );
    expect(parallel.type).toBe('parallel');
    expect(parallel.branches).toHaveLength(2);
    expect(parallel.branches[0][0].id).toBe('collect-evidence');
    expect(parallel.branches[1][0].id).toBe('document-impact');
  });

  it('has elseSteps for non-critical path', () => {
    const step = incidentResponseTemplate.definition.steps[0] as any;
    expect(step.elseSteps).toHaveLength(1);
    expect(step.elseSteps[0].id).toBe('assign-oncall');
    expect(step.elseSteps[0].action).toBe('assign_task');
  });

  it('has a 48h delay in the critical path', () => {
    const step = incidentResponseTemplate.definition.steps[0] as any;
    const delay = step.thenSteps.find(
      (s: any) => s.id === 'schedule-48h-review',
    );
    expect(delay.type).toBe('delay');
    expect(delay.duration).toBe('48h');
  });
});
