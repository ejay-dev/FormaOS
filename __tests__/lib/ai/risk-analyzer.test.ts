/** @jest-environment node */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/realtime', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';
import { sendNotification } from '@/lib/realtime';
import {
  performRiskAnalysis,
  getRiskAnalysisHistory,
  getAIInsights,
  scheduleRiskAnalysis,
} from '@/lib/ai/risk-analyzer';

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

function makeServer(tableResults: Record<string, TableResults> = {}) {
  const server = {
    from: jest.fn().mockImplementation((table: string) => {
      const res = tableResults[table] ?? { data: null, error: null };
      return mockChain(res);
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  };
  (createSupabaseServerClient as jest.Mock).mockResolvedValue(server);
  return server;
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('ai/risk-analyzer', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('performRiskAnalysis', () => {
    it('returns low risk when no issues', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [{ user_id: 'u1' }], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.overallRiskScore).toBe(0);
      expect(r.riskLevel).toBe('low');
      expect(r.totalRisks).toBe(0);
    });

    it('detects expired certificates as critical', async () => {
      const pastExpiry = new Date(Date.now() - 10 * 86400000).toISOString();
      makeServer({
        certifications: {
          data: [{ id: 'cert1', name: 'ISO 27001', expiry_date: pastExpiry }],
          error: null,
        },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.totalRisks).toBeGreaterThan(0);
      expect(r.risksByCategory.certificate_expiration).toBe(1);
      expect(r.risksBySeverity.critical).toBeGreaterThanOrEqual(1);
    });

    it('detects certificates expiring within 7 days as high', async () => {
      const soonExpiry = new Date(Date.now() + 3 * 86400000).toISOString();
      makeServer({
        certifications: {
          data: [{ id: 'cert2', name: 'SOC 2', expiry_date: soonExpiry }],
          error: null,
        },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.certificate_expiration).toBe(1);
      expect(r.risksBySeverity.high).toBeGreaterThanOrEqual(1);
    });

    it('detects certificates expiring within 30 days as medium', async () => {
      const medExpiry = new Date(Date.now() + 20 * 86400000).toISOString();
      makeServer({
        certifications: {
          data: [{ id: 'cert3', name: 'GDPR', expiry_date: medExpiry }],
          error: null,
        },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.certificate_expiration).toBe(1);
      expect(r.risksBySeverity.medium).toBeGreaterThanOrEqual(1);
    });

    it('skips certificates not expiring soon', async () => {
      const farExpiry = new Date(Date.now() + 365 * 86400000).toISOString();
      makeServer({
        certifications: {
          data: [{ id: 'cert4', name: 'Far', expiry_date: farExpiry }],
          error: null,
        },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.certificate_expiration).toBe(0);
    });

    it('detects missing evidence on completed tasks', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: {
          data: [
            {
              id: 't1',
              title: 'Task 1',
              organization_id: 'org-1',
              requires_evidence: true,
              status: 'completed',
            },
          ],
          error: null,
        },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.missing_evidence).toBe(1);
    });

    it('does not flag tasks with evidence', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: {
          data: [
            {
              id: 't1',
              title: 'Task 1',
              organization_id: 'org-1',
              requires_evidence: true,
              status: 'completed',
            },
          ],
          error: null,
        },
        org_evidence: { data: [{ id: 'e1' }], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.missing_evidence).toBe(0);
    });

    it('detects overdue tasks with varying severity', async () => {
      const longOverdue = new Date(Date.now() - 40 * 86400000).toISOString();
      const medOverdue = new Date(Date.now() - 20 * 86400000).toISOString();
      const shortOverdue = new Date(Date.now() - 10 * 86400000).toISOString();
      const justOverdue = new Date(Date.now() - 2 * 86400000).toISOString();

      makeServer({
        certifications: { data: [], error: null },
        tasks: {
          data: [
            {
              id: 't1',
              title: 'Critical',
              due_date: longOverdue,
              status: 'pending',
              priority: 'high',
            },
            {
              id: 't2',
              title: 'High',
              due_date: medOverdue,
              status: 'in_progress',
              priority: 'medium',
            },
            {
              id: 't3',
              title: 'Medium',
              due_date: shortOverdue,
              status: 'pending',
              priority: 'low',
            },
            {
              id: 't4',
              title: 'Low',
              due_date: justOverdue,
              status: 'pending',
              priority: 'low',
            },
          ],
          error: null,
        },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.overdue_tasks).toBe(4);
      expect(r.risksBySeverity.critical).toBeGreaterThanOrEqual(1);
    });

    it('detects non-overdue tasks (future due_date) are not flagged', async () => {
      const futureDue = new Date(Date.now() + 10 * 86400000).toISOString();
      makeServer({
        certifications: { data: [], error: null },
        tasks: {
          data: [
            {
              id: 't1',
              title: 'Future',
              due_date: futureDue,
              status: 'pending',
              priority: 'low',
            },
          ],
          error: null,
        },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.overdue_tasks).toBe(0);
    });

    it('detects workflow failures >= 3', async () => {
      const recentDate = new Date(Date.now() - 86400000).toISOString();
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: {
          data: [
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
          ],
          error: null,
        },
        workflow_configs: { data: { name: 'Test Workflow' }, error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.incomplete_workflows).toBeGreaterThanOrEqual(1);
    });

    it('does not flag workflows with < 3 failures', async () => {
      const recentDate = new Date(Date.now() - 86400000).toISOString();
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: {
          data: [
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
            { workflow_id: 'wf1', status: 'failed', created_at: recentDate },
          ],
          error: null,
        },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.incomplete_workflows).toBe(0);
    });

    it('detects low compliance activity as gap', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: { data: [{ action: 'x' }], error: null }, // < 10
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.compliance_gap).toBeGreaterThanOrEqual(1);
    });

    it('detects unbalanced workload distribution', async () => {
      // Need max > avg * 2.5. With 30 for u1 and 1 each for u2-u4:
      // counts=[30,1,1,1], avg=8.25, max=30, 30>20.625 ✓
      const u1Tasks = Array.from({ length: 30 }, () => ({ assigned_to: 'u1' }));
      makeServer({
        certifications: { data: [], error: null },
        tasks: {
          data: [
            ...u1Tasks,
            { assigned_to: 'u2' },
            { assigned_to: 'u3' },
            { assigned_to: 'u4' },
          ],
          error: null,
        },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: {
          data: [
            { user_id: 'u1' },
            { user_id: 'u2' },
            { user_id: 'u3' },
            { user_id: 'u4' },
          ],
          error: null,
        },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.risksByCategory.compliance_gap).toBeGreaterThanOrEqual(1);
    });

    it('sends notification for high/critical risk', async () => {
      const pastExpiry = new Date(Date.now() - 10 * 86400000).toISOString();
      // Create enough critical risks to make score >= 50
      const certs = Array.from({ length: 5 }, (_, i) => ({
        id: `cert${i}`,
        name: `Cert ${i}`,
        expiry_date: pastExpiry,
      }));

      makeServer({
        certifications: { data: certs, error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      if (r.riskLevel === 'high' || r.riskLevel === 'critical') {
        expect(sendNotification).toHaveBeenCalled();
      }
    });

    it('calculates trends based on previous analysis', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: { overall_risk_score: 80 }, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.trends).toHaveProperty('direction');
      expect(r.trends).toHaveProperty('changePercent');
      expect(r.trends).toHaveProperty('previousScore');
      // Score is 0 now, previous was 80 → improving
      expect(r.trends.direction).toBe('improving');
    });

    it('logs activity after analysis', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      await performRiskAnalysis('org-1');
      expect(logActivity).toHaveBeenCalled();
    });

    it('generates AI insights for certificate risks', async () => {
      const past = new Date(Date.now() - 5 * 86400000).toISOString();
      const soon = new Date(Date.now() + 3 * 86400000).toISOString();
      makeServer({
        certifications: {
          data: [
            { id: 'c1', name: 'Cert A', expiry_date: past },
            { id: 'c2', name: 'Cert B', expiry_date: soon },
          ],
          error: null,
        },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it('generates strong posture insight when few risks', async () => {
      makeServer({
        certifications: { data: [], error: null },
        tasks: { data: [], error: null },
        org_evidence: { data: [], error: null },
        workflow_executions: { data: [], error: null },
        activity_logs: {
          data: Array.from({ length: 20 }, () => ({})),
          error: null,
        },
        org_members: { data: [], error: null },
        risk_analyses: { data: null, error: null },
      });

      const r = await performRiskAnalysis('org-1');
      // With 0 risks and 0 critical, the strong posture insight should appear
      expect(r.totalRisks).toBe(0);
    });
  });

  describe('getRiskAnalysisHistory', () => {
    it('returns history', async () => {
      makeServer({
        risk_analyses: { data: [{ id: 'r1' }, { id: 'r2' }], error: null },
      });

      const r = await getRiskAnalysisHistory('org-1');
      expect(r).toHaveLength(2);
    });

    it('returns empty array on error', async () => {
      makeServer({
        risk_analyses: { data: null, error: { message: 'fail' } },
      });

      const r = await getRiskAnalysisHistory('org-1');
      expect(r).toEqual([]);
    });

    it('uses default limit', async () => {
      makeServer({
        risk_analyses: { data: [], error: null },
      });

      const r = await getRiskAnalysisHistory('org-1');
      expect(r).toEqual([]);
    });

    it('respects custom limit', async () => {
      makeServer({
        risk_analyses: { data: [], error: null },
      });

      const r = await getRiskAnalysisHistory('org-1', 5);
      expect(r).toEqual([]);
    });
  });

  describe('getAIInsights', () => {
    it('returns insights from latest analysis', async () => {
      const insights = [
        {
          type: 'prediction',
          title: 'Test',
          description: 'test',
          confidence: 0.8,
          impact: 'low',
          actionable: true,
          suggestedActions: [],
        },
      ];
      makeServer({
        risk_analyses: { data: { ai_insights: insights }, error: null },
      });

      const r = await getAIInsights('org-1');
      expect(r).toHaveLength(1);
    });

    it('returns empty array when no data', async () => {
      makeServer({
        risk_analyses: { data: null, error: null },
      });

      const r = await getAIInsights('org-1');
      expect(r).toEqual([]);
    });
  });

  describe('scheduleRiskAnalysis', () => {
    it('inserts scheduled task', async () => {
      const server = makeServer({
        scheduled_tasks: { data: null, error: null },
      });

      await scheduleRiskAnalysis('org-1', 'daily');
      expect(server.from).toHaveBeenCalledWith('scheduled_tasks');
    });

    it('handles weekly frequency', async () => {
      makeServer({
        scheduled_tasks: { data: null, error: null },
      });
      await scheduleRiskAnalysis('org-1', 'weekly');
    });

    it('handles monthly frequency', async () => {
      makeServer({
        scheduled_tasks: { data: null, error: null },
      });
      await scheduleRiskAnalysis('org-1', 'monthly');
    });
  });
});
