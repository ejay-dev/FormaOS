/**
 * =========================================================
 * Enterprise Security Features
 * =========================================================
 * Two-Factor Authentication (2FA) and Single Sign-On (SSO)
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

// MFA backup-code hash format: `scrypt$<base64-salt>$<base64-hash>`.
// Audit auth-001 (2026-05-22): backup codes were stored plaintext in
// user_security.backup_codes; this format replaces that. salt is 16
// random bytes; hash is 32 bytes (256 bits) of scrypt output with
// default parameters (N=16384, r=8, p=1) — the same defaults Node's
// built-in scrypt uses, suitable for password-class secrets.
const BACKUP_CODE_HASH_PREFIX = 'scrypt';
const BACKUP_CODE_SALT_BYTES = 16;
const BACKUP_CODE_HASH_BYTES = 32;

async function hashBackupCode(code: string): Promise<string> {
  const salt = randomBytes(BACKUP_CODE_SALT_BYTES);
  const hash = await scryptAsync(code, salt, BACKUP_CODE_HASH_BYTES);
  return `${BACKUP_CODE_HASH_PREFIX}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function backupCodeMatches(code: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== BACKUP_CODE_HASH_PREFIX) return false;
  try {
    const salt = Buffer.from(parts[1], 'base64');
    const expected = Buffer.from(parts[2], 'base64');
    const actual = await scryptAsync(code, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import * as OTPAuth from 'otpauth';
// Audit 2026-05-26 — `speakeasy` flagged by our own auditor as
// unmaintained (last release 2017). Replaced with `otpauth` which is
// the actively-maintained TOTP/HOTP library used by Authelia, Bitwarden,
// and others. API surface differs: see the three migrated call sites
// below.
import * as QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// TOTP Secret Encryption (AES-256-GCM)
// Set TOTP_ENCRYPTION_KEY to a 64-char hex string (32 bytes).
// Existing plaintext secrets are transparently readable so live users aren't
// locked out during the transition; new secrets are always stored encrypted.
// ---------------------------------------------------------------------------
const ENC_PREFIX = 'enc:v1:';

function getTotpKey(): Buffer | null {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, 'hex');
}

/**
 * Deterministic dev-only fallback key so TOTP secrets are never stored
 * as plaintext — even in development. NOT secure for production.
 */
function getDevFallbackKey(): Buffer {
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update('formaos-dev-totp-key-not-for-production').digest();
}

function getRequiredTotpKey(): Buffer {
  const key = getTotpKey();
  if (key) return key;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[security] TOTP_ENCRYPTION_KEY is not configured or invalid. ' +
        'Set TOTP_ENCRYPTION_KEY to a 64-character hex string before storing TOTP secrets.',
    );
  }

  // Dev/test: use a deterministic fallback so secrets are still encrypted at rest
  return getDevFallbackKey();
}

function encryptTotpSecret(plaintext: string): string {
  const key = getRequiredTotpKey();
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(
      ':',
    )
  );
}

function decryptTotpSecret(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored; // legacy plaintext — still usable
  const key = getRequiredTotpKey();
  const parts = stored.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted TOTP secret');
  const [ivHex, tagHex, ctHex] = parts;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return (
    decipher.update(Buffer.from(ctHex, 'hex'), undefined, 'utf8') +
    decipher.final('utf8')
  );
}

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  ssoEnabled: boolean;
  ssoProvider?: 'google' | 'azure' | 'okta' | 'saml';
  sessionTimeout: number; // minutes
  ipWhitelist?: string[];
  requireStrongPassword: boolean;
  passwordExpiryDays?: number;
}

/**
 * Generate 2FA secret for user
 */
export async function generate2FASecret(
  userId: string,
  email: string,
): Promise<TwoFactorSecret> {
  // Generate a base32 secret (RFC 4226 §5.4 recommends ≥ 128 bits; we
  // use 256 here to match the prior `length: 32` setting which was 32
  // bytes / 256 bits of entropy in speakeasy's API).
  const secret = new OTPAuth.Secret({ size: 32 });
  const totp = new OTPAuth.TOTP({
    issuer: 'FormaOS',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(totp.toString());

  // Generate backup codes using a CSPRNG (not Math.random). Plaintext is
  // returned to the user ONCE; the DB stores only scrypt hashes (audit
  // auth-001, 2026-05-22). The legacy `backup_codes` column is cleared.
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(6).toString('hex').toUpperCase(),
  );
  const backupCodeHashes = await Promise.all(
    backupCodes.map((code) => hashBackupCode(code)),
  );

  // Store secret encrypted at rest
  const supabase = await createClient();
  await supabase.from('user_security').upsert(
    {
      user_id: userId,
      two_factor_secret: encryptTotpSecret(secret.base32),
      // otpauth's `secret.base32` matches speakeasy's. Stored values
      // remain interchangeable across the migration.
      backup_codes: [] as string[],
      backup_code_hashes: backupCodeHashes,
      two_factor_enabled: false,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  );

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify 2FA token and enable 2FA
 */
export async function enable2FA(
  userId: string,
  token: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Get secret
  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_secret')
    .eq('user_id', userId)
    .maybeSingle();

  if (!security?.two_factor_secret) {
    throw new Error('2FA secret not found. Please generate a new secret.');
  }

  // Decrypt secret before verifying
  const rawSecret = decryptTotpSecret(security.two_factor_secret);

  // Verify token (window: 1 = ±30s, per NIST recommendation).
  // otpauth's `validate({ window })` accepts the same semantics as
  // speakeasy's `window` option — both count steps either side of now.
  const totp = new OTPAuth.TOTP({
    issuer: 'FormaOS',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(rawSecret),
  });
  const delta = totp.validate({ token, window: 1 });
  const verified = delta !== null;

  if (!verified) {
    return false;
  }

  // Enable 2FA
  await supabase
    .from('user_security')
    .update({
      two_factor_enabled: true,
      two_factor_enabled_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return true;
}

/**
 * Verify 2FA token during login
 */
export async function verify2FAToken(
  userId: string,
  token: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Get secret. Audit auth-001 (2026-05-22): only check backup_code_hashes
  // (scrypt-hashed). The plaintext `backup_codes` column is deprecated;
  // pre-fix values were invalidated by migration 20260624_007. Users
  // affected by the rotation must regenerate via the MFA settings page.
  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_secret, backup_code_hashes')
    .eq('user_id', userId)
    .eq('two_factor_enabled', true)
    .maybeSingle();

  if (!security) {
    return false;
  }

  // Check if it's a backup code by scrypt-comparing against each stored hash.
  // On match, remove that specific hash so the code is single-use.
  const storedHashes: string[] = Array.isArray(
    (security as { backup_code_hashes?: string[] }).backup_code_hashes,
  )
    ? ((security as { backup_code_hashes?: string[] }).backup_code_hashes ?? [])
    : [];
  for (let i = 0; i < storedHashes.length; i++) {
    if (await backupCodeMatches(token, storedHashes[i])) {
      const remaining = storedHashes.filter((_, idx) => idx !== i);
      await supabase
        .from('user_security')
        .update({ backup_code_hashes: remaining })
        .eq('user_id', userId);
      return true;
    }
  }

  // Decrypt and verify TOTP token
  const rawSecret = decryptTotpSecret(security.two_factor_secret);
  const totp = new OTPAuth.TOTP({
    issuer: 'FormaOS',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(rawSecret),
  });
  return totp.validate({ token, window: 1 }) !== null;
}

/**
 * Disable 2FA.
 *
 * v4-015: requires a fresh TOTP code (or single-use backup code) — the
 * second factor itself, not just the password. A phished password
 * alone must not be sufficient to strip MFA off an account; the
 * attacker must also have the authenticator or a backup code, which
 * is the same bar we hold for adding MFA. verify2FAToken consumes
 * the backup code if one is used, so a single disable attempt
 * burns one code (consistent with login flow).
 *
 * Returns false if the token is invalid (wrong/expired TOTP, no
 * matching backup code, or MFA isn't enabled).
 */
export async function disable2FA(
  userId: string,
  totpToken: string,
): Promise<boolean> {
  if (!totpToken) return false;

  const verified = await verify2FAToken(userId, totpToken);
  if (!verified) return false;

  const supabase = await createClient();

  await supabase
    .from('user_security')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      backup_codes: null,
      backup_code_hashes: null,
    })
    .eq('user_id', userId);

  return true;
}

/**
 * Get user security settings
 */
export async function getSecuritySettings(
  userId: string,
): Promise<SecuritySettings> {
  const supabase = await createClient();

  const { data: security } = await supabase
    .from('user_security')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    twoFactorEnabled: security?.two_factor_enabled || false,
    ssoEnabled: security?.sso_enabled || false,
    ssoProvider: security?.sso_provider,
    sessionTimeout: security?.session_timeout || 60,
    ipWhitelist: security?.ip_whitelist,
    requireStrongPassword: security?.require_strong_password || true,
    passwordExpiryDays: security?.password_expiry_days,
  };
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(
  userId: string,
  settings: Partial<SecuritySettings>,
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('user_security').upsert(
    {
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  );
}

// Organization-level SAML SSO is implemented in `lib/sso/*` and the `/api/sso/saml/*`
// route handlers. Keep this module focused on user-level security settings (MFA, etc.).

/**
 * Log security event
 */
export async function logSecurityEvent(
  userId: string,
  event:
    | 'login'
    | 'logout'
    | 'failed_login'
    | '2fa_enabled'
    | '2fa_disabled'
    | 'password_changed',
  metadata?: Record<string, any>,
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('security_events').insert({
    user_id: userId,
    event_type: event,
    metadata,
    ip_address: metadata?.ipAddress,
    user_agent: metadata?.userAgent,
    created_at: new Date().toISOString(),
  });
}

/**
 * Get security events for user
 */
export async function getSecurityEvents(
  userId: string,
  limit = 50,
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data || [];
}

/**
 * Check if IP is whitelisted
 */
export async function isIPWhitelisted(
  userId: string,
  ipAddress: string,
): Promise<boolean> {
  const settings = await getSecuritySettings(userId);

  if (!settings.ipWhitelist || settings.ipWhitelist.length === 0) {
    return true; // No whitelist means all IPs allowed
  }

  return settings.ipWhitelist.includes(ipAddress);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  else feedback.push('Password must be at least 8 characters');

  if (password.length >= 12) score++;

  // Uppercase
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include at least one uppercase letter');

  // Lowercase
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include at least one lowercase letter');

  // Numbers
  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');

  // Special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else feedback.push('Include at least one special character');

  // Common patterns
  if (/123|abc|password|qwerty/i.test(password)) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns and words');
  }

  return {
    isStrong: score >= 4,
    score: Math.min(5, score),
    feedback,
  };
}

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

/**
 * Check if session is expired
 */
export async function isSessionExpired(sessionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('user_sessions')
    .select('expires_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) return true;

  return new Date(session.expires_at) < new Date();
}
