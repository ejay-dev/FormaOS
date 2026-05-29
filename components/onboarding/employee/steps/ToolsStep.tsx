'use client';

import {
  ArrowRight,
  ArrowLeft,
  NotebookPen,
  Calendar,
  Users,
  CheckSquare,
  Lock,
  Stethoscope,
  HeartPulse,
  Home,
  Baby,
  Shield,
  FileText,
  FormInput,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { IndustryToolCard } from '@/lib/onboarding/employee-journey';

const ICON_MAP: Record<string, React.ElementType> = {
  NotebookPen,
  Calendar,
  Users,
  CheckSquare,
  Lock,
  Stethoscope,
  HeartPulse,
  Home,
  Baby,
  Shield,
  FileText,
  FormInput,
  AlertTriangle,
  ShieldCheck,
};

interface ToolsStepProps {
  tools: IndustryToolCard[];
  onNext: () => void;
  onBack: () => void;
}

export function ToolsStep({ tools, onNext, onBack }: ToolsStepProps) {
  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
          <Zap className="h-3 w-3 text-violet-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
            Your daily toolkit
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 leading-tight">
          These are the tools you will use most.
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Everything is in the sidebar when you log in. Here is what each tool
          does.
        </p>
      </div>

      {/* Tool cards */}
      <div className="flex flex-col gap-3">
        {tools.map((tool) => {
          const Icon = ICON_MAP[tool.icon] ?? CheckSquare;

          return (
            <div
              key={tool.title}
              className={[
                'relative flex gap-4 rounded-2xl border p-4 transition-all duration-200',
                tool.highlight
                  ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-[hsl(var(--card))] to-[hsl(var(--card))] shadow-sm shadow-cyan-500/10'
                  : 'border-edge-2 bg-surface-1',
              ].join(' ')}
            >
              {/* Highlighted badge */}
              {tool.highlight && (
                <span className="absolute right-3 top-3 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-400">
                  Key tool
                </span>
              )}

              <div
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  tool.highlight
                    ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400'
                    : 'border-edge-2 bg-surface-2 text-slate-400',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="space-y-1 pr-14">
                <p
                  className={[
                    'text-sm font-semibold',
                    tool.highlight ? 'text-slate-100' : 'text-slate-200',
                  ].join(' ')}
                >
                  {tool.title}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-2xl border border-edge-2 bg-surface-1 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-surface-2 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          Set up my profile
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
