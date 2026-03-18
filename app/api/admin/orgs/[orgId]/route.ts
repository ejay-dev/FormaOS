import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { getAdminOrgHealthSnapshot } from '@/lib/admin/customer-health';

type OrgRouteProps = {
  params: Promise<{ orgId: string }>;
};

function asObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function GET(_request: Request, { params }: OrgRouteProps) {
  try {
    await requireAdminAccess({ permission: 'orgs:view' });
    const { orgId } = await params;
    const admin = createSupabaseAdminClient();

    const [
      { data: organization },
      { data: subscription },
      { data: members },
      { data: notes },
      { data: entitlements },
      { data: supportRequests },
      { data: activity },
      { data: sessions },
      { data: securityEvents },
      { data: complianceExports },
      { data: reportExports },
    ] = await Promise.all([
      admin
        .from('organizations')
        .select(
          'id, name, plan_key, onboarding_completed, created_at, created_by, frameworks, lifecycle_status, lifecycle_reason, suspended_at, restored_at, is_active',
        )
        .eq('id', orgId)
        .maybeSingle(),
      admin
        .from('org_subscriptions')
        .select(
          'status, plan_key, stripe_customer_id, stripe_subscription_id, current_period_end, trial_expires_at, payment_failures, grace_period_end, updated_at',
        )
        .eq('organization_id', orgId)
        .maybeSingle(),
      admin
        .from('org_members')
        .select('user_id, role, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('admin_notes')
        .select('id, note, created_by, created_at, org_id, user_id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('org_entitlements')
        .select('id, feature_key, enabled, limit_value, updated_at')
        .eq('organization_id', orgId)
        .order('feature_key', { ascending: true }),
      admin
        .from('support_requests')
        .select('id, email, name, subject, message, status, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('user_activity')
        .select('id, created_at, action, entity_type, entity_id, route, metadata, user_id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('active_sessions')
        .select(
          'id, session_id, user_id, created_at, last_seen_at, ip_address, user_agent, geo_country, geo_city, metadata',
        )
        .eq('org_id', orgId)
        .is('revoked_at', null)
        .order('last_seen_at', { ascending: false })
        .limit(20),
      admin
        .from('security_events')
        .select('id, created_at, type, severity, user_id, metadata')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('compliance_export_jobs')
        .select('id, framework_slug, status, progress, file_url, created_at, completed_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('report_export_jobs')
        .select('id, report_type, format, status, progress, file_url, created_at, completed_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const memberList = (members ?? []) as Array<Record<string, unknown>>;
    const activityList = (activity ?? []) as Array<Record<string, unknown>>;
    const sessionList = (sessions ?? []) as Array<Record<string, unknown>>;
    const securityEventList = (securityEvents ?? []) as Array<
      Record<string, unknown>
    >;

    const memberUserIds = Array.from(
      new Set(memberList.map((member) => String(member.user_id))),
    );
    const actorUserIds = Array.from(
      new Set(
        [
          ...activityList.map((row) => String(row.user_id ?? '')),
          ...sessionList.map((row) => String(row.user_id ?? '')),
          ...securityEventList.map((row) => String(row.user_id ?? '')),
        ].filter(Boolean),
      ),
    );
    const userIds = Array.from(new Set([...memberUserIds, ...actorUserIds]));
    const emailMap = await fetchAuthEmailsByIds(admin, userIds);
    const customerHealth = await getAdminOrgHealthSnapshot(orgId);

    const memberRows = memberList.map((member) => ({
      user_id: String(member.user_id),
      email: emailMap.get(String(member.user_id)) ?? 'N/A',
      role: member.role ?? 'N/A',
      created_at: member.created_at ?? null,
    }));

    const activityRows = activityList.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      route: row.route,
      metadata: asObject(row.metadata),
      user_id: row.user_id,
      user_email:
        typeof row.user_id === 'string' ? emailMap.get(row.user_id) ?? null : null,
    }));

    const sessionRows = sessionList.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      user_email:
        typeof row.user_id === 'string' ? emailMap.get(row.user_id) ?? null : null,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      geo_country: row.geo_country,
      geo_city: row.geo_city,
      metadata: asObject(row.metadata),
    }));

    const securityEventIds = securityEventList.map((row) => String(row.id));
    const { data: securityAlerts } = securityEventIds.length
      ? await admin
          .from('security_alerts')
          .select('id, created_at, status, event_id, notes, resolved_at, resolution_notes')
          .in('event_id', securityEventIds)
          .order('created_at', { ascending: false })
      : { data: [] as Array<Record<string, unknown>> };

    const alertByEventId = new Map(
      (securityAlerts ?? []).map((alert: Record<string, unknown>) => [
        String(alert.event_id),
        alert,
      ]),
    );

    const securityRows = securityEventList.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      type: row.type,
      severity: row.severity,
      user_id: row.user_id,
      user_email:
        typeof row.user_id === 'string' ? emailMap.get(row.user_id) ?? null : null,
      metadata: asObject(row.metadata),
      alert: alertByEventId.get(String(row.id)) ?? null,
    }));

    return NextResponse.json({
      organization,
      subscription,
      members: memberRows,
      notes: notes ?? [],
      entitlements: entitlements ?? [],
      supportRequests: supportRequests ?? [],
      activity: activityRows,
      sessions: sessionRows,
      security: securityRows,
      customerHealth,
      exports: {
        compliance: complianceExports ?? [],
        reports: reportExports ?? [],
      },
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]');
  }
}
