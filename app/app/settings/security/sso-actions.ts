'use server';

import { getOrgIdForUser } from '@/app/app/actions/enforcement';
import { requireEntitlement } from '@/lib/billing/entitlements';
import { upsertOrgSsoConfig } from '@/lib/sso/org-sso';

export async function saveOrgSsoConfigAction(input: {
  orgId: string;
  enabled: boolean;
  enforceSso: boolean;
  allowedDomains: string[];
  idpMetadataXml: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOrgIdForUser();
  if ('error' in ctx) return { ok: false, error: ctx.error };

  if (ctx.orgId !== input.orgId) {
    return { ok: false, error: 'Organization mismatch.' };
  }

  if (!ctx.role || !['owner', 'admin'].includes(ctx.role)) {
    return { ok: false, error: 'Insufficient permissions.' };
  }

  if (input.enabled || input.enforceSso) {
    try {
      await requireEntitlement(input.orgId, 'sso_saml');
    } catch {
      return {
        ok: false,
        error: input.enforceSso
          ? 'SSO enforcement is available on Enterprise plans only.'
          : 'SAML SSO is available on Enterprise plans only.',
      };
    }
  }

  if (input.enforceSso && !input.enabled) {
    return {
      ok: false,
      error: 'Enable SSO before enforcing SSO.',
    };
  }

  return await upsertOrgSsoConfig({
    orgId: input.orgId,
    enabled: Boolean(input.enabled),
    enforceSso: Boolean(input.enforceSso),
    allowedDomains: Array.isArray(input.allowedDomains)
      ? input.allowedDomains
      : [],
    idpMetadataXml: input.idpMetadataXml,
  });
}
