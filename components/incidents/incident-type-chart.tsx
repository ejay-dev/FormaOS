'use client';

interface TypeChartProps {
  data: Record<string, number>;
  title?: string;
}

const TYPE_COLORS: Record<string, string> = {
  injury: 'bg-destructive',
  medication_error: 'bg-warning',
  behavioral: 'bg-warning/60',
  abuse: 'bg-destructive/70',
  property: 'bg-info',
  complaint: 'bg-muted-foreground',
  near_miss: 'bg-info/60',
};

export function IncidentTypeChart({
  data,
  title = 'Incidents by Type',
}: TypeChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (!entries.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No type data available.
      </div>
    );
  }

  return (
    <div data-testid="incident-type-chart">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.map(([type, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const color = TYPE_COLORS[type] ?? 'bg-muted-foreground';
          return (
            <div key={type}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">
                  {count} ({Math.round(pct)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
