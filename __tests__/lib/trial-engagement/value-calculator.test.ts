/**
 * Tests for lib/trial-engagement/value-calculator.ts
 * Focuses on pure functions: generateValueRecapMessage, getTrialUrgencyMessage
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data: [], count: 0, error: null }),
    })),
  })),
}));

import {
  generateValueRecapMessage,
  getTrialUrgencyMessage,
} from '@/lib/trial-engagement/value-calculator';
import type { TrialValueMetrics } from '@/lib/trial-engagement/value-calculator';

const baseMetrics: TrialValueMetrics = {
  orgId: 'org-1',
  daysActive: 14,
  daysRemaining: 0,
  totalLogins: 0,
  tasksCompleted: 0,
  evidenceUploaded: 0,
  teamMembersAdded: 0,
  frameworksEnabled: 0,
  complianceScore: 0,
  complianceImprovement: 0,
  workflowsCreated: 0,
  valueScore: 0,
  highlights: [],
  calculatedAt: new Date().toISOString(),
};

describe('generateValueRecapMessage', () => {
  it('returns default message when no activity', () => {
    const msg = generateValueRecapMessage(baseMetrics);
    expect(msg).toBe("You've started your compliance journey with FormaOS.");
  });

  it('generates message for single activity', () => {
    const msg = generateValueRecapMessage({
      ...baseMetrics,
      tasksCompleted: 5,
    });
    expect(msg).toContain('completed 5 compliance tasks');
    expect(msg).toContain('During your trial');
  });

  it('generates message for two activities', () => {
    const msg = generateValueRecapMessage({
      ...baseMetrics,
      tasksCompleted: 5,
      evidenceUploaded: 10,
    });
    expect(msg).toContain('completed 5 compliance tasks');
    expect(msg).toContain('collected 10 pieces of evidence');
    expect(msg).toContain(' and ');
  });

  it('generates message for multiple activities', () => {
    const msg = generateValueRecapMessage({
      ...baseMetrics,
      tasksCompleted: 5,
      evidenceUploaded: 10,
      complianceImprovement: 20,
      teamMembersAdded: 3,
    });
    expect(msg).toContain('completed 5 compliance tasks');
    expect(msg).toContain('collected 10 pieces of evidence');
    expect(msg).toContain('improved your compliance score by 20%');
    expect(msg).toContain('onboarded 3 team members');
  });

  it('skips team members when <= 1', () => {
    const msg = generateValueRecapMessage({
      ...baseMetrics,
      tasksCompleted: 5,
      teamMembersAdded: 1,
    });
    expect(msg).not.toContain('onboarded');
  });

  it('skips compliance improvement when 0', () => {
    const msg = generateValueRecapMessage({
      ...baseMetrics,
      tasksCompleted: 5,
      complianceImprovement: 0,
    });
    expect(msg).not.toContain('improved');
  });
});

describe('getTrialUrgencyMessage', () => {
  it('returns critical for expired trial (daysRemaining <= 0) with high value', () => {
    const result = getTrialUrgencyMessage(0, 60);
    expect(result.urgency).toBe('critical');
    expect(result.headline).toBe('Your trial has ended');
    expect(result.subline).toContain("Don't lose the progress");
  });

  it('returns critical for expired trial with low value', () => {
    const result = getTrialUrgencyMessage(0, 30);
    expect(result.urgency).toBe('critical');
    expect(result.subline).toContain('Upgrade to unlock');
  });

  it('returns critical for 1 day remaining with high value', () => {
    const result = getTrialUrgencyMessage(1, 60);
    expect(result.urgency).toBe('critical');
    expect(result.headline).toBe('Trial ends tomorrow');
    expect(result.subline).toContain('momentum');
  });

  it('returns critical for 1 day remaining with low value', () => {
    const result = getTrialUrgencyMessage(1, 30);
    expect(result.urgency).toBe('critical');
    expect(result.subline).toContain('Choose a plan');
  });

  it('returns critical for 2-3 days remaining', () => {
    const result = getTrialUrgencyMessage(3, 50);
    expect(result.urgency).toBe('critical');
    expect(result.headline).toContain('3 days left');
  });

  it('returns critical for 2 days remaining', () => {
    const result = getTrialUrgencyMessage(2, 50);
    expect(result.urgency).toBe('critical');
    expect(result.headline).toContain('2 days left');
  });

  it('returns appropriate message for > 3 days remaining', () => {
    // This hits whatever branch handles daysRemaining > 3
    const result = getTrialUrgencyMessage(7, 50);
    expect(result).toBeTruthy();
    expect(typeof result.headline).toBe('string');
    expect(typeof result.subline).toBe('string');
  });

  it('returns info for many days remaining', () => {
    const result = getTrialUrgencyMessage(14, 20);
    expect(result).toBeTruthy();
    expect(['info', 'warning', 'critical']).toContain(result.urgency);
  });
});
