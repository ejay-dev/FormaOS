'use client';

interface MTTRChartProps {
  data: Record<string, number>;
  title?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export function MTTRChart({
  data,
  title = 'Mean Time to Resolution (hours)',
}: MTTRChartProps) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (!entries.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No MTTR data available.
      </div>
    );
  }

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const sorted = entries.sort(
    ([a], [b]) => severityOrder.indexOf(a) - severityOrder.indexOf(b),
  );

  return (
    <div data-testid="mttr-chart">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-3">
        {sorted.map(([severity, hours]) => {
          const color = SEVERITY_COLORS[severity] ?? 'bg-gray-500';
          return (
            <div key={severity}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="capitalize">{severity}</span>
                <span className="font-medium">{hours}h</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(hours / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
