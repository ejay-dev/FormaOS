'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export function BoardReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import to avoid loading jsPDF unless needed
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      // Fetch live compliance data
      let complianceData = {
        completionPercentage: 0,
        total: 0,
        overdue: 0,
        dueSoon: 0,
        completed: 0,
        openBreaches: 0,
        upcomingDeadlines: [] as { title: string; dueDate: string }[],
        evidenceCoverage: 0,
      };

      try {
        const res = await fetch('/api/v1/compliance/summary');
        if (res.ok) {
          const data = await res.json();
          complianceData = {
            completionPercentage: data.completionPercentage ?? 0,
            total: data.total ?? 0,
            overdue: data.overdue ?? 0,
            dueSoon: data.dueSoon ?? 0,
            completed: data.completed ?? 0,
            openBreaches: data.openBreaches ?? 0,
            upcomingDeadlines: data.upcomingDeadlines ?? [],
            evidenceCoverage: data.evidenceCoverage ?? 0,
          };
        }
      } catch {
        // Use defaults if API fails
      }

      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Title
      doc.setFontSize(20);
      doc.text('Board Compliance Report', 20, 25);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(`Generated: ${now}`, 20, 33);
      doc.text('FormaOS Compliance Platform', 20, 39);

      // Section 1: Executive Summary (RAG Status)
      let y = 55;
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text('1. Executive Summary', 20, y);
      y += 10;

      const ragStatus =
        complianceData.completionPercentage >= 80
          ? 'GREEN'
          : complianceData.completionPercentage >= 50
            ? 'AMBER'
            : 'RED';

      doc.setFontSize(11);
      doc.text(`Overall RAG Status: ${ragStatus}`, 25, y);
      y += 7;
      doc.text(
        `Compliance Score: ${complianceData.completionPercentage}%`,
        25,
        y,
      );
      y += 7;
      doc.text(`Total Obligations: ${complianceData.total}`, 25, y);
      y += 7;
      doc.text(`Open Breaches: ${complianceData.openBreaches}`, 25, y);
      y += 15;

      // Section 2: Obligations Status
      doc.setFontSize(14);
      doc.text('2. Obligations Status', 20, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Count', 'Percentage']],
        body: [
          [
            'Completed',
            String(complianceData.completed),
            complianceData.total
              ? `${Math.round((complianceData.completed / complianceData.total) * 100)}%`
              : '0%',
          ],
          [
            'Overdue',
            String(complianceData.overdue),
            complianceData.total
              ? `${Math.round((complianceData.overdue / complianceData.total) * 100)}%`
              : '0%',
          ],
          [
            'Due Soon',
            String(complianceData.dueSoon),
            complianceData.total
              ? `${Math.round((complianceData.dueSoon / complianceData.total) * 100)}%`
              : '0%',
          ],
          ['Total', String(complianceData.total), '100%'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 25 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable?.finalY + 15 || y + 50;

      // Section 3: Open Breaches
      doc.setFontSize(14);
      doc.text('3. Open Breaches', 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(
        complianceData.openBreaches > 0
          ? `${complianceData.openBreaches} open breach(es) require attention.`
          : 'No open breaches.',
        25,
        y,
      );
      y += 15;

      // Section 4: Upcoming Regulatory Deadlines
      doc.setFontSize(14);
      doc.text('4. Upcoming Regulatory Deadlines', 20, y);
      y += 8;

      if (complianceData.upcomingDeadlines.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Obligation', 'Due Date']],
          body: complianceData.upcomingDeadlines.map((d) => [
            d.title,
            d.dueDate,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 25 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable?.finalY + 15 || y + 30;
      } else {
        doc.setFontSize(11);
        doc.text('No upcoming deadlines in the next 30 days.', 25, y);
        y += 15;
      }

      // Section 5: Evidence Coverage
      doc.setFontSize(14);
      doc.text('5. Evidence Coverage', 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(`Evidence Coverage: ${complianceData.evidenceCoverage}%`, 25, y);

      // Save
      doc.save(
        `board-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
      );
    } catch (err) {
      console.error('Board report generation failed:', err);
    }
    setIsGenerating(false);
  };

  return (
    <ErrorBoundary name="BoardReportGenerator" level="component">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--wire-action)]/15 p-2">
              <FileText className="h-5 w-5 text-[var(--wire-action)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Board Reporting Pack</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate PDF with executive summary, obligations, breaches,
                deadlines, and evidence coverage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-[var(--wire-action)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Board Pack'
            )}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
