/**
 * =========================================================
 * Enterprise Security Features
 * =========================================================
 * Two-Factor Authentication (2FA) and Single Sign-On (SSO)
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes, pbkdf2Sync } from 'crypto';

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
 * Generate cryptographically secure backup code
 */
function generateSecureBackupCode(): string {
  // Generate 8 random bytes (64 bits of entropy)
  const bytes = randomBytes(8);
  // Convert to base32-like string (without ambiguous characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  // Format as XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Hash backup code for secure storage
 */
function hashBackupCode(code: string): string {
  // Use PBKDF2 with random salt for each code
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(code, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify backup code against hash
 */
function verifyBackupCode(code: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const codeHash = pbkdf2Sync(code, salt, 100000, 32, 'sha256').toString('hex');
  return codeHash === hash;
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

  // Generate cryptographically secure backup codes
  const backupCodes = Array.from({ length: 8 }, () => generateSecureBackupCode());
  
  // Hash backup codes for storage
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  // TODO: Encrypt TOTP secret at rest before storing
  // For now, store as-is but add comment indicating encryption needed
  const supabase = await createClient();
  await supabase.from('user_security').upsert(
    {
      user_id: userId,
      two_factor_secret: secret.base32, // TODO: Encrypt this value
      backup_codes: hashedBackupCodes, // Store hashed backup codes
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

  // Check if it's a backup code (compare against hashed codes)
  if (security.backup_codes && security.backup_codes.length > 0) {
    const matchedIndex = security.backup_codes.findIndex(
      (hashedCode: string) => verifyBackupCode(token, hashedCode)
    );
    
    if (matchedIndex !== -1) {
      // Remove used backup code
      const updatedCodes = security.backup_codes.filter(
        (_: any, index: number) => index !== matchedIndex,
      );
      await supabase
        .from('user_security')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      return true;
    }
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
 * 
 * Note: This function verifies the password by attempting a sign-in.
 * While not ideal (creates a session), Supabase doesn't provide a direct
 * password verification API. This is acceptable for the disable 2FA flow
 * as it ensures strong authentication before removing security settings.
 */
export async function disable2FA(
  userId: string,
  password: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Get user email for password verification
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return false;
  }

  // Verify password by attempting sign-in
  // This ensures the user must re-authenticate before disabling 2FA
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });

  if (signInError) {
    // Password is incorrect
    return false;
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
