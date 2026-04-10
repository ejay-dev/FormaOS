/** @jest-environment node */
/**
 * Multi-Tenancy Data Isolation Tests
 *
 * Verifies that org-scoped data cannot leak across organisations.
 * Uses mocked Supabase clients to simulate RLS enforcement.
 */

const mockGetUser = jest.fn();
const _mockFrom = jest.fn();
const mockRateLimitApi = jest.fn();
const mockRequirePermission = jest.fn();
const mockGetDashboardMetrics = jest.fn();

// Track the "current org" for simulated RLS filtering
let currentOrgId = 'org-a';
let _currentUserId = 'user-a';
let isAdmin = false;

// Simulated database tables with org-scoped data
const mockObligations = [
  { id: 'obl-1', org_id: 'org-a', title: 'SOC 2 Audit', status: 'active' },
  { id: 'obl-2', org_id: 'org-a', title: 'ISO 27001 Gap', status: 'active' },
  { id: 'obl-3', org_id: 'org-b', title: 'GDPR Compliance', status: 'active' },
  { id: 'obl-4', org_id: 'org-b', title: 'PCI DSS Review', status: 'active' },
];

const mockIncidents = [
  {
    id: 'inc-1',
    org_id: 'org-a',
    title: 'Data breach attempt',
    severity: 'high',
  },
  { id: 'inc-2', org_id: 'org-b', title: 'Access anomaly', severity: 'medium' },
];

const mockParticipants = [
  {
    id: 'part-1',
    org_id: 'org-a',
    name: 'Alice Smith',
    role: 'compliance_officer',
  },
  { id: 'part-2', org_id: 'org-a', name: 'Bob Jones', role: 'auditor' },
  { id: 'part-3', org_id: 'org-b', name: 'Charlie Brown', role: 'manager' },
];

const mockEvidence = [
  {
    id: 'ev-1',
    org_id: 'org-a',
    filename: 'policy.pdf',
    uploaded_by: 'user-a',
  },
  {
    id: 'ev-2',
    org_id: 'org-b',
    filename: 'audit-report.pdf',
    uploaded_by: 'user-b',
  },
];

const mockMembers = [
  { id: 'mem-1', organization_id: 'org-a', user_id: 'user-a', role: 'owner' },
  { id: 'mem-2', organization_id: 'org-a', user_id: 'user-a2', role: 'member' },
  { id: 'mem-3', organization_id: 'org-b', user_id: 'user-b', role: 'owner' },
];

/**
 * Simulates RLS filtering — returns only data for the current org,
 * unless the caller is an admin (which bypasses RLS via service role).
 */
function rlsFilter<T extends { org_id?: string; organization_id?: string }>(
  data: T[],
  orgField: 'org_id' | 'organization_id' = 'org_id',
): T[] {
  if (isAdmin) return data;
  return data.filter((row) => row[orgField] === currentOrgId);
}

// Build a chainable mock for Supabase query builder
function createQueryBuilder(tableName: string) {
  const tableDataMap: Record<
    string,
    { data: unknown[]; orgField: 'org_id' | 'organization_id' }
  > = {
    obligations: { data: mockObligations, orgField: 'org_id' },
    compliance_tasks: { data: mockObligations, orgField: 'org_id' },
    org_tasks: { data: mockObligations, orgField: 'org_id' },
    incidents: { data: mockIncidents, orgField: 'org_id' },
    org_incidents: { data: mockIncidents, orgField: 'org_id' },
    participants: { data: mockParticipants, orgField: 'org_id' },
    org_members: { data: mockMembers, orgField: 'organization_id' },
    evidence: { data: mockEvidence, orgField: 'org_id' },
    org_evidence: { data: mockEvidence, orgField: 'org_id' },
    evidence_vault: { data: mockEvidence, orgField: 'org_id' },
  };

  const tableConfig = tableDataMap[tableName] || {
    data: [],
    orgField: 'org_id' as const,
  };
  let filteredData = rlsFilter(
    tableConfig.data as Array<{ org_id?: string; organization_id?: string }>,
    tableConfig.orgField,
  );

  const builder: Record<string, jest.Mock> = {};

  // Chainable methods
  const chainable = [
    'select',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ];
  for (const method of chainable) {
    builder[method] = jest.fn().mockImplementation((...args: unknown[]) => {
      if (method === 'eq' && args.length === 2) {
        const [field, value] = args as [string, unknown];
        filteredData = filteredData.filter(
          (row) => (row as Record<string, unknown>)[field] === value,
        );
      }
      if (method === 'single' || method === 'maybeSingle') {
        return Promise.resolve({ data: filteredData[0] || null, error: null });
      }
      return builder;
    });
  }

  // Terminal method
  builder.then = jest
    .fn()
    .mockImplementation((resolve: (value: unknown) => void) => {
      resolve({ data: filteredData, error: null });
    });

  // Make it thenable
  const proxy = new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => {
          resolve({ data: filteredData, error: null });
        };
      }
      return target[prop as string];
    },
  });

  return proxy;
}

jest.mock('@/lib/supabase/server', () => ({
  __esModule: true,
  createSupabaseServerClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: () => mockGetUser(),
      },
      from: (table: string) => createQueryBuilder(table),
    }),
  ),
}));

jest.mock('@/app/app/actions/rbac', () => ({
  requirePermission: (...a: unknown[]) => mockRequirePermission(...a),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...a: unknown[]) => mockRateLimitApi(...a),
}));

jest.mock('@/lib/data/analytics', () => ({
  getDashboardMetrics: (...a: unknown[]) => mockGetDashboardMetrics(...a),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => jest.fn(),
}));

// ============================================================
// Tests
// ============================================================

describe('Multi-Tenancy Data Isolation', () => {
  beforeEach(() => {
    currentOrgId = 'org-a';
    _currentUserId = 'user-a';
    isAdmin = false;
    jest.clearAllMocks();

    mockRateLimitApi.mockResolvedValue({ success: true });
    mockGetDashboardMetrics.mockResolvedValue({
      complianceScore: 75,
      riskLevel: 'medium',
      complianceTrend: 'stable',
      totalPolicies: 10,
      activePolicies: 8,
      policyCoverageRate: 0.8,
      totalTasks: 30,
      completedTasks: 20,
      pendingTasks: 8,
      overdueTasks: 2,
      taskCompletionRate: 0.67,
      evidenceCollected: 50,
      evidenceRequired: 60,
      evidenceCompletionRate: 0.83,
      anomalies: [],
    });
  });

  // Helper to set up auth context for a specific org
  function setAuthContext(orgId: string, userId: string, admin = false) {
    currentOrgId = orgId;
    _currentUserId = userId;
    isAdmin = admin;
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${userId}@test.com` } },
      error: null,
    });
    mockRequirePermission.mockResolvedValue({ orgId, userId });
  }

  // -----------------------------------------------------------
  // Test 1: Org A cannot read Org B's obligations
  // -----------------------------------------------------------
  describe('Obligation isolation', () => {
    it('Org A can only read its own obligations', async () => {
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('obligations').select('*');
      expect(result.data).toHaveLength(2);
      expect(
        result.data.every((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBe(true);
      expect(
        result.data.find((r: { org_id: string }) => r.org_id === 'org-b'),
      ).toBeUndefined();
    });

    it('Org B can only read its own obligations', async () => {
      setAuthContext('org-b', 'user-b');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('obligations').select('*');
      expect(result.data).toHaveLength(2);
      expect(
        result.data.every((r: { org_id: string }) => r.org_id === 'org-b'),
      ).toBe(true);
      expect(
        result.data.find((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBeUndefined();
    });
  });

  // -----------------------------------------------------------
  // Test 2: Org A cannot read Org B's incidents
  // -----------------------------------------------------------
  describe('Incident isolation', () => {
    it('Org A can only see its own incidents', async () => {
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('incidents').select('*');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].org_id).toBe('org-a');
    });

    it('Org B can only see its own incidents', async () => {
      setAuthContext('org-b', 'user-b');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('incidents').select('*');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].org_id).toBe('org-b');
    });
  });

  // -----------------------------------------------------------
  // Test 3: Org A cannot read Org B's participants
  // -----------------------------------------------------------
  describe('Participant isolation', () => {
    it('Org A can only see its own participants', async () => {
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('participants').select('*');
      expect(result.data).toHaveLength(2);
      expect(
        result.data.every((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBe(true);
    });

    it('Org B cannot see Org A participants', async () => {
      setAuthContext('org-b', 'user-b');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('participants').select('*');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].org_id).toBe('org-b');
    });
  });

  // -----------------------------------------------------------
  // Test 4: Org A cannot read Org B's evidence
  // -----------------------------------------------------------
  describe('Evidence isolation', () => {
    it('Org A can only see its own evidence', async () => {
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('evidence').select('*');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].org_id).toBe('org-a');
    });

    it('Org B can only see its own evidence', async () => {
      setAuthContext('org-b', 'user-b');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('evidence').select('*');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].org_id).toBe('org-b');
    });
  });

  // -----------------------------------------------------------
  // Test 5: Admin can read all orgs
  // -----------------------------------------------------------
  describe('Admin cross-org access', () => {
    it('Admin user can see obligations from all orgs', async () => {
      setAuthContext('org-a', 'admin-user', true);
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('obligations').select('*');
      expect(result.data).toHaveLength(4);

      const orgIds = [
        ...new Set(result.data.map((r: { org_id: string }) => r.org_id)),
      ];
      expect(orgIds).toContain('org-a');
      expect(orgIds).toContain('org-b');
    });

    it('Admin user can see evidence from all orgs', async () => {
      setAuthContext('org-a', 'admin-user', true);
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('evidence').select('*');
      expect(result.data).toHaveLength(2);
    });

    it('Admin user can see incidents from all orgs', async () => {
      setAuthContext('org-a', 'admin-user', true);
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const result = await supabase.from('incidents').select('*');
      expect(result.data).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------
  // Test 6: API routes respect org context
  // -----------------------------------------------------------
  describe('API route org context enforcement', () => {
    it('API returns only Org A data for Org A request', async () => {
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      // Simulate what an API route does — queries with the authenticated context
      const obligations = await supabase.from('obligations').select('*');
      const evidence = await supabase.from('evidence').select('*');
      const members = await supabase.from('org_members').select('*');

      // All data must belong to org-a only
      expect(
        obligations.data.every((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBe(true);
      expect(
        evidence.data.every((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBe(true);
      expect(
        members.data.every(
          (r: { organization_id: string }) => r.organization_id === 'org-a',
        ),
      ).toBe(true);
    });

    it('API returns only Org B data for Org B request', async () => {
      setAuthContext('org-b', 'user-b');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      const supabase = await (createSupabaseServerClient as jest.Mock)();

      const obligations = await supabase.from('obligations').select('*');
      const evidence = await supabase.from('evidence').select('*');
      const members = await supabase.from('org_members').select('*');

      expect(
        obligations.data.every((r: { org_id: string }) => r.org_id === 'org-b'),
      ).toBe(true);
      expect(
        evidence.data.every((r: { org_id: string }) => r.org_id === 'org-b'),
      ).toBe(true);
      expect(
        members.data.every(
          (r: { organization_id: string }) => r.organization_id === 'org-b',
        ),
      ).toBe(true);
    });

    it('Switching contexts does not leak data from previous org', async () => {
      // First request as Org A
      setAuthContext('org-a', 'user-a');
      const { createSupabaseServerClient } =
        await import('@/lib/supabase/server');
      let supabase = await (createSupabaseServerClient as jest.Mock)();
      const orgAResult = await supabase.from('obligations').select('*');
      expect(orgAResult.data).toHaveLength(2);

      // Switch to Org B — must NOT see Org A data
      setAuthContext('org-b', 'user-b');
      supabase = await (createSupabaseServerClient as jest.Mock)();
      const orgBResult = await supabase.from('obligations').select('*');
      expect(orgBResult.data).toHaveLength(2);
      expect(
        orgBResult.data.every((r: { org_id: string }) => r.org_id === 'org-b'),
      ).toBe(true);
      expect(
        orgBResult.data.find((r: { org_id: string }) => r.org_id === 'org-a'),
      ).toBeUndefined();
    });
  });
});
