import type {
  ExecutionResult,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStepType,
} from '@/lib/automation/workflow-types';

export const STEP_TYPE_LABELS: Record<WorkflowStepType, string> = {
  action: 'Action',
  condition: 'Condition',
  approval: 'Approval',
  parallel: 'Parallel',
  delay: 'Delay',
  loop: 'Loop',
};

export function cloneWorkflowDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  return JSON.parse(JSON.stringify(definition)) as WorkflowDefinition;
}

export function createNewStep(type: WorkflowStepType): WorkflowStep {
  const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case 'action':
      return {
        id,
        type,
        name: 'New Action',
        action: 'send_notification',
        onError: 'continue',
        config: {
          title: '',
          message: '',
        },
      };
    case 'condition':
      return {
        id,
        type,
        name: 'Condition',
        conditions: [
          {
            field: 'trigger.data.status',
            operator: 'eq',
            value: 'open',
          },
        ],
        thenSteps: [],
        elseSteps: [],
      };
    case 'approval':
      return {
        id,
        type,
        name: 'Approval',
        approvers: [],
        timeout: '3d',
        onTimeout: 'escalate',
        timeoutEscalateTo: [],
      };
    case 'parallel':
      return {
        id,
        type,
        name: 'Parallel',
        branches: [[], []],
      };
    case 'delay':
      return {
        id,
        type,
        name: 'Delay',
        duration: '1d',
      };
    case 'loop':
      return {
        id,
        type,
        name: 'Loop',
        collection: '{{trigger.data.items}}',
        itemVariable: 'item',
        maxIterations: 25,
        steps: [],
      };
  }
}

export function stepSummary(step: WorkflowStep): string {
  switch (step.type) {
    case 'action':
      return `${step.action} • ${Object.keys(step.config ?? {}).length} config values`;
    case 'condition':
      return `${step.conditions.length} conditions • ${step.combinator ?? 'and'}`;
    case 'approval':
      return `${step.approvers.length || 0} approvers • ${String(step.timeout)}`;
    case 'parallel':
      return `${step.branches.length} branches`;
    case 'delay':
      return `Pause for ${String(step.duration)}`;
    case 'loop':
      return `Iterate ${step.collection} up to ${step.maxIterations}`;
  }
}

export function validateWorkflow(definition: WorkflowDefinition): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (!definition.name.trim()) {
    errors.__workflow = ['Workflow name is required'];
  }

  if (!definition.trigger?.type) {
    errors.__trigger = ['Trigger type is required'];
  }

  const validateStep = (step: WorkflowStep) => {
    const stepErrors: string[] = [];
    if (!step.name.trim()) {
      stepErrors.push('Step name is required');
    }

    switch (step.type) {
      case 'action':
        if (!step.action) {
          stepErrors.push('Action type is required');
        }
        break;
      case 'condition':
        if (step.conditions.length === 0) {
          stepErrors.push('At least one condition is required');
        }
        break;
      case 'approval':
        if (step.approvers.length === 0) {
          stepErrors.push('Add at least one approver');
        }
        break;
      case 'parallel':
        if (step.branches.length < 2) {
          stepErrors.push('Parallel steps need at least two branches');
        }
        break;
      case 'delay':
        if (!step.duration) {
          stepErrors.push('Delay duration is required');
        }
        break;
      case 'loop':
        if (!step.collection.trim()) {
          stepErrors.push('Collection is required');
        }
        break;
    }

    if (stepErrors.length > 0) {
      errors[step.id] = stepErrors;
    }

    if (step.type === 'condition') {
      step.thenSteps.forEach(validateStep);
      step.elseSteps?.forEach(validateStep);
    }
    if (step.type === 'parallel') {
      step.branches.forEach((branch) => branch.forEach(validateStep));
    }
    if (step.type === 'loop') {
      step.steps.forEach(validateStep);
    }
  };

  definition.steps.forEach(validateStep);
  return errors;
}

export function flattenSteps(
  steps: WorkflowStep[],
  depth: number = 0,
  branchLabel?: string,
): Array<{ step: WorkflowStep; depth: number; branchLabel?: string }> {
  return steps.flatMap((step) => {
    const current = [{ step, depth, branchLabel }];
    if (step.type === 'condition') {
      return [
        ...current,
        ...flattenSteps(step.thenSteps, depth + 1, 'then'),
        ...flattenSteps(step.elseSteps ?? [], depth + 1, 'else'),
      ];
    }
    if (step.type === 'parallel') {
      return [
        ...current,
        ...step.branches.flatMap((branch, index) =>
          flattenSteps(branch, depth + 1, `branch ${index + 1}`),
        ),
      ];
    }
    if (step.type === 'loop') {
      return [...current, ...flattenSteps(step.steps, depth + 1, 'loop')];
    }
    return current;
  });
}

export function executionStatusByStep(
  trace: ExecutionResult[] | undefined,
): Record<string, ExecutionResult> {
  const map: Record<string, ExecutionResult> = {};
  for (const result of trace ?? []) {
    map[result.stepId] = result;
  }
  return map;
}

export const variableSuggestions = [
  '{{trigger.data.id}}',
  '{{trigger.data.ownerId}}',
  '{{trigger.data.assigneeId}}',
  '{{trigger.data.managerId}}',
  '{{steps.previousStep.output}}',
  '{{env.orgName}}',
  '{{now()}}',
];
