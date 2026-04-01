'use client';

import { useState, useTransition } from 'react';
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

  const handleRunAssessment = () => {
    startAssessment(async () => {
      const result = await runSoc2Assessment();
      setAssessment(result);
      // Refresh the page data after assessment
      window.location.reload();
    });
  };

  const handleGenerateReport = () => {
    startGenerate(async () => {
      try {
        const report = await generateReportAction();
        setReportStatus(`Report generated: ${report.organizationName} — Score: ${report.overallScore}%`);
        // Update local state with fresh data from the report
        setAssessment({
          overallScore: report.overallScore,
          domainScores: report.domainScores,
          controlResults: report.controlResults,
          totalControls: report.controlResults.length,
          satisfiedControls: report.controlResults.filter((c) => c.status === 'satisfied').length,
          assessedAt: report.assessmentDate,
        });
        setMilestones(report.milestones);
        setActions(report.remediationActions);
        setChecks(report.automatedChecks);
      } catch (err) {
        setReportStatus(`Error: ${err instanceof Error ? err.message : 'Failed to generate report'}`);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">SOC 2 Readiness</h1>
          <p className="text-muted-foreground mt-1">
            Automated evidence collection, gap analysis, and certification readiness tracking.
          </p>
          {assessment?.assessedAt && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              Last assessed: {new Date(assessment.assessedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRunAssessment}
            disabled={isAssessing}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/20 transition-colors disabled:opacity-50"
          >
            {isAssessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAssessing ? 'Assessing...' : 'Run Assessment'}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !assessment}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {reportStatus && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300">
          {reportStatus}
        </div>
      )}

      {!assessment ? (
        <div className="rounded-2xl border border-glass-border bg-glass-subtle p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-glass-border bg-white/5">
            <Play className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground/90">No Assessment Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Run your first SOC 2 readiness assessment to see your compliance posture, identify gaps, and track remediation progress.
          </p>
          <button
            onClick={handleRunAssessment}
            disabled={isAssessing}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors disabled:opacity-50"
          >
            {isAssessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isAssessing ? 'Running Assessment...' : 'Run First Assessment'}
          </button>
        </div>
      ) : (
        <>
          {/* Score + Domains */}
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="rounded-2xl border border-glass-border bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex items-center justify-center">
              <ReadinessScoreRing score={assessment.overallScore} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {assessment.satisfiedControls}/{assessment.totalControls} controls satisfied
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
  );
}
