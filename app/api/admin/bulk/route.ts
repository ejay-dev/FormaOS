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

/**
 * POST /api/admin/bulk
 *
 * Dry-run or execute a bulk operator action across multiple organizations.
 *
 * Body:
 * {
 *   dryRun: boolean,          // true = simulate, false = execute
 *   action: string,           // "suspend" | "restore" | "cancel_trials" | "tag"
 *   orgIds: string[],         // target org UUIDs (max 100 per call)
 *   reason?: string,
 *   tag?: string,             // for action === "tag"
 * }
 *
 * Response always includes a `blastRadius` summary so operators can review
 * before committing. dryRun: true never writes to the database.
 */

const SUPPORTED_ACTIONS = [
  'suspend',
  'restore',
  'cancel_trials',
  'tag',
] as const;
type BulkAction = (typeof SUPPORTED_ACTIONS)[number];

const MAX_ORG_IDS = 100;

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

    const dryRun = body?.dryRun !== false; // Default to dry-run for safety
    const action = String(body?.action ?? '').trim() as BulkAction;
    const orgIds: string[] = Array.isArray(body?.orgIds)
      ? body.orgIds.slice(0, MAX_ORG_IDS).map(String)
      : [];

    if (!SUPPORTED_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error: `action_must_be_one_of_${SUPPORTED_ACTIONS.join('_or_')}`,
        },
        { status: 400 },
      );
    }

    if (orgIds.length === 0) {
      return NextResponse.json(
        { error: 'orgIds_must_be_a_non_empty_array' },
        { status: 400 },
      );
    }

    const reason = !dryRun
      ? await requireAdminChangeControl({
          context: access,
          action: `bulk_${action}`,
          targetType: 'bulk_operation',
          targetId: `${orgIds.length}_orgs`,
          reason: extractAdminReason(body, request),
          requireApproval: action === 'suspend',
        })
      : (extractAdminReason(body, request) ?? 'dry_run');

    const admin = createSupabaseAdminClient();

    // Fetch current state of all target orgs for blast-radius preview
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, plan_key, lifecycle_status, is_active')
      .in('id', orgIds);

    const orgMap = new Map(
      (orgs ?? []).map((o: Record<string, unknown>) => [String(o.id), o]),
    );

    // Compute blast-radius
    const blastRadius = orgIds.map((orgId) => {
      const org = orgMap.get(orgId);
      if (!org) {
        return { orgId, found: false, willBeAffected: false, reason: 'org_not_found' };
      }

      let willBeAffected = false;
      let previewOutcome = '';

      switch (action) {
        case 'suspend':
          willBeAffected = org.lifecycle_status !== 'suspended';
          previewOutcome = willBeAffected ? 'suspended' : 'already_suspended';
          break;
        case 'restore':
          willBeAffected = org.lifecycle_status === 'suspended';
          previewOutcome = willBeAffected ? 'restored' : 'not_suspended';
          break;
        case 'cancel_trials':
          willBeAffected = org.plan_key === null || org.plan_key === 'trial';
          previewOutcome = willBeAffected ? 'trial_cancelled' : 'not_on_trial';
          break;
        case 'tag':
          willBeAffected = true;
          previewOutcome = `tagged:${body?.tag ?? ''}`;
          break;
      }

      return {
        orgId,
        found: true,
        name: org.name,
        currentStatus: org.lifecycle_status,
        planKey: org.plan_key,
        willBeAffected,
        previewOutcome,
      };
    });

    const affectedCount = blastRadius.filter((r) => r.willBeAffected).length;

    // If dry-run, return preview without writing
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        action,
        totalTargeted: orgIds.length,
        willAffect: affectedCount,
        willSkip: orgIds.length - affectedCount,
        blastRadius,
      });
    }

    // Execute the bulk action
    const affectedIds = blastRadius
      .filter((r) => r.willBeAffected)
      .map((r) => r.orgId);

    if (affectedIds.length === 0) {
      return NextResponse.json({
        dryRun: false,
        action,
        totalTargeted: orgIds.length,
        affected: 0,
        message: 'No orgs required changes',
        blastRadius,
      });
    }

    const now = new Date().toISOString();

    switch (action) {
      case 'suspend':
        await admin
          .from('organizations')
          .update({
            lifecycle_status: 'suspended',
            is_active: false,
            suspended_at: now,
            lifecycle_reason: reason,
          })
          .in('id', affectedIds);
        break;

      case 'restore':
        await admin
          .from('organizations')
          .update({
            lifecycle_status: 'active',
            is_active: true,
            restored_at: now,
            lifecycle_reason: reason,
          })
          .in('id', affectedIds);
        break;

      case 'cancel_trials':
        await admin
          .from('org_subscriptions')
          .update({
            status: 'canceled',
            updated_at: now,
          })
          .in('organization_id', affectedIds)
          .eq('status', 'trialing');
        break;

      case 'tag':
        // Tags stored as metadata — upsert to org_entitlements or a tags table.
        // Here we append a note to the admin_notes table as a lightweight tag mechanism.
        if (body?.tag && typeof body.tag === 'string') {
          const tagNote = `[bulk-tag] ${String(body.tag).trim()}`;
          const noteInserts = affectedIds.map((orgId) => ({
            org_id: orgId,
            note: tagNote,
            created_by: access.user.id,
            created_at: now,
          }));
          await admin.from('admin_notes').insert(noteInserts);
        }
        break;
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: `bulk_${action}`,
      targetType: 'bulk_operation',
      targetId: `${affectedIds.length}_orgs`,
      metadata: {
        orgIds: affectedIds,
        reason,
        action,
      },
    });

    return NextResponse.json({
      dryRun: false,
      action,
      totalTargeted: orgIds.length,
      affected: affectedIds.length,
      skipped: orgIds.length - affectedIds.length,
      blastRadius,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/bulk');
  }
}
