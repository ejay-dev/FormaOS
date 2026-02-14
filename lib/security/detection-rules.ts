/**
 * Security Detection Rules
 *
 * Enterprise-grade threat detection:
 * - Brute force / repeated login failures
 * - Impossible travel detection
 * - New device login alerts
 * - Token/session anomalies
 * - Privilege escalation attempts
 * - Rate limit violations
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface DetectionContext {
  userId?: string;
  orgId?: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  geoCountry?: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

export interface DetectionResult {
  triggered: boolean;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// 1. BRUTE FORCE DETECTION
// ============================================================================

/**
 * Detect brute force login attempts
 * Rule: 5+ failed logins from same IP within 15 minutes = HIGH
 * Rule: 10+ failed logins to same account within 30 minutes = CRITICAL
 */
export async function detectBruteForce(
  context: DetectionContext,
  identifier: { by: 'ip' | 'user'; value: string },
): Promise<DetectionResult> {
  const admin = createSupabaseAdminClient();

  const timeWindow = identifier.by === 'ip' ? 15 : 30; // minutes
  const threshold = identifier.by === 'ip' ? 5 : 10;
  const since = new Date(Date.now() - timeWindow * 60 * 1000).toISOString();

  const query = admin
    .from('security_events')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'login_failure')
    .gte('created_at', since);

  if (identifier.by === 'ip') {
    query.eq('ip_address', identifier.value);
  } else {
    query.eq('user_id', identifier.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[Detection] Brute force check failed:', error);
    return { triggered: false, severity: 'info' };
  }

  if ((count ?? 0) >= threshold) {
    return {
      triggered: true,
      severity: identifier.by === 'user' ? 'critical' : 'high',
      reason: `${count} failed login attempts from ${identifier.by} within ${timeWindow} minutes`,
      metadata: {
        identifier: identifier.by,
        value: identifier.value,
        count,
        timeWindow,
      },
    };
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// 2. IMPOSSIBLE TRAVEL DETECTION
// ============================================================================

/**
 * Detect impossible travel (country change in short time window)
 * Rule: Country change within 2 hours = MEDIUM (unless VPN pattern)
 */
export async function detectImpossibleTravel(
  context: DetectionContext,
): Promise<DetectionResult> {
  if (!context.userId || !context.geoCountry) {
    return { triggered: false, severity: 'info' };
  }

  const admin = createSupabaseAdminClient();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('security_events')
    .select('geo_country, created_at')
    .eq('user_id', context.userId)
    .not('geo_country', 'is', null)
    .gte('created_at', twoHoursAgo)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) {
    return { triggered: false, severity: 'info' };
  }

  // Check if user has logged in from a different country recently
  const countries = new Set(data.map((e: any) => e.geo_country));
  if (countries.size > 1 && !countries.has(context.geoCountry)) {
    return {
      triggered: true,
      severity: 'medium',
      reason: `Login from new country (${context.geoCountry}) within 2 hours of activity in ${Array.from(countries).join(', ')}`,
      metadata: {
        currentCountry: context.geoCountry,
        previousCountries: Array.from(countries),
        recentEvents: data.length,
      },
    };
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// 3. NEW DEVICE DETECTION
// ============================================================================

/**
 * Detect login from new device
 * Rule: First time seeing this device fingerprint = LOW
 */
export async function detectNewDevice(
  context: DetectionContext,
): Promise<DetectionResult> {
  if (!context.userId || !context.deviceFingerprint) {
    return { triggered: false, severity: 'info' };
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('security_events')
    .select('id')
    .eq('user_id', context.userId)
    .eq('device_fingerprint', context.deviceFingerprint)
    .limit(1);

  if (error) {
    console.error('[Detection] New device check failed:', error);
    return { triggered: false, severity: 'info' };
  }

  // New device if no previous events found
  if (!data || data.length === 0) {
    return {
      triggered: true,
      severity: 'low',
      reason: 'Login from new device',
      metadata: {
        deviceFingerprint: context.deviceFingerprint,
        userAgent: context.userAgent,
      },
    };
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// 4. TOKEN/SESSION ANOMALY DETECTION
// ============================================================================

/**
 * Detect session anomalies (fingerprint mismatch, suspicious patterns)
 * Rule: Device fingerprint doesn't match session = MEDIUM
 */
export async function detectSessionAnomaly(
  sessionId: string,
  context: DetectionContext,
): Promise<DetectionResult> {
  if (!context.deviceFingerprint) {
    return { triggered: false, severity: 'info' };
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('active_sessions')
    .select('device_fingerprint, user_agent')
    .eq('session_id', sessionId)
    .is('revoked_at', null)
    .single();

  if (error || !data) {
    return { triggered: false, severity: 'info' };
  }

  // Check for fingerprint mismatch
  if (
    data.device_fingerprint &&
    data.device_fingerprint !== context.deviceFingerprint
  ) {
    return {
      triggered: true,
      severity: 'medium',
      reason: 'Device fingerprint mismatch for existing session',
      metadata: {
        expectedFingerprint: data.device_fingerprint,
        actualFingerprint: context.deviceFingerprint,
        sessionId,
      },
    };
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// 5. PRIVILEGE ESCALATION DETECTION
// ============================================================================

/**
 * Detect unauthorized access attempts to admin/privileged endpoints
 * Rule: Non-admin accessing /admin/* = HIGH
 * Rule: Non-org-member accessing org resources = HIGH
 */
export async function detectPrivilegeEscalation(
  context: DetectionContext,
  userRole?: string,
): Promise<DetectionResult> {
  // Check admin endpoint access
  if (context.path?.startsWith('/admin')) {
    if (userRole !== 'founder' && userRole !== 'admin') {
      return {
        triggered: true,
        severity: 'high',
        reason: `Non-admin user attempted to access admin endpoint: ${context.path}`,
        metadata: {
          path: context.path,
          userRole: userRole || 'unknown',
        },
      };
    }
  }

  // Check for API endpoints with org context
  if (context.path?.includes('/api/') && context.orgId && context.userId) {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('organization_members')
      .select('id')
      .eq('user_id', context.userId)
      .eq('organization_id', context.orgId)
      .limit(1);

    if (error) {
      console.error('[Detection] Org membership check failed:', error);
      return { triggered: false, severity: 'info' };
    }

    // User not a member of the org they're trying to access
    if (!data || data.length === 0) {
      return {
        triggered: true,
        severity: 'high',
        reason:
          'User attempted to access resources for organization they are not a member of',
        metadata: {
          path: context.path,
          orgId: context.orgId,
        },
      };
    }
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// 6. RATE LIMIT VIOLATION DETECTION
// ============================================================================

/**
 * Detect rate limit violations
 * Rule: 429 status code = MEDIUM (after threshold)
 */
export async function detectRateLimitViolation(
  context: DetectionContext,
): Promise<DetectionResult> {
  if (context.statusCode !== 429) {
    return { triggered: false, severity: 'info' };
  }

  const admin = createSupabaseAdminClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from('security_events')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'rate_limit_exceeded')
    .eq('ip_address', context.ip)
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('[Detection] Rate limit check failed:', error);
    return { triggered: false, severity: 'info' };
  }

  // Trigger alert if multiple violations in short window
  if ((count ?? 0) >= 5) {
    return {
      triggered: true,
      severity: 'medium',
      reason: `${count} rate limit violations from IP within 5 minutes`,
      metadata: {
        count,
        ip: context.ip,
        path: context.path,
      },
    };
  }

  return { triggered: false, severity: 'info' };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse basic geo data from IP (placeholder for real geo service)
 * In production, integrate with MaxMind, ipapi, or similar
 */
export async function enrichGeoData(_ip: string): Promise<{
  country?: string;
  region?: string;
  city?: string;
}> {
  // TODO: Integrate with geo IP service (MaxMind, ipapi, etc.)
  // For now, return empty to not block requests
  return {};
}

/**
 * Parse device info from User-Agent
 */
export function parseUserAgent(ua: string): {
  browser?: string;
  os?: string;
  device?: string;
} {
  const browser = ua.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0];
  const os = ua.match(/(?:Windows|Mac OS X|Linux|Android|iOS)[\w\s\d._]*/)?.[0];
  const device = ua.match(/(?:iPhone|iPad|Android|Mobile)/)?.[0];

  return {
    browser: browser?.split('/')[0],
    os: os?.trim(),
    device: device?.trim(),
  };
}
