'use client';

import { useState } from 'react';
import { BarChart3, ArrowRight, Shield, Ban, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assessmentHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

/**
 * =========================================================
 * COMPLIANCE MATURITY SCORE
 * =========================================================
 *
 * Visual self-assessment widget for the marketing site.
 * Users answer 5 questions and get a maturity score with
 * recommendations. Drives qualification and conversion.
 */

interface AssessmentQuestion {
  id: string;
  question: string;
  options: Array<{
    label: string;
    score: number;
    description?: string;
  }>;
}

const questions: AssessmentQuestion[] = [
  {
    id: 'evidence',
    question: 'How do you collect compliance evidence?',
    options: [
      {
        label: 'Manually / ad hoc',
        score: 1,
        description: 'Spreadsheets, email, shared drives',
      },
      {
        label: 'Partially automated',
        score: 2,
        description: 'Some tools but manual coordination',
      },
      {
        label: 'Fully automated',
        score: 3,
        description: 'Continuous collection with integrations',
      },
    ],
  },
  {
    id: 'frameworks',
    question: 'How do you manage compliance frameworks?',
    options: [
      {
        label: 'Spreadsheets',
        score: 1,
        description: 'Excel or Google Sheets tracking',
      },
      {
        label: 'GRC tool',
        score: 2,
        description: 'Dedicated tool but manual mapping',
      },
      {
        label: 'Mapped & automated',
        score: 3,
        description: 'Controls auto-mapped to evidence',
      },
    ],
  },
  {
    id: 'audit_readiness',
    question: 'How audit-ready are you right now?',
    options: [
      {
        label: 'Not ready',
        score: 1,
        description: 'Would need weeks to prepare',
      },
      { label: 'Partially ready', score: 2, description: 'Some gaps to fill' },
      {
        label: 'Always ready',
        score: 3,
        description: 'Continuous audit readiness',
      },
    ],
  },
  {
    id: 'team_alignment',
    question: 'How aligned is your team on compliance tasks?',
    options: [
      {
        label: 'Siloed',
        score: 1,
        description: "Few people know what's needed",
      },
      {
        label: 'Documented',
        score: 2,
        description: 'Roles defined but manual tracking',
      },
      {
        label: 'Orchestrated',
        score: 3,
        description: 'Automated assignments & tracking',
      },
    ],
  },
  {
    id: 'reporting',
    question: 'How do you report compliance status?',
    options: [
      {
        label: 'Manual reports',
        score: 1,
        description: 'Compiled periodically by hand',
      },
      { label: 'Dashboard', score: 2, description: 'Some visibility but gaps' },
      {
        label: 'Real-time',
        score: 3,
        description: 'Live posture with executive dashboards',
      },
    ],
  },
];

function getMaturityLevel(score: number): {
  level: string;
  color: string;
  description: string;
  recommendation: string;
} {
  if (score >= 13) {
    return {
      level: 'Advanced',
      color: 'text-success',
      description:
        'Your compliance program is mature. FormaOS can help you optimize and scale.',
      recommendation:
        'Focus on automation expansion and multi-framework coverage.',
    };
  }
  if (score >= 9) {
    return {
      level: 'Developing',
      color: 'text-warning',
      description:
        'You have a foundation but significant manual effort remains.',
      recommendation:
        'FormaOS can eliminate 65% of manual work and close framework gaps.',
    };
  }
  return {
    level: 'Foundational',
    color: 'text-destructive',
      description:
        'Your compliance program has significant gaps and manual processes.',
    recommendation:
      'FormaOS can move the highest-risk gaps into enforced workflows during guided onboarding.',
  };
}

export function ComplianceMaturityAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const maxScore = questions.length * 3;
  const percentScore = Math.round((totalScore / maxScore) * 100);
  const maturity = getMaturityLevel(totalScore);

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  if (showResults) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(113,113,122,0.12),transparent_38%)]" />
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-300/[0.14] bg-slate-950/70 p-8 text-center shadow-[0_28px_90px_rgba(8,47,73,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <BarChart3
              className="mx-auto mb-4 h-10 w-10 text-cyan-300"
              aria-hidden="true"
            />
            <h3 className="text-2xl font-bold text-white">
              Your Compliance Maturity Score
            </h3>

            {/* Score ring */}
            <div className="relative w-40 h-40 mx-auto my-8">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 120 120"
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(161,161,170,0.9)"
                  strokeWidth="8"
                  strokeDasharray={`${(percentScore / 100) * 327} 327`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {percentScore}%
                </span>
                <span className={cn('text-sm font-medium', maturity.color)}>
                  {maturity.level}
                </span>
              </div>
            </div>

            <p className="mx-auto max-w-md text-slate-300">
              {maturity.description}
            </p>
            <p className="mt-4 text-sm font-medium text-cyan-200">
              {maturity.recommendation}
            </p>

            <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Evidence trail ready
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Completed actions can be sealed into an immutable audit trail.
                </p>
              </div>
              <div className="rounded-2xl border border-red-300/20 bg-red-500/[0.08] p-4 shadow-[0_0_24px_rgba(248,113,113,0.12)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-100">
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Block incomplete steps
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Missing owner, approval, or evidence requirements stay blocked.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => {
                  setShowResults(false);
                  setAnswers({});
                }}
                className="text-sm text-slate-500 transition-colors hover:text-white"
              >
                Retake assessment
              </button>
              <a
                href={assessmentHref('maturity_assessment')}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold transition hover:opacity-90"
              >
                {PUBLIC_CTA_LABELS.startAssessment}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(113,113,122,0.1),transparent_34%),radial-gradient(circle_at_80%_85%,rgba(82,82,91,0.08),transparent_32%)]" />
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-1.5 text-sm font-medium text-cyan-200">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Self-Assessment
          </div>
          <h2 className="text-3xl font-bold text-white">
            What&apos;s your compliance maturity?
          </h2>
          <p className="mt-3 text-slate-400">
            Answer 5 questions to see where you stand - and where FormaOS can
            enforce stronger operating controls.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="rounded-2xl border border-cyan-300/[0.12] bg-slate-950/65 p-6 shadow-[0_18px_60px_rgba(8,47,73,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
            >
              <p className="mb-4 text-sm font-medium text-slate-100">
                <span className="mr-2 text-slate-500">{qi + 1}.</span>
                {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {q.options.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(q.id, opt.score)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      answers[q.id] === opt.score
                        ? 'border-cyan-300/35 bg-cyan-300/[0.08] text-white'
                        : 'border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-cyan-300/25 hover:bg-white/[0.06] hover:text-white',
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    {opt.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {opt.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {answeredCount === questions.length && (
            <div className="text-center">
              <button
                onClick={() => setShowResults(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground text-background px-8 py-4 text-sm font-semibold transition hover:opacity-90"
              >
                See my score <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {answeredCount > 0 && answeredCount < questions.length && (
            <p className="text-center text-sm text-slate-500">
              {questions.length - answeredCount} question
              {questions.length - answeredCount > 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
