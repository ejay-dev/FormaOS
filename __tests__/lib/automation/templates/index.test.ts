import {
  workflowTemplateRegistry,
  getWorkflowTemplate,
  listWorkflowTemplates,
} from '@/lib/automation/templates/index';

describe('workflowTemplateRegistry', () => {
  it('contains 8 templates', () => {
    expect(workflowTemplateRegistry).toHaveLength(8);
  });

  it('all templates have unique IDs', () => {
    const ids = workflowTemplateRegistry.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have required fields', () => {
    for (const t of workflowTemplateRegistry) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.triggerType).toBeTruthy();
      expect(t.definition).toBeDefined();
      expect(t.definition.steps.length).toBeGreaterThan(0);
    }
  });
});

describe('getWorkflowTemplate', () => {
  it('returns template by ID', () => {
    const template = getWorkflowTemplate('incident-response');
    expect(template).toBeDefined();
    expect(template!.name).toBe('Incident Response');
  });

  it('returns undefined for unknown ID', () => {
    expect(getWorkflowTemplate('nonexistent')).toBeUndefined();
  });
});

describe('listWorkflowTemplates', () => {
  it('returns the full registry', () => {
    const list = listWorkflowTemplates();
    expect(list).toEqual(workflowTemplateRegistry);
  });
});
