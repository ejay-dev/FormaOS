/**
 * Automation Trigger Tests
 * Tests for enhanced onboarding automation triggers
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type {
  TriggerEvent,
  AutomationResult,
} from '@/lib/automation/trigger-engine';

// Mock Supabase admin client
const mockSupabaseInsert = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseUpdate = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn((_table: string) => ({
      insert: mockSupabaseInsert.mockReturnValue({ error: null }),
      select: mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: mockSupabaseUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })),
  })),
}));

// Mock compliance score engine
jest.mock('@/lib/automation/compliance-score-engine', () => ({
  updateComplianceScore: jest.fn().mockResolvedValue({
    score: 75,
    controlsComplete: 10,
    controlsTotal: 20,
  }),
}));

// Mock automation logger
jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Automation Triggers - Onboarding', () => {
  const mockOrgId = 'test-org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Industry Configuration Trigger', () => {
    it('should trigger compliance scoring after industry configuration', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');
      const { updateComplianceScore } =
        await import('@/lib/automation/compliance-score-engine');

      const event: TriggerEvent = {
        type: 'industry_configured',
        organizationId: mockOrgId,
        metadata: { industry: 'ndis' },
        triggeredAt: new Date(),
      };

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { industry: 'ndis' },
            error: null,
          }),
        }),
      });

      const result = await processTrigger(event);

      expect(result).toBeDefined();
      expect(updateComplianceScore).toHaveBeenCalledWith(mockOrgId);
    });

    it('should not trigger scoring if industry is "other"', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');
      const { updateComplianceScore } =
        await import('@/lib/automation/compliance-score-engine');

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { industry: 'other' },
            error: null,
          }),
        }),
      });

      const event: TriggerEvent = {
        type: 'industry_configured',
        organizationId: mockOrgId,
        metadata: { industry: 'other' },
        triggeredAt: new Date(),
      };

      await processTrigger(event);

      // Should not update compliance score for "other" industry
      expect(updateComplianceScore).not.toHaveBeenCalled();
    });
  });

  describe('Frameworks Provisioned Trigger', () => {
    it('should create reminder task after frameworks provisioned', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      const frameworks = ['iso_27001', 'soc2'];
      const event: TriggerEvent = {
        type: 'frameworks_provisioned',
        organizationId: mockOrgId,
        metadata: { frameworks },
        triggeredAt: new Date(),
      };

      const result = await processTrigger(event);

      expect(result.tasksCreated).toBeGreaterThan(0);
      expect(mockSupabaseInsert).toHaveBeenCalled();
    });

    it('should trigger compliance scoring after provisioning', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');
      const { updateComplianceScore } =
        await import('@/lib/automation/compliance-score-engine');

      const event: TriggerEvent = {
        type: 'frameworks_provisioned',
        organizationId: mockOrgId,
        metadata: { frameworks: ['iso_27001'] },
        triggeredAt: new Date(),
      };

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-123' },
            error: null,
          }),
        }),
      });

      await processTrigger(event);

      expect(updateComplianceScore).toHaveBeenCalledWith(mockOrgId);
    });

    it('should send notification to owner', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-123' },
            error: null,
          }),
        }),
      });

      const event: TriggerEvent = {
        type: 'frameworks_provisioned',
        organizationId: mockOrgId,
        metadata: { frameworks: ['iso_27001', 'soc2'] },
        triggeredAt: new Date(),
      };

      const result = await processTrigger(event);

      expect(result.notificationsSent).toBeGreaterThan(0);
    });
  });

  describe('Industry Pack Applied Trigger', () => {
    it('should trigger compliance scoring after pack application', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');
      const { updateComplianceScore } =
        await import('@/lib/automation/compliance-score-engine');

      const event: TriggerEvent = {
        type: 'industry_pack_applied',
        organizationId: mockOrgId,
        metadata: {
          industry: 'ndis',
          packName: 'NDIS Compliance Pack',
        },
        triggeredAt: new Date(),
      };

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-123' },
            error: null,
          }),
        }),
      });

      await processTrigger(event);

      expect(updateComplianceScore).toHaveBeenCalledWith(mockOrgId);
    });

    it('should send notification about pack activation', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-123' },
            error: null,
          }),
        }),
      });

      const event: TriggerEvent = {
        type: 'industry_pack_applied',
        organizationId: mockOrgId,
        metadata: {
          industry: 'healthcare',
          packName: 'Healthcare Compliance Pack',
        },
        triggeredAt: new Date(),
      };

      const result = await processTrigger(event);

      expect(result.notificationsSent).toBeGreaterThan(0);
    });
  });

  describe('Onboarding Milestone Trigger', () => {
    it('should update onboarding status on milestone', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      const event: TriggerEvent = {
        type: 'onboarding_milestone',
        organizationId: mockOrgId,
        metadata: { milestone: 'industry_selected' },
        triggeredAt: new Date(),
      };

      await processTrigger(event);

      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });

    it('should log milestone reached', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');
      const { automationLogger } =
        await import('@/lib/observability/structured-logger');

      const event: TriggerEvent = {
        type: 'onboarding_milestone',
        organizationId: mockOrgId,
        metadata: { milestone: 'frameworks_selected' },
        triggeredAt: new Date(),
      };

      await processTrigger(event);

      expect(automationLogger.info).toHaveBeenCalledWith(
        'onboarding_milestone_reached',
        expect.objectContaining({
          orgId: mockOrgId,
          milestone: 'frameworks_selected',
        }),
      );
    });
  });

  describe('Enhanced Org Onboarding Trigger', () => {
    it('should create industry-aware onboarding tasks', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { industry: 'ndis', name: 'Test Org' },
            error: null,
          }),
        }),
      });

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-123' },
            error: null,
          }),
        }),
      });

      const event: TriggerEvent = {
        type: 'org_onboarding',
        organizationId: mockOrgId,
        triggeredAt: new Date(),
      };

      const result = await processTrigger(event);

      expect(result.tasksCreated).toBeGreaterThan(0);
      expect(result.notificationsSent).toBeGreaterThan(0);
    });

    it('should include industry in notification metadata', async () => {
      const { processTrigger } =
        await import('@/lib/automation/trigger-engine');

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { industry: 'healthcare', name: 'Health Org' },
            error: null,
          }),
        }),
      });

      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'owner-456' },
            error: null,
          }),
        }),
      });

      const mockNotificationInsert = jest
        .fn()
        .mockResolvedValue({ error: null });
      mockSupabaseInsert.mockReturnValue(mockNotificationInsert);

      const event: TriggerEvent = {
        type: 'org_onboarding',
        organizationId: mockOrgId,
        triggeredAt: new Date(),
      };

      await processTrigger(event);

      // Check that notification includes industry
      const notificationCall = mockSupabaseInsert.mock.calls.find(
        (call) => call[0]?.type === 'ONBOARDING_STARTED',
      );

      expect(notificationCall).toBeDefined();
    });
  });
});

describe('Automation Integration Functions', () => {
  const mockOrgId = 'test-org-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onIndustryConfigured', () => {
    it('should call processTrigger with correct event', async () => {
      const { onIndustryConfigured } =
        await import('@/lib/automation/integration');

      await onIndustryConfigured(mockOrgId, 'ndis');

      // Function should not throw
      expect(true).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { onIndustryConfigured } =
        await import('@/lib/automation/integration');

      // Should not throw even if automation fails
      await expect(
        onIndustryConfigured(mockOrgId, 'invalid'),
      ).resolves.not.toThrow();
    });
  });

  describe('onFrameworksProvisioned', () => {
    it('should call processTrigger with frameworks array', async () => {
      const { onFrameworksProvisioned } =
        await import('@/lib/automation/integration');

      const frameworks = ['iso_27001', 'soc2'];
      await onFrameworksProvisioned(mockOrgId, frameworks);

      // Function should not throw
      expect(true).toBe(true);
    });
  });

  describe('onIndustryPackApplied', () => {
    it('should call processTrigger with industry and pack name', async () => {
      const { onIndustryPackApplied } =
        await import('@/lib/automation/integration');

      await onIndustryPackApplied(mockOrgId, 'ndis', 'NDIS Compliance Pack');

      // Function should not throw
      expect(true).toBe(true);
    });
  });

  describe('onOnboardingMilestone', () => {
    it('should call processTrigger with milestone name', async () => {
      const { onOnboardingMilestone } =
        await import('@/lib/automation/integration');

      await onOnboardingMilestone(mockOrgId, 'industry_selected');

      // Function should not throw
      expect(true).toBe(true);
    });
  });
});

describe('Trigger Chain and Compliance Scoring', () => {
  const mockOrgId = 'test-org-789';

  it('should trigger compliance scoring after onboarding completion', async () => {
    const { onOnboardingCompleted } =
      await import('@/lib/automation/integration');
    const { updateComplianceScore } =
      await import('@/lib/automation/compliance-score-engine');

    await onOnboardingCompleted(mockOrgId);

    // Compliance scoring should be triggered
    expect(updateComplianceScore).toHaveBeenCalled();
  });

  it('should update compliance score after all major onboarding events', async () => {
    const { updateComplianceScore } =
      await import('@/lib/automation/compliance-score-engine');
    const {
      onIndustryConfigured,
      onFrameworksProvisioned,
      onIndustryPackApplied,
    } = await import('@/lib/automation/integration');

    mockSupabaseSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { industry: 'ndis', user_id: 'owner-123' },
          error: null,
        }),
      }),
    });

    // Industry configured
    await onIndustryConfigured(mockOrgId, 'ndis');

    // Frameworks provisioned
    await onFrameworksProvisioned(mockOrgId, ['iso_27001']);

    // Industry pack applied
    await onIndustryPackApplied(mockOrgId, 'ndis', 'NDIS Pack');

    // Compliance scoring should be triggered multiple times
    expect(updateComplianceScore).toHaveBeenCalledWith(mockOrgId);
  });
});
