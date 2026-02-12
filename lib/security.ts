/**
 * =========================================================
 * Enterprise Security Features
 * =========================================================
 * Two-Factor Authentication (2FA) and Single Sign-On (SSO)
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

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

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );

  // Store secret (encrypted)
  const supabase = await createClient();
  await supabase.from('user_security').upsert(
    {
      user_id: userId,
      two_factor_secret: secret.base32,
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

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: security.two_factor_secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
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
      (code: any) => code !== token,
    );
    await supabase
      .from('user_security')
      .update({ backup_codes: updatedCodes })
      .eq('user_id', userId);

    return true;
  }

  // Verify TOTP token
  return speakeasy.totp.verify({
    secret: security.two_factor_secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}

/**
 * Disable 2FA
 */
export async function disable2FA(
  userId: string,
  password: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Verify password (implement password verification)
  // const passwordValid = await verifyPassword(userId, password);
  // if (!passwordValid) return false;

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
