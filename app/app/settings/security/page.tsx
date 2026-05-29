import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { MFAEnrollment } from '@/components/settings/mfa-enrollment';
import { SetPasswordForm } from '@/components/settings/set-password-form';
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

  if (!user) redirect('/auth/signin?next=/app/settings/security');

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

  // Detect whether this user has an email/password identity yet.
  // Users provisioned by the admin onboarding script (admin.createUser)
  // have an empty `identities` array — they need the "Set a password"
  // copy. Existing users see "Change password" instead.
  const adminClient = createSupabaseAdminClient();
  let hasPassword = false;
  try {
    const { data: adminUser } = await adminClient.auth.admin.getUserById(
      user.id,
    );
    hasPassword = Boolean(
      adminUser?.user?.identities?.some((i) => i.provider === 'email'),
    );
  } catch {
    // Best-effort; if the lookup fails, default the copy to "Set a password"
    // (worst case the user sees the first-time copy on a change flow).
    hasPassword = false;
  }
  const orgId = membership?.organization_id as string | undefined;
  const [{ data: ssoEntitlement }, { data: directoryEntitlement }] = orgId
    ? await Promise.all([
        supabase
          .from('org_entitlements')
          .select('enabled')
          .eq('organization_id', orgId)
          .eq('feature_key', 'sso_saml')
          .maybeSingle(),
        supabase
          .from('org_entitlements')
          .select('enabled')
          .eq('organization_id', orgId)
          .eq('feature_key', 'directory_sync')
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const orgSso = orgId ? await getOrgSsoConfig(orgId) : null;
  const sp = orgId ? buildServiceProviderUrls(orgId) : null;
  const directoryStatus = orgId
    ? await getDirectorySyncStatus(orgId)
    : { configs: [], runs: [] };
  const canManageSecurity =
    membership?.role === 'owner' || membership?.role === 'admin';
  const ssoDisabledReason = !canManageSecurity
    ? 'Only workspace owners and admins can manage SSO.'
    : ssoEntitlement?.enabled !== true
      ? 'SAML SSO requires the sso_saml Enterprise entitlement.'
      : null;
  const directoryDisabledReason = !canManageSecurity
    ? 'Only workspace owners and admins can manage directory sync.'
    : directoryEntitlement?.enabled !== true
      ? 'Directory sync requires the directory_sync Enterprise entitlement.'
      : null;

  return (
    <div className="space-y-8 pb-24 max-w-5xl animate-in fade-in duration-700">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Security Controls
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure enterprise authentication and access protections.
            </p>
          </div>
        </div>
        <Link
          href="/app/settings"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground/90"
        >
          ← Back to Settings
        </Link>
      </header>

      <SetPasswordForm hasPassword={hasPassword} />

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
          disabledReason={ssoDisabledReason}
        />
      ) : null}

      {orgId ? (
        <DirectorySyncPanel
          orgId={orgId}
          initialProvider={orgSso?.directorySyncProvider ?? ''}
          initialIntervalMinutes={orgSso?.directorySyncIntervalMinutes ?? 60}
          initialConfig={orgSso?.directorySyncConfig ?? {}}
          initialStatus={directoryStatus}
          disabledReason={directoryDisabledReason}
        />
      ) : null}
    </div>
  );
}
