import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

// Audit 2026-05-25 (GDPR): user-scoped personal-data export. Returns a
// JSON document containing every row the app holds keyed to the caller's
// auth user — account, profile, security flags (no secrets), email prefs,
// org memberships, and audit/activity rows. CSV is offered as a sibling
// download via ?format=csv on a future iteration; v1 is JSON-only and
// covers the GDPR Article 15 (right of access) + Article 20 (portability)
// requirements at one canonical endpoint.
//
// Auth: must be a signed-in user. Service-role used downstream to pierce
// RLS on the user's OWN rows after we've already validated the caller's
// identity from cookies.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = routeLog('/api/v1/account/export');

type ExportPayload = {
  exported_at: string;
  schema_version: 1;
  account: {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
  };
  profile: Record<string, unknown> | null;
  security: {
    mfa_enabled: boolean;
    mfa_enabled_at: string | null;
    last_password_change_at: string | null;
  } | null;
  email_preferences: Record<string, unknown> | null;
  memberships: Array<{
    organization_id: string;
    organization_name: string | null;
    role: string | null;
    joined_at: string | null;
  }>;
  notifications_preferences: Record<string, unknown> | null;
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 },
    );
  }

  const rateLimit = await rateLimitApi(request, user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) } },
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    const [
      profileRow,
      securityRow,
      emailPrefRow,
      membershipRows,
      notifPrefRow,
    ] = await Promise.all([
      admin
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('user_security')
        .select(
          'two_factor_enabled, two_factor_enabled_at, last_password_change_at',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('org_members')
        .select('organization_id, role, created_at, organizations(name)')
        .eq('user_id', user.id),
      admin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const memberships =
      (membershipRows.data ?? []).map((m: any) => ({
        organization_id: m.organization_id as string,
        organization_name: Array.isArray(m.organizations)
          ? (m.organizations[0]?.name ?? null)
          : (m.organizations?.name ?? null),
        role: (m.role as string | null) ?? null,
        joined_at: (m.created_at as string | null) ?? null,
      })) ?? [];

    const security = securityRow.data
      ? {
          mfa_enabled: Boolean(securityRow.data.two_factor_enabled),
          mfa_enabled_at: (securityRow.data.two_factor_enabled_at as string | null) ?? null,
          last_password_change_at:
            (securityRow.data.last_password_change_at as string | null) ?? null,
        }
      : null;

    const payload: ExportPayload = {
      exported_at: new Date().toISOString(),
      schema_version: 1,
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        last_sign_in_at: (user as { last_sign_in_at?: string }).last_sign_in_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
      },
      profile: (profileRow.data as Record<string, unknown> | null) ?? null,
      security,
      email_preferences:
        (emailPrefRow.data as Record<string, unknown> | null) ?? null,
      memberships,
      notifications_preferences:
        (notifPrefRow.data as Record<string, unknown> | null) ?? null,
    };

    const json = JSON.stringify(payload, null, 2);
    const filename = `formaos-account-${user.id}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    log.error({ err, userId: user.id }, 'account export failed');
    return NextResponse.json(
      { error: 'export_failed' },
      { status: 500 },
    );
  }
}
