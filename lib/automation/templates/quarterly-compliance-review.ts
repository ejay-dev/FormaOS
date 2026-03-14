import type { WorkflowTemplateDefinition } from '../workflow-types';

export const quarterlyComplianceReviewTemplate: WorkflowTemplateDefinition = {
  id: 'quarterly-compliance-review',
  name: 'Quarterly Compliance Review',
  description:
    'Runs a quarterly control gap review, generates a report, notifies executives, and schedules follow-up.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001'],
  triggerType: 'quarterly_review',
  estimatedSetupTime: '18 minutes',
  definition: {
    name: 'Quarterly Compliance Review',
    description: 'Quarterly review and remediation loop for control posture.',
    trigger: {
      type: 'quarterly_review',
      schedule: {
        cron: '0 9 1 */3 *',
      },
    },
    steps: [
      {
        id: 'gather-control-statuses',
        type: 'action',
        name: 'Gather Control Statuses',
        action: 'set_variable',
        onError: 'continue',
        config: {
          name: 'controlStatuses',
          value: '{{trigger.data.controls}}',
        },
      },
      {
        id: 'loop-gaps',
        type: 'loop',
        name: 'Create Remediation Tasks For Gaps',
        collection: '{{trigger.data.gaps}}',
        itemVariable: 'gap',
        maxIterations: 250,
        steps: [
          {
            id: 'create-gap-task',
            type: 'action',
            name: 'Create Gap Task',
            action: 'create_task',
            onError: 'continue',
            config: {
              title: 'Remediate {{gap.title}}',
              description: '{{gap.description}}',
              assignedTo: '{{gap.ownerId}}',
              priority: 'high',
            },
          },
        ],
      },
      {
        id: 'generate-quarterly-report',
        type: 'action',
        name: 'Generate Compliance Report',
        action: 'generate_report',
        onError: 'continue',
        config: {
          reportType: 'quarterly-compliance-review',
        },
      },
      {
        id: 'notify-executives',
        type: 'action',
        name: 'Notify Executive Team',
        action: 'escalate',
        onError: 'continue',
        config: {
          title: 'Quarterly compliance review complete',
          message: 'Quarterly compliance review report is ready and follow-up tasks were created.',
        },
      },
      {
        id: 'thirty-day-follow-up',
        type: 'delay',
        name: 'Schedule Follow-up',
        duration: '30d',
      },
    ],
  },
};
