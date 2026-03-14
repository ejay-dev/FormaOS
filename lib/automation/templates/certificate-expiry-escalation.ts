import type { WorkflowTemplateDefinition } from '../workflow-types';

export const certificateExpiryEscalationTemplate: WorkflowTemplateDefinition = {
  id: 'certificate-expiry-escalation',
  name: 'Certificate Expiry Escalation',
  description:
    'Escalates expiring certificates through assignee, manager, and compliance lead with an overdue task.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001', 'HIPAA'],
  triggerType: 'certificate_expiring',
  estimatedSetupTime: '10 minutes',
  definition: {
    name: 'Certificate Expiry Escalation',
    description:
      'When a certificate is nearing expiry, progressively escalate until it is renewed.',
    trigger: {
      type: 'certificate_expiring',
    },
    steps: [
      {
        id: 'notify-assignee',
        type: 'action',
        name: 'Notify Assignee',
        action: 'send_notification',
        onError: 'continue',
        config: {
          userId: '{{trigger.data.assigneeId}}',
          title: 'Certificate renewal due',
          message:
            '{{trigger.data.certificateName}} expires on {{trigger.data.expiryDate}}. Start renewal now.',
          actionUrl: '/app/vault',
        },
      },
      {
        id: 'wait-seven-days',
        type: 'delay',
        name: 'Wait 7 Days',
        duration: '7d',
      },
      {
        id: 'check-renewal',
        type: 'condition',
        name: 'Certificate Renewed?',
        conditions: [
          {
            field: 'trigger.data.renewed',
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
              title: 'Renewal overdue',
              message:
                '{{trigger.data.certificateName}} is still unrenewed after 7 days.',
            },
          },
          {
            id: 'wait-three-days',
            type: 'delay',
            name: 'Wait 3 Days',
            duration: '3d',
          },
          {
            id: 'final-escalation',
            type: 'action',
            name: 'Escalate To Compliance Lead',
            action: 'send_notification',
            onError: 'continue',
            config: {
              userId: '{{trigger.data.complianceLeadId}}',
              title: 'Final certificate escalation',
              message:
                '{{trigger.data.certificateName}} remains overdue after manager escalation.',
            },
          },
          {
            id: 'create-overdue-task',
            type: 'action',
            name: 'Create Overdue Task',
            action: 'create_task',
            onError: 'retry',
            config: {
              title: 'Renew overdue certificate',
              description:
                'Renew {{trigger.data.certificateName}} and upload updated evidence.',
              assignedTo: '{{trigger.data.assigneeId}}',
              priority: 'high',
            },
          },
        ],
        thenSteps: [],
      },
    ],
  },
};
