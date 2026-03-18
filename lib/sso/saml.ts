import { load as loadCheerio } from 'cheerio';
import { SAML, ValidateInResponseTo, type Profile } from '@node-saml/node-saml';
import { getRedisClient } from '@/lib/redis/client';

export type DirectorySyncProvider = 'azure-ad' | 'okta' | 'google-workspace';
export type OrgSsoConfig = {
  enabled: boolean;
  enforceSso: boolean;
  idpMetadataXml: string | null;
  idpEntityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
  logoutUrl: string | null;
  allowedDomains: string[];
  jitProvisioningEnabled: boolean;
  jitDefaultRole: 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';
  directorySyncEnabled: boolean;
  directorySyncProvider: DirectorySyncProvider | null;
  directorySyncIntervalMinutes: number;
  directorySyncConfig: Record<string, unknown>;
  updatedAt?: string | null;
};

export type ParsedIdpMetadata = {
  entityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
  logoutUrl: string | null;
};

function normalizeCert(cert: string): string {
  return cert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function parseIdpMetadataXml(xml: string): ParsedIdpMetadata {
  const $ = loadCheerio(xml, { xmlMode: true });
  const entityId = $('EntityDescriptor').attr('entityID') ?? null;

  const redirectNode = $('IDPSSODescriptor SingleSignOnService[Binding*="HTTP-Redirect"]').first();
  const postNode = $('IDPSSODescriptor SingleSignOnService[Binding*="HTTP-POST"]').first();
  const sloNode = $('IDPSSODescriptor SingleLogoutService[Binding*="HTTP-Redirect"]').first();
  const anySloNode = $('IDPSSODescriptor SingleLogoutService').first();
  const signingCertNode = $('IDPSSODescriptor KeyDescriptor[use="signing"] X509Certificate').first();
  const anyCertNode = $('IDPSSODescriptor KeyDescriptor X509Certificate').first();

  const certRaw = signingCertNode.text() || anyCertNode.text() || '';

  return {
    entityId,
    ssoUrl: (redirectNode.attr('Location') ?? postNode.attr('Location') ?? null)?.trim() ?? null,
    certificate: certRaw ? normalizeCert(certRaw) : null,
    logoutUrl: (sloNode.attr('Location') ?? anySloNode.attr('Location') ?? null)?.trim() ?? null,
  };
}

function getAppBase() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function buildCacheProvider(prefix: string) {
  const redis = getRedisClient();

  if (!redis) {
    const mem = new Map<string, { value: string; createdAt: number }>();
    return {
      async saveAsync(key: string, value: string) {
        const createdAt = Date.now();
        mem.set(key, { value, createdAt });
        return { value, createdAt };
      },
      async getAsync(key: string) {
        return mem.get(key)?.value ?? null;
      },
      async removeAsync(key: string | null) {
        if (!key) return null;
        const existing = mem.get(key);
        mem.delete(key);
        return existing?.value ?? null;
      },
    };
  }

  return {
    async saveAsync(key: string, value: string) {
      const createdAt = Date.now();
      await redis.set(`${prefix}:${key}`, value, { ex: 10 * 60 });
      return { value, createdAt };
    },
    async getAsync(key: string) {
      return (await redis.get<string>(`${prefix}:${key}`)) ?? null;
    },
    async removeAsync(key: string | null) {
      if (!key) return null;
      const redisKey = `${prefix}:${key}`;
      const value = await redis.get<string>(redisKey);
      await redis.del(redisKey);
      return value ?? null;
    },
  };
}

export function buildServiceProviderUrls(orgId: string) {
  const appBase = getAppBase();
  return {
    appBase,
    loginUrl: `${appBase}/api/sso/saml/login/${orgId}`,
    acsUrl: `${appBase}/api/sso/saml/acs/${orgId}`,
    metadataUrl: `${appBase}/api/sso/saml/metadata/${orgId}`,
    sloUrl: `${appBase}/api/sso/saml/logout/${orgId}`,
  };
}

export function createSamlClient(params: {
  orgId: string;
  idp: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl'>;
}) {
  const urls = buildServiceProviderUrls(params.orgId);
  const privateKey = (process.env.SAML_SP_PRIVATE_KEY ?? '').trim();
  const publicCert = (process.env.SAML_SP_PUBLIC_CERT ?? '').trim();

  if (!params.idp.ssoUrl || !params.idp.certificate) {
    throw new Error('SSO not configured');
  }

  const saml = new SAML({
    entryPoint: params.idp.ssoUrl,
    logoutUrl: params.idp.logoutUrl ?? params.idp.ssoUrl,
    idpCert: params.idp.certificate,
    idpIssuer: params.idp.idpEntityId ?? undefined,
    issuer: urls.metadataUrl,
    callbackUrl: urls.acsUrl,
    logoutCallbackUrl: urls.sloUrl,
    audience: urls.metadataUrl,
    acceptedClockSkewMs: 2 * 60 * 1000,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    validateInResponseTo: ValidateInResponseTo.ifPresent,
    requestIdExpirationPeriodMs: 10 * 60 * 1000,
    cacheProvider: buildCacheProvider(`saml:${params.orgId}`),
    ...(privateKey
      ? {
          privateKey,
          publicCert: publicCert || undefined,
        }
      : {}),
  });

  return { saml, urls };
}

export function isAllowedDomain(email: string, allowedDomains: string[]) {
  if (!allowedDomains.length) return true;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? allowedDomains.map((item) => item.toLowerCase()).includes(domain) : false;
}

export function getSamlEmail(profile: Profile) {
  const email =
    (profile.email as string | undefined) ??
    (profile.mail as string | undefined) ??
    (profile['urn:oid:0.9.2342.19200300.100.1.3'] as string | undefined) ??
    profile.nameID;
  return typeof email === 'string' ? email.toLowerCase() : null;
}

export function getSamlDisplayName(profile: Profile) {
  const firstName =
    (profile.firstName as string | undefined) ??
    (profile.givenName as string | undefined) ??
    '';
  const lastName =
    (profile.lastName as string | undefined) ??
    (profile.sn as string | undefined) ??
    '';
  const fullName =
    (profile.displayName as string | undefined) ??
    (profile.cn as string | undefined) ??
    `${firstName} ${lastName}`.trim();

  return fullName || getSamlEmail(profile) || profile.nameID;
}

export function getSamlGroups(profile: Profile): string[] {
  const groups = (profile.groups ??
    profile.Groups ??
    profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] ??
    []) as unknown;

  if (Array.isArray(groups)) {
    return groups.map((group) => String(group));
  }

  if (typeof groups === 'string') {
    return [groups];
  }

  return [];
}

export async function buildSpInitiatedLoginUrl(args: {
  orgId: string;
  ssoConfig: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl'>;
  relayState: string;
  host?: string;
}) {
  const { saml } = createSamlClient({
    orgId: args.orgId,
    idp: args.ssoConfig,
  });

  return saml.getAuthorizeUrlAsync(args.relayState, args.host, {});
}

export async function validateSamlResponse(args: {
  orgId: string;
  ssoConfig: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl' | 'allowedDomains'>;
  samlResponse: string;
  relayState?: string | null;
}) {
  const { saml, urls } = createSamlClient({
    orgId: args.orgId,
    idp: args.ssoConfig,
  });

  const result = await saml.validatePostResponseAsync({
    SAMLResponse: args.samlResponse,
    RelayState: args.relayState ?? '',
  });

  if (!result.profile) {
    throw new Error('Missing SAML profile');
  }

  const email = getSamlEmail(result.profile);
  if (!email) {
    throw new Error('Missing SAML email');
  }

  if (!isAllowedDomain(email, args.ssoConfig.allowedDomains)) {
    throw new Error('Email domain is not allowed for this SSO configuration');
  }

  return {
    ...result,
    email,
    displayName: getSamlDisplayName(result.profile),
    groups: getSamlGroups(result.profile),
    audience: urls.metadataUrl,
  };
}

export async function buildSingleLogoutUrl(args: {
  orgId: string;
  ssoConfig: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl'>;
  profile: Profile;
  relayState?: string;
}) {
  const { saml } = createSamlClient({
    orgId: args.orgId,
    idp: args.ssoConfig,
  });

  return saml.getLogoutUrlAsync(args.profile, args.relayState ?? '', {});
}

export async function validateSingleLogoutRequest(args: {
  orgId: string;
  ssoConfig: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl'>;
  samlRequest: string;
}) {
  const { saml } = createSamlClient({
    orgId: args.orgId,
    idp: args.ssoConfig,
  });

  return saml.validatePostRequestAsync({
    SAMLRequest: args.samlRequest,
  });
}

export function generateSpMetadataXml(args: {
  orgId: string;
  ssoConfig: Pick<OrgSsoConfig, 'ssoUrl' | 'certificate' | 'idpEntityId' | 'logoutUrl'>;
}) {
  const { saml } = createSamlClient({
    orgId: args.orgId,
    idp: args.ssoConfig,
  });
  const publicCert = (process.env.SAML_SP_PUBLIC_CERT ?? '').trim();
  return saml.generateServiceProviderMetadata(null, publicCert || null);
}
