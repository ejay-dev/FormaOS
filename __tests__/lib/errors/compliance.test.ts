/**
 * Tests for lib/compliance/enforcement-types.ts
 * Already exists at __tests__/lib/compliance/enforcement-types.test.ts
 * This adds additional edge case tests
 */

import { ComplianceBlockedError } from '@/lib/errors/compliance';

describe('ComplianceBlockedError', () => {
  it('constructs with gate and blocks', () => {
    const blocks = [
      {
        id: 'b1',
        gate_key: 'AUDIT_EXPORT',
        reason: 'Missing evidence',
        metadata: {},
      },
    ];
    const err = new ComplianceBlockedError('AUDIT_EXPORT', blocks);
    expect(err.message).toBe('Compliance gate blocked: AUDIT_EXPORT');
    expect(err.name).toBe('ComplianceBlockedError');
    expect(err.gate).toBe('AUDIT_EXPORT');
    expect(err.blocks).toEqual(blocks);
  });

  it('constructs with empty blocks array', () => {
    const err = new ComplianceBlockedError('CERT_REPORT', []);
    expect(err.gate).toBe('CERT_REPORT');
    expect(err.blocks).toHaveLength(0);
  });

  it('is an instance of Error', () => {
    const err = new ComplianceBlockedError('FRAMEWORK_SOC2', []);
    expect(err).toBeInstanceOf(Error);
  });

  it('handles multiple blocks', () => {
    const blocks = [
      {
        id: 'b1',
        gate_key: 'FRAMEWORK_ISO27001',
        reason: 'r1',
        metadata: { a: 1 },
      },
      {
        id: 'b2',
        gate_key: 'FRAMEWORK_ISO27001',
        reason: 'r2',
        metadata: null,
      },
    ];
    const err = new ComplianceBlockedError('FRAMEWORK_ISO27001', blocks);
    expect(err.blocks).toHaveLength(2);
  });

  it('preserves metadata in blocks', () => {
    const meta = { controlId: 'CC1.1', severity: 'high' };
    const blocks = [
      { id: 'b1', gate_key: 'FRAMEWORK_HIPAA', reason: 'test', metadata: meta },
    ];
    const err = new ComplianceBlockedError('FRAMEWORK_HIPAA', blocks);
    expect(err.blocks[0].metadata).toEqual(meta);
  });
});
