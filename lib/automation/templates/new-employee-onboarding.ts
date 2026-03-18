import type { WorkflowTemplateDefinition } from '../workflow-types';

export const newEmployeeOnboardingTemplate: WorkflowTemplateDefinition = {
  id: 'new-employee-onboarding',
  name: 'New Employee Onboarding',
  description:
    'Creates role-based onboarding tasks, a checklist, and a 30-day compliance follow-up.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001', 'HIPAA'],
  triggerType: 'member_added',
  estimatedSetupTime: '8 minutes',
  definition: {
    name: 'New Employee Onboarding',
    description: 'Automate compliance onboarding for new hires.',
    trigger: {
      type: 'member_added',
    },
    steps: [
      {
        id: 'training-task',
        type: 'action',
        name: 'Create Training Task',
        action: 'create_task',
        onError: 'retry',
        config: {
          title: 'Complete {{trigger.data.role}} training',
          description: 'Assigned automatically for new employee onboarding.',
          assignedTo: '{{trigger.data.memberId}}',
          priority: 'high',
        },
      },
      {
        id: 'orientation-checklist',
        type: 'action',
        name: 'Assign Orientation Checklist',
        action: 'create_task',
        onError: 'retry',
        config: {
          title: 'Orientation compliance checklist',
          description: 'Finish orientation checklist and acknowledge policies.',
          assignedTo: '{{trigger.data.memberId}}',
          priority: 'medium',
        },
      },
      {
        id: 'thirty-day-delay',
        type: 'delay',
        name: 'Wait 30 Days',
        duration: '30d',
      },
      {
        id: 'checklist-complete',
        type: 'condition',
        name: 'Checklist Completed?',
        conditions: [
          {
            field: 'trigger.data.checklistComplete',
            operator: 'eq',
            value: true,
          },
        ],
        elseSteps: [
          {
            id: 'notify-manager',
            type: 'action',
            name: 'Notify Manager',
            action: 'send_notification',
            onError: 'continue',
            config: {
              userId: '{{trigger.data.managerId}}',
              title: 'Onboarding incomplete at 30 days',
              message:
                '{{trigger.data.memberName}} still has outstanding onboarding items.',
            },
          },
        ],
        thenSteps: [],
      },
    ],
  },
};
