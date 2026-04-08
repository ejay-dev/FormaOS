jest.mock('@/lib/data-governance/classification', () => ({
  inferClassificationForField: jest.fn(() => ({
    level: 'public',
    reason: 'No sensitive',
  })),
}));

jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => {
  const q: Record<string, jest.Mock> = {};
  q.from = jest.fn(() => q);
  q.select = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  q.insert = jest.fn(() => Promise.resolve({ error: null }));
  q.then = jest.fn((r: Function) => r({ data: [], error: null }));
  return { createSupabaseAdminClient: () => q, __q: q };
});

import { scanRecord } from '@/lib/data-governance/pii-scanner';

describe('scanRecord', () => {
  it('returns empty for non-sensitive data', () => {
    const result = scanRecord({ id: '123', color: 'blue' });
    expect(result).toEqual([]);
  });

  it('detects email patterns', () => {
    const result = scanRecord({ contact_email: 'test@example.com' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].indicators).toContain('email');
  });

  it('detects phone patterns', () => {
    const result = scanRecord({ phone: '+61412345678' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].indicators).toContain('phone');
  });

  it('detects SSN patterns', () => {
    const result = scanRecord({ ssn_field: '123-45-6789' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects TFN patterns', () => {
    const result = scanRecord({ tfn: '123 456 789' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects date of birth patterns', () => {
    const result = scanRecord({ birthday: '1990-01-15' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].indicators).toContain('dob');
  });

  it('detects address patterns', () => {
    const result = scanRecord({ home: '123 Main Street' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].indicators).toContain('address');
  });

  it('uses name-based rules for sensitive field names', () => {
    const {
      inferClassificationForField,
    } = require('@/lib/data-governance/classification');
    inferClassificationForField.mockReturnValue({
      level: 'confidential',
      reason: 'Contact',
    });
    const result = scanRecord({ phone_number: 'N/A' });
    // phone_number field name triggers name-based classification
    expect(result.length).toBeGreaterThan(0);
  });

  it('truncates samples to 64 chars', () => {
    const longEmail = 'a'.repeat(100) + '@test.com';
    const result = scanRecord({ email: longEmail });
    if (result.length > 0) {
      expect(result[0].sample.length).toBeLessThanOrEqual(64);
    }
  });

  it('handles null and undefined values', () => {
    const result = scanRecord({ email: null, phone: undefined });
    // Should not throw
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles numeric values', () => {
    const result = scanRecord({ amount: 12345 });
    expect(Array.isArray(result)).toBe(true);
  });
});
