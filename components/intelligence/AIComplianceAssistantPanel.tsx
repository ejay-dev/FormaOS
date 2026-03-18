'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, FileSearch, ShieldCheck, Wand2 } from 'lucide-react';

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
    <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-cyan-300" />
        <h2 className="text-lg font-semibold text-slate-100">
          AI Compliance Assistant
        </h2>
      </div>
      <p className="mb-5 text-sm text-slate-300">
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
              className="group rounded-xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:bg-slate-900/60"
            >
              <div className="mb-3 inline-flex rounded-lg border border-cyan-300/20 bg-cyan-500/10 p-2">
                <Icon className="h-4 w-4 text-cyan-200" />
              </div>
              <p className="text-sm font-semibold text-slate-100">
                {suggestion.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {suggestion.detail}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-200">
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
