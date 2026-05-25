import crypto from 'crypto';

type EncryptedConfigEnvelope = {
  __encrypted: true;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
};

const DEV_FALLBACK_SECRET = 'formaos-dev-integration-secret';

/**
 * Resolve the symmetric key used to encrypt third-party integration
 * configs (Slack, Salesforce, etc. tokens stored on org rows).
 *
 * Precedence:
 *   1. INTEGRATION_CONFIG_KEY  — purpose-built secret. Strongly
 *      recommended (rotate independently of platform credentials).
 *   2. INTEGRATION_CONFIG_SECRET — legacy name; equivalent in scope.
 *   3. NEXTAUTH_SECRET — historical fallback, kept for back-compat
 *      with environments that haven't rotated yet.
 *
 * The previous implementation fell back to SUPABASE_SERVICE_ROLE_KEY
 * — a single key leak would then both bypass RLS *and* decrypt every
 * customer's integration tokens. That fallback is now removed in
 * production (audit 2026-05-26 / security HIGH-3). In production the
 * function throws if no key is configured — fail-closed rather than
 * silently degrade to a known-weak default.
 */
function getConfigKey(): Buffer {
  const explicit =
    process.env.INTEGRATION_CONFIG_KEY?.trim() ||
    process.env.INTEGRATION_CONFIG_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (explicit) {
    return crypto.createHash('sha256').update(explicit).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'INTEGRATION_CONFIG_KEY (or legacy INTEGRATION_CONFIG_SECRET) is required ' +
        'in production for integration-config encryption. Never reuse ' +
        'SUPABASE_SERVICE_ROLE_KEY for this purpose.',
    );
  }

  return crypto.createHash('sha256').update(DEV_FALLBACK_SECRET).digest();
}

export function encodeIntegrationConfig(
  value: Record<string, unknown>,
): Record<string, unknown> | EncryptedConfigEnvelope {
  // Resolve the key BEFORE the encryption try/catch so that the
  // production fail-closed error from getConfigKey propagates to the
  // caller instead of being swallowed (which would silently store
  // plaintext credentials).
  const key = getConfigKey();
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(JSON.stringify(value), 'utf8')),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
      __encrypted: true,
      alg: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
    };
  } catch {
    // Encryption itself can only fail for pathological inputs (e.g.
    // circular JSON). Return plaintext in that narrow case to avoid
    // breaking the call site, but the key-presence check above
    // ensures we never silently store plaintext because of missing
    // configuration in production.
    return value;
  }
}

export function decodeIntegrationConfig<T extends Record<string, unknown>>(
  value: unknown,
): T {
  if (
    !value ||
    typeof value !== 'object' ||
    !('__encrypted' in value) ||
    (value as { __encrypted?: unknown }).__encrypted !== true
  ) {
    return (value ?? {}) as T;
  }

  const encrypted = value as EncryptedConfigEnvelope;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getConfigKey(),
    Buffer.from(encrypted.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext) as T;
}

