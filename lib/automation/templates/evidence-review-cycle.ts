import type { WorkflowTemplateDefinition } from '../workflow-types';

export const evidenceReviewCycleTemplate: WorkflowTemplateDefinition = {
  id: 'evidence-review-cycle',
  name: 'Evidence Review Cycle',
  description:
    'Routes uploaded evidence through reviewer approval, control updates, and remediation on rejection.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001'],
  triggerType: 'evidence_uploaded',
  estimatedSetupTime: '12 minutes',
  definition: {
    name: 'Evidence Review Cycle',
    description: 'Drive consistent review and remediation for uploaded evidence.',
    trigger: {
      type: 'evidence_uploaded',
    },
    steps: [
      {
        id: 'assign-review-task',
        type: 'action',
        name: 'Assign Reviewer',
        action: 'create_task',
        onError: 'retry',
        config: {
          title: 'Review uploaded evidence',
          description: 'Review {{trigger.data.evidenceName}} for control {{trigger.data.controlId}}.',
          assignedTo: '{{trigger.data.reviewerId}}',
          priority: 'high',
        },
      },
      {
        id: 'review-approval',
        type: 'approval',
        name: 'Reviewer Decision',
        approvers: ['{{trigger.data.reviewerId}}'],
        timeout: '5d',
        onTimeout: 'escalate',
        timeoutEscalateTo: ['{{trigger.data.managerId}}'],
      },
      {
        id: 'apply-review-result',
        type: 'condition',
        name: 'Approved?',
        conditions: [
          {
            field: 'steps.review-approval.approved',
            operator: 'eq',
            value: true,
          },
        ],
        thenSteps: [
          {
            id: 'update-control-status',
            type: 'action',
            name: 'Update Control Status',
            action: 'update_status',
            onError: 'retry',
            config: {
              table: 'controls',
              recordId: '{{trigger.data.controlId}}',
              status: 'evidence_reviewed',
            },
          },
          {
            id: 'recalculate-score',
            type: 'action',
            name: 'Recalculate Compliance Score',
            action: 'calculate_compliance_score',
            onError: 'continue',
            config: {},
          },
        ],
        elseSteps: [
          {
            id: 'notify-uploader',
            type: 'action',
            name: 'Notify Uploader',
            action: 'send_notification',
            onError: 'continue',
            config: {
              userId: '{{trigger.data.uploaderId}}',
              title: 'Evidence requires changes',
              message:
                'Evidence review rejected. Comment: {{steps.review-approval.comment}}',
            },
          },
          {
            id: 'create-remediation-task',
            type: 'action',
            name: 'Create Remediation Task',
            action: 'create_task',
            onError: 'retry',
            config: {
              title: 'Remediate rejected evidence',
              description:
                'Update {{trigger.data.evidenceName}} using reviewer feedback.',
              assignedTo: '{{trigger.data.uploaderId}}',
              priority: 'high',
            },
          },
        ],
      },
    ],
  },
};
