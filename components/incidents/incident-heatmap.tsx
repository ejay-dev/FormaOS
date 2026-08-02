'use client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HeatmapProps {
  /** 7×24 grid: grid[dayOfWeek][hour] = count */
  grid: number[][];
  title?: string;
}

export function IncidentHeatmap({
  grid,
  title = 'Incident Heatmap (Day × Hour)',
}: HeatmapProps) {
  if (!grid.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No heatmap data available.
      </div>
    );
  }

  const max = Math.max(...grid.flat(), 1);

  // Single-hue sequential ramp: more incidents in a slot reads as more
  // destructive, and each cell carries its count in the title attribute.
  function cellColor(count: number): string {
    if (count === 0) return 'bg-muted';
    const intensity = count / max;
    if (intensity > 0.75) return 'bg-destructive';
    if (intensity > 0.5) return 'bg-destructive/70';
    if (intensity > 0.25) return 'bg-destructive/45';
    return 'bg-destructive/20';
  }

  return (
    <div data-testid="incident-heatmap">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="w-10" />
              {Array.from({ length: 24 }, (_, h) => (
                <th
                  key={h}
                  className="text-center text-muted-foreground font-normal px-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, day) => (
              <tr key={day}>
                <td className="text-muted-foreground font-medium pr-1">
                  {DAYS[day]}
                </td>
                {row.map((count, hour) => (
                  <td
                    key={hour}
                    className="p-0.5"
                    title={`${DAYS[day]} ${hour}:00 — ${count} incidents`}
                  >
                    <div
                      className={`h-4 w-full rounded-sm ${cellColor(count)}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-muted" />
        <div className="h-3 w-3 rounded-sm bg-destructive/20" />
        <div className="h-3 w-3 rounded-sm bg-destructive/45" />
        <div className="h-3 w-3 rounded-sm bg-destructive/70" />
        <div className="h-3 w-3 rounded-sm bg-destructive" />
        <span>More</span>
      </div>
    </div>
  );
}
