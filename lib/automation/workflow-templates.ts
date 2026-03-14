import type { WorkflowTemplate } from './workflow-types';
import {
  getWorkflowTemplate,
  listWorkflowTemplates,
  workflowTemplateRegistry,
} from './templates';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = workflowTemplateRegistry.map(
  (template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    trigger: template.definition.trigger,
    steps: template.definition.steps,
    variables: template.definition.variables,
    tags: [
      ...template.industry,
      ...template.framework,
    ],
    estimatedDuration: template.estimatedSetupTime,
  }),
);

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((template) => template.category === category);
}

export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowered = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter((template) =>
    [template.name, template.description, ...(template.tags ?? [])]
      .join(' ')
      .toLowerCase()
      .includes(lowered),
  );
}

export { getWorkflowTemplate, listWorkflowTemplates, workflowTemplateRegistry };
