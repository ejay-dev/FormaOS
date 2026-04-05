/**
 * Tests for lib/compliance/enforcement-types.ts
 * Covers: ComplianceBlockedError, GateKey type, ComplianceBlock type
 */

import {
  ComplianceBlockedError,
  type GateKey,
  type ComplianceBlock,
} from '@/lib/compliance/enforcement-types';

describe('ComplianceBlockedError', () => {
  const mockBlocks: ComplianceBlock[] = [
    {
      id: 'block-1',
      gate_key: 'AUDIT_EXPORT',
      reason: 'Missing evidence for SOC 2 controls',
      metadata: { controlCount: 3 },
    },
  ];

  it('creates error with correct message', () => {
    const err = new ComplianceBlockedError('AUDIT_EXPORT', mockBlocks);
    expect(err.message).toBe('Compliance gate blocked: AUDIT_EXPORT');
  });

  it('sets error name to ComplianceBlockedError', () => {
    const err = new ComplianceBlockedError('CERT_REPORT', []);
    expect(err.name).toBe('ComplianceBlockedError');
  });

  it('stores the gate key', () => {
    const err = new ComplianceBlockedError('FRAMEWORK_SOC2', mockBlocks);
    expect(err.gate).toBe('FRAMEWORK_SOC2');
  });

  it('stores the blocks array', () => {
    const err = new ComplianceBlockedError('AUDIT_EXPORT', mockBlocks);
    expect(err.blocks).toEqual(mockBlocks);
  });

  it('is an instance of Error', () => {
    const err = new ComplianceBlockedError('AUDIT_EXPORT', mockBlocks);
    expect(err).toBeInstanceOf(Error);
  });

  it('handles empty blocks array', () => {
    const err = new ComplianceBlockedError('FRAMEWORK_HIPAA', []);
    expect(err.blocks).toEqual([]);
    expect(err.gate).toBe('FRAMEWORK_HIPAA');
  });

  it('handles multiple blocks', () => {
    const blocks: ComplianceBlock[] = [
      {
        id: 'b1',
        gate_key: 'AUDIT_EXPORT',
        reason: 'Reason 1',
        metadata: null,
      },
      {
        id: 'b2',
        gate_key: 'AUDIT_EXPORT',
        reason: 'Reason 2',
        metadata: { severity: 'high' },
      },
      {
        id: 'b3',
        gate_key: 'AUDIT_EXPORT',
        reason: 'Reason 3',
        metadata: undefined,
      },
    ];
    const err = new ComplianceBlockedError('AUDIT_EXPORT', blocks);
    expect(err.blocks).toHaveLength(3);
  });

  it('works with all valid gate keys', () => {
    const gates: GateKey[] = [
      'AUDIT_EXPORT',
      'CERT_REPORT',
      'FRAMEWORK_ISO27001',
      'FRAMEWORK_SOC2',
      'FRAMEWORK_HIPAA',
      'FRAMEWORK_NDIS',
    ];
    for (const gate of gates) {
      const err = new ComplianceBlockedError(gate, []);
      expect(err.gate).toBe(gate);
      expect(err.message).toContain(gate);
    }
  });

  it('can be caught as Error', () => {
    expect(() => {
      throw new ComplianceBlockedError('AUDIT_EXPORT', mockBlocks);
    }).toThrow(Error);
  });

  it('can be caught by name', () => {
    try {
      throw new ComplianceBlockedError('CERT_REPORT', []);
    } catch (e) {
      expect((e as ComplianceBlockedError).name).toBe('ComplianceBlockedError');
    }
  });
});
