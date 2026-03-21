/**
 * @jest-environment node
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

let mockAdmin: { from: ReturnType<typeof mockSupabase>['client']['from'] };
const ensureFrameworkPacksInstalled = jest.fn();
const syncComplianceFramework = jest.fn();
const getServerSideFeatureFlags = jest.fn();
const detectComplianceControlsSchema = jest.fn();
const getEvidenceSuggestions = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

jest.mock('@/lib/feature-flags', () => ({
  getServerSideFeatureFlags: jest.fn(() => getServerSideFeatureFlags()),
}));

jest.mock('@/lib/frameworks/framework-installer', () => ({
  ensureFrameworkPacksInstalled: jest.fn(() => ensureFrameworkPacksInstalled()),
  getFrameworkCodeForSlug: jest.fn((slug: string) => slug.toUpperCase()),
  syncComplianceFramework: jest.fn((slug: string, client: unknown) =>
    syncComplianceFramework(slug, client),
  ),
}));

jest.mock('@/lib/frameworks/compliance-controls-schema', () => ({
  detectComplianceControlsSchema: jest.fn((client: unknown) =>
    detectComplianceControlsSchema(client),
  ),
  riskLevelFromWeight: jest.fn(() => 'high'),
}));

jest.mock('@/lib/frameworks/evidence-suggestions', () => ({
  getEvidenceSuggestions: jest.fn((control: unknown) => getEvidenceSuggestions(control)),
}));

import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';

describe('provisionFrameworkControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns early when the framework engine is disabled and force is not set', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: false });
    mockAdmin = { from: jest.fn() };

    await provisionFrameworkControls('org-1', 'iso27001');

    expect(ensureFrameworkPacksInstalled).not.toHaveBeenCalled();
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it('creates tasks, links, and evaluations only for controls not already linked', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: true });
    detectComplianceControlsSchema.mockResolvedValue('current');
    getEvidenceSuggestions.mockReturnValue({
      evidenceTypes: ['policy'],
      automationTriggers: ['task.created'],
      reviewCadenceDays: 30,
      taskTemplates: [
        {
          title: 'Implement control',
          description: 'Do the thing',
          priority: 'high',
        },
      ],
    });

    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'compliance_frameworks') {
          return { data: { id: 'framework-1', code: 'ISO27001' }, error: null };
        }

        if (operation.table === 'compliance_controls') {
          return {
            data: [
              {
                id: 'control-linked',
                code: 'A.1',
                title: 'Linked control',
                description: 'Already linked',
                risk_level: 'medium',
                framework_control_id: 'fc-1',
              },
              {
                id: 'control-new',
                code: 'A.2',
                title: 'New control',
                description: 'Needs work',
                risk_level: 'high',
                framework_control_id: 'fc-2',
              },
            ],
            error: null,
          };
        }

        if (operation.table === 'control_tasks' && operation.action === 'select') {
          return {
            data: [{ control_id: 'control-linked' }],
            error: null,
          };
        }

        if (operation.table === 'framework_controls') {
          return {
            data: [
              {
                id: 'fc-2',
                control_code: 'A.2',
                title: 'New control',
                summary_description: 'summary',
                default_risk_level: 'high',
                review_frequency_days: 30,
                suggested_evidence_types: ['policy'],
                suggested_automation_triggers: ['task.created'],
                suggested_task_templates: [],
              },
            ],
            error: null,
          };
        }

        if (operation.table === 'org_tasks' && operation.action === 'insert') {
          return { data: { id: 'task-1' }, error: null };
        }

        if (operation.table === 'org_frameworks') {
          return { data: null, error: null };
        }

        if (operation.table === 'control_tasks' && operation.action === 'insert') {
          return { data: null, error: null };
        }

        if (operation.table === 'org_control_evaluations' && operation.action === 'upsert') {
          return { data: null, error: null };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = { from: supabase.client.from };

    await provisionFrameworkControls('org-1', 'iso27001', { force: true });

    expect(ensureFrameworkPacksInstalled).toHaveBeenCalled();
    expect(syncComplianceFramework).toHaveBeenCalledWith('iso27001', mockAdmin);

    const orgTaskInserts = supabase.operations.filter(
      (operation) => operation.table === 'org_tasks' && operation.action === 'insert',
    );
    expect(orgTaskInserts).toHaveLength(1);

    const evaluationUpsert = supabase.operations.find(
      (operation) =>
        operation.table === 'org_control_evaluations' && operation.action === 'upsert',
    );
    expect(evaluationUpsert?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organization_id: 'org-1',
          control_key: 'control:control-new',
        }),
      ]),
    );
  });
});
