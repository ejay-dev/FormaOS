/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/admin/releases route and [releaseId] route
 * Targets uncovered branches in GET/POST (releases/route.ts) and GET/PATCH (releases/[releaseId]/route.ts)
 */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn(),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  extractAdminReason: jest.fn(() => 'test reason'),
  handleAdminError: jest.fn((err: any) => {
    const { NextResponse } = jest.requireActual('next/server');
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status },
    );
  }),
  ADMIN_CACHE_HEADERS: { 'Cache-Control': 'no-store' },
  parseAdminMutationPayload: jest.fn(),
  requireAdminChangeControl: jest.fn(async () => 'approved'),
}));

jest.mock('@/lib/admin/audit', () => ({
  logAdminAction: jest.fn(),
}));

jest.mock('@/lib/release/service', () => ({
  invalidateReleaseCache: jest.fn(),
}));

jest.mock('@/config/release', () => ({
  isValidVersionCode: jest.fn((v: string) => /^\d+\.\d+\.\d+$/.test(v)),
}));

jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: jest.fn(() => null),
}));

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { parseAdminMutationPayload } from '@/app/api/admin/_helpers';

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
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

// ──── List route (GET/POST) ────
describe('GET /api/admin/releases', () => {
  let GET: any;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/admin/releases/route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdminAccess as jest.Mock).mockResolvedValue({
      user: { id: 'admin1' },
    });
  });

  it('returns releases list', async () => {
    const builder = createBuilder({
      data: [{ id: 'r1', version_code: '1.0.0' }],
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const res = await GET();
    const body = await res.json();
    expect(body.releases.length).toBe(1);
  });

  it('returns empty when error', async () => {
    const builder = createBuilder({ data: null, error: { message: 'fail' } });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const res = await GET();
    const body = await res.json();
    expect(body.releases).toEqual([]);
  });
});

describe('POST /api/admin/releases', () => {
  let POST: any;

  beforeAll(async () => {
    ({ POST } = await import('@/app/api/admin/releases/route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdminAccess as jest.Mock).mockResolvedValue({
      user: { id: 'admin1' },
    });
  });

  it('creates a new release', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { version_code: '2.0.0', release_name: 'Major Release' },
    });
    const builder = createBuilder({
      data: { id: 'r-new', version_code: '2.0.0' },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.release.id).toBe('r-new');
  });

  it('rejects invalid version code', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { version_code: 'bad', release_name: 'Bad' },
    });

    const req = new Request('http://localhost/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing release_name', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { version_code: '1.0.0', release_name: '' },
    });

    const req = new Request('http://localhost/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate version', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { version_code: '1.0.0', release_name: 'Dup' },
    });
    const builder = createBuilder({
      data: null,
      error: { message: 'unique constraint', code: '23505' },
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

// ──── Detail route (GET/PATCH) ────
describe('GET /api/admin/releases/[releaseId]', () => {
  let GET: any;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/admin/releases/[releaseId]/route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdminAccess as jest.Mock).mockResolvedValue({
      user: { id: 'admin1' },
    });
  });

  it('returns a single release', async () => {
    const builder = createBuilder({
      data: { id: 'r1', version_code: '1.0.0' },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/r1');
    const res = await GET(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    const body = await res.json();
    expect(body.release.id).toBe('r1');
  });

  it('returns 404 when not found', async () => {
    const builder = createBuilder({ data: null, error: null });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/bad');
    const res = await GET(req, {
      params: Promise.resolve({ releaseId: 'bad' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/releases/[releaseId]', () => {
  let PATCH: any;

  beforeAll(async () => {
    ({ PATCH } = await import('@/app/api/admin/releases/[releaseId]/route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdminAccess as jest.Mock).mockResolvedValue({
      user: { id: 'admin1' },
    });
  });

  it('transitions draft to stable', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { release_status: 'stable' },
    });
    const builder = createBuilder({
      data: { id: 'r1', release_status: 'draft', is_locked: false },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/r1', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    const body = await res.json();
    expect(body.release).toBeDefined();
  });

  it('rejects invalid transition archived → draft', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { release_status: 'draft' },
    });
    // First call: fetch current (archived)
    let callNum = 0;
    const fromFn = jest.fn(() => {
      callNum++;
      if (callNum === 1) {
        return createBuilder({
          data: { id: 'r1', release_status: 'archived', is_locked: false },
          error: null,
        });
      }
      return createBuilder({ data: null, error: null });
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({ from: fromFn });

    const req = new Request('http://localhost/api/admin/releases/r1', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    expect(res.status).toBe(400);
  });

  it('blocks edits on locked release', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { release_notes: 'Updated notes' },
    });
    const builder = createBuilder({
      data: { id: 'r1', release_status: 'stable', is_locked: true },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/r1', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    expect(res.status).toBe(403);
  });

  it('allows unlock on locked release', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { is_locked: false },
    });
    const builder = createBuilder({
      data: { id: 'r1', release_status: 'stable', is_locked: true },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/r1', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    const body = await res.json();
    expect(body.release).toBeDefined();
  });

  it('returns 404 when release not found', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: { release_notes: 'Nope' },
    });
    const builder = createBuilder({ data: null, error: null });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/bad', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'bad' }),
    });
    expect(res.status).toBe(404);
  });

  it('updates field-level properties', async () => {
    (parseAdminMutationPayload as jest.Mock).mockResolvedValue({
      payload: {
        release_notes: 'New notes',
        feature_flags: { dark_mode: true },
        schema_version: '2',
        ui_version: '3.1',
        compatibility_min_version: '1.0.0',
      },
    });
    const builder = createBuilder({
      data: { id: 'r1', release_status: 'draft', is_locked: false },
      error: null,
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({
      from: () => builder,
    });

    const req = new Request('http://localhost/api/admin/releases/r1', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ releaseId: 'r1' }),
    });
    const body = await res.json();
    expect(body.release).toBeDefined();
  });
});
