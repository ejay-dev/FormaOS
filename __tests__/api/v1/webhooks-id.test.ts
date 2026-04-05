/** @jest-environment node */
/**
 * Tests for app/api/v1/webhooks/[id]/route.ts
 * GET, PATCH, DELETE webhook endpoints
 */

// ── helpers ──────────────────────────────────────────────
function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

// ── mocks ────────────────────────────────────────────────
jest.mock('server-only', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockRateLimitApi = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...args: any[]) => mockRateLimitApi(...args),
}));

jest.mock('@/lib/supabase/server', () => {
  const c = {
    from: jest.fn(() => createBuilder()),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: { user: { id: 'u1', email: 'test@t.com' } },
        }),
    },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
function getServerClient() {
  return require('@/lib/supabase/server').__client;
}

const mockRequirePermission = jest
  .fn()
  .mockResolvedValue({ orgId: 'org1', userId: 'u1' });
jest.mock('@/app/app/actions/rbac', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

const mockGetRelayWebhook = jest.fn();
const mockUpdateRelayWebhook = jest.fn();
const mockDeleteRelayWebhook = jest.fn();
const mockGetRelayDeliveries = jest.fn();
const mockSanitizeWebhookForResponse = jest.fn((w: any) => w);
const mockIsValidWebhookUrl = jest.fn().mockResolvedValue(true);
const mockValidateRelayEvents = jest.fn().mockReturnValue([]);

jest.mock('@/lib/integrations/webhook-relay', () => ({
  getRelayWebhook: (...args: any[]) => mockGetRelayWebhook(...args),
  updateRelayWebhook: (...args: any[]) => mockUpdateRelayWebhook(...args),
  deleteRelayWebhook: (...args: any[]) => mockDeleteRelayWebhook(...args),
  getRelayDeliveries: (...args: any[]) => mockGetRelayDeliveries(...args),
  sanitizeWebhookForResponse: (...args: any[]) =>
    mockSanitizeWebhookForResponse(...args),
  isValidWebhookUrl: (...args: any[]) => mockIsValidWebhookUrl(...args),
  validateRelayEvents: (...args: any[]) => mockValidateRelayEvents(...args),
}));

// ── imports ─────────────────────────────────────────────
import { GET, PATCH, DELETE } from '@/app/api/v1/webhooks/[id]/route';

// ── helpers ─────────────────────────────────────────────
function makeRequest(method: string, body?: any, query?: string) {
  const url = `http://localhost:3000/api/v1/webhooks/wh1${query ? `?${query}` : ''}`;
  const opts: RequestInit = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(url, opts);
}

function makeContext(id = 'wh1') {
  return { params: Promise.resolve({ id }) };
}

const sampleWebhook = {
  id: 'wh1',
  organization_id: 'org1',
  name: 'Test Webhook',
  url: 'https://example.com/hook',
  events: ['control.created'],
  enabled: true,
};

// ── suite ───────────────────────────────────────────────
describe('API v1 /webhooks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitApi.mockResolvedValue({ success: true });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1', userId: 'u1' });
    getServerClient().auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockGetRelayWebhook.mockResolvedValue(sampleWebhook);
    mockSanitizeWebhookForResponse.mockImplementation((w: any) => w);
  });

  // ── GET ──
  describe('GET', () => {
    it('returns webhook details', async () => {
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.webhook).toBeDefined();
    });

    it('returns 429 when rate limited', async () => {
      mockRateLimitApi.mockResolvedValue({ success: false, resetAt: 1234 });
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(429);
    });

    it('returns 401 when no user', async () => {
      getServerClient().auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(401);
    });

    it('returns 403 when no permission', async () => {
      mockRequirePermission.mockResolvedValue(null);
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(403);
    });

    it('returns 404 when webhook not found', async () => {
      mockGetRelayWebhook.mockResolvedValue(null);
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(404);
    });

    it('returns 403 for different org webhook', async () => {
      mockGetRelayWebhook.mockResolvedValue({
        ...sampleWebhook,
        organization_id: 'other-org',
      });
      const res = await GET(makeRequest('GET'), makeContext());
      expect(res.status).toBe(403);
    });

    it('includes deliveries when requested', async () => {
      mockGetRelayDeliveries.mockResolvedValue([{ id: 'd1' }]);
      const res = await GET(
        makeRequest(
          'GET',
          undefined,
          'include_deliveries=true&delivery_limit=5',
        ),
        makeContext(),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deliveries).toBeDefined();
    });
  });

  // ── PATCH ──
  describe('PATCH', () => {
    it('updates webhook successfully', async () => {
      mockUpdateRelayWebhook.mockResolvedValue({
        ...sampleWebhook,
        name: 'Updated',
      });
      const res = await PATCH(
        makeRequest('PATCH', { name: 'Updated' }),
        makeContext(),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('updated');
    });

    it('returns 429 when rate limited', async () => {
      mockRateLimitApi.mockResolvedValue({ success: false, resetAt: 1234 });
      const res = await PATCH(
        makeRequest('PATCH', { name: 'x' }),
        makeContext(),
      );
      expect(res.status).toBe(429);
    });

    it('returns 401 when no user', async () => {
      getServerClient().auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      const res = await PATCH(
        makeRequest('PATCH', { name: 'x' }),
        makeContext(),
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 when no permission', async () => {
      mockRequirePermission.mockResolvedValue(null);
      const res = await PATCH(
        makeRequest('PATCH', { name: 'x' }),
        makeContext(),
      );
      expect(res.status).toBe(403);
    });

    it('returns 404 when webhook not found', async () => {
      mockGetRelayWebhook.mockResolvedValue(null);
      const res = await PATCH(
        makeRequest('PATCH', { name: 'x' }),
        makeContext(),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid webhook URL', async () => {
      mockIsValidWebhookUrl.mockResolvedValue(false);
      const res = await PATCH(
        makeRequest('PATCH', { url: 'http://bad' }),
        makeContext(),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty events array', async () => {
      const res = await PATCH(
        makeRequest('PATCH', { events: [] }),
        makeContext(),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid event types', async () => {
      mockValidateRelayEvents.mockReturnValue(['invalid.event']);
      const res = await PATCH(
        makeRequest('PATCH', { events: ['invalid.event'] }),
        makeContext(),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid provider', async () => {
      const res = await PATCH(
        makeRequest('PATCH', { provider: 'invalid' }),
        makeContext(),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty name', async () => {
      const res = await PATCH(
        makeRequest('PATCH', { name: '' }),
        makeContext(),
      );
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE ──
  describe('DELETE', () => {
    it('deletes webhook successfully', async () => {
      mockDeleteRelayWebhook.mockResolvedValue(undefined);
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('deleted');
    });

    it('returns 429 when rate limited', async () => {
      mockRateLimitApi.mockResolvedValue({ success: false, resetAt: 1234 });
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(429);
    });

    it('returns 401 when no user', async () => {
      getServerClient().auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(401);
    });

    it('returns 403 when no permission', async () => {
      mockRequirePermission.mockResolvedValue(null);
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(403);
    });

    it('returns 404 when webhook not found', async () => {
      mockGetRelayWebhook.mockResolvedValue(null);
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(404);
    });

    it('returns 403 for different org webhook', async () => {
      mockGetRelayWebhook.mockResolvedValue({
        ...sampleWebhook,
        organization_id: 'other-org',
      });
      const res = await DELETE(makeRequest('DELETE'), makeContext());
      expect(res.status).toBe(403);
    });
  });
});
