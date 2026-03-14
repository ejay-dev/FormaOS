import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  parseIdpMetadataXml,
  type DirectorySyncProvider,
  type OrgSsoConfig,
} from '@/lib/sso/saml';

type SsoRow = {
  enabled: boolean;
  enforce_sso: boolean;
  idp_metadata_xml: string | null;
  idp_entity_id: string | null;
  sso_url: string | null;
  certificate: string | null;
  logout_url: string | null;
  allowed_domains: string[] | null;
  jit_provisioning_enabled: boolean | null;
  jit_default_role: string | null;
  directory_sync_enabled: boolean | null;
  directory_sync_provider: DirectorySyncProvider | null;
  directory_sync_interval_minutes: number | null;
  directory_sync_config: Record<string, unknown> | null;
  updated_at: string | null;
};

function normalizeDomains(domains: string[] | null | undefined) {
  return (domains ?? []).map((domain) => domain.trim().toLowerCase()).filter(Boolean);
}

export async function getOrgSsoConfig(orgId: string): Promise<OrgSsoConfig | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('organization_sso')
    .select(
      'enabled, enforce_sso, idp_metadata_xml, idp_entity_id, sso_url, certificate, logout_url, allowed_domains, jit_provisioning_enabled, jit_default_role, directory_sync_enabled, directory_sync_provider, directory_sync_interval_minutes, directory_sync_config, updated_at',
    )
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[org-sso] getOrgSsoConfig error:', error.message);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as SsoRow;
  return {
    enabled: Boolean(row.enabled),
    enforceSso: Boolean(row.enforce_sso),
    idpMetadataXml: row.idp_metadata_xml ?? null,
    idpEntityId: row.idp_entity_id ?? null,
    ssoUrl: row.sso_url ?? null,
    certificate: row.certificate ?? null,
    logoutUrl: row.logout_url ?? null,
    allowedDomains: normalizeDomains(row.allowed_domains),
    jitProvisioningEnabled: Boolean(row.jit_provisioning_enabled),
    jitDefaultRole: (row.jit_default_role as OrgSsoConfig['jitDefaultRole']) ?? 'member',
    directorySyncEnabled: Boolean(row.directory_sync_enabled),
    directorySyncProvider: row.directory_sync_provider ?? null,
    directorySyncIntervalMinutes: row.directory_sync_interval_minutes ?? 60,
    directorySyncConfig:
      row.directory_sync_config && typeof row.directory_sync_config === 'object'
        ? row.directory_sync_config
        : {},
    updatedAt: row.updated_at ?? null,
  };
}

export async function upsertOrgSsoConfig(params: {
  orgId: string;
  enabled: boolean;
  enforceSso: boolean;
  allowedDomains: string[];
  idpMetadataXml: string | null;
  jitProvisioningEnabled?: boolean;
  jitDefaultRole?: OrgSsoConfig['jitDefaultRole'];
  directorySyncEnabled?: boolean;
  directorySyncProvider?: DirectorySyncProvider | null;
  directorySyncIntervalMinutes?: number;
  directorySyncConfig?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const parsed = params.idpMetadataXml
    ? parseIdpMetadataXml(params.idpMetadataXml)
    : {
        entityId: null,
        ssoUrl: null,
        certificate: null,
        logoutUrl: null,
      };

  const { error } = await supabase.from('organization_sso').upsert(
    {
      organization_id: params.orgId,
      provider: 'saml',
      enabled: params.enabled,
      enforce_sso: params.enforceSso,
      allowed_domains: normalizeDomains(params.allowedDomains),
      idp_metadata_xml: params.idpMetadataXml,
      idp_entity_id: parsed.entityId,
      sso_url: parsed.ssoUrl,
      certificate: parsed.certificate,
      logout_url: parsed.logoutUrl,
      jit_provisioning_enabled: params.jitProvisioningEnabled ?? false,
      jit_default_role: params.jitDefaultRole ?? 'member',
      directory_sync_enabled: params.directorySyncEnabled ?? false,
      directory_sync_provider: params.directorySyncProvider ?? null,
      directory_sync_interval_minutes: params.directorySyncIntervalMinutes ?? 60,
      directory_sync_config: params.directorySyncConfig ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id' },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function discoverOrgSsoByEmail(email: string): Promise<{
  ok: boolean;
  orgId?: string;
  enabled?: boolean;
  enforceSso?: boolean;
  error?: string;
}> {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) {
    return { ok: false, error: 'invalid_email' };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('organization_sso')
    .select('organization_id, enabled, enforce_sso, allowed_domains')
    .eq('enabled', true)
    .contains('allowed_domains', [domain])
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: 'not_found' };
  }

  const { data: sub } = await admin
    .from('org_subscriptions')
    .select('plan_key, status')
    .eq('organization_id', (data as any).organization_id)
    .maybeSingle();

  const isActive = (sub as any)?.status === 'active' || (sub as any)?.status === 'trialing';
  const isEnterprise = (sub as any)?.plan_key === 'enterprise';

  return {
    ok: true,
    orgId: (data as any).organization_id as string,
    enabled: Boolean((data as any).enabled),
    enforceSso: Boolean((data as any).enforce_sso && isActive && isEnterprise),
  };
}
