'use client';

import { FileText, MessageSquare, Database, ExternalLink } from 'lucide-react';

interface Source {
  sourceType: string;
  sourceId: string;
  title?: string;
  snippet: string;
  similarity: number;
}

export function AiSourceCard({ source }: { source: Source }) {
  const typeIcons: Record<string, typeof FileText> = {
    evidence: FileText,
    policy: FileText,
    control: Database,
    task: MessageSquare,
    form_submission: FileText,
  };
  const Icon = typeIcons[source.sourceType] ?? FileText;

  const typeLabels: Record<string, string> = {
    evidence: 'Evidence',
    policy: 'Policy',
    control: 'Control',
    task: 'Task',
    form_submission: 'Form Submission',
  };

  const relevanceColor =
    source.similarity >= 0.85
      ? 'text-green-600 dark:text-green-400'
      : source.similarity >= 0.7
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-muted-foreground';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="mt-0.5 rounded bg-muted p-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {typeLabels[source.sourceType] ?? source.sourceType}
          </span>
          <span className={`text-xs ${relevanceColor}`}>
            {Math.round(source.similarity * 100)}% match
          </span>
        </div>
        {source.title && (
          <p className="mt-0.5 text-sm font-medium text-foreground truncate">
            {source.title}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {source.snippet}
        </p>
      </div>
      <button
        className="shrink-0 rounded p-1 hover:bg-muted"
        title="View source"
      >
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export function AiSourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Sources ({sources.length})
      </h4>
      <div className="space-y-2">
        {sources.map((source, i) => (
          <AiSourceCard
            key={`${source.sourceType}-${source.sourceId}-${i}`}
            source={source}
          />
        ))}
      </div>
    </div>
  );
}
