/**
 * PDF Generator for Audit Reports
 * Uses jsPDF with autotable for professional PDF generation
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  BaseReportPayload,
  Iso27001ReportPayload,
  NdisReportPayload,
  HipaaReportPayload,
  ReportType,
} from './types';

// Color palette
const COLORS = {
  primary: [56, 189, 248] as [number, number, number], // sky-400
  success: [74, 222, 128] as [number, number, number], // green-400
  warning: [251, 191, 36] as [number, number, number], // amber-400
  danger: [248, 113, 113] as [number, number, number], // red-400
  text: [30, 41, 59] as [number, number, number], // slate-800
  muted: [100, 116, 139] as [number, number, number], // slate-500
  background: [248, 250, 252] as [number, number, number], // slate-50
};

/**
 * Generate PDF for any supported report type
 */
export function generateReportPdf(
  report: BaseReportPayload | Iso27001ReportPayload | NdisReportPayload | HipaaReportPayload,
  reportType: ReportType
): Blob {
  const doc = new jsPDF();
  let currentY = 20;

  // Cover page
  currentY = addCoverPage(doc, report, reportType);

  // Executive summary
  doc.addPage();
  currentY = 20;
  currentY = addExecutiveSummary(doc, report, currentY);

  // Control summary table
  currentY = addControlSummarySection(doc, report, currentY);

  // Evidence summary
  currentY = addEvidenceSummarySection(doc, report, currentY);

  // Gaps and recommendations
  if (report.gaps.criticalGaps.length > 0) {
    currentY = addGapsSection(doc, report, currentY);
  }

  // Framework-specific sections
  if (reportType === 'iso27001' && 'statementOfApplicability' in report) {
    doc.addPage();
    addIso27001Sections(doc, report);
  } else if (reportType === 'ndis' && 'practiceStandards' in report) {
    doc.addPage();
    addNdisSections(doc, report);
  } else if (reportType === 'hipaa' && 'privacyRuleCompliance' in report) {
    doc.addPage();
    addHipaaSections(doc, report);
  }

  // Footer on all pages
  addFooters(doc, report);

  return doc.output('blob');
}

/**
 * Add cover page
 */
function addCoverPage(
  doc: jsPDF,
  report: BaseReportPayload,
  reportType: ReportType
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect (header bar)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Logo placeholder
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('FormaOS', 20, 35);

  // Framework badge
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Compliance Report', 20, 50);

  // Main title
  doc.setFontSize(36);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  const title = getReportTitle(reportType);
  doc.text(title, 20, 120);

  // Organization name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(report.organizationName, 20, 140);

  // Readiness score circle
  const scoreX = pageWidth - 60;
  const scoreY = 130;
  const scoreRadius = 30;

  // Score background circle
  doc.setFillColor(...COLORS.background);
  doc.circle(scoreX, scoreY, scoreRadius, 'F');

  // Score value
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...getScoreColor(report.readinessScore));
  doc.text(`${report.readinessScore}%`, scoreX, scoreY + 5, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text('Readiness', scoreX, scoreY + 15, { align: 'center' });

  // Report metadata
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  const metadataY = pageHeight - 60;
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, 20, metadataY);
  doc.text(`Framework: ${report.frameworkName}`, 20, metadataY + 8);

  // Confidential notice
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.danger);
  doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', pageWidth / 2, pageHeight - 20, {
    align: 'center',
  });

  return 160;
}

/**
 * Add executive summary section
 */
function addExecutiveSummary(doc: jsPDF, report: BaseReportPayload, startY: number): number {
  let y = startY;

  // Section header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Executive Summary', 20, y);
  y += 15;

  // Summary text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  const summaryText = getSummaryText(report);
  const splitText = doc.splitTextToSize(summaryText, 170);
  doc.text(splitText, 20, y);
  y += splitText.length * 6 + 15;

  // Key metrics grid
  const metrics = [
    { label: 'Readiness Score', value: `${report.readinessScore}%`, color: getScoreColor(report.readinessScore) },
    { label: 'Controls Satisfied', value: `${report.controlSummary.satisfied}/${report.controlSummary.total}`, color: COLORS.success },
    { label: 'Evidence Collected', value: report.evidenceSummary.total.toString(), color: COLORS.primary },
    { label: 'Tasks Completed', value: `${report.taskSummary.completed}/${report.taskSummary.total}`, color: COLORS.primary },
  ];

  const boxWidth = 40;
  const boxHeight = 35;
  const startX = 20;

  metrics.forEach((metric, index) => {
    const x = startX + index * (boxWidth + 5);

    // Box background
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');

    // Value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...metric.color);
    doc.text(metric.value, x + boxWidth / 2, y + 15, { align: 'center' });

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(metric.label, x + boxWidth / 2, y + 28, { align: 'center' });
  });

  return y + boxHeight + 20;
}

/**
 * Add control summary section
 */
function addControlSummarySection(doc: jsPDF, report: BaseReportPayload, startY: number): number {
  let y = startY;

  // Check if we need a new page
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Control Summary', 20, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count', 'Percentage']],
    body: [
      ['Satisfied', report.controlSummary.satisfied.toString(), `${Math.round((report.controlSummary.satisfied / report.controlSummary.total) * 100)}%`],
      ['Partial', report.controlSummary.partial.toString(), `${Math.round((report.controlSummary.partial / report.controlSummary.total) * 100)}%`],
      ['Missing', report.controlSummary.missing.toString(), `${Math.round((report.controlSummary.missing / report.controlSummary.total) * 100)}%`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
    },
  });

  return (doc as any).lastAutoTable.finalY + 20;
}

/**
 * Add evidence summary section
 */
function addEvidenceSummarySection(doc: jsPDF, report: BaseReportPayload, startY: number): number {
  let y = startY;

  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Evidence Summary', 20, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count']],
    body: [
      ['Verified', report.evidenceSummary.verified.toString()],
      ['Pending Review', report.evidenceSummary.pending.toString()],
      ['Rejected', report.evidenceSummary.rejected.toString()],
      ['Total', report.evidenceSummary.total.toString()],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
  });

  return (doc as any).lastAutoTable.finalY + 20;
}

/**
 * Add gaps section
 */
function addGapsSection(doc: jsPDF, report: BaseReportPayload, startY: number): number {
  let y = startY;

  if (y > 180) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text('Critical Gaps', 20, y);
  y += 10;

  const gapData = report.gaps.criticalGaps.slice(0, 10).map((gap) => [
    gap.controlCode,
    gap.controlTitle,
    gap.priority.toUpperCase(),
    gap.reason,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Control', 'Title', 'Priority', 'Gap Description']],
    body: gapData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.danger,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 80 },
    },
  });

  return (doc as any).lastAutoTable.finalY + 20;
}

/**
 * Add ISO 27001 specific sections
 */
function addIso27001Sections(doc: jsPDF, report: Iso27001ReportPayload): void {
  let y = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Statement of Applicability', 20, y);
  y += 15;

  const soaData = report.statementOfApplicability.slice(0, 20).map((entry) => [
    entry.clauseNumber,
    entry.controlName,
    entry.applicable ? 'Yes' : 'No',
    entry.implementationStatus.replace('_', ' ').toUpperCase(),
    entry.evidenceCount.toString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Clause', 'Control', 'Applicable', 'Status', 'Evidence']],
    body: soaData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  });
}

/**
 * Add NDIS specific sections
 */
function addNdisSections(doc: jsPDF, report: NdisReportPayload): void {
  let y = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('NDIS Practice Standards', 20, y);
  y += 15;

  const standardsData = report.practiceStandards.map((standard) => [
    standard.standardCode,
    standard.standardName,
    standard.category,
    standard.complianceStatus.replace('_', ' ').toUpperCase(),
    standard.evidenceCount.toString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Standard', 'Category', 'Status', 'Evidence']],
    body: standardsData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  });

  // Staff credentials summary
  y = (doc as any).lastAutoTable.finalY + 20;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.text('Staff Credentials', 20, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    body: [
      ['Total Staff', report.staffCredentialsSummary.totalStaff.toString()],
      ['Compliant Staff', report.staffCredentialsSummary.compliantStaff.toString()],
      ['Expiring Credentials', report.staffCredentialsSummary.expiringCredentials.toString()],
      ['Expired Credentials', report.staffCredentialsSummary.expiredCredentials.toString()],
    ],
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });
}

/**
 * Add HIPAA specific sections
 */
function addHipaaSections(doc: jsPDF, report: HipaaReportPayload): void {
  let y = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('HIPAA Rule Compliance', 20, y);
  y += 15;

  const rules = [
    report.privacyRuleCompliance,
    report.securityRuleCompliance,
    report.breachNotificationCompliance,
  ];

  const rulesData = rules.map((rule) => [
    rule.ruleName,
    `${rule.complianceScore}%`,
    `${rule.satisfiedRequirements}/${rule.totalRequirements}`,
    rule.criticalGaps.toString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Rule', 'Score', 'Requirements', 'Critical Gaps']],
    body: rulesData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
  });
}

/**
 * Add footers to all pages
 */
function addFooters(doc: jsPDF, report: BaseReportPayload): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${report.organizationName} | ${report.frameworkName} Report | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

// Helper functions
function getReportTitle(reportType: ReportType): string {
  const titles: Record<ReportType, string> = {
    soc2: 'SOC 2 Readiness Report',
    iso27001: 'ISO 27001 Statement of Applicability',
    ndis: 'NDIS Compliance Report',
    hipaa: 'HIPAA Compliance Assessment',
    trust: 'Enterprise Buyer Trust Packet',
  };
  return titles[reportType];
}

function getSummaryText(report: BaseReportPayload): string {
  const score = report.readinessScore;
  const status = score >= 80 ? 'audit-ready' : score >= 60 ? 'progressing well' : score >= 40 ? 'developing' : 'early stage';

  return `This report provides a comprehensive assessment of ${report.organizationName}'s compliance posture for ${report.frameworkName}. ` +
    `With a current readiness score of ${score}%, the organization is at a ${status} compliance maturity level. ` +
    `${report.controlSummary.satisfied} of ${report.controlSummary.total} controls are satisfied, ` +
    `with ${report.evidenceSummary.verified} pieces of verified evidence supporting the compliance program.`;
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
}
