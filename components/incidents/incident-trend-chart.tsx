'use client';

interface TrendChartProps {
  data: Array<{ period: string; count: number }>;
  title?: string;
}

export function IncidentTrendChart({
  data,
  title = 'Incident Trend',
}: TrendChartProps) {
  if (!data.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No trend data available.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div data-testid="incident-trend-chart">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="flex items-end gap-1 h-40">
        {data.map((d) => (
          <div
            key={d.period}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${d.period}: ${d.count}`}
          >
            <span className="text-[10px] text-muted-foreground">{d.count}</span>
            <div
              className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm min-h-[2px]"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
            <span className="text-[9px] text-muted-foreground truncate max-w-full">
              {d.period.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
