'use client';

import {
  MessageSquare,
  FileText,
  ClipboardCheck,
  BarChart3,
  Wrench,
} from 'lucide-react';
import { PROMPT_TEMPLATES } from '@/lib/ai/prompt-templates';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  FileText,
  ClipboardCheck,
  BarChart3,
  Wrench,
};

interface PromptTemplateSelectorProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function PromptTemplateSelector({ selectedId, onSelect }: PromptTemplateSelectorProps) {
  return (
    <div className="border-b border-glass-border px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {PROMPT_TEMPLATES.map((template) => {
          const Icon = ICON_MAP[template.icon] ?? MessageSquare;
          const isActive = selectedId === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(isActive ? null : template.id)}
              title={template.description}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-300'
                  : 'border-glass-border bg-glass-subtle text-muted-foreground hover:bg-glass-strong hover:text-foreground/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {template.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
