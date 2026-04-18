import {
  formatTabular,
  parseFormat,
  toCsv,
  toJson,
  toMarkdown,
  toHtml,
  toNdjson,
  attachmentHeaders,
  TABULAR_FORMATS,
} from '@/lib/exports/formatters';

const rows = [
  { id: '1', name: 'Alice, PhD', score: 92, active: true },
  { id: '2', name: 'Bob "the Builder"', score: 71, active: false },
  { id: '3', name: 'Line\nBreak', score: 0, active: null },
];

describe('parseFormat', () => {
  it('falls back when input is null / unknown', () => {
    expect(parseFormat(null)).toBe('csv');
    expect(parseFormat('xml')).toBe('csv');
    expect(parseFormat(undefined, 'json')).toBe('json');
  });

  it('accepts aliases', () => {
    expect(parseFormat('markdown')).toBe('md');
    expect(parseFormat('jsonl')).toBe('ndjson');
    expect(parseFormat('HTML')).toBe('html');
  });

  it('every advertised format parses back to itself', () => {
    for (const f of TABULAR_FORMATS) {
      expect(parseFormat(f)).toBe(f);
    }
  });
});

describe('toCsv', () => {
  it('escapes quotes, commas, and newlines', () => {
    const csv = toCsv(rows);
    expect(csv).toBe(
      [
        'id,name,score,active',
        '1,"Alice, PhD",92,true',
        '2,"Bob ""the Builder""",71,false',
        '3,"Line\nBreak",0,',
      ].join('\n'),
    );
  });

  it('returns just headers for empty input when headers are provided', () => {
    expect(toCsv([], ['a', 'b'])).toBe('a,b');
  });

  it('returns empty string for empty rows with no headers', () => {
    expect(toCsv([])).toBe('');
  });
});

describe('toJson', () => {
  it('returns array without meta envelope when meta is empty', () => {
    const out = JSON.parse(toJson(rows));
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(3);
  });

  it('wraps with meta when title/org/generatedAt are set', () => {
    const out = JSON.parse(
      toJson(rows, {
        title: 'Staff Credentials',
        organizationName: 'Acme Care',
        generatedAt: '2026-04-18T00:00:00Z',
      }),
    );
    expect(out.meta.title).toBe('Staff Credentials');
    expect(out.meta.organizationName).toBe('Acme Care');
    expect(out.meta.count).toBe(3);
    expect(out.rows).toHaveLength(3);
  });
});

describe('toNdjson', () => {
  it('produces one JSON object per line', () => {
    const nd = toNdjson(rows);
    const lines = nd.split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]).id).toBe('1');
  });
});

describe('toMarkdown', () => {
  it('renders a pipe table with header separator', () => {
    const md = toMarkdown(rows, { title: 'Report' });
    expect(md).toContain('# Report');
    expect(md).toContain('| id | name | score | active |');
    expect(md).toMatch(/\| --- \| --- \| --- \| --- \|/);
    // pipe inside a cell would've broken the table — we escape it
    const escaped = toMarkdown([{ s: 'a|b' }]);
    expect(escaped).toContain('a\\|b');
  });

  it('handles empty rows gracefully', () => {
    expect(toMarkdown([])).toContain('_No rows._');
  });
});

describe('toHtml', () => {
  it('escapes HTML special chars in values', () => {
    const html = toHtml([{ name: '<script>alert(1)</script>' }]);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('includes FormaOS branding + metadata', () => {
    const html = toHtml(rows, {
      title: 'Incidents',
      organizationName: 'Acme',
      generatedAt: '2026-04-18',
    });
    expect(html).toContain('FormaOS');
    expect(html).toContain('Incidents');
    expect(html).toContain('Acme');
    expect(html).toContain('2026-04-18');
    expect(html).toContain('<table>');
  });

  it('shows empty state when there are no rows', () => {
    const html = toHtml([], { title: 'Nothing' }, ['a', 'b']);
    expect(html).toContain('No rows');
    expect(html).toContain('colspan="2"');
  });
});

describe('formatTabular dispatcher', () => {
  it('returns correct mime + extension per format', () => {
    expect(formatTabular(rows, 'csv')).toMatchObject({
      mimeType: 'text/csv; charset=utf-8',
      extension: 'csv',
    });
    expect(formatTabular(rows, 'json')).toMatchObject({
      mimeType: 'application/json; charset=utf-8',
      extension: 'json',
    });
    expect(formatTabular(rows, 'ndjson')).toMatchObject({
      mimeType: 'application/x-ndjson; charset=utf-8',
      extension: 'ndjson',
    });
    expect(formatTabular(rows, 'md')).toMatchObject({
      mimeType: 'text/markdown; charset=utf-8',
      extension: 'md',
    });
    expect(formatTabular(rows, 'html')).toMatchObject({
      mimeType: 'text/html; charset=utf-8',
      extension: 'html',
    });
  });
});

describe('attachmentHeaders', () => {
  it('sanitizes filename stem and uses format extension', () => {
    const headers = attachmentHeaders(
      'incidents export/2026',
      formatTabular(rows, 'json'),
    );
    expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(headers['Content-Disposition']).toBe(
      'attachment; filename="incidents_export_2026.json"',
    );
    expect(headers['Cache-Control']).toBe('no-store');
  });
});
