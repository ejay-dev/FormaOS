/**
 * Tests for lib/reports/csv-generator.ts
 * Covers: generateCSV, flattenWidgetToSection.
 */

import {
  generateCSV,
  flattenWidgetToSection,
} from '@/lib/reports/csv-generator';

describe('generateCSV', () => {
  it('generates single-section CSV with default delimiter', () => {
    const csv = generateCSV([
      {
        title: 'Users',
        columns: ['Name', 'Email'],
        rows: [
          ['Alice', 'alice@test.com'],
          ['Bob', 'bob@test.com'],
        ],
      },
    ]);
    expect(csv).toContain('# Users');
    expect(csv).toContain('Name,Email');
    expect(csv).toContain('Alice,alice@test.com');
    expect(csv).toContain('Bob,bob@test.com');
  });

  it('supports custom delimiter', () => {
    const csv = generateCSV(
      [{ title: 'T', columns: ['A', 'B'], rows: [['1', '2']] }],
      { delimiter: '\t' },
    );
    expect(csv).toContain('A\tB');
    expect(csv).toContain('1\t2');
  });

  it('escapes values containing delimiter', () => {
    const csv = generateCSV([
      { title: 'T', columns: ['Col'], rows: [['has, comma']] },
    ]);
    expect(csv).toContain('"has, comma"');
  });

  it('escapes values with double quotes', () => {
    const csv = generateCSV([
      { title: 'T', columns: ['Col'], rows: [['say "hello"']] },
    ]);
    expect(csv).toContain('"say ""hello"""');
  });

  it('escapes values with newlines', () => {
    const csv = generateCSV([
      { title: 'T', columns: ['Col'], rows: [['line1\nline2']] },
    ]);
    expect(csv).toContain('"line1\nline2"');
  });

  it('separates multiple sections with blank lines', () => {
    const csv = generateCSV([
      { title: 'A', columns: ['X'], rows: [['1']] },
      { title: 'B', columns: ['Y'], rows: [['2']] },
    ]);
    expect(csv).toContain('# A');
    expect(csv).toContain('# B');
    // Blank line between sections
    expect(csv).toContain('\n\n');
  });
});

describe('flattenWidgetToSection', () => {
  it('flattens table widget', () => {
    const result = flattenWidgetToSection({
      label: 'Table Widget',
      type: 'table',
      columns: ['A', 'B'],
      rows: [['1', '2']],
    });
    expect(result).toEqual({
      title: 'Table Widget',
      columns: ['A', 'B'],
      rows: [['1', '2']],
    });
  });

  it('flattens bar_chart widget', () => {
    const result = flattenWidgetToSection({
      label: 'Bar Chart',
      type: 'bar_chart',
      data: [
        { label: 'Q1', value: 100 },
        { label: 'Q2', value: 200 },
      ],
    });
    expect(result).toEqual({
      title: 'Bar Chart',
      columns: ['Label', 'Value'],
      rows: [
        ['Q1', 100],
        ['Q2', 200],
      ],
    });
  });

  it('flattens pie_chart widget', () => {
    const result = flattenWidgetToSection({
      label: 'Pie',
      type: 'pie_chart',
      data: [{ label: 'Slice', value: 50 }],
    });
    expect(result?.columns).toEqual(['Label', 'Value']);
  });

  it('flattens line_chart widget', () => {
    const result = flattenWidgetToSection({
      label: 'Line',
      type: 'line_chart',
      data: [{ date: '2024-01-01', value: 10 }],
    });
    expect(result?.columns).toEqual(['Date', 'Value']);
    expect(result?.rows[0]).toEqual(['2024-01-01', 10]);
  });

  it('flattens kpi widget', () => {
    const result = flattenWidgetToSection({
      label: 'KPI Widget',
      type: 'kpi',
      value: 42,
      change: 5,
      trend: 'up',
    } as any);
    expect(result?.columns).toEqual(['Metric', 'Value', 'Change', 'Trend']);
  });

  it('returns null for unknown widget type', () => {
    const result = flattenWidgetToSection({
      label: 'Unknown',
      type: 'sparkline',
    });
    expect(result).toBeNull();
  });
});
