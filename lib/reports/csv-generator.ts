/**
 * CSV Report Generator
 */

interface Section {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export function generateCSV(
  sections: Section[],
  options: { delimiter?: string; dateFormat?: string } = {},
): string {
  const delim = options.delimiter ?? ',';
  const lines: string[] = [];

  for (const section of sections) {
    lines.push(`# ${section.title}`);
    lines.push(section.columns.map((c) => escapeCSV(c, delim)).join(delim));
    for (const row of section.rows) {
      lines.push(row.map((cell) => escapeCSV(String(cell), delim)).join(delim));
    }
    lines.push(''); // blank line between sections
  }

  return lines.join('\n');
}

function escapeCSV(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function flattenWidgetToSection(widget: {
  label: string;
  type: string;
  data?: unknown;
  columns?: string[];
  rows?: unknown[][];
}): Section | null {
  if (widget.type === 'table' && widget.columns && widget.rows) {
    return {
      title: widget.label,
      columns: widget.columns,
      rows: widget.rows as (string | number)[][],
    };
  }

  if (
    (widget.type === 'bar_chart' || widget.type === 'pie_chart') &&
    Array.isArray(widget.data)
  ) {
    return {
      title: widget.label,
      columns: ['Label', 'Value'],
      rows: (widget.data as { label: string; value: number }[]).map((d) => [
        d.label,
        d.value,
      ]),
    };
  }

  if (widget.type === 'line_chart' && Array.isArray(widget.data)) {
    return {
      title: widget.label,
      columns: ['Date', 'Value'],
      rows: (widget.data as { date: string; value: number }[]).map((d) => [
        d.date,
        d.value,
      ]),
    };
  }

  if (widget.type === 'kpi') {
    const w = widget as unknown as {
      label: string;
      value: number;
      change: number;
      trend: string;
    };
    return {
      title: widget.label,
      columns: ['Metric', 'Value', 'Change', 'Trend'],
      rows: [[w.label, w.value, w.change, w.trend]],
    };
  }

  return null;
}
