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
    supabase_url: { status: string; value?: string };
    anon_key: { status: string; truncated?: string };
    service_role_key: { status: string; configured: boolean };
    session: { status: string; user?: string | null; error?: string };
    jwt_validity: { status: string; message?: string };
    cookies: { status: string; count: number; auth_cookies: string[] };
  };
  diagnostics?: {
    environment: string;
    cookie_domain?: string;
    app_url?: string;
  };
}

function getProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'unknown';
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  const projectRef = getProjectRef(supabaseUrl);
  const authCookiePrefix = `sb-${projectRef}`;

  // Find all Supabase auth cookies
  const authCookies = allCookies
    .filter((c) => c.name.startsWith(authCookiePrefix))
    .map((c) => c.name);

  const response: AuthHealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase_url: {
        status: supabaseUrl ? 'ok' : 'missing',
        value: supabaseUrl ? `${new URL(supabaseUrl).hostname}` : undefined,
      },
      anon_key: {
        status: anonKey ? 'ok' : 'missing',
        truncated: anonKey ? `${anonKey.slice(0, 20)}...` : undefined,
      },
      service_role_key: {
        status: serviceRoleKey ? 'ok' : 'missing',
        configured: !!serviceRoleKey,
      },
      session: {
        status: 'checking',
        user: null,
      },
      jwt_validity: {
        status: 'checking',
      },
      cookies: {
        status: authCookies.length > 0 ? 'ok' : 'none',
        count: authCookies.length,
        auth_cookies: authCookies,
      },
    },
    diagnostics: {
      environment: process.env.NODE_ENV ?? 'unknown',
      cookie_domain:
        process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.COOKIE_DOMAIN,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
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
      response.checks.session.user = data.user.email ?? data.user.id;
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
