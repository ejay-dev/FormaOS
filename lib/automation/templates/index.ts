import type { WorkflowTemplateDefinition } from '../workflow-types';
import { auditPreparationTemplate } from './audit-preparation';
import { certificateExpiryEscalationTemplate } from './certificate-expiry-escalation';
import { evidenceReviewCycleTemplate } from './evidence-review-cycle';
import { incidentResponseTemplate } from './incident-response';
import { newEmployeeOnboardingTemplate } from './new-employee-onboarding';
import { policyReviewCycleTemplate } from './policy-review-cycle';
import { quarterlyComplianceReviewTemplate } from './quarterly-compliance-review';
import { vendorRiskAssessmentTemplate } from './vendor-risk-assessment';

export const workflowTemplateRegistry: WorkflowTemplateDefinition[] = [
  certificateExpiryEscalationTemplate,
  evidenceReviewCycleTemplate,
  newEmployeeOnboardingTemplate,
  incidentResponseTemplate,
  quarterlyComplianceReviewTemplate,
  vendorRiskAssessmentTemplate,
  policyReviewCycleTemplate,
  auditPreparationTemplate,
];

export function getWorkflowTemplate(id: string): WorkflowTemplateDefinition | undefined {
  return workflowTemplateRegistry.find((template) => template.id === id);
}

export function listWorkflowTemplates(): WorkflowTemplateDefinition[] {
  return workflowTemplateRegistry;
}
