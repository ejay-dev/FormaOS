'use client';

import { useState } from 'react';
import { Calculator, Clock, DollarSign, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * =========================================================
 * AUDIT TIME SAVINGS CALCULATOR
 * =========================================================
 *
 * Interactive calculator for the marketing site that shows
 * prospective customers how much time/money FormaOS saves.
 *
 * Drives conversion through quantified outcome proof.
 */

interface CalculatorInputs {
  teamSize: number;
  frameworkCount: number;
  auditsPerYear: number;
  avgHourlyRate: number;
}

interface SavingsResult {
  hoursPerAuditCycle: number;
  hoursSavedPerCycle: number;
  annualHoursSaved: number;
  annualCostSaved: number;
  timeToAuditReady: string;
  nonComplianceCost: number;
}

function calculateSavings(inputs: CalculatorInputs): SavingsResult {
  const { teamSize, frameworkCount, auditsPerYear, avgHourlyRate } = inputs;

  // Industry benchmarks (hours per audit cycle without automation)
  const baseHoursPerFramework = 120;
  const baseEvidenceCollectionHours = teamSize * 8;
  const baseReportingHours = 40;

  const hoursPerAuditCycle =
    frameworkCount * baseHoursPerFramework +
    baseEvidenceCollectionHours +
    baseReportingHours;

  // FormaOS reduces by ~65% through automation
  const automationReduction = 0.65;
  const hoursSavedPerCycle = Math.round(
    hoursPerAuditCycle * automationReduction,
  );
  const annualHoursSaved = hoursSavedPerCycle * auditsPerYear;
  const annualCostSaved = annualHoursSaved * avgHourlyRate;

  // Average cost of non-compliance per framework
  const nonComplianceCostPerFramework = 85000;
  const nonComplianceCost = frameworkCount * nonComplianceCostPerFramework;

  // Time to audit-ready
  let timeToAuditReady = '2-3 weeks';
  if (frameworkCount === 1 && teamSize <= 10) timeToAuditReady = '5-7 days';
  else if (frameworkCount <= 2 && teamSize <= 25)
    timeToAuditReady = '10-14 days';
  else if (frameworkCount <= 3) timeToAuditReady = '2-3 weeks';
  else timeToAuditReady = '3-4 weeks';

  return {
    hoursPerAuditCycle,
    hoursSavedPerCycle,
    annualHoursSaved,
    annualCostSaved,
    timeToAuditReady,
    nonComplianceCost,
  };
}

export function AuditSavingsCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    teamSize: 15,
    frameworkCount: 2,
    auditsPerYear: 2,
    avgHourlyRate: 95,
  });

  const results = calculateSavings(inputs);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            ROI Calculator
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How much time does FormaOS save you?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Adjust the inputs below to see your estimated savings per audit
            cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6 p-8 rounded-2xl border border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground">
              Your organization
            </h3>

            <SliderInput
              label="Team size"
              value={inputs.teamSize}
              min={1}
              max={200}
              step={1}
              suffix="people"
              onChange={(v) => setInputs((p) => ({ ...p, teamSize: v }))}
            />

            <SliderInput
              label="Compliance frameworks"
              value={inputs.frameworkCount}
              min={1}
              max={7}
              step={1}
              suffix="frameworks"
              onChange={(v) => setInputs((p) => ({ ...p, frameworkCount: v }))}
            />

            <SliderInput
              label="Audit cycles per year"
              value={inputs.auditsPerYear}
              min={1}
              max={12}
              step={1}
              suffix="per year"
              onChange={(v) => setInputs((p) => ({ ...p, auditsPerYear: v }))}
            />

            <SliderInput
              label="Average hourly rate"
              value={inputs.avgHourlyRate}
              min={30}
              max={300}
              step={5}
              prefix="$"
              suffix="/hr"
              onChange={(v) => setInputs((p) => ({ ...p, avgHourlyRate: v }))}
            />
          </div>

          {/* Results */}
          <div className="space-y-4">
            <ResultCard
              icon={Clock}
              label="Hours saved per audit cycle"
              value={`${results.hoursSavedPerCycle}`}
              suffix="hours"
              description={`Down from ${results.hoursPerAuditCycle} manual hours`}
              highlight
            />

            <ResultCard
              icon={DollarSign}
              label="Annual cost savings"
              value={`$${results.annualCostSaved.toLocaleString()}`}
              description={`${results.annualHoursSaved} hours × $${inputs.avgHourlyRate}/hr`}
              highlight
            />

            <ResultCard
              icon={Calculator}
              label="Time to audit-ready"
              value={results.timeToAuditReady}
              description="With FormaOS guided setup"
            />

            <ResultCard
              icon={TrendingDown}
              label="Cost of non-compliance risk"
              value={`$${results.nonComplianceCost.toLocaleString()}`}
              description="Average regulatory penalty exposure"
              variant="warning"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm font-semibold text-primary">
          {prefix}
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer accent-primary"
        aria-label={`${label}: ${prefix || ''}${value}${suffix ? ` ${suffix}` : ''}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>
          {prefix}
          {min}
        </span>
        <span>
          {prefix}
          {max}
        </span>
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  highlight,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  description?: string;
  highlight?: boolean;
  variant?: 'default' | 'warning';
}) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl border border-border transition-all',
        highlight && 'bg-primary/5 border-primary/20',
        variant === 'warning' && 'bg-warning/5 border-warning/20',
        !highlight && variant === 'default' && 'bg-card',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
            highlight && 'bg-primary/10',
            variant === 'warning' && 'bg-warning/10',
            !highlight && variant === 'default' && 'bg-muted',
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              highlight && 'text-primary',
              variant === 'warning' && 'text-warning',
              !highlight && variant === 'default' && 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {value}
            {suffix && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {suffix}
              </span>
            )}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
