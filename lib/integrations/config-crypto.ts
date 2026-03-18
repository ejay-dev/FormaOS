import crypto from 'crypto';

type EncryptedConfigEnvelope = {
  __encrypted: true;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
};

function getConfigKey(): Buffer {
  const secret =
    process.env.INTEGRATION_CONFIG_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    'formaos-dev-integration-secret';

  return crypto.createHash('sha256').update(secret).digest();
}

export function encodeIntegrationConfig(
  value: Record<string, unknown>,
): Record<string, unknown> | EncryptedConfigEnvelope {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getConfigKey(), iv);
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

