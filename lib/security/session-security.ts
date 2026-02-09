/**
 * Session Security Module
 *
 * - Secure session creation and validation
 * - Device fingerprinting
 * - Session binding and rotation
 */

import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface SessionInfo {
  userId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  reason?: string;
  session?: {
    id: string;
    lastActiveAt: Date;
    expiresAt: Date;
  };
}

/**
 * Generate a secure session token hash (for storage)
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a device fingerprint from request metadata
 * Used for session binding - alerts if session is used from different device
 */
export function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage?: string,
  acceptEncoding?: string,
): string {
  const components = [
    userAgent,
    acceptLanguage || '',
    acceptEncoding || '',
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(components)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Extract client IP from request headers
 */
export function extractClientIP(headers: Headers): string {
  // Check common proxy headers in order of reliability
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return '0.0.0.0'; // Unknown
}

/**
 * Create a new tracked session
 */
export async function createTrackedSession(
  info: SessionInfo,
): Promise<{ sessionId: string; expiresAt: Date }> {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { data, error } = await admin
    .from('user_sessions')
    .insert({
      user_id: info.userId,
      session_token_hash: hashSessionToken(info.sessionToken),
      ip_address: info.ipAddress,
      user_agent: info.userAgent,
      device_fingerprint: info.deviceFingerprint,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Session] Failed to create tracked session:', error);
    throw new Error('Failed to create session');
  }

  return { sessionId: data.id, expiresAt };
}

/**
 * Validate a session token
 */
export async function validateSession(
  sessionToken: string,
  currentIP: string,
  currentFingerprint?: string,
): Promise<SessionValidationResult> {
  const admin = createSupabaseAdminClient();
  const tokenHash = hashSessionToken(sessionToken);

  const { data: session, error } = await admin
    .from('user_sessions')
    .select('*')
    .eq('session_token_hash', tokenHash)
    .is('revoked_at', null)
    .single();

  if (error || !session) {
    return { valid: false, reason: 'Session not found or revoked' };
  }

  // Check expiration
  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, reason: 'Session expired' };
  }

  // Check device fingerprint (soft check - log anomaly but don't block)
  if (currentFingerprint && session.device_fingerprint) {
    if (currentFingerprint !== session.device_fingerprint) {
      console.warn('[Session] Device fingerprint mismatch', {
        sessionId: session.id,
        userId: session.user_id,
        expectedFingerprint: session.device_fingerprint.slice(0, 8),
        actualFingerprint: currentFingerprint.slice(0, 8),
      });

      // Log security event
      await logSecurityEvent({
        eventType: 'session_fingerprint_mismatch',
        userId: session.user_id,
        ipAddress: currentIP,
        metadata: {
          sessionId: session.id,
          expectedFingerprint: session.device_fingerprint,
          actualFingerprint: currentFingerprint,
        },
      });
    }
  }

  // Update last active timestamp
  await admin
    .from('user_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    valid: true,
    session: {
      id: session.id,
      lastActiveAt: new Date(session.last_active_at),
      expiresAt: new Date(session.expires_at),
    },
  };
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  await admin
    .from('user_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', sessionId);
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('user_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null)
    .select('id');

  if (error) {
    console.error('[Session] Failed to revoke user sessions:', error);
    throw new Error('Failed to revoke sessions');
  }

  return data?.length || 0;
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(userId: string): Promise<
  Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    lastActiveAt: Date;
    createdAt: Date;
  }>
> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('user_sessions')
    .select('id, ip_address, user_agent, last_active_at, created_at')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('last_active_at', { ascending: false });

  if (error) {
    console.error('[Session] Failed to get user sessions:', error);
    return [];
  }

  return (data || []).map(
    (s: {
      id: string;
      ip_address: string;
      user_agent: string;
      last_active_at: string;
      created_at: string;
    }) => ({
      id: s.id,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      lastActiveAt: new Date(s.last_active_at),
      createdAt: new Date(s.created_at),
    }),
  );
}

/**
 * Log a security event
 */
export async function logSecurityEvent(event: {
  eventType: string;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from('security_audit_log').insert({
    event_type: event.eventType,
    user_id: event.userId,
    organization_id: event.organizationId,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    metadata: event.metadata || {},
  });

  if (error) {
    console.error('[Security] Failed to log security event:', error);
  }
}

/**
 * Security event types
 */
export const SecurityEventTypes = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGIN_MFA_REQUIRED: 'login_mfa_required',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  SESSION_REVOKED: 'session_revoked',
  SESSION_FINGERPRINT_MISMATCH: 'session_fingerprint_mismatch',
  PRIVILEGE_ESCALATION_ATTEMPT: 'privilege_escalation_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
} as const;
