import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import {
  createTrackedSession,
  generateDeviceFingerprint,
  generateSessionToken,
  extractClientIP,
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';
import {
  TRACKED_SESSION_COOKIE,
  TRACKED_SESSION_MAX_AGE,
} from '@/lib/security/session-constants';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership?.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', membership.organization_id)
      .maybeSingle();

    const response = NextResponse.json({
      ok: true,
      organizationId: membership.organization_id,
      next: org?.onboarding_completed ? '/app' : '/onboarding',
    });

    await logSecurityEvent({
      eventType: SecurityEventTypes.LOGIN_SUCCESS,
      userId: user.id,
      ipAddress: extractClientIP(request.headers),
      userAgent: request.headers.get('user-agent') ?? undefined,
      metadata: { source: 'bootstrap' },
    });

    const cookieStore = await cookies();
    const existingToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
    if (!existingToken) {
      const userAgent = request.headers.get('user-agent') ?? '';
      const fingerprint = generateDeviceFingerprint(
        userAgent,
        request.headers.get('accept-language') ?? '',
        request.headers.get('accept-encoding') ?? '',
      );
      const sessionToken = generateSessionToken();
      try {
        await createTrackedSession({
          userId: user.id,
          sessionToken,
          ipAddress: extractClientIP(request.headers),
          userAgent,
          deviceFingerprint: fingerprint,
        });
        const requestUrl = new URL(request.url);
        const cookieDomain = getCookieDomain(requestUrl.hostname);
        response.cookies.set(TRACKED_SESSION_COOKIE, sessionToken, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: requestUrl.protocol === 'https:',
          maxAge: TRACKED_SESSION_MAX_AGE,
          ...(cookieDomain ? { domain: cookieDomain } : {}),
        });
      } catch (error) {
        console.error('[auth/bootstrap] Session tracking failed:', error);
      }
    }

    return response;
  }

  const now = new Date().toISOString();
  const planKey = resolvePlanKey(
    (user.user_metadata as { selected_plan?: string | null })?.selected_plan ??
      null,
  );
  const orgName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'New Organization';

  const { data: organization, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: orgName,
      created_by: user.id,
      plan_key: planKey ?? null,
      plan_selected_at: planKey ? now : null,
      onboarding_completed: false,
    })
    .select('id')
    .single();

  if (orgError || !organization?.id) {
    console.error('[auth/bootstrap] organization insert failed:', orgError);
    return NextResponse.json({ ok: false, error: 'org_create_failed' }, { status: 500 });
  }

  const orgId = organization.id;

  const { error: memberError } = await admin.from('org_members').insert({
    organization_id: orgId,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) {
    console.error('[auth/bootstrap] org_members insert failed:', memberError);
    await admin.from('organizations').delete().eq('id', orgId);
    return NextResponse.json({ ok: false, error: 'member_create_failed' }, { status: 500 });
  }

  await admin
    .from('org_onboarding_status')
    .upsert({
      organization_id: orgId,
      current_step: 1,
      completed_steps: [],
      updated_at: now,
    })
    .select('organization_id')
    .maybeSingle();

  try {
    await ensureSubscription(orgId, planKey ?? null);
  } catch (err) {
    console.error('[auth/bootstrap] ensureSubscription failed:', err);
  }

  const response = NextResponse.json({
    ok: true,
    organizationId: orgId,
    next: '/onboarding',
  });

  await logSecurityEvent({
    eventType: SecurityEventTypes.LOGIN_SUCCESS,
    userId: user.id,
    ipAddress: extractClientIP(request.headers),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata: { source: 'bootstrap' },
  });

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (!existingToken) {
    const userAgent = request.headers.get('user-agent') ?? '';
    const fingerprint = generateDeviceFingerprint(
      userAgent,
      request.headers.get('accept-language') ?? '',
      request.headers.get('accept-encoding') ?? '',
    );
    const sessionToken = generateSessionToken();
    try {
      await createTrackedSession({
        userId: user.id,
        sessionToken,
        ipAddress: extractClientIP(request.headers),
        userAgent,
        deviceFingerprint: fingerprint,
      });
      const requestUrl = new URL(request.url);
      const cookieDomain = getCookieDomain(requestUrl.hostname);
      response.cookies.set(TRACKED_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: requestUrl.protocol === 'https:',
        maxAge: TRACKED_SESSION_MAX_AGE,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
    } catch (error) {
      console.error('[auth/bootstrap] Session tracking failed:', error);
    }
  }

  return response;
}
