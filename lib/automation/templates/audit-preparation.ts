import type { WorkflowTemplateDefinition } from '../workflow-types';

export const auditPreparationTemplate: WorkflowTemplateDefinition = {
  id: 'audit-preparation',
  name: 'Audit Preparation',
  description:
    'Stages evidence collection, readiness reporting, and final reminders in the 30 days before audit.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001'],
  triggerType: 'audit_preparation',
  estimatedSetupTime: '16 minutes',
  definition: {
    name: 'Audit Preparation',
    description: 'Countdown workflow for upcoming external audits.',
    trigger: {
      type: 'audit_preparation',
    },
    steps: [
      {
        id: 'inventory-evidence',
        type: 'action',
        name: 'Gather Evidence Inventory',
        action: 'generate_report',
        onError: 'continue',
        config: {
          reportType: 'audit-evidence-inventory',
        },
      },
      {
        id: 'create-gap-collection-tasks',
        type: 'loop',
        name: 'Create Evidence Gap Tasks',
        collection: '{{trigger.data.evidenceGaps}}',
        itemVariable: 'gap',
        maxIterations: 200,
        steps: [
          {
            id: 'create-evidence-task',
            type: 'action',
            name: 'Create Evidence Collection Task',
            action: 'create_task',
            onError: 'continue',
            config: {
              title: 'Collect {{gap.name}} evidence',
              description: '{{gap.description}}',
              assignedTo: '{{gap.ownerId}}',
              priority: 'high',
            },
          },
        ],
      },
      {
        id: 'wait-to-fourteen-days',
        type: 'delay',
        name: 'Wait Until 14 Days Out',
        duration: '16d',
      },
      {
        id: 'verify-current-evidence',
        type: 'action',
        name: 'Verify Evidence Currency',
        action: 'generate_report',
        onError: 'continue',
        config: {
          reportType: 'audit-evidence-verification',
        },
      },
      {
        id: 'wait-to-seven-days',
        type: 'delay',
        name: 'Wait Until 7 Days Out',
        duration: '7d',
      },
      {
        id: 'final-review-reminder',
        type: 'action',
        name: 'Final Review Notification',
        action: 'escalate',
        onError: 'continue',
        config: {
          title: 'Audit final review',
          message: 'External audit starts in 7 days. Final readiness review required.',
        },
      },
    ],
  },
};
