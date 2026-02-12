/**
 * Enterprise SAML SSO (SP) implementation.
 *
 * Design goals:
 * - Multi-tenant: org-specific ACS + metadata endpoints.
 * - No inflated claims: only support what we implement here.
 * - Safe defaults: validate assertion signatures, issuer, audience where possible.
 *
 * Note: This uses `@node-saml/node-saml` (the same core used by `@node-saml/passport-saml`)
 * for AuthnRequest generation and assertion validation.
 */

import { load as loadCheerio } from 'cheerio';
import { SAML, type CacheProvider, ValidateInResponseTo } from '@node-saml/node-saml';
import { getRedisClient } from '@/lib/redis/client';

export type OrgSsoConfig = {
  enabled: boolean;
  enforceSso: boolean;
  idpMetadataXml: string | null;
  idpEntityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
  allowedDomains: string[];
};

export type ParsedIdpMetadata = {
  entityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
};

function normalizeCert(cert: string): string {
  return cert.replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function parseIdpMetadataXml(xml: string): ParsedIdpMetadata {
  const $ = loadCheerio(xml, { xmlMode: true });

  const entityId = $('EntityDescriptor').attr('entityID') ?? null;

  // Prefer HTTP-Redirect binding for login initiation.
  const redirectNode = $('IDPSSODescriptor SingleSignOnService[Binding*="HTTP-Redirect"]').first();
  const postNode = $('IDPSSODescriptor SingleSignOnService[Binding*="HTTP-POST"]').first();
  const ssoUrl =
    redirectNode.attr('Location') ??
    postNode.attr('Location') ??
    null;

  // Prefer signing cert, then take the first available.
  const signingCertNode =
    $('IDPSSODescriptor KeyDescriptor[use="signing"] X509Certificate').first();
  const anyCertNode =
    $('IDPSSODescriptor KeyDescriptor X509Certificate').first();
  const certRaw = signingCertNode.text() || anyCertNode.text() || '';
  const certificate = certRaw ? normalizeCert(certRaw) : null;

  return {
    entityId,
    ssoUrl: ssoUrl ? ssoUrl.trim() : null,
    certificate,
  };
}

function getAppBase(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  if (!base) {
    // Safe fallback for local / misconfigured environments. Keep deterministic.
    return 'http://localhost:3000';
  }
  return base;
}

function buildCacheProvider(prefix: string): CacheProvider {
  const redis = getRedisClient();

  // If Redis is not configured, fall back to in-memory Map. This degrades
  // "InResponseTo" validation but keeps SAML functional in dev.
  if (!redis) {
    const mem = new Map<string, { value: string; createdAt: number }>();
    return {
      async saveAsync(key: string, value: string) {
        const createdAt = Date.now();
        mem.set(key, { value, createdAt });
        return { value, createdAt };
      },
      async getAsync(key: string) {
        const v = mem.get(key);
        return v ? v.value : null;
      },
      async removeAsync(key: string | null) {
        if (!key) return null;
        const v = mem.get(key);
        mem.delete(key);
        return v ? v.value : null;
      },
    };
  }

  return {
    async saveAsync(key: string, value: string) {
      const createdAt = Date.now();
      const redisKey = `${prefix}:${key}`;
      // Store createdAt as value for node-saml time checks.
      await redis.set(redisKey, String(createdAt), { ex: 10 * 60 }); // 10 minutes
      return { value: String(createdAt), createdAt };
    },
    async getAsync(key: string) {
      const redisKey = `${prefix}:${key}`;
      const v = await redis.get<string>(redisKey);
      return v ?? null;
    },
    async removeAsync(key: string | null) {
      if (!key) return null;
      const redisKey = `${prefix}:${key}`;
      const v = await redis.get<string>(redisKey);
      await redis.del(redisKey);
      return v ?? null;
    },
  };
}

export function buildServiceProviderUrls(orgId: string) {
  const appBase = getAppBase();
  const acsUrl = `${appBase}/api/sso/saml/acs/${orgId}`;
  const metadataUrl = `${appBase}/api/sso/saml/metadata/${orgId}`;
  return { appBase, acsUrl, metadataUrl };
}

export function createSamlClient(params: {
  orgId: string;
  idp: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId'>;
}) {
  const { appBase, acsUrl, metadataUrl } = buildServiceProviderUrls(params.orgId);

  if (!params.idp.ssoUrl || !params.idp.certificate) {
    throw new Error('SSO not configured (missing IdP SSO URL or certificate).');
  }

  const spPrivateKey = (process.env.SAML_SP_PRIVATE_KEY ?? '').trim();
  const spPublicCert = (process.env.SAML_SP_PUBLIC_CERT ?? '').trim();

  const saml = new SAML({
    // IdP
    entryPoint: params.idp.ssoUrl,
    idpCert: params.idp.certificate,
    idpIssuer: params.idp.idpEntityId ?? undefined,

    // SP
    issuer: metadataUrl, // stable per-org entity ID
    callbackUrl: acsUrl,

    // Security expectations
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    acceptedClockSkewMs: 2 * 60 * 1000,
    audience: metadataUrl,

    // Response validation (InResponseTo) using Redis where available.
    validateInResponseTo: ValidateInResponseTo.ifPresent,
    requestIdExpirationPeriodMs: 10 * 60 * 1000,
    cacheProvider: buildCacheProvider(`saml:${params.orgId}`),

    // Optional request signing if keys are provided.
    ...(spPrivateKey
      ? {
          privateKey: spPrivateKey,
          publicCert: spPublicCert || undefined,
        }
      : {}),
  });

  return { saml, appBase };
}

export function isAllowedDomain(email: string, allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return allowedDomains.map((d) => d.toLowerCase().trim()).includes(domain);
}

