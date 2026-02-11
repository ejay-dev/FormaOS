import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { logAdminAction } from '@/lib/admin/audit';
import { invalidateReleaseCache } from '@/lib/release/service';
import type { ReleaseStatus } from '@/config/release';

type Params = { params: Promise<{ releaseId: string }> };

const VALID_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  draft: ['stable', 'archived'],
  stable: ['deprecated'],
  deprecated: ['archived', 'stable'],
  archived: [],
};

/**
 * GET /api/admin/releases/[releaseId] — Get single release
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireFounderAccess();
    const { releaseId } = await params;
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('product_releases')
      .select('*')
      .eq('id', releaseId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    return NextResponse.json({ release: data });
  } catch (error) {
    return handleAdminError(error, '/api/admin/releases/[releaseId]');
  }
}

/**
 * PATCH /api/admin/releases/[releaseId] — Update release
 *
 * Supports: status transitions, feature flags, release notes, lock/unlock
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user } = await requireFounderAccess();
    const { releaseId } = await params;
    const body = await request.json().catch(() => ({}));

    const admin = createSupabaseAdminClient();

    const { data: current, error: fetchError } = await admin
      .from('product_releases')
      .select('*')
      .eq('id', releaseId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Block edits on locked releases (except status changes and lock toggle)
    if (
      current.is_locked &&
      body.release_status === undefined &&
      body.is_locked === undefined
    ) {
      return NextResponse.json(
        { error: 'Release is locked. Unlock before editing.' },
        { status: 403 },
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle status transition
    if (body.release_status) {
      const newStatus = body.release_status as ReleaseStatus;
      const currentStatus = current.release_status as ReleaseStatus;
      const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          {
            error: `Cannot transition from ${currentStatus} to ${newStatus}`,
          },
          { status: 400 },
        );
      }

      updates.release_status = newStatus;

      if (newStatus === 'stable') {
        updates.release_date = new Date().toISOString();
        // Deprecate any other stable release
        await admin
          .from('product_releases')
          .update({
            release_status: 'deprecated',
            updated_at: new Date().toISOString(),
          })
          .eq('release_status', 'stable')
          .neq('id', releaseId);
      }
    }

    // Handle other field updates
    if (body.release_notes !== undefined)
      updates.release_notes = body.release_notes;
    if (body.feature_flags !== undefined)
      updates.feature_flags = body.feature_flags;
    if (body.schema_version !== undefined)
      updates.schema_version = body.schema_version;
    if (body.ui_version !== undefined) updates.ui_version = body.ui_version;
    if (body.compatibility_min_version !== undefined) {
      updates.compatibility_min_version = body.compatibility_min_version;
    }
    if (body.is_locked !== undefined) updates.is_locked = Boolean(body.is_locked);

    const { data, error } = await admin
      .from('product_releases')
      .update(updates)
      .eq('id', releaseId)
      .select()
      .single();

    if (error) throw error;

    invalidateReleaseCache();

    await logAdminAction({
      actorUserId: user.id,
      action: 'release_updated',
      targetType: 'product_release',
      targetId: releaseId,
      metadata: { updates: Object.keys(updates) },
    });

    return NextResponse.json({ release: data });
  } catch (error) {
    return handleAdminError(error, '/api/admin/releases/[releaseId]');
  }
}
