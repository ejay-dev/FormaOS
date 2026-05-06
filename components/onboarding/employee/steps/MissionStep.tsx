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
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
            Your mission at {orgName}
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 leading-tight">
          {missionContent.headline}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          {missionContent.subtext}
        </p>
      </div>

      {/* Tagline */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4">
        <p className="text-base font-bold text-indigo-300 italic">
          &ldquo;{missionContent.tagline}&rdquo;
        </p>
      </div>

      {/* Three pillars */}
      <div className="flex flex-col gap-3">
        {missionContent.pillars.map((pillar, i) => {
          const Icon = ICON_MAP[pillar.icon] ?? ShieldCheck;
          const accentColors = [
            'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
            'text-violet-400 bg-violet-500/10 border-violet-500/25',
            'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
          ];
          const accent = accentColors[i % accentColors.length];

          return (
            <div
              key={pillar.title}
              className="flex gap-4 rounded-2xl border border-edge-2 bg-surface-1 p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent}`}
              >
                <Icon className={`h-5 w-5 ${accent.split(' ')[0]}`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-100">
                  {pillar.title}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
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
          className="flex items-center gap-2 rounded-2xl border border-edge-2 bg-surface-1 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-surface-2 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          Show me my tools
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
