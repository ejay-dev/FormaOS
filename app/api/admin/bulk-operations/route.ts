import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { checkAdminRateLimit, getClientIp } from '@/lib/ratelimit';

type BulkOperation = 'suspend_orgs' | 'extend_trials' | 'recalculate_health';

interface Target {
  orgId: string;
  orgName?: string;
}

const SUPPORTED: readonly BulkOperation[] = [
  'suspend_orgs',
  'extend_trials',
  'recalculate_health',
] as const;

const DAY_MS = 86_400_000;

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = await checkAdminRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const access = await requireAdminAccess({ permission: 'orgs:manage' });
    const { payload: body } = await parseAdminMutationPayload(request);

    const operation = String(body?.operation ?? '').trim() as BulkOperation;
    const dryRun = body?.dryRun !== false;
    const targets: Target[] = Array.isArray(body?.targets)
      ? (body.targets as Target[]).slice(0, 100)
      : [];
    const params = (body?.params ?? {}) as { days?: number };

    if (!SUPPORTED.includes(operation)) {
      return NextResponse.json(
        { error: `operation_must_be_${SUPPORTED.join('_or_')}` },
        { status: 400 }
      );
    }
    if (targets.length === 0) {
      return NextResponse.json({ error: 'targets_required' }, { status: 400 });
    }

    const reason = !dryRun
      ? await requireAdminChangeControl({
          context: access,
          action: `bulk_${operation}`,
          targetType: 'bulk_operation',
          targetId: `${targets.length}_orgs`,
          reason: extractAdminReason(body, request),
          requireApproval: operation === 'suspend_orgs',
        })
      : (extractAdminReason(body, request) || 'dry_run');
    const admin = createSupabaseAdminClient();
    const orgIds = targets.map((t) => t.orgId).filter(Boolean);

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, lifecycle_status')
      .in('id', orgIds);
    const orgMap = new Map(
      (orgs ?? []).map((o: Record<string, unknown>) => [String(o.id), o])
    );

    const targetsWithNames = targets.map((t) => ({
      orgId: t.orgId,
      orgName: t.orgName ?? (orgMap.get(t.orgId)?.name as string | undefined),
    }));

    const warnings: string[] = [];
    let affectedUsers = 0;
    let affectedSubscriptions = 0;

    for (const t of targets) {
      const org = orgMap.get(t.orgId);
      if (!org) {
        warnings.push(`Organization ${t.orgId} not found`);
        continue;
      }
      if (operation === 'suspend_orgs' && org.lifecycle_status === 'suspended') {
        warnings.push(`${org.name ?? t.orgId} already suspended`);
      }
    }

    if (operation === 'suspend_orgs') {
      const { count: memberCount } = await admin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .in('organization_id', orgIds);
      affectedUsers = memberCount ?? 0;

      const { count: subCount } = await admin
        .from('org_subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('organization_id', orgIds);
      affectedSubscriptions = subCount ?? 0;
    }

    if (dryRun) {
      return NextResponse.json({
        operation,
        targets: targetsWithNames,
        affectedUsers,
        affectedSubscriptions,
        warnings,
      });
    }

    // Execute
    const nowIso = new Date().toISOString();
    const results: Array<{ orgId: string; status: string; error?: string }> = [];

    for (const orgId of orgIds) {
      try {
        if (operation === 'suspend_orgs') {
          const { error } = await admin
            .from('organizations')
            .update({
              lifecycle_status: 'suspended',
              is_active: false,
              suspended_at: nowIso,
              lifecycle_reason: reason,
            })
            .eq('id', orgId);
          if (error) throw error;
        } else if (operation === 'extend_trials') {
          const days = Math.max(1, Math.min(90, Number(params.days) || 14));
          const { data: sub } = await admin
            .from('org_subscriptions')
            .select('current_period_end, status')
            .eq('organization_id', orgId)
            .maybeSingle();
          const base = sub?.current_period_end
            ? new Date(sub.current_period_end as string).getTime()
            : Date.now();
          const extended = new Date(base + days * DAY_MS).toISOString();
          const { error } = await admin
            .from('org_subscriptions')
            .upsert(
              {
                organization_id: orgId,
                plan_key: 'trial',
                status: 'trialing',
                current_period_end: extended,
                updated_at: nowIso,
              },
              { onConflict: 'organization_id' }
            );
          if (error) throw error;
        } else if (operation === 'recalculate_health') {
          const { error } = await admin
            .from('organizations')
            .update({ updated_at: nowIso })
            .eq('id', orgId);
          if (error) throw error;
        }
        results.push({ orgId, status: 'succeeded' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown_error';
        results.push({ orgId, status: 'failed', error: message });
      }
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: `bulk_${operation}`,
      targetType: 'bulk_operation',
      targetId: `${orgIds.length}_orgs`,
      metadata: { orgIds, reason, operation, params },
    });

    const succeeded = results.filter((r) => r.status === 'succeeded').length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      total: orgIds.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/bulk-operations');
  }
}
