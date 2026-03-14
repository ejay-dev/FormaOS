import { inferClassificationForField } from '@/lib/data-governance/classification';
import { scanRecord } from '@/lib/data-governance/pii-scanner';

describe('Governance helpers', () => {
  it('classifies sensitive fields by name', () => {
    expect(inferClassificationForField('email').level).toBe('confidential');
    expect(inferClassificationForField('bank_account').level).toBe('restricted');
    expect(inferClassificationForField('status').level).toBe('internal');
  });

  it('detects pii indicators in records', () => {
    const findings = scanRecord({
      email: 'person@example.com',
      phone: '+61 400 000 000',
      notes: 'N/A',
    });

    expect(findings.map((finding) => finding.field)).toEqual(
      expect.arrayContaining(['email', 'phone']),
    );
  });
});
