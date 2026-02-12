import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { parseIdpMetadataXml, type OrgSsoConfig } from '@/lib/sso/saml';

export async function getOrgSsoConfig(orgId: string): Promise<OrgSsoConfig | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('organization_sso')
    .select('enabled, enforce_sso, idp_metadata_xml, idp_entity_id, sso_url, certificate, allowed_domains')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[org-sso] getOrgSsoConfig error:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    enabled: Boolean((data as any).enabled),
    enforceSso: Boolean((data as any).enforce_sso),
    idpMetadataXml: (data as any).idp_metadata_xml ?? null,
    idpEntityId: (data as any).idp_entity_id ?? null,
    ssoUrl: (data as any).sso_url ?? null,
    certificate: (data as any).certificate ?? null,
    allowedDomains: Array.isArray((data as any).allowed_domains)
      ? ((data as any).allowed_domains as string[])
      : [],
  };
}

export async function upsertOrgSsoConfig(params: {
  orgId: string;
  enabled: boolean;
  enforceSso: boolean;
  allowedDomains: string[];
  idpMetadataXml: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const parsed = params.idpMetadataXml
    ? parseIdpMetadataXml(params.idpMetadataXml)
    : { entityId: null, ssoUrl: null, certificate: null };

  const { error } = await supabase
    .from('organization_sso')
    .upsert(
      {
        organization_id: params.orgId,
        provider: 'saml',
        enabled: params.enabled,
        enforce_sso: params.enforceSso,
        allowed_domains: (params.allowedDomains ?? []).map((d) => d.trim()).filter(Boolean),
        idp_metadata_xml: params.idpMetadataXml,
        idp_entity_id: parsed.entityId,
        sso_url: parsed.ssoUrl,
        certificate: parsed.certificate,
      },
      { onConflict: 'organization_id' },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Discover org SSO by email domain. This uses the service role client so it can
 * be called from unauthenticated sign-in flows without relaxing RLS.
 */
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

  const orgId = (data as any).organization_id as string;
  const enabled = Boolean((data as any).enabled);
  const enforceConfigured = Boolean((data as any).enforce_sso);

  // Commercial gate: only enforce SSO for active Enterprise plan orgs.
  let enforceSso = false;
  try {
    const { data: sub } = await admin
      .from('org_subscriptions')
      .select('plan_key, status')
      .eq('organization_id', orgId)
      .maybeSingle();
    const isActive = (sub as any)?.status === 'active' || (sub as any)?.status === 'trialing';
    const isEnterprise = (sub as any)?.plan_key === 'enterprise';
    enforceSso = Boolean(enabled && enforceConfigured && isActive && isEnterprise);
  } catch {
    enforceSso = false;
  }

  return {
    ok: true,
    orgId,
    enabled,
    enforceSso,
  };
}
