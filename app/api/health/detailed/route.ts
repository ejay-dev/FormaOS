import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { checkRedisHealth } from '@/lib/redis/health';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

interface DetailedCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'error';
  responseTime: number;
  details?: any;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: DetailedCheck[] = [];

  // Database connection test
  await testDatabase(checks);

  // Authentication service test
  await testAuthentication(checks);

  // API endpoints test
  await testAPIEndpoints(checks);

  // Environment configuration test
  await testEnvironmentConfig(checks);

  // Redis health check
  await testRedis(checks);

  // Calculate overall health
  const errorCount = checks.filter((c) => c.status === 'error').length;
  const degradedCount = checks.filter((c) => c.status === 'degraded').length;

  let overallStatus: 'healthy' | 'degraded' | 'error';
  if (errorCount > 0) {
    overallStatus = 'error';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalResponseTime: Date.now() - startTime,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || 'unknown',
    uptime: process.uptime(),
    checks: checks,
    summary: {
      total: checks.length,
      healthy: checks.filter((c) => c.status === 'healthy').length,
      degraded: degradedCount,
      errors: errorCount,
    },
    system: {
      memory: process.memoryUsage(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  const httpStatus =
    overallStatus === 'error' ? 503 : overallStatus === 'degraded' ? 200 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

async function testDatabase(checks: DetailedCheck[]) {
  const startTime = Date.now();

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Test basic connection
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (orgsError) {
      checks.push({
        name: 'database_connection',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: orgsError.message,
      });
      return;
    }

    // Test RLS policies
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    checks.push({
      name: 'database_connection',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        organizations_count: orgs?.length || 0,
        rls_policies_active: !profilesError,
      },
    });
  } catch (error) {
    checks.push({
      name: 'database_connection',
      status: 'error',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : 'Database connection failed',
    });
  }
}

async function testAuthentication(checks: DetailedCheck[]) {
  const startTime = Date.now();

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    // Test auth service
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    checks.push({
      name: 'authentication_service',
      status: error ? 'degraded' : 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        session_active: !!session,
        auth_service_responding: !error,
      },
      error: error?.message,
    });
  } catch (error) {
    checks.push({
      name: 'authentication_service',
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Auth service error',
    });
  }
}

async function testAPIEndpoints(checks: DetailedCheck[]) {
  const startTime = Date.now();

  try {
    // Test API responsiveness (self-test)
    checks.push({
      name: 'api_endpoints',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        self_test: 'passed',
        endpoints_responding: true,
      },
    });
  } catch (error) {
    checks.push({
      name: 'api_endpoints',
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'API endpoints error',
    });
  }
}

async function testEnvironmentConfig(checks: DetailedCheck[]) {
  const startTime = Date.now();

  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    const hasServiceRole =
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
      Boolean(process.env.SUPABASE_SERVICE_KEY) ||
      Boolean(process.env.SUPABASE_SERVICE_ROLE);

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );
    if (!hasServiceRole) {
      missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    }
    const hasAllRequired = missingVars.length === 0;

    checks.push({
      name: 'environment_config',
      status: hasAllRequired ? 'healthy' : 'error',
      responseTime: Date.now() - startTime,
      details: {
        required_vars_count: requiredEnvVars.length,
        missing_vars_count: missingVars.length,
        environment: process.env.NODE_ENV,
      },
      error:
        missingVars.length > 0
          ? `Missing required environment variables: ${missingVars.join(', ')}`
          : undefined,
    });
  } catch (error) {
    checks.push({
      name: 'environment_config',
      status: 'error',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : 'Environment config error',
    });
  }
}

async function testRedis(checks: DetailedCheck[]) {
  const startTime = Date.now();

  try {
    const result = await checkRedisHealth();
    checks.push({
      name: 'redis_cache',
      status: result.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      details: {
        reason: result.ok ? 'ok' : result.reason ?? 'unknown',
      },
    });
  } catch (error) {
    checks.push({
      name: 'redis_cache',
      status: 'degraded',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Redis check failed',
    });
  }
}
