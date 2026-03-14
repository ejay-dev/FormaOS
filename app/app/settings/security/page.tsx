import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MFAEnrollment } from '@/components/settings/mfa-enrollment';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
import { ShieldCheck } from 'lucide-react';
import { SsoConfigPanel } from '@/components/settings/sso-config';
import { DirectorySyncPanel } from '@/components/settings/directory-sync';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { buildServiceProviderUrls } from '@/lib/sso/saml';
import { getDirectorySyncStatus } from '@/lib/sso/directory-sync';

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
  const directoryStatus = orgId
    ? await getDirectorySyncStatus(orgId)
    : { configs: [], runs: [] };

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
        <SsoConfigPanel
          orgId={orgId}
          initial={{
            enabled: orgSso?.enabled ?? false,
            enforceSso: orgSso?.enforceSso ?? false,
            allowedDomains: orgSso?.allowedDomains ?? [],
            idpMetadataXml: orgSso?.idpMetadataXml ?? null,
            jitProvisioningEnabled: orgSso?.jitProvisioningEnabled ?? false,
            jitDefaultRole: orgSso?.jitDefaultRole ?? 'member',
          }}
          sp={{
            metadataUrl: sp.metadataUrl,
            acsUrl: sp.acsUrl,
            entityId: sp.metadataUrl,
          }}
        />
      ) : null}

      {orgId ? (
        <DirectorySyncPanel
          orgId={orgId}
          initialProvider={orgSso?.directorySyncProvider ?? ''}
          initialIntervalMinutes={orgSso?.directorySyncIntervalMinutes ?? 60}
          initialConfig={orgSso?.directorySyncConfig ?? {}}
          initialStatus={directoryStatus}
        />
      ) : null}
    </div>
  );
}
