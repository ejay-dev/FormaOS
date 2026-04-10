/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateCareScorecard } from '@/lib/care-scorecard/scorecard-service';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockChain(result: unknown = { data: null, error: null }) {
  const c: Record<string, any> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.neq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.gte = jest.fn().mockReturnValue(c);
  c.lte = jest.fn().mockReturnValue(c);
  c.lt = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.is = jest.fn().mockReturnValue(c);
  c.not = jest.fn().mockReturnValue(c);
  c.insert = jest.fn().mockReturnValue(c);
  c.upsert = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  c.delete = jest.fn().mockReturnValue(c);
  c.maybeSingle = jest.fn().mockResolvedValue(result);
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

type TableResults = Record<string, unknown>;

function makeAdmin(tableResults: Record<string, TableResults> = {}) {
  const admin = {
    from: jest.fn().mockImplementation((table: string) => {
      const res = tableResults[table] ?? { data: null, error: null };
      const c = mockChain(res);
      return c;
    }),
  };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
  return admin;
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('care-scorecard/scorecard-service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('generateCareScorecard', () => {
    it('returns complete scorecard with empty data', async () => {
      makeAdmin({
        org_members: { data: [], error: null },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.industry).toBe('ndis');
      expect(r.generatedAt).toBeDefined();
      expect(r.staffCompliance).toHaveProperty('percentage', 100);
      expect(r.staffCompliance.totalStaff).toBe(0);
      expect(r.credentials.total).toBe(0);
      expect(r.visits.completionRate).toBe(0);
      expect(r.carePlans.active).toBe(0);
      expect(r.incidents.openCount).toBe(0);
      expect(r.workload.averageLoad).toBe(0);
    });

    it('calculates staff compliance with mixed statuses', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 90 * 86400000).toISOString();
      const past = new Date(now.getTime() - 10 * 86400000).toISOString();

      makeAdmin({
        org_members: {
          data: [
            { id: 'm1', user_id: 'u1' },
            { id: 'm2', user_id: 'u2' },
            { id: 'm3', user_id: 'u3' },
          ],
          error: null,
        },
        org_staff_credentials: {
          data: [
            { user_id: 'u1', status: 'verified', expires_at: future },
            { user_id: 'u2', status: 'expired', expires_at: past },
            { user_id: 'u2', status: 'verified', expires_at: future },
            // u3 has no credentials -> pending
          ],
          error: null,
        },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'healthcare');
      expect(r.staffCompliance.totalStaff).toBe(3);
      expect(r.staffCompliance.compliant).toBe(1); // u1
      expect(r.staffCompliance.nonCompliant).toBe(1); // u2 has expired
      expect(r.staffCompliance.pending).toBe(1); // u3
    });

    it('calculates trend as "up" when many verifications', async () => {
      const auditLogs = Array.from({ length: 10 }, () => ({
        metadata: {},
      }));
      makeAdmin({
        org_members: { data: [{ id: 'm1', user_id: 'u1' }], error: null },
        org_staff_credentials: {
          data: [
            {
              user_id: 'u1',
              status: 'verified',
              expires_at: new Date(Date.now() + 86400000).toISOString(),
            },
          ],
          error: null,
        },
        org_audit_logs: { data: auditLogs, error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.staffCompliance.trend).toBe('up');
      expect(r.staffCompliance.trendPercentage).toBe(5);
    });

    it('calculates trend as "down" when low percentage', async () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      makeAdmin({
        org_members: {
          data: [
            { id: 'm1', user_id: 'u1' },
            { id: 'm2', user_id: 'u2' },
          ],
          error: null,
        },
        org_staff_credentials: {
          data: [
            { user_id: 'u1', status: 'expired', expires_at: past },
            { user_id: 'u2', status: 'expired', expires_at: past },
          ],
          error: null,
        },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.staffCompliance.trend).toBe('down');
      expect(r.staffCompliance.trendPercentage).toBe(3);
    });

    it('calculates credential metrics with expiring credentials', async () => {
      const now = new Date();
      const in20Days = new Date(now.getTime() + 20 * 86400000).toISOString();
      const in50Days = new Date(now.getTime() + 50 * 86400000).toISOString();
      const in80Days = new Date(now.getTime() + 80 * 86400000).toISOString();
      const pastDate = new Date(now.getTime() - 5 * 86400000).toISOString();

      makeAdmin({
        org_members: {
          data: [
            {
              user_id: 'u1',
              profiles: { full_name: 'Alice', email: 'alice@test.com' },
            },
            {
              user_id: 'u2',
              profiles: [{ full_name: 'Bob', email: 'bob@test.com' }],
            },
          ],
          error: null,
        },
        org_staff_credentials: {
          data: [
            {
              id: 'c1',
              user_id: 'u1',
              credential_type: 'wwcc',
              name: 'WWCC',
              credential_number: '123',
              expires_at: in20Days,
              status: 'verified',
              document_url: null,
            },
            {
              id: 'c2',
              user_id: 'u1',
              credential_type: 'cpr',
              name: 'CPR',
              credential_number: null,
              expires_at: in50Days,
              status: 'verified',
              document_url: null,
            },
            {
              id: 'c3',
              user_id: 'u2',
              credential_type: 'police_check',
              name: 'Police',
              credential_number: null,
              expires_at: in80Days,
              status: 'verified',
              document_url: 'http://doc',
            },
            {
              id: 'c4',
              user_id: 'u2',
              credential_type: 'other',
              name: 'Other',
              credential_number: null,
              expires_at: pastDate,
              status: 'expired',
              document_url: null,
            },
            {
              id: 'c5',
              user_id: 'u2',
              credential_type: 'ndis_screening',
              name: 'Pending',
              credential_number: null,
              expires_at: null,
              status: 'pending',
              document_url: null,
            },
          ],
          error: null,
        },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'aged_care');
      expect(r.credentials.total).toBe(5);
      expect(r.credentials.verified).toBe(3);
      expect(r.credentials.expired).toBe(1);
      expect(r.credentials.pending).toBe(1);
      expect(r.credentials.expiring30Days.length).toBe(1);
      expect(r.credentials.expiring60Days.length).toBe(1);
      expect(r.credentials.expiring90Days.length).toBe(1);
    });

    it('calculates visit metrics', async () => {
      const now = new Date();
      const today = now.toISOString();
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

      makeAdmin({
        org_members: { data: [], error: null },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: {
          data: [
            {
              id: 'v1',
              status: 'completed',
              visit_type: 'home',
              scheduled_at: today,
              completed_at: today,
              duration_minutes: 60,
            },
            {
              id: 'v2',
              status: 'completed',
              visit_type: 'clinic',
              scheduled_at: twoDaysAgo,
              completed_at: twoDaysAgo,
              duration_minutes: 30,
            },
            {
              id: 'v3',
              status: 'scheduled',
              visit_type: 'home',
              scheduled_at: today,
              completed_at: null,
              duration_minutes: null,
            },
            {
              id: 'v4',
              status: 'missed',
              visit_type: 'home',
              scheduled_at: twoDaysAgo,
              completed_at: null,
              duration_minutes: null,
            },
            {
              id: 'v5',
              status: 'cancelled',
              visit_type: null,
              scheduled_at: twoDaysAgo,
              completed_at: null,
              duration_minutes: null,
            },
            {
              id: 'v6',
              status: 'in_progress',
              visit_type: 'home',
              scheduled_at: today,
              completed_at: null,
              duration_minutes: null,
            },
          ],
          error: null,
        },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.visits.completed).toBe(2);
      expect(r.visits.scheduled).toBe(1);
      expect(r.visits.missed).toBe(1);
      expect(r.visits.cancelled).toBe(1);
      expect(r.visits.inProgress).toBe(1);
      expect(r.visits.averageDuration).toBe(45);
      expect(r.visits.completionRate).toBeGreaterThan(0);
      expect(r.visits.weeklyTrend).toHaveLength(7);
      expect(r.visits.byType).toHaveProperty('home');
    });

    it('calculates care plan metrics with reviews due', async () => {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString();
      const in20Days = new Date(now.getTime() + 20 * 86400000).toISOString();
      const pastReview = new Date(now.getTime() - 5 * 86400000).toISOString();

      makeAdmin({
        org_members: { data: [], error: null },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: {
          data: [
            {
              id: 'cp1',
              patient_id: 'p1',
              title: 'Plan A',
              status: 'active',
              plan_type: 'support',
              review_date: in3Days,
              goals: ['g1', 'g2'],
            },
            {
              id: 'cp2',
              patient_id: 'p2',
              title: 'Plan B',
              status: 'active',
              plan_type: 'ndis',
              review_date: in20Days,
              goals: ['g1'],
            },
            {
              id: 'cp3',
              patient_id: 'p1',
              title: 'Plan C',
              status: 'active',
              plan_type: 'therapy',
              review_date: pastReview,
              goals: [],
            },
            {
              id: 'cp4',
              patient_id: 'p2',
              title: 'Draft',
              status: 'draft',
              plan_type: null,
              review_date: null,
              goals: null,
            },
            {
              id: 'cp5',
              patient_id: 'p3',
              title: 'Review',
              status: 'under_review',
              plan_type: null,
              review_date: null,
              goals: null,
            },
            {
              id: 'cp6',
              patient_id: 'p3',
              title: 'Expired',
              status: 'expired',
              plan_type: null,
              review_date: null,
              goals: null,
            },
          ],
          error: null,
        },
        org_patients: {
          data: [
            { id: 'p1', full_name: 'Patient One' },
            { id: 'p2', full_name: 'Patient Two' },
          ],
          error: null,
        },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.carePlans.active).toBe(3);
      expect(r.carePlans.draft).toBe(1);
      expect(r.carePlans.underReview).toBe(1);
      expect(r.carePlans.expired).toBe(1);
      expect(r.carePlans.reviewsDue).toBe(1); // pastReview is overdue
      expect(r.carePlans.reviewsDue7Days.length).toBe(1); // in3Days
      expect(r.carePlans.reviewsDue30Days.length).toBe(1); // in20Days
      expect(r.carePlans.averageGoalsPerPlan).toBeGreaterThan(0);
    });

    it('calculates incident metrics with trends', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
      const tenDaysAgo = new Date(now.getTime() - 10 * 86400000).toISOString();
      const todayStr = now.toISOString();

      makeAdmin({
        org_members: { data: [], error: null },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: {
          data: [
            {
              id: 'i1',
              status: 'open',
              severity: 'high',
              incident_type: 'fall',
              created_at: twoDaysAgo,
              resolved_at: null,
              follow_up_date: twoDaysAgo,
            },
            {
              id: 'i2',
              status: 'resolved',
              severity: 'low',
              incident_type: 'medication',
              created_at: tenDaysAgo,
              resolved_at: twoDaysAgo,
              follow_up_date: null,
            },
            {
              id: 'i3',
              status: 'resolved',
              severity: 'medium',
              incident_type: 'fall',
              created_at: twoDaysAgo,
              resolved_at: todayStr,
              follow_up_date: null,
            },
            {
              id: 'i4',
              status: 'open',
              severity: 'critical',
              incident_type: null,
              created_at: todayStr,
              resolved_at: null,
              follow_up_date: todayStr,
            },
          ],
          error: null,
        },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.incidents.openCount).toBe(2);
      expect(r.incidents.resolvedThisWeek).toBeGreaterThanOrEqual(1);
      expect(r.incidents.averageResolutionTime).toBeGreaterThan(0);
      expect(r.incidents.weeklyTrend).toHaveLength(7);
      expect(r.incidents.monthlyTrend).toHaveLength(4);
      expect(r.incidents.bySeverity).toHaveProperty('high');
      expect(r.incidents.byType).toHaveProperty('fall');
      expect(r.incidents.requireFollowUp).toBeGreaterThanOrEqual(1);
    });

    it('calculates workload metrics with distribution', async () => {
      makeAdmin({
        org_members: {
          data: [
            {
              user_id: 'u1',
              role: 'STAFF',
              profiles: { full_name: 'Alice', email: 'a@t.com' },
            },
            {
              user_id: 'u2',
              role: 'STAFF',
              profiles: { full_name: 'Bob', email: 'b@t.com' },
            },
          ],
          error: null,
        },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: {
          data: [
            { assigned_to: 'u1', id: 'v1' },
            { assigned_to: 'u1', id: 'v2' },
            { assigned_to: 'u1', id: 'v3' },
            { assigned_to: 'u1', id: 'v4' },
            { assigned_to: 'u1', id: 'v5' },
            { assigned_to: 'u1', id: 'v6' },
            { assigned_to: 'u1', id: 'v7' },
            { assigned_to: 'u1', id: 'v8' },
            { assigned_to: 'u1', id: 'v9' },
            { assigned_to: 'u1', id: 'v10' },
            { assigned_to: 'u1', id: 'v11' },
            { assigned_to: 'u1', id: 'v12' },
            { assigned_to: 'u1', id: 'v13' },
            { assigned_to: 'u1', id: 'v14' },
            { assigned_to: 'u1', id: 'v15' },
            { assigned_to: 'u1', id: 'v16' },
            { assigned_to: 'u1', id: 'v17' },
          ],
          error: null,
        },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: {
          data: [
            { user_id: 'u1', patient_id: 'p1' },
            { user_id: 'u1', patient_id: 'p2' },
            { user_id: 'u1', patient_id: 'p3' },
            { user_id: 'u1', patient_id: 'p4' },
            { user_id: 'u1', patient_id: 'p5' },
            { user_id: 'u1', patient_id: 'p6' },
            { user_id: 'u1', patient_id: 'p7' },
            { user_id: 'u1', patient_id: 'p8' },
          ],
          error: null,
        },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.workload.distribution).toHaveLength(2);
      expect(r.workload.averageLoad).toBeGreaterThan(0);
      // u1 has high load, u2 has none
      const u1 = r.workload.distribution.find((d: any) => d.userId === 'u1');
      const u2 = r.workload.distribution.find((d: any) => d.userId === 'u2');
      expect(u1!.status).toBe('overloaded');
      expect(u2!.status).toBe('underutilized');
      expect(r.workload.overloaded).toBe(1);
      expect(r.workload.underutilized).toBe(1);
    });

    it('handles staff with pending credentials', async () => {
      makeAdmin({
        org_members: { data: [{ id: 'm1', user_id: 'u1' }], error: null },
        org_staff_credentials: {
          data: [{ user_id: 'u1', status: 'pending', expires_at: null }],
          error: null,
        },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.staffCompliance.pending).toBe(1);
    });

    it('handles credential with status verified but expired date', async () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      makeAdmin({
        org_members: { data: [{ id: 'm1', user_id: 'u1' }], error: null },
        org_staff_credentials: {
          data: [{ user_id: 'u1', status: 'verified', expires_at: past }],
          error: null,
        },
        org_audit_logs: { data: [], error: null },
        org_visits: { data: [], error: null },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: { data: [], error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      // Status says verified but date is expired → hasExpired = true → non_compliant
      expect(r.staffCompliance.nonCompliant).toBe(1);
    });

    it('handles null data arrays gracefully', async () => {
      makeAdmin({
        org_members: { data: null, error: null },
        org_staff_credentials: { data: null, error: null },
        org_audit_logs: { data: null, error: null },
        org_visits: { data: null, error: null },
        org_care_plans: { data: null, error: null },
        org_patients: { data: null, error: null },
        org_incidents: { data: null, error: null },
        org_patient_assignments: { data: null, error: null },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      expect(r.staffCompliance.totalStaff).toBe(0);
      expect(r.credentials.total).toBe(0);
    });

    it('handles workload with optimal load staff', async () => {
      makeAdmin({
        org_members: {
          data: [
            {
              user_id: 'u1',
              role: 'STAFF',
              profiles: { full_name: 'X', email: 'x@t.com' },
            },
          ],
          error: null,
        },
        org_staff_credentials: { data: [], error: null },
        org_audit_logs: { data: [], error: null },
        org_visits: {
          data: [
            { assigned_to: 'u1', id: 'v1' },
            { assigned_to: 'u1', id: 'v2' },
            { assigned_to: 'u1', id: 'v3' },
            { assigned_to: 'u1', id: 'v4' },
            { assigned_to: 'u1', id: 'v5' },
            { assigned_to: 'u1', id: 'v6' },
            { assigned_to: 'u1', id: 'v7' },
          ],
          error: null,
        },
        org_care_plans: { data: [], error: null },
        org_patients: { data: [], error: null },
        org_incidents: { data: [], error: null },
        org_patient_assignments: {
          data: [
            { user_id: 'u1', patient_id: 'p1' },
            { user_id: 'u1', patient_id: 'p2' },
            { user_id: 'u1', patient_id: 'p3' },
          ],
          error: null,
        },
      });

      const r = await generateCareScorecard('org-1', 'ndis');
      const u1 = r.workload.distribution.find((d: any) => d.userId === 'u1');
      // 3 clients * 10 + 7 visits * 5 = 65 → optimal
      expect(u1!.status).toBe('optimal');
      expect(r.workload.optimal).toBe(1);
    });
  });
});
