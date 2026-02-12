'use server';

import { getOrgIdForUser } from '@/app/app/actions/enforcement';
import { upsertOrgSsoConfig } from '@/lib/sso/org-sso';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function saveOrgSsoConfigAction(input: {
  orgId: string;
  enabled: boolean;
  enforceSso: boolean;
  allowedDomains: string[];
  idpMetadataXml: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOrgIdForUser();

  if (ctx.orgId !== input.orgId) {
    return { ok: false, error: 'Organization mismatch.' };
  }

  if (!ctx.role || !['owner', 'admin'].includes(ctx.role)) {
    return { ok: false, error: 'Insufficient permissions.' };
  }

  // Enterprise identity gate: SAML SSO is reserved for enterprise plans by default.
  // (This is a commercial gate and a procurement expectation.)
  const supabase = await createSupabaseServerClient();
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('plan_key, status')
    .eq('organization_id', input.orgId)
    .maybeSingle();

  const planKey = (sub as any)?.plan_key ?? null;
  const status = (sub as any)?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';
  const isEnterprise = planKey === 'enterprise';

  if (input.enabled && (!isActive || !isEnterprise)) {
    return {
      ok: false,
      error: 'SAML SSO is available on Enterprise plans only.',
    };
  }

  if (input.enforceSso && (!isActive || !isEnterprise)) {
    return {
      ok: false,
      error: 'SSO enforcement is available on Enterprise plans only.',
    };
  }

  return await upsertOrgSsoConfig({
    orgId: input.orgId,
    enabled: Boolean(input.enabled),
    enforceSso: Boolean(input.enforceSso),
    allowedDomains: Array.isArray(input.allowedDomains) ? input.allowedDomains : [],
    idpMetadataXml: input.idpMetadataXml,
  });
}
