'use client';

import { useState } from 'react';
import { BarChart3, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      'FormaOS can transform your posture from reactive to proactive in 14 days.',
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
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <BarChart3
              className="h-10 w-10 text-primary mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-2xl font-bold text-foreground">
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
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${(percentScore / 100) * 327} 327`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">
                  {percentScore}%
                </span>
                <span className={cn('text-sm font-medium', maturity.color)}>
                  {maturity.level}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground max-w-md mx-auto">
              {maturity.description}
            </p>
            <p className="text-sm text-primary mt-4 font-medium">
              {maturity.recommendation}
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => {
                  setShowResults(false);
                  setAnswers({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Retake assessment
              </button>
              <a
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Self-Assessment
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            What&apos;s your compliance maturity?
          </h2>
          <p className="text-muted-foreground mt-3">
            Answer 5 questions to see where you stand — and where FormaOS can
            help.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="p-6 rounded-xl border border-border bg-card"
            >
              <p className="text-sm font-medium text-foreground mb-4">
                <span className="text-muted-foreground mr-2">{qi + 1}.</span>
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
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-1">
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
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                See my score <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {answeredCount > 0 && answeredCount < questions.length && (
            <p className="text-center text-sm text-muted-foreground">
              {questions.length - answeredCount} question
              {questions.length - answeredCount > 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
