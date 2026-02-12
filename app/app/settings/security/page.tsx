import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MFAEnrollment } from '@/components/settings/mfa-enrollment';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
import { ShieldCheck } from 'lucide-react';
import { SsoSettings } from '@/components/settings/SsoSettings';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { buildServiceProviderUrls } from '@/lib/sso/saml';

export default async function SecuritySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role, mfa_required')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  const required =
    membership?.mfa_required ??
    roleRequiresMFA(membership?.role ?? null);
  const enabled = security?.two_factor_enabled ?? false;
  const orgId = (membership as any)?.organization_id as string | undefined;
  const orgSso = orgId ? await getOrgSsoConfig(orgId) : null;
  const sp = orgId ? buildServiceProviderUrls(orgId) : null;
  const spSigningAvailable = Boolean((process.env.SAML_SP_PRIVATE_KEY ?? '').trim());

  return (
    <div className="space-y-8 pb-24 max-w-5xl animate-in fade-in duration-700">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              Security Controls
            </h1>
            <p className="text-sm text-slate-400">
              Configure enterprise authentication and access protections.
            </p>
          </div>
        </div>
        <Link
          href="/app/settings"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          ← Back to Settings
        </Link>
      </header>

      <MFAEnrollment initialEnabled={enabled} required={Boolean(required)} />

      {orgId && sp ? (
        <SsoSettings
          orgId={orgId}
          initial={{
            enabled: orgSso?.enabled ?? false,
            enforceSso: orgSso?.enforceSso ?? false,
            allowedDomains: orgSso?.allowedDomains ?? [],
            idpMetadataXml: orgSso?.idpMetadataXml ?? null,
            idpEntityId: orgSso?.idpEntityId ?? null,
            ssoUrl: orgSso?.ssoUrl ?? null,
            certificatePresent: Boolean(orgSso?.certificate),
          }}
          sp={{ metadataUrl: sp.metadataUrl, acsUrl: sp.acsUrl }}
          spSigningAvailable={spSigningAvailable}
        />
      ) : null}
    </div>
  );
}
