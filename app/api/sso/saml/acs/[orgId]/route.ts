import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import { provisionJitUser } from '@/lib/sso/jit-provisioning';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { buildServiceProviderUrls, validateSamlResponse } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeNext(value: string | null) {
  return value && value.startsWith('/') ? value : '/app';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const config = await getOrgSsoConfig(orgId);
  if (!config?.enabled) {
    return NextResponse.json({ error: 'SSO not enabled' }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const samlResponse = form?.get('SAMLResponse');
  const relayState = form?.get('RelayState');

  if (typeof samlResponse !== 'string' || samlResponse.length < 20) {
    return NextResponse.json({ error: 'Missing SAMLResponse' }, { status: 400 });
  }

  const { appBase } = buildServiceProviderUrls(orgId);

  try {
    const validated = await validateSamlResponse({
      orgId,
      ssoConfig: config,
      samlResponse,
      relayState: typeof relayState === 'string' ? relayState : '',
    });

    // v4-031: defence-in-depth IdP-init gate.
    // @node-saml is configured with `validateInResponseTo: always` in
    // lib/sso/saml.ts, so a true IdP-initiated assertion (one without an
    // InResponseTo attribute matching a cached request id) already fails
    // validation. This explicit check guards against future config drift
    // and gives an auditable reject for any assertion that lacks a
    // request id we issued. Operators that genuinely need IdP-init can
    // set `directory_sync_config.allow_idp_initiated = true` per-org.
    const profile = validated.profile as
      | (typeof validated.profile & {
          inResponseTo?: string | null;
          InResponseTo?: string | null;
        })
      | undefined;
    const inResponseTo =
      profile?.inResponseTo ?? profile?.InResponseTo ?? null;
    const allowIdpInit = Boolean(
      (config.directorySyncConfig as { allow_idp_initiated?: boolean } | null)
        ?.allow_idp_initiated,
    );
    const isIdpInitiated = !inResponseTo;
    if (isIdpInitiated && !allowIdpInit) {
      throw new Error(
        'IdP-initiated SAML assertions are disabled for this organization',
      );
    }

    if (config.jitProvisioningEnabled) {
      await provisionJitUser({
        orgId,
        profile: validated.profile!,
        allowedDomains: config.allowedDomains,
        defaultRole: config.jitDefaultRole,
        actorLabel: 'SAML JIT',
      });
    }

    const admin = createSupabaseAdminClient();

    // Audit 2026-08-02 — bind the asserted identity to THIS organisation.
    //
    // Everything validateSamlResponse() checks is supplied by the org's own
    // admin: the signing certificate and idpEntityId are parsed from the
    // idp_metadata_xml they upload via PUT /api/sso/config, and
    // isAllowedDomain() returns true when their allowedDomains list is empty.
    // Nothing verifies that they control the domain they are asserting. So
    // without the check below, an admin of any tenant holding the sso_saml
    // entitlement could sign an assertion naming victim@another-tenant.com and
    // receive a magic link that logs them in as that user — a full cross-tenant
    // account takeover.
    //
    // The session is minted by GoTrue before any application code runs, so the
    // membership check in /auth/callback is not a sufficient backstop: an
    // admin-generated magic link carries no PKCE state, so the tokens are
    // readable straight off the redirect. The binding therefore has to happen
    // here, BEFORE generateLink.
    //
    // Deliberately resolved against org_members rather than an invitation: a
    // pending invitation is also attacker-creatable (any org admin may invite
    // an arbitrary address), so accepting one here would leave the takeover
    // path open.
    // Resolved in two explicit steps rather than one embedded join: user_profiles
    // carries an organization_id, so a user who belongs to several orgs has
    // several rows and .maybeSingle() would throw on a legitimate multi-org
    // account.
    const { data: profileRows, error: profileError } = await admin
      .from('user_profiles')
      .select('user_id')
      .ilike('email', validated.email);

    if (profileError) {
      throw new Error(
        `Unable to verify SSO account binding: ${profileError.message}`,
      );
    }

    const candidateUserIds = Array.from(
      new Set(
        (profileRows ?? [])
          .map((row) => row.user_id as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (candidateUserIds.length === 0) {
      throw new Error(
        'This account is not a member of the organization for this SSO connection',
      );
    }

    const { data: memberships, error: membershipError } = await admin
      .from('org_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .in('user_id', candidateUserIds);

    if (membershipError) {
      throw new Error(
        `Unable to verify SSO membership: ${membershipError.message}`,
      );
    }

    if (!memberships || memberships.length === 0) {
      throw new Error(
        'This account is not a member of the organization for this SSO connection',
      );
    }
    const next = safeNext(typeof relayState === 'string' ? relayState : null);
    const redirectTo = `${appBase}/auth/callback?sso_org=${encodeURIComponent(orgId)}&next=${encodeURIComponent(next)}`;
    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: validated.email,
      options: { redirectTo },
    });

    if (error || !link?.properties?.action_link) {
      throw new Error(error?.message ?? 'Failed to create post-SSO session link');
    }

    await logIdentityEvent({
      eventType: 'sso.login',
      actorType: 'system',
      actorLabel: config.idpEntityId ?? 'saml-idp',
      orgId,
      targetUserEmail: validated.email,
      result: 'success',
      metadata: {
        groups: validated.groups,
        idp_initiated: isIdpInitiated,
      },
    });

    return NextResponse.redirect(link.properties.action_link);
  } catch (error) {
    await logIdentityEvent({
      eventType: 'sso.login',
      actorType: 'system',
      actorLabel: config.idpEntityId ?? 'saml-idp',
      orgId,
      result: 'failure',
      metadata: {
        error: error instanceof Error ? error.message : 'SAML validation failed',
      },
    });

    return NextResponse.redirect(
      `${appBase}/auth/signin?error=sso_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'SSO assertion could not be validated.',
      )}`,
    );
  }
}
