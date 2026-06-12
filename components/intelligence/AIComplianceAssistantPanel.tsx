'use client';

import Link from 'next/link';
import { ArrowRight, FileSearch, ShieldCheck, Wand2 } from 'lucide-react';

type Suggestion = {
  title: string;
  detail: string;
  href: string;
  icon: 'evidence' | 'policy' | 'remediation';
};

const iconMap = {
  evidence: FileSearch,
  policy: ShieldCheck,
  remediation: Wand2,
} as const;

export function AIComplianceAssistantPanel({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          AI Compliance Assistant
        </h2>
      </div>
      <p className="mb-5 text-sm text-foreground/70">
        Context-aware recommendations grounded in your current compliance
        workflow state.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {suggestions.map((suggestion) => {
          const Icon = iconMap[suggestion.icon];
          return (
            <Link
              key={suggestion.title}
              href={suggestion.href}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-surface-2"
            >
              <div className="mb-3 inline-flex rounded-lg border border-border bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {suggestion.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {suggestion.detail}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                Open workflow
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
