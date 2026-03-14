/** @jest-environment node */

import {
  initializeComplianceGraph,
  repairComplianceGraph,
  validateComplianceGraph,
} from '@/lib/compliance-graph';
import { mockSupabase } from '@/tests/helpers';

const serverSupabase = mockSupabase();
const adminSupabase = mockSupabase();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => serverSupabase.client),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => adminSupabase.client),
}));

describe('compliance-graph', () => {
  beforeEach(() => {
    serverSupabase.reset();
    adminSupabase.reset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes the default graph nodes, wires, and audit event for a new org', async () => {
    adminSupabase.setResolver((operation) => {
      if (operation.table === 'org_members' && operation.action === 'select') {
        return { data: { id: 'membership-1', role: 'owner' }, error: null };
      }
      if (operation.table === 'org_policies' && operation.action === 'insert') {
        return {
          data: [
            { id: 'policy-1', created_at: '2026-03-14T00:00:00.000Z' },
            { id: 'policy-2', created_at: '2026-03-14T00:00:01.000Z' },
          ],
          error: null,
        };
      }
      if (operation.table === 'org_entities' && operation.action === 'insert') {
        return {
          data: { id: 'entity-1', created_at: '2026-03-14T00:00:02.000Z' },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await initializeComplianceGraph('org-a', 'user-1');

    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(5);
    expect(result.wires).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: 'org-a',
          toNodeId: 'user-1',
          wireType: 'organization_user',
        }),
      ]),
    );
    expect(
      adminSupabase.operations.some(
        (operation) =>
          operation.table === 'org_audit_events' && operation.action === 'insert',
      ),
    ).toBe(true);
  });

  it('returns a failure result when the user membership is missing', async () => {
    adminSupabase.queueResponse({
      match: { table: 'org_members', action: 'select', expects: 'single' },
      response: { data: null, error: null },
    });

    await expect(initializeComplianceGraph('org-a', 'user-1')).resolves.toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('membership not found'),
      }),
    );
  });

  it('detects missing organization and role nodes during validation', async () => {
    serverSupabase.setResolver((operation) => {
      switch (operation.table) {
        case 'organizations':
          return { data: null, error: null };
        case 'org_members':
        case 'org_policies':
        case 'org_tasks':
        case 'org_evidence':
        case 'org_audit_events':
        case 'org_entities':
          return { data: [], error: null };
        default:
          return { data: null, error: null };
      }
    });

    const result = await validateComplianceGraph('org-missing');

    expect(result.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Organization node missing',
        'No role nodes found - organization has no members',
        'Missing user role assignments',
      ]),
    );
    expect(result.nodeCount.organization).toBe(0);
  });

  it('counts node and wire totals for a healthy compliance graph', async () => {
    serverSupabase.setResolver((operation) => {
      switch (operation.table) {
        case 'organizations':
          return { data: { id: 'org-a' }, error: null };
        case 'org_members':
          return {
            data: [
              { id: 'member-1', role: 'owner' },
              { id: 'member-2', role: 'admin' },
            ],
            error: null,
          };
        case 'org_policies':
          return { data: [{ id: 'policy-1' }], error: null };
        case 'org_tasks':
          return {
            data: [
              { id: 'task-1', policy_id: 'policy-1' },
              { id: 'task-2', policy_id: null },
            ],
            error: null,
          };
        case 'org_evidence':
          return {
            data: [
              { id: 'evidence-1', task_id: 'task-1' },
              { id: 'evidence-2', task_id: null },
            ],
            error: null,
          };
        case 'org_audit_events':
          return { data: [{ id: 'audit-1' }], error: null };
        case 'org_entities':
          return { data: [{ id: 'entity-1' }, { id: 'entity-2' }], error: null };
        default:
          return { data: null, error: null };
      }
    });

    const result = await validateComplianceGraph('org-a');

    expect(result.isValid).toBe(true);
    expect(result.nodeCount).toEqual({
      organization: 1,
      role: 2,
      policy: 1,
      task: 2,
      evidence: 2,
      audit: 1,
      entity: 2,
    });
    expect(result.wireCount).toEqual({
      organization_user: 2,
      user_role: 0,
      policy_task: 1,
      task_evidence: 1,
      evidence_audit: 0,
    });
  });

  it('repairs orphaned tasks and missing roles and audits the repair', async () => {
    adminSupabase.setResolver((operation) => {
      switch (operation.table) {
        case 'org_tasks':
          if (operation.action === 'select') {
            return {
              data: [{ id: 'task-1', title: 'Orphan task' }],
              error: null,
            };
          }
          return { data: null, error: null };
        case 'org_policies':
          return { data: { id: 'policy-1' }, error: null };
        case 'org_members':
          if (operation.action === 'select') {
            return {
              data: [{ id: 'member-1', user_id: 'user-9' }],
              error: null,
            };
          }
          return { data: null, error: null };
        case 'org_audit_events':
          return { data: null, error: null };
        default:
          return { data: null, error: null };
      }
    });

    const result = await repairComplianceGraph('org-a', 'user-1');

    expect(result).toEqual({
      success: true,
      repairsApplied: [
        'Fixed 1 orphaned tasks',
        'Fixed 1 missing role assignments',
      ],
    });
    expect(
      adminSupabase.operations.some(
        (operation) =>
          operation.table === 'org_audit_events' && operation.action === 'insert',
      ),
    ).toBe(true);
  });
});

