/**
 * Enhanced Security Event Logger
 *
 * Integrates with detection rules to log security events and create alerts
 * Extends existing session-security logging with enterprise features
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  detectBruteForce,
  detectImpossibleTravel,
  detectNewDevice,
  detectSessionAnomaly,
  detectPrivilegeEscalation,
  detectRateLimitViolation,
  enrichGeoData,
  parseUserAgent,
  type DetectionContext,
} from './detection-rules';

export interface SecurityEventPayload {
  type: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  orgId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Log a security event with automatic detection rule execution
 */
export async function logSecurityEventEnhanced(
  payload: SecurityEventPayload,
): Promise<{ eventId: string; alertCreated: boolean } | null> {
  try {
    const admin = createSupabaseAdminClient();

    // Enrich with geo data (best-effort, non-blocking)
    const geo = await enrichGeoData(payload.ip).catch(() => ({
      country: undefined,
      region: undefined,
      city: undefined,
    }));
    const deviceInfo = parseUserAgent(payload.userAgent);

    // Insert security event
    const { data: event, error: insertError } = await admin
      .from('security_events')
      .insert({
        type: payload.type,
        severity: payload.severity || 'info',
        user_id: payload.userId,
        org_id: payload.orgId,
        ip_address: payload.ip,
        user_agent: payload.userAgent,
        device_fingerprint: payload.deviceFingerprint,
        geo_country: geo.country,
        geo_region: geo.region,
        geo_city: geo.city,
        request_path: payload.path,
        request_method: payload.method,
        status_code: payload.statusCode,
        metadata: {
          ...payload.metadata,
          ...deviceInfo,
        },
      })
      .select('id')
      .single();

    if (insertError || !event) {
      console.error('[Security] Failed to log event:', insertError);
      return null;
    }

    const eventId = event.id;

    // Run detection rules for specific event types
    let shouldAlert = false;
    let alertReason = '';

    const context: DetectionContext = {
      userId: payload.userId,
      orgId: payload.orgId,
      ip: payload.ip,
      userAgent: payload.userAgent,
      deviceFingerprint: payload.deviceFingerprint,
      geoCountry: geo.country,
      path: payload.path,
      method: payload.method,
      statusCode: payload.statusCode,
    };

    // Run appropriate detection rules based on event type
    if (payload.type === 'login_failure') {
      // Check brute force by IP
      const bruteForceIP = await detectBruteForce(context, {
        by: 'ip',
        value: payload.ip,
      });
      if (bruteForceIP.triggered) {
        shouldAlert = true;
        alertReason = bruteForceIP.reason || 'Brute force detected';
      }

      // Check brute force by user
      if (payload.userId) {
        const bruteForceUser = await detectBruteForce(context, {
          by: 'user',
          value: payload.userId,
        });
        if (bruteForceUser.triggered) {
          shouldAlert = true;
          alertReason = bruteForceUser.reason || 'Brute force detected';
        }
      }
    }

    if (payload.type === 'login_success') {
      // Check impossible travel
      const impossibleTravel = await detectImpossibleTravel(context);
      if (impossibleTravel.triggered) {
        shouldAlert = true;
        alertReason = impossibleTravel.reason || 'Impossible travel detected';
      }

      // Check new device
      const newDevice = await detectNewDevice(context);
      if (newDevice.triggered) {
        shouldAlert = true;
        alertReason = newDevice.reason || 'New device login';
      }
    }

    if (payload.type === 'token_refresh' && payload.metadata?.sessionId) {
      // Check session anomaly
      const sessionAnomaly = await detectSessionAnomaly(
        payload.metadata.sessionId as string,
        context,
      );
      if (sessionAnomaly.triggered) {
        shouldAlert = true;
        alertReason = sessionAnomaly.reason || 'Session anomaly detected';
      }
    }

    if (payload.type === 'unauthorized_access_attempt') {
      // Check privilege escalation
      const privEscalation = await detectPrivilegeEscalation(
        context,
        payload.metadata?.userRole as string,
      );
      if (privEscalation.triggered) {
        shouldAlert = true;
        alertReason = privEscalation.reason || 'Privilege escalation attempt';
      }
    }

    if (payload.type === 'rate_limit_exceeded') {
      // Check rate limit violations
      const rateLimit = await detectRateLimitViolation(context);
      if (rateLimit.triggered) {
        shouldAlert = true;
        alertReason = rateLimit.reason || 'Rate limit violation';
      }
    }

    // Create alert if any detection rule triggered
    if (shouldAlert) {
      const { error: alertError } = await admin.from('security_alerts').insert({
        event_id: eventId,
        notes: `Auto-generated: ${alertReason}`,
      });

      if (alertError) {
        console.error('[Security] Failed to create alert:', alertError);
      }

      return { eventId, alertCreated: true };
    }

    return { eventId, alertCreated: false };
  } catch (error) {
    console.error('[Security] logSecurityEventEnhanced error:', error);
    return null;
  }
}

/**
 * Log user activity (high-level actions)
 */
export async function logUserActivity(params: {
  userId: string;
  orgId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  route?: string;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from('user_activity').insert({
      user_id: params.userId,
      org_id: params.orgId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      route: params.route,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error('[Activity] Failed to log user activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Activity] logUserActivity error:', error);
    return false;
  }
}

/**
 * Helper: Log specific security event types
 */

export async function logLoginAttempt(params: {
  success: boolean;
  userId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  reason?: string;
}) {
  return logSecurityEventEnhanced({
    type: params.success ? 'login_success' : 'login_failure',
    severity: params.success ? 'info' : 'medium',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    deviceFingerprint: params.deviceFingerprint,
    metadata: { reason: params.reason },
  });
}

export async function logUnauthorizedAccess(params: {
  userId?: string;
  orgId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  userRole?: string;
}) {
  return logSecurityEventEnhanced({
    type: 'unauthorized_access_attempt',
    severity: 'high',
    userId: params.userId,
    orgId: params.orgId,
    ip: params.ip,
    userAgent: params.userAgent,
    path: params.path,
    method: params.method,
    metadata: { userRole: params.userRole },
  });
}

export async function logRateLimitExceeded(params: {
  userId?: string;
  ip: string;
  userAgent: string;
  path?: string;
}) {
  return logSecurityEventEnhanced({
    type: 'rate_limit_exceeded',
    severity: 'medium',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    path: params.path,
    statusCode: 429,
  });
}
