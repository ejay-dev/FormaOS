import type { WorkflowTemplateDefinition } from '../workflow-types';

export const incidentResponseTemplate: WorkflowTemplateDefinition = {
  id: 'incident-response',
  name: 'Incident Response',
  description:
    'Classifies incidents and routes critical issues through admin alerts, war room creation, and review.',
  industry: ['all'],
  framework: ['SOC 2', 'ISO 27001'],
  triggerType: 'incident_created',
  estimatedSetupTime: '15 minutes',
  definition: {
    name: 'Incident Response',
    description: 'Standardize incident triage and follow-up actions.',
    trigger: {
      type: 'incident_created',
    },
    steps: [
      {
        id: 'severity-check',
        type: 'condition',
        name: 'Critical Severity?',
        conditions: [
          {
            field: 'trigger.data.severity',
            operator: 'in',
            value: ['critical', 'sev1'],
          },
        ],
        thenSteps: [
          {
            id: 'notify-admins',
            type: 'action',
            name: 'Notify All Admins',
            action: 'escalate',
            onError: 'continue',
            config: {
              title: 'Critical incident created',
              message:
                'Critical incident {{trigger.data.incidentId}} requires immediate response.',
            },
          },
          {
            id: 'create-war-room',
            type: 'action',
            name: 'Create War Room',
            action: 'create_incident_room',
            onError: 'continue',
            config: {
              roomName: '{{trigger.data.incidentId}}-war-room',
            },
          },
          {
            id: 'assign-incident-lead',
            type: 'action',
            name: 'Assign Incident Lead',
            action: 'assign_task',
            onError: 'retry',
            config: {
              title: 'Lead critical incident',
              description: 'Own and coordinate response for {{trigger.data.incidentId}}.',
              assignedTo: '{{trigger.data.incidentLeadId}}',
              priority: 'high',
            },
          },
          {
            id: 'parallel-investigation',
            type: 'parallel',
            name: 'Parallel Investigation',
            branches: [
              [
                {
                  id: 'collect-evidence',
                  type: 'action',
                  name: 'Collect Evidence',
                  action: 'create_task',
                  onError: 'retry',
                  config: {
                    title: 'Collect incident evidence',
                    assignedTo: '{{trigger.data.incidentLeadId}}',
                    priority: 'high',
                  },
                },
              ],
              [
                {
                  id: 'document-impact',
                  type: 'action',
                  name: 'Document Impact',
                  action: 'create_task',
                  onError: 'retry',
                  config: {
                    title: 'Document business impact',
                    assignedTo: '{{trigger.data.opsLeadId}}',
                    priority: 'high',
                  },
                },
              ],
            ],
          },
          {
            id: 'schedule-48h-review',
            type: 'delay',
            name: 'Wait 48 Hours',
            duration: '48h',
          },
        ],
        elseSteps: [
          {
            id: 'assign-oncall',
            type: 'action',
            name: 'Assign To On-call',
            action: 'assign_task',
            onError: 'retry',
            config: {
              title: 'Investigate non-critical incident',
              description: 'Investigate {{trigger.data.incidentId}}.',
              assignedTo: '{{trigger.data.onCallId}}',
              priority: 'medium',
            },
          },
        ],
      },
    ],
  },
};
