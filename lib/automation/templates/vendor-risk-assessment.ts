import type { WorkflowTemplateDefinition } from '../workflow-types';

export const vendorRiskAssessmentTemplate: WorkflowTemplateDefinition = {
  id: 'vendor-risk-assessment',
  name: 'Vendor Risk Assessment',
  description:
    'Creates a procurement questionnaire, scores vendor risk, requires approval for high risk, and schedules re-review.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001', 'GDPR'],
  triggerType: 'vendor_added',
  estimatedSetupTime: '14 minutes',
  definition: {
    name: 'Vendor Risk Assessment',
    description: 'Automated intake and annual re-review workflow for new vendors.',
    trigger: {
      type: 'vendor_added',
    },
    steps: [
      {
        id: 'create-questionnaire',
        type: 'action',
        name: 'Create Risk Questionnaire Task',
        action: 'create_task',
        onError: 'retry',
        config: {
          title: 'Complete vendor risk questionnaire',
          description: 'Collect risk questionnaire for {{trigger.data.vendorName}}.',
          assignedTo: '{{trigger.data.procurementOwnerId}}',
          priority: 'high',
        },
      },
      {
        id: 'score-risk',
        type: 'condition',
        name: 'High Risk Vendor?',
        conditions: [
          {
            field: 'trigger.data.riskScore',
            operator: 'gte',
            value: 80,
          },
        ],
        thenSteps: [
          {
            id: 'approval-high-risk',
            type: 'approval',
            name: 'Compliance Lead Approval',
            approvers: ['{{trigger.data.complianceLeadId}}'],
            timeout: '5d',
            onTimeout: 'reject',
          },
        ],
        elseSteps: [],
      },
      {
        id: 'annual-rereview-delay',
        type: 'delay',
        name: 'Schedule Annual Re-review',
        duration: '52w',
      },
    ],
  },
};
