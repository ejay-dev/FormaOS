/**
 * Tabular export formatters — CSV, JSON, NDJSON, HTML, Markdown.
 *
 * Zero-dependency, pure TypeScript. Server-safe.
 * All functions are deterministic given the same input (no Date.now), so they
 * can be unit-tested and snapshot-compared.
 *
 * For binary formats (XLSX, DOCX) we deliberately do not ship implementations
 * here — those require heavyweight deps (exceljs ~3MB, docx ~1MB). Add them
 * in a separate module behind a feature flag if/when needed.
 */

export type TabularFormat = 'csv' | 'json' | 'ndjson' | 'html' | 'md';

export const TABULAR_FORMATS: readonly TabularFormat[] = [
  'csv',
  'json',
  'ndjson',
  'html',
  'md',
] as const;

export interface TabularExportMeta {
  title?: string;
  organizationName?: string;
  generatedAt?: string;
  description?: string;
}

export interface TabularExportResult {
  mimeType: string;
  extension: string;
  body: string;
}

const MIME: Record<TabularFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
  ndjson: 'application/x-ndjson; charset=utf-8',
  html: 'text/html; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
};

export function parseFormat(
  value: string | null | undefined,
  fallback: TabularFormat = 'csv',
): TabularFormat {
  if (!value) return fallback;
  const v = value.toLowerCase();
  if (v === 'markdown') return 'md';
  if (v === 'jsonl') return 'ndjson';
  return (TABULAR_FORMATS as readonly string[]).includes(v)
    ? (v as TabularFormat)
    : fallback;
}

/**
 * Parse a format string, returning null for unknown values (no fallback).
 * Use this when the caller wants to distinguish "no tabular format requested"
 * from "invalid format" — e.g., an API route that falls through to a JSON list
 * response when the client didn't ask for a tabular export.
 */
export function parseFormatOrNull(
  value: string | null | undefined,
): TabularFormat | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === 'markdown') return 'md';
  if (v === 'jsonl') return 'ndjson';
  return (TABULAR_FORMATS as readonly string[]).includes(v)
    ? (v as TabularFormat)
    : null;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mdEscape(text: string): string {
  // Pipe and newlines break Markdown tables.
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function sniffHeaders<T extends Record<string, unknown>>(rows: T[]): string[] {
  if (!rows.length) return [];
  const seen = new Set<string>();
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  return headers;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers?: string[],
): string {
  const cols = headers ?? sniffHeaders(rows);
  const lines: string[] = [cols.join(',')];
  for (const row of rows) {
    lines.push(
      cols.map((h) => csvEscape(stringifyCell(row[h]))).join(','),
    );
  }
  return lines.join('\n');
}

export function toJson<T>(rows: T[], meta?: TabularExportMeta): string {
  if (meta && (meta.title || meta.organizationName || meta.generatedAt)) {
    return JSON.stringify(
      {
        meta: {
          ...(meta.title ? { title: meta.title } : {}),
          ...(meta.organizationName
            ? { organizationName: meta.organizationName }
            : {}),
          ...(meta.description ? { description: meta.description } : {}),
          ...(meta.generatedAt ? { generatedAt: meta.generatedAt } : {}),
          count: rows.length,
        },
        rows,
      },
      null,
      2,
    );
  }
  return JSON.stringify(rows, null, 2);
}

export function toNdjson<T>(rows: T[]): string {
  return rows.map((r) => JSON.stringify(r)).join('\n');
}

export function toMarkdown<T extends Record<string, unknown>>(
  rows: T[],
  meta?: TabularExportMeta,
  headers?: string[],
): string {
  const cols = headers ?? sniffHeaders(rows);
  const lines: string[] = [];

  if (meta?.title) lines.push(`# ${meta.title}`, '');
  if (meta?.organizationName) lines.push(`**Organization:** ${meta.organizationName}`);
  if (meta?.generatedAt) lines.push(`**Generated:** ${meta.generatedAt}`);
  if (meta?.description) lines.push('', meta.description);
  if (meta?.title || meta?.organizationName || meta?.generatedAt) lines.push('');

  if (!rows.length) {
    lines.push('_No rows._');
    return lines.join('\n');
  }

  lines.push(`| ${cols.map(mdEscape).join(' | ')} |`);
  lines.push(`| ${cols.map(() => '---').join(' | ')} |`);
  for (const row of rows) {
    lines.push(
      `| ${cols.map((h) => mdEscape(stringifyCell(row[h]))).join(' | ')} |`,
    );
  }
  lines.push('', `_${rows.length} row${rows.length === 1 ? '' : 's'}_`);
  return lines.join('\n');
}

export function toHtml<T extends Record<string, unknown>>(
  rows: T[],
  meta?: TabularExportMeta,
  headers?: string[],
): string {
  const cols = headers ?? sniffHeaders(rows);
  const title = meta?.title ?? 'FormaOS Export';
  const orgLine = meta?.organizationName
    ? `<p class="meta">Organization: <strong>${htmlEscape(meta.organizationName)}</strong></p>`
    : '';
  const genLine = meta?.generatedAt
    ? `<p class="meta">Generated: ${htmlEscape(meta.generatedAt)}</p>`
    : '';
  const desc = meta?.description
    ? `<p class="description">${htmlEscape(meta.description)}</p>`
    : '';

  const thead = `<thead><tr>${cols
    .map((h) => `<th>${htmlEscape(h)}</th>`)
    .join('')}</tr></thead>`;

  const tbody = rows.length
    ? `<tbody>${rows
        .map(
          (row) =>
            `<tr>${cols
              .map((h) => `<td>${htmlEscape(stringifyCell(row[h]))}</td>`)
              .join('')}</tr>`,
        )
        .join('')}</tbody>`
    : `<tbody><tr><td colspan="${cols.length}" class="empty">No rows</td></tr></tbody>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${htmlEscape(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #ffffff; }
  header { border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 18px; }
  h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: -0.01em; }
  .brand { color: #0ea5e9; font-weight: 600; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
  .meta { margin: 2px 0; color: #475569; font-size: 12px; }
  .description { color: #334155; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
  tr:nth-child(even) td { background: #f8fafc; }
  td.empty { text-align: center; color: #94a3b8; font-style: italic; padding: 24px; }
  footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
</style>
</head>
<body>
<header>
  <div class="brand">FormaOS</div>
  <h1>${htmlEscape(title)}</h1>
  ${orgLine}
  ${genLine}
  ${desc}
</header>
<table>${thead}${tbody}</table>
<footer>${htmlEscape(`${rows.length} row${rows.length === 1 ? '' : 's'}`)} — Confidential</footer>
</body>
</html>`;
}

/**
 * One-shot dispatcher — picks the right formatter for the requested format
 * and returns everything the HTTP layer needs (mime, extension, body).
 */
export function formatTabular<T extends Record<string, unknown>>(
  rows: T[],
  format: TabularFormat,
  meta?: TabularExportMeta,
  headers?: string[],
): TabularExportResult {
  switch (format) {
    case 'csv':
      return { mimeType: MIME.csv, extension: 'csv', body: toCsv(rows, headers) };
    case 'json':
      return { mimeType: MIME.json, extension: 'json', body: toJson(rows, meta) };
    case 'ndjson':
      return {
        mimeType: MIME.ndjson,
        extension: 'ndjson',
        body: toNdjson(rows),
      };
    case 'md':
      return {
        mimeType: MIME.md,
        extension: 'md',
        body: toMarkdown(rows, meta, headers),
      };
    case 'html':
      return {
        mimeType: MIME.html,
        extension: 'html',
        body: toHtml(rows, meta, headers),
      };
  }
}

export function attachmentHeaders(
  filenameStem: string,
  result: TabularExportResult,
): Record<string, string> {
  const safeStem = filenameStem.replace(/[^a-zA-Z0-9._-]/g, '_');
  return {
    'Content-Type': result.mimeType,
    'Content-Disposition': `attachment; filename="${safeStem}.${result.extension}"`,
    'Cache-Control': 'no-store',
  };
}
