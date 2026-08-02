import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { MFAEnrollment } from '@/components/settings/mfa-enrollment';
import { SetPasswordForm } from '@/components/settings/set-password-form';
import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { entitlementName } from '@/lib/billing/entitlement-labels';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
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
      ? `${entitlementName('sso_saml')} is available on the Enterprise plan. Upgrade to connect your identity provider.`
      : null;
  const directoryDisabledReason = !canManageSecurity
    ? 'Only workspace owners and admins can manage directory sync.'
    : directoryEntitlement?.enabled !== true
      ? `${entitlementName('directory_sync')} is available on the Enterprise plan. Upgrade to keep members in step with your directory.`
      : null;

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Security"
        description="Passwords, multi-factor authentication, single sign-on, and directory sync."
      />

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
    </SettingsPageShell>
  );
}
