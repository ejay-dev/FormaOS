/**
 * @jest-environment node
 *
 * Hard flow integration — the /api/activity route dispatches to the right
 * tabular formatter based on `?format=`, stamps the right Content-Type and
 * Content-Disposition, and returns a 429 when the rate limiter rejects.
 *
 * Catches regressions like: new format added to formatters.ts but forgotten
 * in the route, wrong filename stem, mime drift, rate limit bypassed.
 */

const mockRateLimitApi = jest.fn();
const mockGetActivityFeed = jest.fn();
const mockRequireNotificationContext = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...a: unknown[]) => mockRateLimitApi(...a),
}));

jest.mock('@/lib/activity/feed', () => ({
  getActivityFeed: (...a: unknown[]) => mockGetActivityFeed(...a),
}));

jest.mock('@/lib/notifications/server', () => ({
  requireNotificationContext: (...a: unknown[]) =>
    mockRequireNotificationContext(...a),
}));

import { GET } from '@/app/api/activity/route';

function makeRequest(format: string | null): Request {
  const url = format
    ? `http://localhost/api/activity?format=${encodeURIComponent(format)}`
    : 'http://localhost/api/activity';
  return new Request(url, { method: 'GET' });
}

const FEED_ITEMS = [
  {
    id: 'evt-1',
    created_at: '2026-04-18T10:00:00.000Z',
    actor_id: 'u1',
    actor_name: 'Alice Owner',
    actor_email: 'alice@example.com',
    action: 'evidence.upload',
    resource_type: 'evidence',
    resource_id: 'ev-1',
    resource_name: 'Q2 Access Review',
    metadata: { bytes: 12_340 },
  },
  {
    id: 'evt-2',
    created_at: '2026-04-18T11:15:00.000Z',
    actor_id: 'u2',
    actor_name: null,
    actor_email: null,
    action: 'task.complete',
    resource_type: 'task',
    resource_id: 't-9',
    resource_name: null,
    metadata: null,
  },
];

describe('GET /api/activity — format dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitApi.mockResolvedValue({ success: true });
    mockRequireNotificationContext.mockResolvedValue({
      orgId: 'org-123',
      userId: 'u1',
    });
    mockGetActivityFeed.mockResolvedValue({
      items: FEED_ITEMS,
      nextCursor: null,
    });
  });

  it('returns JSON (no filename) when no format is specified', async () => {
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    // No attachment disposition for the default JSON list response
    expect(res.headers.get('content-disposition')).toBeNull();
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(2);
  });

  it('CSV: correct mime + attachment filename + header row', async () => {
    const res = await GET(makeRequest('csv'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.csv"',
    );
    expect(res.headers.get('cache-control')).toBe('no-store');
    const text = await res.text();
    // Header row must contain the canonical columns we map in route.ts
    expect(text.split('\n')[0]).toBe(
      'created_at,actor_name,action,resource_type,resource_name,resource_id,metadata',
    );
    // Row 2 should have the fallback "System" actor (actor_name + email null)
    expect(text).toContain('System');
    expect(text).toContain('evidence.upload');
    expect(text).toContain('task.complete');
  });

  it('JSON format: meta envelope with title + orgId + row count', async () => {
    const res = await GET(makeRequest('json'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.json"',
    );
    const body = JSON.parse(await res.text());
    expect(body.meta.title).toBe('Activity Feed');
    expect(body.meta.count).toBe(2);
    expect(body.meta.description).toContain('org-123');
    expect(body.rows).toHaveLength(2);
    expect(body.rows[0]).toMatchObject({
      action: 'evidence.upload',
      resource_name: 'Q2 Access Review',
    });
  });

  it('NDJSON: one JSON object per line, no meta envelope', async () => {
    const res = await GET(makeRequest('ndjson'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/x-ndjson; charset=utf-8',
    );
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.ndjson"',
    );
    const text = await res.text();
    const lines = text.split('\n');
    expect(lines).toHaveLength(2);
    const parsed = lines.map((l) => JSON.parse(l));
    expect(parsed[0].action).toBe('evidence.upload');
    expect(parsed[1].action).toBe('task.complete');
  });

  it('Markdown (md): table syntax + title header', async () => {
    const res = await GET(makeRequest('md'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'text/markdown; charset=utf-8',
    );
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.md"',
    );
    const text = await res.text();
    expect(text).toContain('# Activity Feed');
    expect(text).toContain('| created_at | actor_name |');
    expect(text).toContain('| --- |');
    expect(text).toContain('evidence.upload');
    expect(text).toMatch(/_2 rows_/);
  });

  it('Markdown alias "markdown" is normalized to md', async () => {
    const res = await GET(makeRequest('markdown'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'text/markdown; charset=utf-8',
    );
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.md"',
    );
  });

  it('HTML: full branded document with table + footer', async () => {
    const res = await GET(makeRequest('html'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="activity-feed.html"',
    );
    const text = await res.text();
    expect(text.startsWith('<!doctype html>')).toBe(true);
    expect(text).toContain('<div class="brand">FormaOS</div>');
    expect(text).toContain('Activity Feed');
    expect(text).toContain('<table>');
    expect(text).toContain('Confidential');
    // XSS-safety: even if feed had raw HTML, it must be escaped. Sanity check
    // on an input we controlled: nothing unescaped should surface.
    expect(text).not.toMatch(/<script/i);
  });

  it('Unknown format falls back to JSON list (no attachment)', async () => {
    const res = await GET(makeRequest('xlsx'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(res.headers.get('content-disposition')).toBeNull();
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('Rate limiter rejection short-circuits with 429', async () => {
    mockRateLimitApi.mockResolvedValueOnce({ success: false });
    const res = await GET(makeRequest('csv'));
    expect(res.status).toBe(429);
    // Rate-limit rejections should be application/json (error envelope),
    // NOT a CSV download — otherwise an attacker could probe by format.
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(mockGetActivityFeed).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toMatch(/rate limit/i);
  });

  it('Auth context failure surfaces as 500 without leaking the feed', async () => {
    mockRequireNotificationContext.mockRejectedValueOnce(
      new Error('not authenticated'),
    );
    const res = await GET(makeRequest('csv'));
    expect(res.status).toBe(500);
    expect(mockGetActivityFeed).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe('not authenticated');
  });
});
