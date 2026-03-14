'use client';

import { Clock3, Sparkles } from 'lucide-react';

import type { WorkflowTemplateDefinition } from '@/lib/automation/workflow-types';

interface WorkflowTemplatePickerProps {
  templates: WorkflowTemplateDefinition[];
  onUseTemplate: (template: WorkflowTemplateDefinition) => void;
}

export function WorkflowTemplatePicker({
  templates,
  onUseTemplate,
}: WorkflowTemplatePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
          onClick={() => onUseTemplate(template)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {template.triggerType}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">{template.name}</h3>
            </div>
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <p className="mt-3 text-sm text-slate-400">{template.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {template.framework.map((framework) => (
              <span
                key={`${template.id}-${framework}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
              >
                {framework}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {template.estimatedSetupTime}
            </span>
            <span>{template.definition.steps.length} steps</span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Preview
            </p>
            <ol className="mt-2 space-y-1 text-sm text-slate-300">
              {template.definition.steps.slice(0, 4).map((step) => (
                <li key={step.id}>{step.name}</li>
              ))}
            </ol>
          </div>
        </button>
      ))}
    </div>
  );
}
