'use client';

import { useState } from 'react';
import { ShieldCheck, Siren, LineChart } from 'lucide-react';
import AuditRequestScenario from './AuditRequestScenario';
import IncidentResponseScenario from './IncidentResponseScenario';
import BoardReportScenario from './BoardReportScenario';

const TABS = [
  {
    id: 'audit',
    label: 'Audit Request',
    icon: ShieldCheck,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-500/15 border-cyan-400/30',
  },
  {
    id: 'incident',
    label: 'Incident Response',
    icon: Siren,
    color: 'text-red-400',
    activeBg: 'bg-red-500/15 border-red-400/30',
  },
  {
    id: 'board',
    label: 'Board Report',
    icon: LineChart,
    color: 'text-purple-400',
    activeBg: 'bg-purple-500/15 border-purple-400/30',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * ScenarioShowcase — Tabbed container for the three interactive scenario demos.
 * Drop into any marketing page to show operational workflows.
 */
export default function ScenarioShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('audit');

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        {/* Section heading */}
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Interactive Scenarios
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Walk through real compliance workflows
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
            Step through the exact workflows your team will use — from audit
            request to board report, with real data and measurable outcomes.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="mb-8 flex flex-wrap justify-center gap-2"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? `${tab.activeBg} ${tab.color}`
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active scenario */}
        {activeTab === 'audit' && <AuditRequestScenario />}
        {activeTab === 'incident' && <IncidentResponseScenario />}
        {activeTab === 'board' && <BoardReportScenario />}
      </div>
    </section>
  );
}
