/**
 * =========================================================
 * Export Token Generation and Verification
 * =========================================================
 * JWT-based signed tokens for secure export downloads
 */

import crypto from 'crypto';

const ALGORITHM = 'HS256';
const EXPIRY_HOURS = 1;

interface TokenPayload {
  jobId: string;
  userId: string;
  orgId: string;
  iat: number;
  exp: number;
}

/**
 * Get the secret key for signing tokens
 */
function getSecret(): string {
  const secret = process.env.EXPORT_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('EXPORT_TOKEN_SECRET or JWT_SECRET must be configured');
  }
  return secret;
}

/**
 * Base64 URL encode a buffer
 */
function base64UrlEncode(buffer: Buffer | string): string {
  const str = typeof buffer === 'string' ? buffer : buffer.toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL decode a string
 */
function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Generate a signed export token
 */
export function generateExportToken(
  jobId: string,
  userId: string,
  orgId: string,
  expiryHours: number = EXPIRY_HOURS
): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: ALGORITHM,
    typ: 'JWT',
  };

  const payload: TokenPayload = {
    jobId,
    userId,
    orgId,
    iat: now,
    exp: now + expiryHours * 3600,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64');

  return `${signatureInput}.${base64UrlEncode(signature)}`;
}

/**
 * Verify and decode an export token
 */
export function verifyExportToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const secret = getSecret();

    // Verify signature
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64');

    const expectedSignatureEncoded = base64UrlEncode(expectedSignature);
    if (signatureEncoded !== expectedSignatureEncoded) {
      return null;
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a download URL with embedded token
 */
export function generateSignedDownloadUrl(
  baseUrl: string,
  jobId: string,
  userId: string,
  orgId: string
): string {
  const token = generateExportToken(jobId, userId, orgId);
  return `${baseUrl}/api/exports/enterprise/${jobId}?token=${encodeURIComponent(token)}`;
}
