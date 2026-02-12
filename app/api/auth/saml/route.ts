/**
 * SAML SSO Assertion Consumer Service (ACS) Endpoint
 *
 * POST /api/auth/saml
 *
 * Receives SAML assertions from an Identity Provider after a user
 * authenticates. For now this is a foundation endpoint — it validates the
 * request shape and returns appropriate status codes, but full assertion
 * parsing requires a SAML library integration.
 *
 * Security:
 *   - No caching headers on every response.
 *   - Validates that SAML is enabled before processing.
 *   - Returns 501 when no provider is configured (not-yet-implemented).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SAML_SUPPORTED,
  getSAMLConfig,
  validateSAMLAssertion,
} from '@/lib/auth/saml-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Shared security headers applied to every response.
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: SECURITY_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// POST — Assertion Consumer Service
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Check global feature flag
  if (!SAML_SUPPORTED) {
    return jsonResponse(
      { error: 'SAML SSO is not enabled on this instance.' },
      501,
    );
  }

  // 2. Parse the incoming form-encoded body (IdPs POST application/x-www-form-urlencoded)
  let samlResponse: string | null = null;
  let relayState: string | null = null;

  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      samlResponse = formData.get('SAMLResponse') as string | null;
      relayState = formData.get('RelayState') as string | null;
    } else if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      samlResponse = typeof body.SAMLResponse === 'string' ? body.SAMLResponse : null;
      relayState = typeof body.RelayState === 'string' ? body.RelayState : null;
    }
  } catch (err) {
    console.error('[SAML] Failed to parse request body:', err);
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  if (!samlResponse) {
    return jsonResponse(
      { error: 'Missing SAMLResponse parameter.' },
      400,
    );
  }

  // 3. Determine the organization from the RelayState or other mechanism.
  //    For the foundation, we require RelayState to carry the orgId.
  const orgId = relayState?.trim() || null;

  if (!orgId) {
    return jsonResponse(
      { error: 'Missing RelayState (organization identifier).' },
      400,
    );
  }

  // 4. Load the org's SAML config
  let config;
  try {
    config = await getSAMLConfig(orgId);
  } catch (err) {
    console.error('[SAML] Error loading SAML config for org', orgId, err);
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }

  if (!config.enabled || !config.provider) {
    return jsonResponse(
      {
        error: 'SAML SSO not yet configured for this organization.',
        hint: 'An administrator must configure a SAML Identity Provider in organization settings.',
      },
      501,
    );
  }

  // 5. Validate the assertion (currently a stub)
  try {
    const result = await validateSAMLAssertion(samlResponse, config);

    if (!result.valid) {
      console.warn('[SAML] Assertion validation failed:', result.error);
      return jsonResponse(
        { error: result.error ?? 'SAML assertion validation failed.' },
        401,
      );
    }

    // In the future, this is where we would:
    //   - Look up or provision the user by result.nameId
    //   - Create a Supabase session
    //   - Redirect the user to the app
    return jsonResponse(
      {
        success: true,
        nameId: result.nameId,
        sessionIndex: result.sessionIndex,
        attributes: result.attributes,
      },
      200,
    );
  } catch (err) {
    console.error('[SAML] Unexpected error during assertion validation:', err);
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }
}
