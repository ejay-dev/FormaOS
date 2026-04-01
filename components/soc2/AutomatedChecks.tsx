'use client';

import { CheckCircle2, XCircle, Cpu } from 'lucide-react';
import type { AutomatedCheckResult } from '@/lib/soc2/types';

interface AutomatedChecksProps {
  checks: AutomatedCheckResult[];
}

export function AutomatedChecks({ checks }: AutomatedChecksProps) {
  const grouped = new Map<string, AutomatedCheckResult[]>();
  for (const check of checks) {
    const list = grouped.get(check.category) ?? [];
    list.push(check);
    grouped.set(check.category, list);
  }

  const totalPassed = checks.filter((c) => c.passed).length;
  const total = checks.length;

  return (
    <div className="rounded-2xl border border-glass-border bg-glass-subtle p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <h3 className="text-lg font-semibold text-foreground">Automated Checks</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground/60">System-verified compliance evidence.</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass-subtle px-3 py-2 text-right">
          <div className="text-xs text-muted-foreground">Passing</div>
          <div className="text-lg font-semibold text-foreground tabular-nums">
            {totalPassed}<span className="text-muted-foreground/60">/{total}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {Array.from(grouped.entries()).map(([category, categoryChecks]) => (
          <div key={category}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">{category}</div>
            <div className="space-y-2">
              {categoryChecks.map((check) => (
                <div
                  key={`${check.controlCode}-${check.checkName}`}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    check.passed
                      ? 'border-emerald-400/10 bg-emerald-400/5'
                      : 'border-rose-400/10 bg-rose-400/5'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/90">{check.checkName}</span>
                      <span className="rounded border border-glass-border bg-glass-subtle px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60">
                        {check.controlCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
