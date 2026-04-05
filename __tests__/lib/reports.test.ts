/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Supabase builder helper                                           */
/* ------------------------------------------------------------------ */
function createBuilder(
  result: { data?: any; error?: any } = { data: null, error: null },
) {
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

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
jest.mock('server-only', () => ({}));

jest.mock('@/lib/analytics', () => ({
  getComplianceMetrics: jest.fn().mockResolvedValue({
    totalCertificates: 10,
    activeCertificates: 8,
    expiringSoon: 1,
    expiredCertificates: 1,
    completionRate: 85,
  }),
  getTeamMetrics: jest.fn().mockResolvedValue({
    totalMembers: 5,
    activeMembers: 4,
    topPerformers: [
      { email: 'alice@test.com', completedTasks: 5, complianceRate: 95 },
    ],
  }),
  getComplianceTrend: jest.fn().mockResolvedValue([]),
  calculateRiskScore: jest.fn().mockResolvedValue({ overall: 40 }),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn((text: string) => text.split('\n')),
    addPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(100)),
  })),
}));

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/server').__client;
}

import {
  generateComplianceReport,
  generateCertificateReport,
  generateAuditReport,
  htmlToPdf,
  saveReport,
  getSavedReports,
} from '@/lib/reports';

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- generateComplianceReport ---------- */
  describe('generateComplianceReport', () => {
    it('returns HTML with org name and metrics', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { name: 'Test Org', logo_url: null } }),
      );
      const html = await generateComplianceReport('org-1');
      expect(html).toContain('Compliance Report');
      expect(html).toContain('Test Org');
      expect(html).toContain('Executive Summary');
    });

    it('includes date range when provided', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { name: 'Org', logo_url: null } }),
      );
      const html = await generateComplianceReport('org-1', {
        dateRange: { from: '2025-01-01', to: '2025-06-01' },
      });
      expect(html).toContain('2025-01-01');
    });

    it('includes charts section when opted in', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { name: 'Org', logo_url: null } }),
      );
      const html = await generateComplianceReport('org-1', {
        includeCharts: true,
      });
      expect(html).toContain('30-Day Compliance Trend');
    });

    it('includes logo when org has logo_url', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { name: 'Org', logo_url: 'https://logo.png' } }),
      );
      const html = await generateComplianceReport('org-1');
      expect(html).toContain('https://logo.png');
    });
  });

  /* ---------- generateCertificateReport ---------- */
  describe('generateCertificateReport', () => {
    it('generates HTML with certificate data', async () => {
      const futureDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString();
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({ data: { name: 'Test Org' } });
        if (table === 'certifications')
          return createBuilder({
            data: [
              {
                name: 'ISO 27001',
                issued_date: '2024-01-01',
                expiry_date: futureDate,
                issuer: 'BSI',
              },
            ],
          });
        return createBuilder();
      });
      const html = await generateCertificateReport('org-1');
      expect(html).toContain('Certificate Report');
      expect(html).toContain('ISO 27001');
      expect(html).toContain('BSI');
    });

    it('shows expired status for past-due certificates', async () => {
      const pastDate = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({ data: { name: 'Org' } });
        if (table === 'certifications')
          return createBuilder({
            data: [
              {
                name: 'Old Cert',
                issued_date: '2020-01-01',
                expiry_date: pastDate,
                issuer: 'X',
              },
            ],
          });
        return createBuilder();
      });
      const html = await generateCertificateReport('org-1');
      expect(html).toContain('Expired');
    });

    it('filters by certificate ID when provided', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({ data: { name: 'Org' } });
        if (table === 'certifications')
          return createBuilder({
            data: [
              {
                name: 'Cert',
                issued_date: '2024-01-01',
                expiry_date: new Date(Date.now() + 86400000).toISOString(),
                issuer: 'X',
              },
            ],
          });
        return createBuilder();
      });
      const html = await generateCertificateReport('org-1', 'cert-1');
      expect(html).toContain('Certificate Report');
      expect(getClient().from).toHaveBeenCalledWith('certifications');
    });
  });

  /* ---------- generateAuditReport ---------- */
  describe('generateAuditReport', () => {
    it('generates HTML with activity logs', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({ data: { name: 'Org' } });
        if (table === 'activity_logs')
          return createBuilder({
            data: [
              {
                action: 'create',
                entity_type: 'policy',
                entity_name: 'Privacy',
                created_at: '2025-01-15T10:00:00Z',
                profiles: { full_name: 'Alice', email: 'a@test.com' },
              },
              {
                action: 'update',
                entity_type: 'control',
                entity_name: 'AC-1',
                created_at: '2025-01-16T10:00:00Z',
                profiles: { full_name: 'Bob', email: 'b@test.com' },
              },
            ],
          });
        return createBuilder();
      });
      const html = await generateAuditReport('org-1', {
        from: '2025-01-01',
        to: '2025-02-01',
      });
      expect(html).toContain('Audit Report');
      expect(html).toContain('Alice');
    });

    it('handles empty activity logs', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const html = await generateAuditReport('org-1', {
        from: '2025-01-01',
        to: '2025-02-01',
      });
      expect(html).toContain('Audit Report');
      expect(html).toContain('0');
    });
  });

  /* ---------- htmlToPdf ---------- */
  describe('htmlToPdf', () => {
    it('converts HTML to PDF buffer', async () => {
      const result = await htmlToPdf('<html><body><p>Hello</p></body></html>');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  /* ---------- saveReport ---------- */
  describe('saveReport', () => {
    it('saves report and returns id', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'report-1' } }),
      );
      const id = await saveReport('org-1', 'u1', {
        type: 'compliance',
        title: 'Q1 Report',
        content: '<html></html>',
        format: 'html',
      });
      expect(id).toBe('report-1');
    });

    it('throws when save fails', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'db fail' } }),
      );
      await expect(
        saveReport('org-1', 'u1', {
          type: 'audit',
          title: 'T',
          content: '',
          format: 'pdf',
        }),
      ).rejects.toThrow('Failed to save report');
    });
  });

  /* ---------- getSavedReports ---------- */
  describe('getSavedReports', () => {
    it('returns saved reports', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [{ id: 'r1', title: 'Report 1' }] }),
      );
      const reports = await getSavedReports('org-1');
      expect(reports).toHaveLength(1);
      expect(reports[0].title).toBe('Report 1');
    });

    it('returns empty array on error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      const reports = await getSavedReports('org-1');
      expect(reports).toEqual([]);
    });
  });
});
