import crypto from 'crypto';

const AUDIENCE = 'email_unsubscribe';
const DEFAULT_EXPIRY_DAYS = 90;

interface UnsubscribeTokenPayload {
  userId: string;
  iat: number;
  exp: number;
  aud: typeof AUDIENCE;
}

function getSecret(): string {
  const secret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.EXPORT_TOKEN_SECRET ||
    process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'EMAIL_UNSUBSCRIBE_SECRET, EXPORT_TOKEN_SECRET, or JWT_SECRET must be configured',
    );
  }
  return secret;
}

function base64UrlEncode(buffer: Buffer | string): string {
  const str =
    typeof buffer === 'string'
      ? Buffer.from(buffer, 'utf8').toString('base64')
      : buffer.toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function generateUnsubscribeToken(
  userId: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS,
): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: UnsubscribeTokenPayload = {
    userId,
    iat: now,
    exp: now + expiryDays * 86400,
    aud: AUDIENCE,
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest();
  return `${payloadEncoded}.${base64UrlEncode(signature)}`;
}

export function verifyUnsubscribeToken(
  token: string,
): UnsubscribeTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadEncoded, signatureEncoded] = parts;
    const secret = getSecret();
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest();
    const expectedEncoded = base64UrlEncode(expected);
    const a = Buffer.from(expectedEncoded, 'utf8');
    const b = Buffer.from(signatureEncoded, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      base64UrlDecode(payloadEncoded),
    ) as UnsubscribeTokenPayload;
    if (
      !payload ||
      typeof payload.userId !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      payload.aud !== AUDIENCE
    ) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(baseUrl: string, userId: string): string {
  const token = generateUnsubscribeToken(userId);
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
}
