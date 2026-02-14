/**
 * Enhanced Security Event Logger
 *
 * Best-effort buffered writer for security events and activity records.
 * Request handlers should enqueue and return immediately.
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

const DB_WRITE_TIMEOUT_MS = 200;
const DEFAULT_FLUSH_INTERVAL_MS = 3000;
const DEFAULT_BATCH_SIZE = 100;

const flushIntervalMs = (() => {
  const parsed = Number(process.env.SECURITY_LOG_FLUSH_MS ?? DEFAULT_FLUSH_INTERVAL_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_FLUSH_INTERVAL_MS;
  return Math.min(5000, Math.max(2000, Math.floor(parsed)));
})();

const maxBatchSize = (() => {
  const parsed = Number(process.env.SECURITY_LOG_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_SIZE;
  return Math.min(500, Math.max(10, Math.floor(parsed)));
})();

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

type UserActivityPayload = {
  userId: string;
  orgId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
};

type EnrichedSecurityEvent = {
  payload: SecurityEventPayload;
  baseSeverity: Severity;
  baseMetadata: Record<string, unknown>;
  geo: { country?: string; region?: string; city?: string };
};

const securityEventQueue: SecurityEventPayload[] = [];
const userActivityQueue: UserActivityPayload[] = [];

let flushTimer: NodeJS.Timeout | null = null;
let flushInProgress = false;

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

async function withDbTimeout<T>(
  promise: Promise<T>,
  operationName: string,
): Promise<T | null> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[Security] ${operationName} exceeded ${DB_WRITE_TIMEOUT_MS}ms; dropping batch write`,
      );
      resolve(null);
    }, DB_WRITE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result as T | null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueues();
  }, flushIntervalMs);
}

function triggerImmediateFlushIfNeeded(): void {
  if (
    securityEventQueue.length < maxBatchSize &&
    userActivityQueue.length < maxBatchSize
  ) {
    scheduleFlush();
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  void flushQueues();
}

function drainBatch<T>(queue: T[]): T[] {
  if (!queue.length) return [];
  return queue.splice(0, maxBatchSize);
}

async function enrichSecurityEvents(
  batch: SecurityEventPayload[],
): Promise<EnrichedSecurityEvent[]> {
  return Promise.all(
    batch.map(async (payload) => {
      const geo: { country?: string; region?: string; city?: string } =
        await enrichGeoData(payload.ip).catch(() => ({}));
      const deviceInfo = parseUserAgent(payload.userAgent);
      const baseSeverity: Severity = payload.severity ?? 'info';
      const baseMetadata = sanitizeMetadata({
        ...(payload.metadata ?? {}),
        ...deviceInfo,
      });

      return {
        payload,
        geo,
        baseSeverity,
        baseMetadata,
      };
    }),
  );
}

async function flushSecurityEventsBatch(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  batch: SecurityEventPayload[],
): Promise<void> {
  if (!batch.length) return;

  const enrichedBatch = await enrichSecurityEvents(batch);

  const insertPayload = enrichedBatch.map((entry) => ({
    type: entry.payload.type,
    severity: entry.baseSeverity,
    user_id: entry.payload.userId,
    org_id: entry.payload.orgId,
    ip_address: entry.payload.ip,
    user_agent: entry.payload.userAgent,
    device_fingerprint: entry.payload.deviceFingerprint,
    geo_country: entry.geo.country,
    geo_region: entry.geo.region,
    geo_city: entry.geo.city,
    request_path: entry.payload.path,
    request_method: entry.payload.method,
    status_code: entry.payload.statusCode,
    metadata: entry.baseMetadata,
  }));

  const inserted = await withDbTimeout(
    admin.from('security_events').insert(insertPayload).select('id'),
    'security_events.insert',
  );

  if (!inserted || (inserted as any).error || !(inserted as any).data) {
    return;
  }

  const insertedRows = (inserted as any).data as Array<{ id: string }>;
  if (!insertedRows.length) return;

  const updates: Array<{ id: string; severity: Severity; metadata: Record<string, unknown> }> = [];
  const alerts: Array<{ event_id: string; notes: string }> = [];

  for (let index = 0; index < enrichedBatch.length; index += 1) {
    const entry = enrichedBatch[index];
    const insertedEventId = insertedRows[index]?.id;
    if (!insertedEventId) continue;

    const context: DetectionContext = {
      userId: entry.payload.userId,
      orgId: entry.payload.orgId,
      ip: entry.payload.ip,
      userAgent: entry.payload.userAgent,
      deviceFingerprint: entry.payload.deviceFingerprint,
      geoCountry: entry.geo.country,
      path: entry.payload.path,
      method: entry.payload.method,
      statusCode: entry.payload.statusCode,
    };

    const detections = await runDetectionRules(entry.payload, context);
    const strongestDetectionSeverity = detections.reduce<Severity>(
      (current, detection) => maxSeverity(current, detection.severity),
      'info',
    );
    const finalSeverity = maxSeverity(
      entry.baseSeverity,
      strongestDetectionSeverity,
    );

    if (detections.length > 0 || finalSeverity !== entry.baseSeverity) {
      const detectionDetails = detections.map((detection) => ({
        severity: detection.severity,
        reason: detection.reason,
        metadata: sanitizeMetadata(
          (detection.metadata ?? {}) as Record<string, unknown>,
        ),
      }));

      updates.push({
        id: insertedEventId,
        severity: finalSeverity,
        metadata: {
          ...entry.baseMetadata,
          detection: detectionDetails,
        },
      });
    }

    if (shouldCreateAlert(finalSeverity)) {
      const alertReason =
        detections[0]?.reason ?? `Auto-generated ${finalSeverity} event`;
      alerts.push({
        event_id: insertedEventId,
        notes: `Auto-generated: ${alertReason}`,
      });
    }
  }

  if (updates.length > 0) {
    await withDbTimeout(
      Promise.all(
        updates.map((update) =>
          admin
            .from('security_events')
            .update({
              severity: update.severity,
              metadata: update.metadata,
            })
            .eq('id', update.id),
        ),
      ),
      'security_events.update',
    );
  }

  if (alerts.length > 0) {
    await withDbTimeout(
      admin.from('security_alerts').insert(alerts),
      'security_alerts.insert',
    );
  }
}

async function flushUserActivityBatch(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  batch: UserActivityPayload[],
): Promise<void> {
  if (!batch.length) return;

  const rows = batch.map((params) => ({
    user_id: params.userId,
    org_id: params.orgId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    route: params.route,
    metadata: sanitizeMetadata(params.metadata),
  }));

  await withDbTimeout(
    admin.from('user_activity').insert(rows),
    'user_activity.insert',
  );
}

async function flushQueues(): Promise<void> {
  if (flushInProgress) return;
  flushInProgress = true;

  try {
    const admin = createSupabaseAdminClient();

    while (securityEventQueue.length > 0 || userActivityQueue.length > 0) {
      const securityBatch = drainBatch(securityEventQueue);
      const activityBatch = drainBatch(userActivityQueue);

      await Promise.all([
        flushSecurityEventsBatch(admin, securityBatch),
        flushUserActivityBatch(admin, activityBatch),
      ]);
    }
  } catch {
    // Best-effort logging only.
  } finally {
    flushInProgress = false;
    if (securityEventQueue.length > 0 || userActivityQueue.length > 0) {
      scheduleFlush();
    }
  }
}

function enqueueSecurityEvent(payload: SecurityEventPayload): void {
  securityEventQueue.push(payload);
  triggerImmediateFlushIfNeeded();
}

function enqueueUserActivity(payload: UserActivityPayload): void {
  userActivityQueue.push(payload);
  triggerImmediateFlushIfNeeded();
}

export function dispatchSecurityEventEnhanced(payload: SecurityEventPayload): void {
  try {
    enqueueSecurityEvent(payload);
  } catch {
    // Best-effort logging only.
  }
}

export function dispatchUserActivity(params: UserActivityPayload): void {
  try {
    enqueueUserActivity(params);
  } catch {
    // Best-effort logging only.
  }
}

export function logSecurityEventEnhanced(
  payload: SecurityEventPayload,
): void {
  dispatchSecurityEventEnhanced(payload);
}

export function logUserActivity(params: UserActivityPayload): void {
  dispatchUserActivity(params);
}

export function logLoginAttempt(params: {
  success: boolean;
  userId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  reason?: string;
}): void {
  dispatchSecurityEventEnhanced({
    type: params.success ? 'login_success' : 'login_failure',
    severity: params.success ? 'info' : 'medium',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    deviceFingerprint: params.deviceFingerprint,
    metadata: { reason: params.reason },
  });
}

export function logUnauthorizedAccess(params: {
  userId?: string;
  orgId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  userRole?: string;
}): void {
  dispatchSecurityEventEnhanced({
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

export function logRateLimitExceeded(params: {
  userId?: string;
  ip: string;
  userAgent: string;
  path?: string;
}): void {
  dispatchSecurityEventEnhanced({
    type: 'rate_limit_exceeded',
    severity: 'medium',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    path: params.path,
    statusCode: 429,
  });
}
