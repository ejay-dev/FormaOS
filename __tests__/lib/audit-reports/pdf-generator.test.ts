const mockDoc: Record<string, unknown> = {
  setFillColor: jest.fn(),
  setTextColor: jest.fn(),
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  text: jest.fn(),
  rect: jest.fn(),
  roundedRect: jest.fn(),
  circle: jest.fn(),
  addPage: jest.fn(),
  line: jest.fn(),
  setDrawColor: jest.fn(),
  setLineWidth: jest.fn(),
  output: jest.fn(() => new Blob(['pdf-content'])),
  splitTextToSize: jest.fn((text: string) => [text]),
  internal: {
    pageSize: { getWidth: () => 210, getHeight: () => 297 },
    getNumberOfPages: () => 1,
  },
  setPage: jest.fn(),
  getNumberOfPages: jest.fn(() => 1),
  lastAutoTable: { finalY: 100 },
};

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => mockDoc),
}));

jest.mock('jspdf-autotable', () => jest.fn());

import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    organizationName: 'Acme Corp',
    organizationId: 'org-1',
    frameworkSlug: 'soc2',
    frameworkName: 'SOC 2 Type II',
    generatedAt: '2024-06-01T00:00:00Z',
    periodStart: '2024-01-01',
    periodEnd: '2024-06-01',
    readinessScore: 85,
    overallScore: 85,
    controlSummary: {
      total: 20,
      satisfied: 15,
      partial: 3,
      missing: 2,
      notSatisfied: 2,
    },
    evidenceSummary: {
      total: 50,
      verified: 40,
      pending: 5,
      rejected: 3,
      expired: 2,
    },
    taskSummary: {
      total: 30,
      completed: 25,
      inProgress: 3,
      overdue: 2,
    },
    gaps: {
      criticalGaps: [],
      recommendations: [],
    },
    ...overrides,
  } as Record<string, unknown>;
}

describe('generateReportPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a Blob', () => {
    const result = generateReportPdf(makeReport() as never, 'soc2');
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls jsPDF methods for cover page', () => {
    generateReportPdf(makeReport() as never, 'soc2');
    expect(mockDoc.setFillColor).toHaveBeenCalled();
    expect(mockDoc.text).toHaveBeenCalled();
    expect(mockDoc.addPage).toHaveBeenCalled();
  });

  it('outputs pdf blob', () => {
    generateReportPdf(makeReport() as never, 'soc2');
    expect(mockDoc.output).toHaveBeenCalledWith('blob');
  });

  it('adds gaps section when critical gaps exist', () => {
    const report = makeReport({
      gaps: {
        criticalGaps: [
          {
            controlCode: 'C-1',
            controlTitle: 'Missing MFA',
            priority: 'high',
            reason: 'No MFA configured',
          },
        ],
        recommendations: [],
      },
    });
    generateReportPdf(report as never, 'soc2');
    expect(mockDoc.output).toHaveBeenCalled();
  });

  it('adds ISO 27001 sections for iso27001 type', () => {
    const report = makeReport({
      frameworkSlug: 'iso27001',
      statementOfApplicability: [
        {
          clauseNumber: 'A.5.1',
          controlName: 'Policies for InfoSec',
          applicable: true,
          implementationStatus: 'implemented',
          evidenceCount: 3,
        },
      ],
    });
    generateReportPdf(report as never, 'iso27001');
    expect(mockDoc.addPage).toHaveBeenCalled();
  });

  it('adds NDIS sections for ndis type', () => {
    const report = makeReport({
      frameworkSlug: 'ndis',
      practiceStandards: [
        {
          standardCode: 'PS-1',
          standardName: 'Rights',
          category: 'Core',
          complianceStatus: 'compliant',
          evidenceCount: 5,
        },
      ],
      staffCredentialsSummary: {
        totalStaff: 10,
        compliantStaff: 8,
        expiringCredentials: 1,
        expiredCredentials: 1,
      },
    });
    generateReportPdf(report as never, 'ndis');
    expect(mockDoc.addPage).toHaveBeenCalled();
  });

  it('adds HIPAA sections for hipaa type', () => {
    const hipaaRule = {
      ruleName: 'Privacy Rule',
      complianceScore: 90,
      satisfiedRequirements: 9,
      totalRequirements: 10,
      criticalGaps: 1,
    };
    const report = makeReport({
      frameworkSlug: 'hipaa',
      privacyRuleCompliance: hipaaRule,
      securityRuleCompliance: { ...hipaaRule, ruleName: 'Security Rule' },
      breachNotificationCompliance: {
        ...hipaaRule,
        ruleName: 'Breach Notification',
      },
    });
    generateReportPdf(report as never, 'hipaa');
    expect(mockDoc.addPage).toHaveBeenCalled();
  });
});
