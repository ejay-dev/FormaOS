import { auditPreparationTemplate } from '@/lib/automation/templates/audit-preparation';
import { newEmployeeOnboardingTemplate } from '@/lib/automation/templates/new-employee-onboarding';
import { quarterlyComplianceReviewTemplate } from '@/lib/automation/templates/quarterly-compliance-review';
import { vendorRiskAssessmentTemplate } from '@/lib/automation/templates/vendor-risk-assessment';

describe('auditPreparationTemplate', () => {
  it('has correct metadata', () => {
    expect(auditPreparationTemplate.id).toBe('audit-preparation');
    expect(auditPreparationTemplate.name).toBeTruthy();
    expect(auditPreparationTemplate.triggerType).toBeTruthy();
    expect(auditPreparationTemplate.definition.steps.length).toBeGreaterThan(0);
  });

  it('has framework assignments', () => {
    expect(auditPreparationTemplate.framework.length).toBeGreaterThan(0);
  });
});

describe('newEmployeeOnboardingTemplate', () => {
  it('has correct metadata', () => {
    expect(newEmployeeOnboardingTemplate.id).toBe('new-employee-onboarding');
    expect(newEmployeeOnboardingTemplate.name).toBeTruthy();
    expect(newEmployeeOnboardingTemplate.triggerType).toBeTruthy();
    expect(
      newEmployeeOnboardingTemplate.definition.steps.length,
    ).toBeGreaterThan(0);
  });

  it('has framework assignments', () => {
    expect(newEmployeeOnboardingTemplate.framework.length).toBeGreaterThan(0);
  });
});

describe('quarterlyComplianceReviewTemplate', () => {
  it('has correct metadata', () => {
    expect(quarterlyComplianceReviewTemplate.id).toBe(
      'quarterly-compliance-review',
    );
    expect(quarterlyComplianceReviewTemplate.name).toBeTruthy();
    expect(quarterlyComplianceReviewTemplate.triggerType).toBeTruthy();
    expect(
      quarterlyComplianceReviewTemplate.definition.steps.length,
    ).toBeGreaterThan(0);
  });

  it('has framework assignments', () => {
    expect(quarterlyComplianceReviewTemplate.framework.length).toBeGreaterThan(
      0,
    );
  });
});

describe('vendorRiskAssessmentTemplate', () => {
  it('has correct metadata', () => {
    expect(vendorRiskAssessmentTemplate.id).toBe('vendor-risk-assessment');
    expect(vendorRiskAssessmentTemplate.name).toBeTruthy();
    expect(vendorRiskAssessmentTemplate.triggerType).toBeTruthy();
    expect(
      vendorRiskAssessmentTemplate.definition.steps.length,
    ).toBeGreaterThan(0);
  });

  it('has framework assignments', () => {
    expect(vendorRiskAssessmentTemplate.framework.length).toBeGreaterThan(0);
  });
});
