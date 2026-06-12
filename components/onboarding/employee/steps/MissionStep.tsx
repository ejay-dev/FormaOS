'use client';

import {
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  FileText,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Star,
  Shield,
  CheckSquare,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import type { IndustryMissionContent } from '@/lib/onboarding/employee-journey';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck,
  FileText,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Star,
  Shield,
  CheckSquare,
  Lock,
  AlertTriangle,
};

interface MissionStepProps {
  orgName: string;
  missionContent: IndustryMissionContent;
  onNext: () => void;
  onBack: () => void;
}

export function MissionStep({
  orgName,
  missionContent,
  onNext,
  onBack,
}: MissionStepProps) {
  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Your mission at {orgName}
          </span>
        </div>
        <h2 className="text-2xl font-black text-foreground leading-tight">
          {missionContent.headline}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {missionContent.subtext}
        </p>
      </div>

      {/* Tagline */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-base font-bold text-foreground italic">
          &ldquo;{missionContent.tagline}&rdquo;
        </p>
      </div>

      {/* Three pillars */}
      <div className="flex flex-col gap-3">
        {missionContent.pillars.map((pillar) => {
          const Icon = ICON_MAP[pillar.icon] ?? ShieldCheck;

          return (
            <div
              key={pillar.title}
              className="flex gap-4 rounded-2xl border border-edge-2 bg-surface-1 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {pillar.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.body}
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
          className="flex items-center gap-2 rounded-2xl border border-edge-2 bg-surface-1 px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Show me my tools
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
