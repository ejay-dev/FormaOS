import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuthHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    supabase_url: { status: string };
    anon_key: { status: string };
    service_role_key: { status: string };
    session: { status: string; authenticated?: boolean; error?: string };
    jwt_validity: { status: string; message?: string };
    cookies: { status: string; count: number };
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  // Count auth cookies without exposing names or project ref
  const authCookieCount = allCookies.filter((c) =>
    c.name.startsWith('sb-'),
  ).length;

  const response: AuthHealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase_url: {
        status: supabaseUrl ? 'ok' : 'missing',
      },
      anon_key: {
        status: anonKey ? 'ok' : 'missing',
      },
      service_role_key: {
        status: serviceRoleKey ? 'ok' : 'missing',
      },
      session: {
        status: 'checking',
        authenticated: false,
      },
      jwt_validity: {
        status: 'checking',
      },
      cookies: {
        status: authCookieCount > 0 ? 'ok' : 'none',
        count: authCookieCount,
      },
    },
  };

  // Check session validity
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      response.checks.session.status = 'error';
      response.checks.session.error = error.message;

      // Check if this is a JWT-related error (key rotation issue)
      if (
        error.message.includes('invalid JWT') ||
        error.message.includes('JWT expired') ||
        error.message.includes('token') ||
        error.message.includes('signature')
      ) {
        response.checks.jwt_validity.status = 'invalid';
        response.checks.jwt_validity.message =
          'Session token may be signed with old JWT key. User should sign out and sign in again.';
        response.status = 'degraded';
      } else {
        response.checks.jwt_validity.status = 'no_session';
      }
    } else if (data?.user) {
      response.checks.session.status = 'authenticated';
      response.checks.session.authenticated = true;
      response.checks.jwt_validity.status = 'valid';
      response.checks.jwt_validity.message =
        'Session token is valid with current JWT key.';
    } else {
      response.checks.session.status = 'no_session';
      response.checks.jwt_validity.status = 'no_session';
    }
  } catch (err) {
    response.checks.session.status = 'error';
    response.checks.session.error =
      err instanceof Error ? err.message : 'Unknown error';
    response.status = 'unhealthy';
  }

  // Test admin client connectivity (without exposing sensitive data)
  try {
    const admin = createSupabaseAdminClient();
    const { error: adminError } = await admin
      .from('organizations')
      .select('id')
      .limit(1);

    if (adminError && !adminError.message.includes('permission denied')) {
      response.status = 'degraded';
    }
  } catch {
    // Admin check is optional
  }

  // Determine overall status
  if (!supabaseUrl || !anonKey) {
    response.status = 'unhealthy';
  } else if (!serviceRoleKey) {
    response.status = 'degraded';
  }

  return NextResponse.json(response);
}
