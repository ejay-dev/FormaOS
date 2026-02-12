/**
 * SAML SSO Configuration
 *
 * Foundation types and helpers for SAML 2.0 Single Sign-On.
 * This module provides the configuration layer — full SAML assertion
 * parsing will be added later with a dedicated library (e.g. saml2-js).
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Whether SAML SSO is enabled at the environment level.
 * Set `SAML_ENABLED=true` in your environment to activate.
 */
export const SAML_SUPPORTED: boolean =
  process.env.SAML_ENABLED === 'true';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Identity Provider (IdP) configuration for a single SAML provider. */
export interface SAMLProvider {
  /** Internal unique identifier (UUID). */
  id: string;
  /** Human-readable display name (e.g. "Okta", "Azure AD"). */
  name: string;
  /** IdP Entity ID / Issuer URI. */
  entityId: string;
  /** IdP SSO login URL (HTTP-POST or HTTP-Redirect binding). */
  ssoUrl: string;
  /** Base-64 encoded X.509 signing certificate from the IdP. */
  certificate: string;
  /** Optional URL where the IdP publishes its metadata XML. */
  metadataUrl: string | null;
  /** Whether this provider is currently active. */
  enabled: boolean;
  /** The organization this provider belongs to. */
  organizationId: string;
}

/** Organization-level SAML settings. */
export interface SAMLConfig {
  /** Whether SAML SSO is enabled for this organization. */
  enabled: boolean;
  /** The configured SAML identity provider, if any. */
  provider: SAMLProvider | null;
  /** When true, all users in the org MUST authenticate via SAML. */
  enforced: boolean;
  /** Email domains that are allowed / required to use SAML. */
  allowedDomains: string[];
}

/** The result of validating a SAML assertion. */
export interface SAMLAssertionResult {
  valid: boolean;
  /** Extracted NameID (email) from the assertion, if valid. */
  nameId: string | null;
  /** Extracted session index, if present. */
  sessionIndex: string | null;
  /** Additional SAML attributes mapped from the assertion. */
  attributes: Record<string, string>;
  /** Human-readable error when `valid` is false. */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Default / empty values
// ---------------------------------------------------------------------------

const EMPTY_SAML_CONFIG: SAMLConfig = {
  enabled: false,
  provider: null,
  enforced: false,
  allowedDomains: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve the SAML configuration for an organization.
 *
 * Reads from the `organization_settings` table with a `setting_key` of
 * `'saml_config'`. Returns a sensible default when no row exists or when
 * Supabase is not configured.
 */
export async function getSAMLConfig(orgId: string): Promise<SAMLConfig> {
  if (!SAML_SUPPORTED) {
    return EMPTY_SAML_CONFIG;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('organization_settings')
      .select('value')
      .eq('organization_id', orgId)
      .eq('setting_key', 'saml_config')
      .maybeSingle();

    if (error) {
      console.error('[SAML] Failed to fetch SAML config:', error.message);
      return EMPTY_SAML_CONFIG;
    }

    if (!data?.value) {
      return EMPTY_SAML_CONFIG;
    }

    // The `value` column is expected to be a JSONB object matching SAMLConfig.
    const raw = data.value as Record<string, unknown>;

    const provider: SAMLProvider | null = raw.provider
      ? (raw.provider as SAMLProvider)
      : null;

    return {
      enabled: Boolean(raw.enabled),
      provider,
      enforced: Boolean(raw.enforced),
      allowedDomains: Array.isArray(raw.allowedDomains)
        ? (raw.allowedDomains as string[])
        : [],
    };
  } catch (err) {
    console.error(
      '[SAML] Unexpected error reading SAML config:',
      err instanceof Error ? err.message : err,
    );
    return EMPTY_SAML_CONFIG;
  }
}

/**
 * Validate a SAML assertion (stub).
 *
 * This is a placeholder that always returns an invalid result. A real
 * implementation will be added once a SAML parsing library (e.g. saml2-js
 * or @node-saml/node-saml) is integrated.
 *
 * @param _samlResponse - The raw Base-64 encoded SAMLResponse from the IdP.
 * @param _config       - The organization's SAML configuration.
 */
export async function validateSAMLAssertion(
  _samlResponse: string,
  _config: SAMLConfig,
): Promise<SAMLAssertionResult> {
  // Stub: full SAML parsing is not yet implemented.
  return {
    valid: false,
    nameId: null,
    sessionIndex: null,
    attributes: {},
    error:
      'SAML assertion validation is not yet implemented. ' +
      'A SAML parsing library is required for production use.',
  };
}
