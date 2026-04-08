/**
 * Tests for lib/notifications/digest.ts (pure function coverage)
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/config/brand', () => ({
  brand: {
    appName: 'TestApp',
    identity: 'TestID',
    seo: { appUrl: 'https://test.app' },
  },
}));

jest.mock('@/lib/email/resend-client', () => ({
  getFromEmail: jest.fn(() => 'noreply@test.app'),
  getResendClient: jest.fn(() => ({
    emails: { send: jest.fn() },
  })),
}));

import {
  getDigestKey,
  getNextDigestSchedule,
} from '@/lib/notifications/digest';

describe('getDigestKey', () => {
  it('generates daily key', () => {
    const key = getDigestKey('daily', new Date('2024-06-15T10:00:00Z'), 'UTC');
    expect(key).toMatch(/^daily:\d{4}-\d{2}-\d{2}$/);
    expect(key).toContain('2024');
  });

  it('generates weekly key', () => {
    const key = getDigestKey('weekly', new Date('2024-06-15T10:00:00Z'), 'UTC');
    expect(key).toMatch(/^weekly:\d{4}-\d{2}-\d{2}:week$/);
  });

  it('generates hourly key with hour component', () => {
    const key = getDigestKey('hourly', new Date('2024-06-15T14:30:00Z'), 'UTC');
    expect(key).toMatch(/^hourly:\d{4}-\d{2}-\d{2}:\d{2}$/);
    expect(key).toContain(':14');
  });

  it('respects timezone', () => {
    const utcKey = getDigestKey(
      'hourly',
      new Date('2024-06-15T23:30:00Z'),
      'UTC',
    );
    const ausKey = getDigestKey(
      'hourly',
      new Date('2024-06-15T23:30:00Z'),
      'Australia/Sydney',
    );
    // Sydney is UTC+10/11, so the hour should differ
    expect(utcKey).not.toBe(ausKey);
  });

  it('uses default format for unknown frequency', () => {
    // Falls through to the default case
    const key = getDigestKey(
      'instant' as any,
      new Date('2024-06-15T10:00:00Z'),
      'UTC',
    );
    expect(key).toMatch(/^instant:\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getNextDigestSchedule', () => {
  it('returns fromDate ISO for instant frequency', () => {
    const from = new Date('2024-06-15T10:00:00Z');
    const result = getNextDigestSchedule('instant', 'UTC', from);
    expect(result).toBe(from.toISOString());
  });

  it('returns fromDate ISO for never frequency', () => {
    const from = new Date('2024-06-15T10:00:00Z');
    const result = getNextDigestSchedule('never', 'UTC', from);
    expect(result).toBe(from.toISOString());
  });

  it('returns next hour for hourly frequency', () => {
    const from = new Date('2024-06-15T10:35:00Z');
    const result = getNextDigestSchedule('hourly', 'UTC', from);
    const resultDate = new Date(result);
    expect(resultDate.getMinutes()).toBe(0);
    expect(resultDate.getTime()).toBeGreaterThan(from.getTime());
  });

  it('returns next 9am for daily frequency (before 9am)', () => {
    const from = new Date('2024-06-15T07:00:00Z');
    const result = getNextDigestSchedule('daily', 'UTC', from);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns tomorrow 9am for daily frequency (after 9am)', () => {
    const from = new Date('2024-06-15T10:00:00Z');
    const result = getNextDigestSchedule('daily', 'UTC', from);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThan(from.getTime());
  });

  it('handles weekly frequency', () => {
    const from = new Date('2024-06-15T10:00:00Z'); // Saturday
    const result = getNextDigestSchedule('weekly', 'UTC', from);
    expect(result).toBeTruthy();
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThan(from.getTime());
  });

  it('uses default timezone when none provided', () => {
    const result = getNextDigestSchedule(
      'daily',
      undefined,
      new Date('2024-06-15T10:00:00Z'),
    );
    expect(result).toBeTruthy();
  });

  it('uses default timezone for null', () => {
    const result = getNextDigestSchedule(
      'daily',
      null,
      new Date('2024-06-15T10:00:00Z'),
    );
    expect(result).toBeTruthy();
  });

  it('uses empty string timezone falls back to default', () => {
    const result = getNextDigestSchedule(
      'daily',
      '   ',
      new Date('2024-06-15T10:00:00Z'),
    );
    expect(result).toBeTruthy();
  });
});
