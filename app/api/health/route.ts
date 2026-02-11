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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

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

    // Return appropriate HTTP status
    const httpStatus = hasErrors ? 503 : 200;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
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
