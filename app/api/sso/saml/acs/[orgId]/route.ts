import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSamlClient, isAllowedDomain } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FALLBACK_APP_BASE = 'http://localhost:3000';

function safeNext(value: string | null): string {
  if (!value) return '/app';
  if (value.startsWith('/')) return value;
  return '/app';
}

// POST /api/sso/saml/acs/:orgId
// Handles SAMLResponse from IdP (HTTP-POST binding)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: cfg, error: cfgError } = await admin
    .from('organization_sso')
    .select('enabled, allowed_domains, idp_entity_id, sso_url, certificate')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (cfgError || !cfg?.enabled) {
    return NextResponse.json({ error: 'SSO not enabled' }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const samlResponse = form?.get('SAMLResponse');
  const relayState = form?.get('RelayState');

  if (typeof samlResponse !== 'string' || samlResponse.length < 20) {
    return NextResponse.json({ error: 'Missing SAMLResponse' }, { status: 400 });
  }

  const { saml, appBase } = createSamlClient({
    orgId,
    idp: {
      ssoUrl: (cfg as any).sso_url ?? null,
      certificate: (cfg as any).certificate ?? null,
      idpEntityId: (cfg as any).idp_entity_id ?? null,
    },
  });

  try {
    const { profile } = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
      RelayState: typeof relayState === 'string' ? relayState : '',
    });

    const email =
      (profile as any)?.email ??
      (profile as any)?.mail ??
      (profile as any)?.nameID ??
      null;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid assertion (missing email)' }, { status: 400 });
    }

    const allowedDomains = Array.isArray((cfg as any).allowed_domains)
      ? ((cfg as any).allowed_domains as string[])
      : [];
    if (!isAllowedDomain(email, allowedDomains)) {
      return NextResponse.redirect(
        `${appBase}/auth/signin?error=sso_domain_not_allowed&message=${encodeURIComponent(
          'Your email domain is not allowed for this SSO configuration.',
        )}`,
      );
    }

    // Create a Supabase magiclink for the SAML-authenticated user.
    // We do NOT email it; we redirect directly to the verify link.
    const next = safeNext(typeof relayState === 'string' ? relayState : null);
    const redirectTo = `${appBase}/auth/callback?sso_org=${encodeURIComponent(orgId)}&next=${encodeURIComponent(next)}`;

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    if (error || !link?.properties?.action_link) {
      console.error('[saml/acs] generateLink failed:', error?.message);
      return NextResponse.redirect(
        `${appBase}/auth/signin?error=sso_failed&message=${encodeURIComponent(
          'SSO sign-in failed. Please contact your administrator.',
        )}`,
      );
    }

    return NextResponse.redirect(link.properties.action_link);
  } catch (err) {
    console.error('[saml/acs] assertion validation failed:', err);
    return NextResponse.redirect(
      `${((process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') || FALLBACK_APP_BASE)}/auth/signin?error=sso_failed&message=${encodeURIComponent(
        'SSO assertion could not be validated.',
      )}`,
    );
  }
}
