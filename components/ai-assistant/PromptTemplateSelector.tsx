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
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {PROMPT_TEMPLATES.map((template) => {
          const Icon = ICON_MAP[template.icon] ?? MessageSquare;
          const isActive = selectedId === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(isActive ? null : template.id)}
              title={template.description}
              className={`flex shrink-0 min-h-[44px] md:min-h-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground/70'
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
