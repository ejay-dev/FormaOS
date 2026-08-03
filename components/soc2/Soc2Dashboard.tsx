'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Play, FileDown, RefreshCw } from 'lucide-react';
import { ReadinessScoreRing } from './ReadinessScoreRing';
import { DomainBreakdown } from './DomainBreakdown';
import { ControlGapTable } from './ControlGapTable';
import { MilestoneTimeline } from './MilestoneTimeline';
import { AutomatedChecks } from './AutomatedChecks';
import { RemediationTracker } from './RemediationTracker';
import {
  runSoc2Assessment,
  generateReportAction,
} from '@/app/app/actions/soc2-readiness';
import type {
  Soc2ReadinessResult,
  Soc2Milestone,
  Soc2RemediationAction,
  AutomatedCheckResult as AutoCheckResult,
} from '@/lib/soc2/types';

interface Soc2DashboardProps {
  assessment: Soc2ReadinessResult | null;
  milestones: Soc2Milestone[];
  remediationActions: Soc2RemediationAction[];
  automatedChecks: AutoCheckResult[];
}

export function Soc2Dashboard({
  assessment: initialAssessment,
  milestones: initialMilestones,
  remediationActions: initialActions,
  automatedChecks: initialChecks,
}: Soc2DashboardProps) {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [actions, setActions] = useState(initialActions);
  const [checks, setChecks] = useState(initialChecks);
  const [isAssessing, startAssessment] = useTransition();
  const [isGenerating, startGenerate] = useTransition();
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleRunAssessment = () => {
    startAssessment(async () => {
      const result = await runSoc2Assessment();
      if ('error' in result) {
        setReportStatus(result.error);
        return;
      }
      setAssessment(result);
      // Re-fetch the server components rather than reloading the document,
      // so the state this component just set survives.
      router.refresh();
    });
  };

  const handleGenerateReport = () => {
    startGenerate(async () => {
      try {
        const report = await generateReportAction();
        if ('error' in report) throw new Error(report.error);
        setReportStatus(
          `Report generated: ${report.organizationName} — Score: ${report.overallScore}%`,
        );
        // Update local state with fresh data from the report
        setAssessment({
          overallScore: report.overallScore,
          domainScores: report.domainScores,
          controlResults: report.controlResults,
          totalControls: report.controlResults.length,
          satisfiedControls: report.controlResults.filter(
            (c) => c.status === 'satisfied',
          ).length,
          assessedAt: report.assessmentDate,
        });
        setMilestones(report.milestones);
        setActions(report.remediationActions);
        setChecks(report.automatedChecks);
      } catch (err) {
        setReportStatus(
          `Error: ${err instanceof Error ? err.message : 'Failed to generate report'}`,
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">SOC 2 readiness</h1>
          <p className="page-description">
            Automated evidence collection, gap analysis, and certification
            readiness tracking.
            {assessment?.assessedAt
              ? ` Last assessed ${new Date(assessment.assessedAt).toLocaleString()}.`
              : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAssessment}
            disabled={isAssessing}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isAssessing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isAssessing ? 'Assessing…' : 'Run assessment'}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !assessment}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            {isGenerating ? 'Generating…' : 'Generate report'}
          </button>
        </div>
      </div>

      <div className="page-content space-y-6">
      {reportStatus && (
        <div
          role="status"
          className="rounded-lg border border-border bg-card p-4 text-sm text-foreground"
        >
          {reportStatus}
        </div>
      )}

      {!assessment ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-1">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No assessment yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Run your first SOC 2 readiness assessment to see your compliance
            posture, identify gaps, and track remediation progress.
          </p>
          <button
            onClick={handleRunAssessment}
            disabled={isAssessing}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isAssessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAssessing ? 'Running assessment…' : 'Run first assessment'}
          </button>
        </div>
      ) : (
        <>
          {/* Score + Domains */}
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="rounded-xl border border-border bg-card p-8 flex items-center justify-center">
              <ReadinessScoreRing score={assessment.overallScore} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {assessment.satisfiedControls}/{assessment.totalControls}{' '}
                  controls satisfied
                </span>
              </div>
              <DomainBreakdown domains={assessment.domainScores} />
            </div>
          </div>

          {/* Automated Checks + Milestones */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AutomatedChecks checks={checks} />
            <MilestoneTimeline milestones={milestones} />
          </div>

          {/* Control Gap Table */}
          <ControlGapTable controls={assessment.controlResults} />

          {/* Remediation Tracker */}
          <RemediationTracker actions={actions} />
        </>
      )}
      </div>
    </div>
  );
}
