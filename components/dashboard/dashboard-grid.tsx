'use client';

import { WidgetRenderer } from './widget-renderer';

interface WidgetPlacement {
  widgetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

interface Props {
  widgets: WidgetPlacement[];
  widgetData: Record<string, Record<string, unknown>>;
  columns?: number;
}

export function DashboardGrid({ widgets, widgetData, columns = 8 }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Add widgets to build your dashboard
        </p>
      </div>
    );
  }

  // Compute max row from placements
  const maxRow = Math.max(...widgets.map((w) => w.y + w.h), 4);

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: '100px',
      }}
    >
      {widgets.map((w, i) => (
        <div
          key={`${w.widgetKey}-${i}`}
          style={{
            gridColumn: `${w.x + 1} / span ${w.w}`,
            gridRow: `${w.y + 1} / span ${w.h}`,
          }}
        >
          <WidgetRenderer
            widgetKey={w.widgetKey}
            data={widgetData[w.widgetKey]}
            config={w.config}
          />
        </div>
      ))}
    </div>
  );
}
