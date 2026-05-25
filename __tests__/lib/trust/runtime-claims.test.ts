/**
 * @jest-environment node
 *
 * High-19: signTrustPacket / verifyTrustPacketSignature contract.
 */

import {
  computeTrustClaims,
  signTrustPacket,
  verifyTrustPacketSignature,
} from '@/lib/trust/runtime-claims';

describe('trust packet signing', () => {
  beforeAll(() => {
    process.env.TRUST_PACKET_SIGNING_KEY = 'test-trust-key-for-jest';
  });

  it('signs and verifies a stable payload', () => {
    const payload = { hello: 'world', n: 1, nested: { a: [1, 2, 3] } };
    const { signature } = signTrustPacket(payload);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyTrustPacketSignature(payload, signature)).toBe(true);
  });

  it('rejects a modified payload', () => {
    const original = { hello: 'world' };
    const { signature } = signTrustPacket(original);
    const tampered = { hello: 'world!' };
    expect(verifyTrustPacketSignature(tampered, signature)).toBe(false);
  });

  it('rejects a malformed signature without throwing', () => {
    expect(verifyTrustPacketSignature({ a: 1 }, 'not-hex')).toBe(false);
    expect(verifyTrustPacketSignature({ a: 1 }, '')).toBe(false);
  });
});

describe('computeTrustClaims', () => {
  it('marks SSO as provisioned only when an enabled SSO config exists', () => {
    const noSso = computeTrustClaims({
      hasAuditLogs: true,
      hasMfaEnabled: false,
      ssoConfig: null,
    });
    expect(noSso.sso_provisioned).toBe(false);

    const withDisabledSso = computeTrustClaims({
      hasAuditLogs: true,
      hasMfaEnabled: false,
       
      ssoConfig: { enabled: false } as any,
    });
    expect(withDisabledSso.sso_provisioned).toBe(false);

    const withEnabledSso = computeTrustClaims({
      hasAuditLogs: true,
      hasMfaEnabled: false,
       
      ssoConfig: { enabled: true } as any,
    });
    expect(withEnabledSso.sso_provisioned).toBe(true);
  });

  it('reflects FORMAOS_STORAGE_ENCRYPTED_AT_REST=false in the claim', () => {
    const original = process.env.FORMAOS_STORAGE_ENCRYPTED_AT_REST;
    process.env.FORMAOS_STORAGE_ENCRYPTED_AT_REST = 'false';
    const claims = computeTrustClaims({
      hasAuditLogs: true,
      hasMfaEnabled: true,
      ssoConfig: null,
    });
    expect(claims.encryption_at_rest).toBe(false);
    if (original === undefined) delete process.env.FORMAOS_STORAGE_ENCRYPTED_AT_REST;
    else process.env.FORMAOS_STORAGE_ENCRYPTED_AT_REST = original;
  });
});
