import type { WorkflowTemplateDefinition } from '../workflow-types';

export const policyReviewCycleTemplate: WorkflowTemplateDefinition = {
  id: 'policy-review-cycle',
  name: 'Policy Review Cycle',
  description:
    'Runs annual policy review, escalates if stalled, updates versions, notifies staff, and creates acknowledgements.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001', 'HIPAA'],
  triggerType: 'policy_review_due',
  estimatedSetupTime: '11 minutes',
  definition: {
    name: 'Policy Review Cycle',
    description: 'Annual policy review workflow for policy owners and staff.',
    trigger: {
      type: 'policy_review_due',
    },
    steps: [
      {
        id: 'notify-owner',
        type: 'action',
        name: 'Notify Policy Owner',
        action: 'send_notification',
        onError: 'continue',
        config: {
          userId: '{{trigger.data.ownerId}}',
          title: 'Policy review due',
          message: '{{trigger.data.policyName}} is due for annual review.',
        },
      },
      {
        id: 'create-review-task',
        type: 'action',
        name: 'Create Review Task',
        action: 'create_task',
        onError: 'retry',
        config: {
          title: 'Review {{trigger.data.policyName}}',
          description: 'Complete annual review and publish changes.',
          assignedTo: '{{trigger.data.ownerId}}',
          priority: 'high',
        },
      },
      {
        id: 'wait-fourteen-days',
        type: 'delay',
        name: 'Wait 14 Days',
        duration: '14d',
      },
      {
        id: 'policy-review-check',
        type: 'condition',
        name: 'Review Completed?',
        conditions: [
          {
            field: 'trigger.data.reviewCompleted',
            operator: 'eq',
            value: true,
          },
        ],
        elseSteps: [
          {
            id: 'policy-escalation',
            type: 'action',
            name: 'Escalate Review',
            action: 'send_notification',
            onError: 'continue',
            config: {
              userId: '{{trigger.data.managerId}}',
              title: 'Policy review overdue',
              message: '{{trigger.data.policyName}} review is overdue.',
            },
          },
        ],
        thenSteps: [
          {
            id: 'update-policy-version',
            type: 'action',
            name: 'Update Policy Version',
            action: 'update_field',
            onError: 'retry',
            config: {
              table: 'policies',
              recordId: '{{trigger.data.policyId}}',
              field: 'version',
              value: '{{trigger.data.nextVersion}}',
            },
          },
          {
            id: 'notify-staff',
            type: 'action',
            name: 'Notify Affected Staff',
            action: 'escalate',
            onError: 'continue',
            config: {
              title: 'Policy updated',
              message: '{{trigger.data.policyName}} was updated and requires acknowledgement.',
            },
          },
          {
            id: 'create-ack-task',
            type: 'action',
            name: 'Create Acknowledgment Task',
            action: 'create_task',
            onError: 'retry',
            config: {
              title: 'Acknowledge updated policy',
              description: 'Acknowledge {{trigger.data.policyName}} policy changes.',
              assignedTo: '{{trigger.data.ownerId}}',
              priority: 'medium',
            },
          },
        ],
      },
    ],
  },
};
