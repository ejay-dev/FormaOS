import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: {
        status: 'unknown' as string,
        responseTime: null as number | null,
        error: null as string | null,
      },
      auth: {
        status: 'unknown' as string,
        responseTime: null as number | null,
        error: null as string | null,
      },
      api: {
        status: 'healthy' as string,
        responseTime: null as number | null,
        error: null as string | null,
      },
    },
    version: process.env.npm_package_version || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    // Database health check
    const dbStart = Date.now();
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const hasValidSupabaseUrl = (() => {
      if (!supabaseUrl) return false;
      try {
        new URL(supabaseUrl);
        return true;
      } catch {
        return false;
      }
    })();

    // In CI / preview contexts, Supabase env can be intentionally absent.
    // This endpoint is used as a liveness signal in CI security tests, so it
    // must not return 5xx for configuration issues; report `degraded` but keep
    // HTTP 200. Use `/api/health/detailed` or HEAD for stricter readiness.
    if (!hasValidSupabaseUrl || !serviceRoleKey) {
      health.checks.database = {
        status: 'error',
        responseTime: Date.now() - dbStart,
        error: 'Supabase service role configuration missing',
      };
      health.checks.auth = {
        status: 'error',
        responseTime: 0,
        error: 'Supabase service role configuration missing',
      };
      health.checks.api = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        error: null,
      };

      health.status = 'degraded';

      return NextResponse.json(health, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      const { error } = await supabase.from('organizations').select('id').limit(1);

      health.checks.database = {
        status: error ? 'error' : 'healthy',
        responseTime: Date.now() - dbStart,
        error: error?.message || null,
      };
    } catch (dbError: any) {
      health.checks.database = {
        status: 'error',
        responseTime: Date.now() - dbStart,
        error:
          dbError instanceof Error
            ? dbError.message
            : 'Database connection failed',
      };
    }

    // Auth service health check
    const authStart = Date.now();
    try {
      const { error: authError } = await supabase.auth.getSession();
      health.checks.auth = {
        status: authError ? 'error' : 'healthy',
        responseTime: Date.now() - authStart,
        error: authError?.message || null,
      };
    } catch (authErr) {
      health.checks.auth = {
        status: 'error',
        responseTime: Date.now() - authStart,
        error:
          authErr instanceof Error ? authErr.message : 'Auth service error',
      };
    }

    // API health check (self-check)
    health.checks.api = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      error: null,
    };

    // Determine overall health status
    const hasErrors = Object.values(health.checks).some(
      (check) => check.status === 'error',
    );
    health.status = hasErrors ? 'degraded' : 'healthy';

    // Liveness endpoint: always 200 unless we hit a critical exception.
    const httpStatus = 200;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Health-Status': health.status,
      },
    });
  } catch (error) {
    // Critical error - system is down
    const criticalHealth = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Critical system error',
      checks: {
        database: {
          status: 'error',
          responseTime: null,
          error: 'Critical failure',
        },
        auth: {
          status: 'error',
          responseTime: null,
          error: 'Critical failure',
        },
        api: {
          status: 'error',
          responseTime: Date.now() - startTime,
          error: 'Critical failure',
        },
      },
    };

    return NextResponse.json(criticalHealth, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

// Support HEAD requests for simple up/down checks
export async function HEAD() {
  try {
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const hasValidSupabaseUrl = (() => {
      if (!supabaseUrl) return false;
      try {
        new URL(supabaseUrl);
        return true;
      } catch {
        return false;
      }
    })();

    if (!hasValidSupabaseUrl || !serviceRoleKey) {
      return new Response(null, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from('organizations').select('id').limit(1).single();

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
