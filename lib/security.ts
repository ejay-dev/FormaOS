/**
 * =========================================================
 * Enterprise Security Features
 * =========================================================
 * Two-Factor Authentication (2FA) and Single Sign-On (SSO)
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import * as speakeasy from 'speakeasy';
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

function encryptTotpSecret(plaintext: string): string {
  const key = getTotpKey();
  if (!key) {
    console.warn(
      '[security] TOTP_ENCRYPTION_KEY not configured — TOTP secret stored unencrypted',
    );
    return plaintext;
  }
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
  const key = getTotpKey();
  if (!key)
    throw new Error(
      'TOTP_ENCRYPTION_KEY is required to decrypt a stored 2FA secret',
    );
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
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `FormaOS (${email})`,
    issuer: 'FormaOS',
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

  // Generate backup codes using a CSPRNG (not Math.random)
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(6).toString('hex').toUpperCase(),
  );

  // Store secret encrypted at rest
  const supabase = await createClient();
  await supabase.from('user_security').upsert(
    {
      user_id: userId,
      two_factor_secret: encryptTotpSecret(secret.base32),
      backup_codes: backupCodes,
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
    .single();

  if (!security?.two_factor_secret) {
    throw new Error('2FA secret not found. Please generate a new secret.');
  }

  // Decrypt secret before verifying
  const rawSecret = decryptTotpSecret(security.two_factor_secret);

  // Verify token (window: 1 = ±30s, per NIST recommendation)
  const verified = speakeasy.totp.verify({
    secret: rawSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

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

  // Get secret
  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_secret, backup_codes')
    .eq('user_id', userId)
    .eq('two_factor_enabled', true)
    .single();

  if (!security) {
    return false;
  }

  // Check if it's a backup code
  if (security.backup_codes?.includes(token)) {
    // Remove used backup code
    const updatedCodes = security.backup_codes.filter(
      (code: string) => code !== token,
    );
    await supabase
      .from('user_security')
      .update({ backup_codes: updatedCodes })
      .eq('user_id', userId);

    return true;
  }

  // Decrypt and verify TOTP token
  const rawSecret = decryptTotpSecret(security.two_factor_secret);
  return speakeasy.totp.verify({
    secret: rawSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
}

/**
 * Disable 2FA
 * Requires the user's current password to prevent a stolen session from
 * silently removing two-factor protection.
 */
export async function disable2FA(
  userId: string,
  password: string,
): Promise<boolean> {
  if (!password) return false;

  const supabase = await createClient();
  const adminClient = createSupabaseAdminClient();

  // Fetch the user's email so we can re-verify via signInWithPassword
  const { data: userData, error: userError } =
    await adminClient.auth.admin.getUserById(userId);
  if (userError || !userData?.user?.email) {
    throw new Error('Unable to retrieve user for re-authentication');
  }

  // Re-verify password — this is a fresh credential check, not a session check
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });
  if (authError) {
    return false; // Wrong password
  }

  // Disable 2FA
  await supabase
    .from('user_security')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      backup_codes: null,
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
    .single();

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
    .single();

  if (!session) return true;

  return new Date(session.expires_at) < new Date();
}
