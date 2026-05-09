/**
 * SAML Single Logout (SLO) callback (High-13)
 *
 * Accepts an IdP-initiated SAML LogoutRequest at this URL, validates it,
 * and signs the user out of the FormaOS session. Without this route the
 * IdP cannot terminate a session in FormaOS when the user logs out at
 * the IdP — they would remain authenticated until their cookie expired.
 *
 * The SAML metadata exposed at /api/sso/saml/metadata/[orgId] already
 * advertises this endpoint as the SingleLogoutService location (see
 * buildServiceProviderUrls in lib/sso/saml.ts). Wire-up was previously
 * incomplete: the URL was advertised but no handler existed, causing
 * IdP-initiated logout POSTs to 404.
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { validateSingleLogoutRequest } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const samlRequest = form?.get('SAMLRequest');
  const relayState = form?.get('RelayState');

  if (typeof samlRequest !== 'string' || samlRequest.length < 20) {
    return NextResponse.json(
      { error: 'Missing SAMLRequest' },
      { status: 400 },
    );
  }

  let profile;
  try {
    const result = await validateSingleLogoutRequest({
      orgId,
      ssoConfig: config,
      samlRequest,
    });
    profile = result?.profile ?? null;
  } catch (error) {
    await logIdentityEvent({
      eventType: 'sso.logout',
      actorType: 'system',
      orgId,
      result: 'failure',
      metadata: {
        phase: 'validation_failed',
        reason: error instanceof Error ? error.message : 'unknown',
      },
    });
    return NextResponse.json(
      { error: 'Invalid SAML logout request' },
      { status: 400 },
    );
  }

  // If the IdP supplied a NameID, terminate any FormaOS sessions tied to
  // that user. Supabase manages session lifetime via JWTs, so the most
  // reliable revocation is admin.signOut on the user's id.
  const nameId = profile?.nameID ?? null;
  if (nameId) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: lookup } = await admin
        .from('user_profiles')
        .select('user_id')
        .eq('email', String(nameId).toLowerCase())
        .maybeSingle<{ user_id: string }>();
      if (lookup?.user_id) {
        await admin.auth.admin.signOut(lookup.user_id, 'global');
        await logIdentityEvent({
          eventType: 'sso.logout',
          actorType: 'system',
          orgId,
          result: 'success',
          targetUserId: lookup.user_id,
          targetUserEmail: String(nameId).toLowerCase(),
          metadata: {
            phase: 'completed',
            nameId,
            relayState: relayState?.toString() ?? null,
          },
        });
      }
    } catch (error) {
      await logIdentityEvent({
        eventType: 'sso.logout',
        actorType: 'system',
        orgId,
        result: 'failure',
        metadata: {
          phase: 'signout_failed',
          reason: error instanceof Error ? error.message : 'unknown',
        },
      });
      // Fall through — even if Supabase signOut fails, the IdP considers
      // the user signed out, so we still return success to it.
    }
  }

  // SAML SLO can be either synchronous (we send a LogoutResponse back) or
  // asynchronous (we just acknowledge). FormaOS treats it asynchronously
  // by returning 200 — no LogoutResponse is sent. This is acceptable for
  // most IdPs (Okta, Azure AD) which tolerate "soft" SLO. Wiring a real
  // signed LogoutResponse is a follow-up if we onboard an IdP that
  // requires it.
  return new NextResponse(null, { status: 200 });
}
