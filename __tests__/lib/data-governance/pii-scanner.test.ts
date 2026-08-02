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

  // Audit 2026-08-02: the truncation assertion used to sit inside
  // `if (result.length > 0)`. If email detection regressed and scanRecord
  // returned nothing, the test passed with zero assertions executed — hiding
  // both the detection break and any truncation bug. Truncation matters here
  // because samples are written into scan reports and logs.
  it('truncates samples to 64 chars', () => {
    const longEmail = 'a'.repeat(100) + '@test.com';
    const result = scanRecord({ email: longEmail });
    expect(result).toHaveLength(1);
    expect(result[0].indicators).toContain('email');
    expect(result[0].sample).toBe(longEmail.slice(0, 64));
    expect(result[0].sample).toHaveLength(64);
    // The untruncated value must not survive into the finding.
    expect(result[0].sample).not.toContain('@test.com');
  });

  it('truncates non-string samples through their JSON form', () => {
    const {
      inferClassificationForField,
    } = require('@/lib/data-governance/classification');
    inferClassificationForField.mockReturnValue({
      level: 'confidential',
      reason: 'Address',
    });
    const longValue = { note: 'b'.repeat(200) };
    const result = scanRecord({ home_address: longValue });
    expect(result).toHaveLength(1);
    expect(result[0].sample).toHaveLength(64);
    expect(result[0].sample).toBe(JSON.stringify(longValue).slice(0, 64));
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
