/**
 * Enhanced Security Event Logger
 *
 * Writes forensic security events, runs detection rules, and opens actionable
 * alerts for high-severity incidents.
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
  type DetectionResult,
} from './detection-rules';

type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN =
  /(token|password|otp|secret|authorization|cookie|session|refresh)/i;

export interface SecurityEventPayload {
  type: string;
  severity?: Severity;
  userId?: string;
  orgId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

function maxSeverity(...severities: Severity[]): Severity {
  return severities.reduce((current, candidate) =>
    SEVERITY_RANK[candidate] > SEVERITY_RANK[current] ? candidate : current,
  );
}

function shouldCreateAlert(severity: Severity): boolean {
  return severity === 'high' || severity === 'critical';
}

function partiallyMaskEmail(value: string): string {
  const normalized = value.trim();
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 1) return REDACTED;
  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!domain) return REDACTED;
  return `${local.slice(0, 2)}***@${domain}`;
}

function sanitizeMetadataValue(
  key: string,
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 3) return '[TRUNCATED]';

  if (value == null) return value;

  if (SENSITIVE_KEY_PATTERN.test(key)) return REDACTED;

  if (typeof value === 'string') {
    if (SENSITIVE_KEY_PATTERN.test(value)) return REDACTED;
    if (key.toLowerCase().includes('email') || value.includes('@')) {
      return partiallyMaskEmail(value);
    }
    return value.slice(0, 1000);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeMetadataValue(key, item, depth + 1));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(obj)) {
      sanitized[nestedKey] = sanitizeMetadataValue(
        nestedKey,
        nestedValue,
        depth + 1,
      );
    }
    return sanitized;
  }

  return String(value);
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key] = sanitizeMetadataValue(key, value);
  }
  return sanitized;
}

async function runDetectionRules(
  payload: SecurityEventPayload,
  context: DetectionContext,
): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  if (payload.type === 'login_failure') {
    results.push(
      await detectBruteForce(context, {
        by: 'ip',
        value: payload.ip,
      }),
    );

    if (payload.userId) {
      results.push(
        await detectBruteForce(context, {
          by: 'user',
          value: payload.userId,
        }),
      );
    }
  }

  if (payload.type === 'login_success') {
    results.push(await detectImpossibleTravel(context));
    results.push(await detectNewDevice(context));
  }

  if (payload.type === 'token_refresh' && payload.metadata?.sessionId) {
    results.push(
      await detectSessionAnomaly(
        String(payload.metadata.sessionId),
        context,
      ),
    );
  }

  if (payload.type === 'unauthorized_access_attempt') {
    results.push(
      await detectPrivilegeEscalation(
        context,
        typeof payload.metadata?.userRole === 'string'
          ? payload.metadata.userRole
          : undefined,
      ),
    );
  }

  if (payload.type === 'rate_limit_exceeded') {
    results.push(await detectRateLimitViolation(context));
  }

  return results.filter((result) => result.triggered);
}

/**
 * Log a security event with automatic detection rule execution.
 */
export async function logSecurityEventEnhanced(
  payload: SecurityEventPayload,
): Promise<{ eventId: string; alertCreated: boolean } | null> {
  try {
    const admin = createSupabaseAdminClient();

    const geo: { country?: string; region?: string; city?: string } =
      await enrichGeoData(payload.ip).catch(() => ({}));
    const deviceInfo = parseUserAgent(payload.userAgent);
    const baseSeverity: Severity = payload.severity ?? 'info';
    const baseMetadata = sanitizeMetadata({
      ...(payload.metadata ?? {}),
      ...deviceInfo,
    });

    const { data: insertedEvent, error: insertError } = await admin
      .from('security_events')
      .insert({
        type: payload.type,
        severity: baseSeverity,
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
        metadata: baseMetadata,
      })
      .select('id')
      .single();

    if (insertError || !insertedEvent) {
      console.error('[Security] Failed to log event:', insertError);
      return null;
    }

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

    const detections = await runDetectionRules(payload, context);
    const strongestDetectionSeverity = detections.reduce<Severity>(
      (current, detection) => maxSeverity(current, detection.severity),
      'info',
    );
    const finalSeverity = maxSeverity(baseSeverity, strongestDetectionSeverity);

    if (detections.length > 0 || finalSeverity !== baseSeverity) {
      const detectionDetails = detections.map((detection) => ({
        severity: detection.severity,
        reason: detection.reason,
        metadata: sanitizeMetadata(
          (detection.metadata ?? {}) as Record<string, unknown>,
        ),
      }));

      const metadataUpdate = {
        ...baseMetadata,
        detection: detectionDetails,
      };

      const { error: updateError } = await admin
        .from('security_events')
        .update({
          severity: finalSeverity,
          metadata: metadataUpdate,
        })
        .eq('id', insertedEvent.id);

      if (updateError) {
        console.error('[Security] Failed to update detected event:', updateError);
      }
    }

    if (shouldCreateAlert(finalSeverity)) {
      const alertReason =
        detections[0]?.reason ?? `Auto-generated ${finalSeverity} event`;

      const { error: alertError } = await admin.from('security_alerts').insert({
        event_id: insertedEvent.id,
        notes: `Auto-generated: ${alertReason}`,
      });

      if (alertError) {
        console.error('[Security] Failed to create alert:', alertError);
      }

      return { eventId: insertedEvent.id, alertCreated: !alertError };
    }

    return { eventId: insertedEvent.id, alertCreated: false };
  } catch (error) {
    console.error('[Security] logSecurityEventEnhanced error:', error);
    return null;
  }
}

/**
 * Log high-level user activity.
 */
export async function logUserActivity(params: {
  userId: string;
  orgId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
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
      metadata: sanitizeMetadata(params.metadata),
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
