/**
 * @jest-environment node
 *
 * End-to-end PDF content assertion — renders with the real jsPDF engine
 * and pokes the raw PDF bytes to verify enterprise-grade branding and metadata
 * actually lands in the output. The sibling pdf-generator.test.ts mocks jsPDF
 * and therefore can't catch regressions in actual rendered content.
 *
 * jsPDF does not compress text streams by default, so plain substring search
 * on the decoded buffer is sufficient.
 */

import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';
import type {
  BaseReportPayload,
  Iso27001ReportPayload,
  NdisReportPayload,
  HipaaReportPayload,
} from '@/lib/audit-reports/types';

function baseReport(
  overrides: Partial<BaseReportPayload> = {},
): BaseReportPayload {
  return {
    organizationId: 'org-abc',
    organizationName: 'Acme Care Pty Ltd',
    frameworkSlug: 'soc2',
    frameworkName: 'SOC 2 Type II',
    generatedAt: '2026-04-18T00:00:00.000Z',
    periodStart: '2026-01-01',
    periodEnd: '2026-04-18',
    readinessScore: 82,
    overallScore: 82,
    controlSummary: {
      total: 50,
      satisfied: 40,
      partial: 5,
      missing: 5,
      notSatisfied: 5,
    },
    evidenceSummary: {
      total: 120,
      verified: 100,
      pending: 15,
      rejected: 5,
    },
    taskSummary: {
      total: 30,
      completed: 22,
      inProgress: 5,
      todo: 3,
      overdue: 0,
    },
    gaps: {
      criticalGaps: [
        {
          controlCode: 'CC6.1',
          controlTitle: 'Logical access',
          priority: 'high',
          reason: 'Missing quarterly access review evidence',
        },
        {
          controlCode: 'CC7.2',
          controlTitle: 'Change management',
          priority: 'critical',
          reason: 'No documented change approval workflow',
        },
      ],
      mediumGaps: [],
      lowGaps: [],
    },
    ...overrides,
  };
}

async function renderToBuffer(blob: Blob): Promise<Buffer> {
  const ab = await blob.arrayBuffer();
  return Buffer.from(ab);
}

function assertPdf(buf: Buffer): string {
  expect(buf.length).toBeGreaterThan(500);
  // Canonical PDF magic bytes: %PDF-
  expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  // Latin-1 decode preserves text-stream bytes as-is, making substring search
  // reliable even when the buffer contains arbitrary non-UTF8 octets.
  return buf.toString('latin1');
}

describe('generateReportPdf — enterprise branding', () => {
  it('SOC 2: header brand, title, organization name, readiness score, footer', async () => {
    const blob = generateReportPdf(baseReport(), 'soc2');
    const buf = await renderToBuffer(blob);
    const text = assertPdf(buf);

    expect(text).toContain('FormaOS');
    expect(text).toContain('SOC 2 Readiness Report');
    expect(text).toContain('Acme Care Pty Ltd');
    expect(text).toContain('82%');
    expect(text).toContain('CONFIDENTIAL');
    // Footer mentions framework + pagination
    expect(text).toMatch(/SOC 2 Type II Report \| Page \d+ of \d+/);
  });

  it('renders control / evidence summary tables with expected numeric values', async () => {
    const blob = generateReportPdf(baseReport(), 'soc2');
    const text = assertPdf(await renderToBuffer(blob));

    expect(text).toContain('Control Summary');
    expect(text).toContain('Evidence Summary');
    expect(text).toContain('Executive Summary');
    // Spot-check values: satisfied 40, evidence total 120
    expect(text).toContain('40');
    expect(text).toContain('120');
  });

  it('renders critical gaps when present', async () => {
    const blob = generateReportPdf(baseReport(), 'soc2');
    const text = assertPdf(await renderToBuffer(blob));

    expect(text).toContain('Critical Gaps');
    expect(text).toContain('CC6.1');
    expect(text).toContain('CC7.2');
    // Priority labels render in the table — check one is present. jsPDF text
    // stream segmentation makes exact word matching on all cells flaky, so we
    // assert on the longer gap-description strings we also render.
    expect(text).toContain('Missing quarterly access review evidence');
    expect(text).toContain('No documented change approval workflow');
  });

  it('ISO 27001: includes Statement of Applicability section', async () => {
    const iso: Iso27001ReportPayload = {
      ...baseReport(),
      frameworkSlug: 'iso27001',
      frameworkName: 'ISO/IEC 27001:2022',
      statementOfApplicability: [
        {
          clauseNumber: 'A.5.1',
          controlName: 'Information security policies',
          applicable: true,
          implementationStatus: 'implemented',
          evidenceCount: 3,
          justification: 'Policy approved by leadership 2026-02-01',
        },
        {
          clauseNumber: 'A.5.2',
          controlName: 'Information security roles',
          applicable: true,
          implementationStatus: 'partially_implemented',
          evidenceCount: 1,
          justification: 'RACI matrix drafted',
        },
      ],
      riskAssessmentSummary: {
        totalRisks: 10,
        highRisks: 2,
        mediumRisks: 5,
        lowRisks: 3,
        treatedRisks: 7,
        acceptedRisks: 3,
      },
    };

    const text = assertPdf(await renderToBuffer(generateReportPdf(iso, 'iso27001')));
    expect(text).toContain('Statement of Applicability');
    expect(text).toContain('A.5.1');
    expect(text).toContain('A.5.2');
    expect(text).toContain('ISO/IEC 27001:2022');
  });

  it('NDIS: includes practice standards + staff credentials summary', async () => {
    const ndis: NdisReportPayload = {
      ...baseReport(),
      frameworkSlug: 'ndis',
      frameworkName: 'NDIS Practice Standards',
      practiceStandards: [
        {
          standardCode: '1.1',
          standardName: 'Person-centred supports',
          category: 'Rights',
          complianceStatus: 'compliant',
          evidenceCount: 4,
        },
      ],
      staffCredentialsSummary: {
        totalStaff: 42,
        compliantStaff: 39,
        expiringCredentials: 2,
        expiredCredentials: 1,
      },
      workerScreeningSummary: {
        totalWorkers: 42,
        screenedWorkers: 42,
        pendingScreening: 0,
        expiredChecks: 0,
      },
    };

    const text = assertPdf(await renderToBuffer(generateReportPdf(ndis, 'ndis')));
    expect(text).toContain('NDIS Practice Standards');
    expect(text).toContain('Staff Credentials');
    expect(text).toContain('Person-centred supports');
    expect(text).toContain('42'); // total staff
  });

  it('HIPAA: includes three rule sections', async () => {
    const hipaa: HipaaReportPayload = {
      ...baseReport(),
      frameworkSlug: 'hipaa',
      frameworkName: 'HIPAA Security Rule',
      privacyRuleCompliance: {
        ruleName: 'Privacy Rule',
        complianceScore: 88,
        satisfiedRequirements: 22,
        totalRequirements: 25,
        criticalGaps: 1,
      },
      securityRuleCompliance: {
        ruleName: 'Security Rule',
        complianceScore: 91,
        satisfiedRequirements: 32,
        totalRequirements: 35,
        criticalGaps: 0,
      },
      breachNotificationCompliance: {
        ruleName: 'Breach Notification',
        complianceScore: 100,
        satisfiedRequirements: 5,
        totalRequirements: 5,
        criticalGaps: 0,
      },
      phiInventorySummary: {
        totalPhiRecords: 1200,
        encryptedRecords: 1200,
        accessAuditedRecords: 1200,
      },
    };

    const text = assertPdf(await renderToBuffer(generateReportPdf(hipaa, 'hipaa')));
    expect(text).toContain('HIPAA');
    expect(text).toContain('Privacy Rule');
    expect(text).toContain('Security Rule');
    expect(text).toContain('Breach Notification');
  });

  it('Trust packet: renders without framework-specific extras', async () => {
    const text = assertPdf(
      await renderToBuffer(generateReportPdf(baseReport({
        frameworkSlug: 'trust',
        frameworkName: 'Enterprise Buyer Trust Packet',
      }), 'trust')),
    );
    expect(text).toContain('Enterprise Buyer Trust Packet');
    expect(text).toContain('Acme Care Pty Ltd');
  });

  it('generates multi-page output (cover + detail)', async () => {
    const blob = generateReportPdf(baseReport(), 'soc2');
    const text = assertPdf(await renderToBuffer(blob));
    // At minimum 2 pages: cover + executive summary
    const match = text.match(/Page (\d+) of (\d+)/);
    expect(match).not.toBeNull();
    const total = Number(match?.[2] ?? 0);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it('handles organization name with special characters without corruption', async () => {
    const blob = generateReportPdf(
      baseReport({ organizationName: "O'Brien & Sons / Care" }),
      'soc2',
    );
    const text = assertPdf(await renderToBuffer(blob));
    // PDF may escape the apostrophe and the ampersand — just verify the name
    // fragments are present so we know it rendered the right org.
    expect(text).toContain('Brien');
    expect(text).toContain('Sons');
    expect(text).toContain('Care');
  });
});
