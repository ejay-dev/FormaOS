/**
 * =========================================================
 * API Rate Limiting & Monitoring
 * =========================================================
 * Rate limiting and API usage monitoring with Redis
 */

import { Redis } from '@upstash/redis';
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '../audit-trail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type RateLimitTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface RateLimitConfig {
  tier: RateLimitTier;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstAllowance: number;
}

export interface ApiUsageMetrics {
  organizationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userId?: string;
  errorMessage?: string;
}

/**
 * Rate limit configurations by tier
 */
const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  free: {
    tier: 'free',
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    burstAllowance: 5,
  },
  starter: {
    tier: 'starter',
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstAllowance: 20,
  },
  professional: {
    tier: 'professional',
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstAllowance: 100,
  },
  enterprise: {
    tier: 'enterprise',
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    burstAllowance: 500,
  },
};

/**
 * Check rate limit using sliding window algorithm
 */
export async function checkRateLimit(
  organizationId: string,
  tier: RateLimitTier,
  endpoint: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMIT_CONFIGS[tier];
  const now = Date.now();
  const minuteKey = `ratelimit:${organizationId}:minute`;
  const hourKey = `ratelimit:${organizationId}:hour`;
  const dayKey = `ratelimit:${organizationId}:day`;

  try {
    // Check minute limit (sliding window)
    const minuteCount = (await redis.get<number>(minuteKey)) || 0;
    if (minuteCount >= config.requestsPerMinute) {
      const ttl = await redis.ttl(minuteKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + ttl * 1000),
      };
    }

    // Check hour limit
    const hourCount = (await redis.get<number>(hourKey)) || 0;
    if (hourCount >= config.requestsPerHour) {
      const ttl = await redis.ttl(hourKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + ttl * 1000),
      };
    }

    // Check day limit
    const dayCount = (await redis.get<number>(dayKey)) || 0;
    if (dayCount >= config.requestsPerDay) {
      const ttl = await redis.ttl(dayKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + ttl * 1000),
      };
    }

    // Increment counters
    await redis.incr(minuteKey);
    await redis.expire(minuteKey, 60); // 1 minute

    await redis.incr(hourKey);
    await redis.expire(hourKey, 3600); // 1 hour

    await redis.incr(dayKey);
    await redis.expire(dayKey, 86400); // 1 day

    return {
      allowed: true,
      remaining: config.requestsPerMinute - (minuteCount + 1),
      resetAt: new Date(now + 60000), // Next minute
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: config.requestsPerMinute,
      resetAt: new Date(now + 60000),
    };
  }
}

/**
 * Check IP-based rate limit (DDoS protection)
 */
export async function checkIpRateLimit(ipAddress: string): Promise<boolean> {
  const key = `ratelimit:ip:${ipAddress}`;
  const limit = 100; // Max 100 requests per minute per IP
  const ttl = 60; // 1 minute window

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }

    return count <= limit;
  } catch (error) {
    console.error('IP rate limit check failed:', error);
    return true; // Fail open
  }
}

/**
 * Track API usage metrics
 */
export async function trackApiUsage(metrics: ApiUsageMetrics): Promise<void> {
  const supabase = await createClient();

  // Store in database for long-term analytics
  await supabase.from('api_usage_logs').insert({
    organization_id: metrics.organizationId,
    user_id: metrics.userId,
    endpoint: metrics.endpoint,
    method: metrics.method,
    status_code: metrics.statusCode,
    response_time: metrics.responseTime,
    error_message: metrics.errorMessage,
    timestamp: metrics.timestamp,
  });

  // Update real-time counters in Redis
  const date = new Date().toISOString().split('T')[0];
  const hourKey = `metrics:${metrics.organizationId}:${date}:hour`;

  await redis.hincrby(hourKey, 'total_requests', 1);
  await redis.hincrby(hourKey, `status_${metrics.statusCode}`, 1);
  await redis.expire(hourKey, 86400 * 7); // Keep for 7 days

  // Track response times
  const responseKey = `metrics:${metrics.organizationId}:response_times`;
  await redis.lpush(responseKey, metrics.responseTime);
  await redis.ltrim(responseKey, 0, 99); // Keep last 100
  await redis.expire(responseKey, 3600); // 1 hour

  // Log slow requests (>1 second)
  if (metrics.responseTime > 1000) {
    await logActivity(
      metrics.organizationId,
      metrics.userId || '',
      'view',
      'auth',
      {
        entityId: metrics.endpoint,
        entityName: `${metrics.method} ${metrics.endpoint}`,
        details: {
          responseTime: metrics.responseTime,
          statusCode: metrics.statusCode,
        },
      },
    );
  }
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(
  organizationId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  statusBreakdown: Record<number, number>;
}> {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('api_usage_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error || !logs) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      errorRate: 0,
      topEndpoints: [],
      statusBreakdown: {},
    };
  }

  const totalRequests = logs.length;
  const successfulRequests = logs.filter(
    (log: { status_code: number }) =>
      log.status_code >= 200 && log.status_code < 300,
  ).length;
  const successRate =
    totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const errorRate =
    totalRequests > 0
      ? ((totalRequests - successfulRequests) / totalRequests) * 100
      : 0;

  const totalResponseTime = logs.reduce(
    (sum: number, log: { response_time?: number }) =>
      sum + (log.response_time || 0),
    0,
  );
  const averageResponseTime =
    totalRequests > 0 ? totalResponseTime / totalRequests : 0;

  // Count by endpoint
  const endpointCounts = new Map<string, number>();
  logs.forEach((log: { endpoint: string }) => {
    const count = endpointCounts.get(log.endpoint) || 0;
    endpointCounts.set(log.endpoint, count + 1);
  });

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count by status code
  const statusBreakdown: Record<number, number> = {};
  logs.forEach((log: { status_code: number }) => {
    statusBreakdown[log.status_code] =
      (statusBreakdown[log.status_code] || 0) + 1;
  });

  return {
    totalRequests,
    successRate: Math.round(successRate * 100) / 100,
    averageResponseTime: Math.round(averageResponseTime),
    errorRate: Math.round(errorRate * 100) / 100,
    topEndpoints,
    statusBreakdown,
  };
}

/**
 * Get real-time API metrics from Redis
 */
export async function getRealtimeApiMetrics(organizationId: string): Promise<{
  requestsLastMinute: number;
  requestsLastHour: number;
  averageResponseTime: number;
  currentLoad: number;
}> {
  try {
    const minuteKey = `ratelimit:${organizationId}:minute`;
    const hourKey = `ratelimit:${organizationId}:hour`;
    const responseKey = `metrics:${organizationId}:response_times`;

    const [minuteCount, hourCount, responseTimes] = await Promise.all([
      redis.get<number>(minuteKey),
      redis.get<number>(hourKey),
      redis.lrange(responseKey, 0, -1),
    ]);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + Number(time), 0) /
          responseTimes.length
        : 0;

    // Calculate load percentage based on tier limits
    // Assuming professional tier for now
    const config = RATE_LIMIT_CONFIGS.professional;
    const currentLoad = (minuteCount || 0) / config.requestsPerMinute;

    return {
      requestsLastMinute: minuteCount || 0,
      requestsLastHour: hourCount || 0,
      averageResponseTime: Math.round(avgResponseTime),
      currentLoad: Math.round(currentLoad * 100),
    };
  } catch (error) {
    console.error('Failed to get realtime metrics:', error);
    return {
      requestsLastMinute: 0,
      requestsLastHour: 0,
      averageResponseTime: 0,
      currentLoad: 0,
    };
  }
}

/**
 * Get rate limit status for organization
 */
export async function getRateLimitStatus(
  organizationId: string,
  tier: RateLimitTier,
): Promise<{
  tier: RateLimitTier;
  limits: RateLimitConfig;
  current: {
    minute: number;
    hour: number;
    day: number;
  };
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
}> {
  const config = RATE_LIMIT_CONFIGS[tier];

  const minuteKey = `ratelimit:${organizationId}:minute`;
  const hourKey = `ratelimit:${organizationId}:hour`;
  const dayKey = `ratelimit:${organizationId}:day`;

  try {
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      redis.get<number>(minuteKey),
      redis.get<number>(hourKey),
      redis.get<number>(dayKey),
    ]);

    return {
      tier,
      limits: config,
      current: {
        minute: minuteCount || 0,
        hour: hourCount || 0,
        day: dayCount || 0,
      },
      remaining: {
        minute: Math.max(0, config.requestsPerMinute - (minuteCount || 0)),
        hour: Math.max(0, config.requestsPerHour - (hourCount || 0)),
        day: Math.max(0, config.requestsPerDay - (dayCount || 0)),
      },
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      tier,
      limits: config,
      current: { minute: 0, hour: 0, day: 0 },
      remaining: {
        minute: config.requestsPerMinute,
        hour: config.requestsPerHour,
        day: config.requestsPerDay,
      },
    };
  }
}

/**
 * Monitor API health
 */
export async function getApiHealthMetrics(organizationId: string): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  errorRate: number;
  latencyP95: number;
  lastIncident?: string;
}> {
  const supabase = await createClient();

  // Get last hour of data
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { data: recentLogs } = await supabase
    .from('api_usage_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('timestamp', oneHourAgo.toISOString());

  if (!recentLogs || recentLogs.length === 0) {
    return {
      status: 'healthy',
      uptime: 100,
      errorRate: 0,
      latencyP95: 0,
    };
  }

  // Calculate error rate
  const errorCount = recentLogs.filter(
    (log: { status_code: number }) => log.status_code >= 500,
  ).length;
  const errorRate = (errorCount / recentLogs.length) * 100;

  // Calculate P95 latency
  const sortedLatencies = recentLogs
    .map((log: { response_time: number }) => log.response_time)
    .sort((a: number, b: number) => a - b);
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const latencyP95 = sortedLatencies[p95Index] || 0;

  // Determine status
  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  if (errorRate > 10 || latencyP95 > 5000) {
    status = 'degraded';
  }
  if (errorRate > 50) {
    status = 'down';
  }

  const uptime = 100 - errorRate;

  return {
    status,
    uptime: Math.round(uptime * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    latencyP95: Math.round(latencyP95),
    lastIncident: status !== 'healthy' ? new Date().toISOString() : undefined,
  };
}

/**
 * Set alert thresholds
 */
export async function setApiAlertThresholds(
  organizationId: string,
  thresholds: {
    errorRatePercent: number;
    responseTimeMs: number;
    requestsPerMinute: number;
  },
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('api_alert_config').upsert({
    organization_id: organizationId,
    error_rate_threshold: thresholds.errorRatePercent,
    response_time_threshold: thresholds.responseTimeMs,
    request_rate_threshold: thresholds.requestsPerMinute,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Check if alerts should be triggered
 */
export async function checkApiAlerts(
  organizationId: string,
): Promise<Array<{ type: string; message: string; severity: string }>> {
  const supabase = await createClient();
  const alerts: Array<{ type: string; message: string; severity: string }> = [];

  const { data: config } = await supabase
    .from('api_alert_config')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (!config) return alerts;

  const health = await getApiHealthMetrics(organizationId);
  const realtime = await getRealtimeApiMetrics(organizationId);

  // Check error rate
  if (health.errorRate > config.error_rate_threshold) {
    alerts.push({
      type: 'high_error_rate',
      message: `Error rate (${health.errorRate}%) exceeds threshold (${config.error_rate_threshold}%)`,
      severity: 'high',
    });
  }

  // Check response time
  if (health.latencyP95 > config.response_time_threshold) {
    alerts.push({
      type: 'high_latency',
      message: `P95 latency (${health.latencyP95}ms) exceeds threshold (${config.response_time_threshold}ms)`,
      severity: 'medium',
    });
  }

  // Check request rate
  if (realtime.requestsLastMinute > config.request_rate_threshold) {
    alerts.push({
      type: 'high_traffic',
      message: `Request rate (${realtime.requestsLastMinute}/min) exceeds threshold (${config.request_rate_threshold}/min)`,
      severity: 'low',
    });
  }

  return alerts;
}
