'use client';

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileSearch,
  Wrench,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface ChainNode {
  type: 'incident' | 'investigation' | 'capa' | 'regulatory';
  id: string;
  label: string;
  status: string;
  href: string;
}

interface IncidentChainViewProps {
  incidentId: string;
  nodes: ChainNode[];
}

const NODE_ICONS: Record<string, typeof Clock> = {
  incident: AlertCircle,
  investigation: FileSearch,
  capa: Wrench,
  regulatory: Shield,
};

function statusColor(status: string): string {
  if (
    [
      'resolved',
      'closed',
      'verified',
      'submitted',
      'acknowledged',
      'effective',
    ].includes(status)
  ) {
    return 'border-green-500 bg-green-50 dark:bg-green-950/20';
  }
  if (
    ['in_progress', 'findings_ready', 'implemented', 'draft'].includes(status)
  ) {
    return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
  }
  if (['overdue', 'ineffective', 'needs_revision'].includes(status)) {
    return 'border-red-500 bg-red-50 dark:bg-red-950/20';
  }
  return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
}

function StatusIndicator({ status }: { status: string }) {
  if (
    [
      'resolved',
      'closed',
      'verified',
      'submitted',
      'acknowledged',
      'effective',
    ].includes(status)
  ) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (['overdue', 'ineffective'].includes(status)) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

export function IncidentChainView({
  incidentId,
  nodes,
}: IncidentChainViewProps) {
  if (!nodes.length) {
    return (
      <div
        className="text-sm text-muted-foreground text-center py-4"
        data-testid="chain-empty"
      >
        No resolution chain items yet.
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-2 overflow-x-auto pb-2"
      data-testid="incident-chain-view"
    >
      {nodes.map((node, i) => {
        const Icon = NODE_ICONS[node.type] ?? Clock;
        return (
          <div key={`${node.type}-${node.id}`} className="flex items-center">
            <Link
              href={node.href}
              className={`flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px] hover:shadow-md transition-shadow ${statusColor(node.status)}`}
            >
              <Icon className="h-6 w-6 mb-1.5 text-muted-foreground" />
              <span className="text-xs font-medium text-center">
                {node.label}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <StatusIndicator status={node.status} />
                <span className="text-[10px] text-muted-foreground capitalize">
                  {node.status.replace(/_/g, ' ')}
                </span>
              </div>
            </Link>
            {i < nodes.length - 1 && (
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
