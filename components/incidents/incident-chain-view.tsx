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

const DONE_STATUSES = [
  'resolved',
  'closed',
  'verified',
  'submitted',
  'acknowledged',
  'effective',
];
const IN_FLIGHT_STATUSES = [
  'in_progress',
  'findings_ready',
  'implemented',
  'draft',
];
const FAILED_STATUSES = ['overdue', 'ineffective', 'needs_revision'];

function statusColor(status: string): string {
  if (DONE_STATUSES.includes(status)) {
    return 'border-success bg-success/10';
  }
  if (IN_FLIGHT_STATUSES.includes(status)) {
    return 'border-info bg-info/10';
  }
  if (FAILED_STATUSES.includes(status)) {
    return 'border-destructive bg-destructive/10';
  }
  return 'border-warning bg-warning/10';
}

function StatusIndicator({ status }: { status: string }) {
  if (DONE_STATUSES.includes(status)) {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (['overdue', 'ineffective'].includes(status)) {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  return <Clock className="h-4 w-4 text-warning" />;
}

export function IncidentChainView({
  incidentId: _incidentId,
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
