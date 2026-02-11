import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  handleAdminError,
  ADMIN_CACHE_HEADERS,
} from '@/app/api/admin/_helpers';
import { logAdminAction } from '@/lib/admin/audit';
import { isValidVersionCode } from '@/config/release';

/**
 * GET /api/admin/releases — List all product releases
 */
export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('product_releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('/api/admin/releases query error:', error);
    }

    return NextResponse.json(
      { releases: data ?? [] },
      { headers: ADMIN_CACHE_HEADERS },
    );
  } catch (error) {
    return handleAdminError(error, '/api/admin/releases');
  }
}

/**
 * POST /api/admin/releases — Create a new draft release
 */
export async function POST(request: Request) {
  try {
    const { user } = await requireFounderAccess();
    const body = await request.json().catch(() => ({}));

    const version_code = String(body?.version_code ?? '').trim();
    const release_name = String(body?.release_name ?? '').trim();
    const release_notes = body?.release_notes ?? null;
    const feature_flags = body?.feature_flags ?? {};

    if (!version_code || !isValidVersionCode(version_code)) {
      return NextResponse.json(
        { error: 'Invalid version_code. Must be X.Y.Z format.' },
        { status: 400 },
      );
    }
    if (!release_name) {
      return NextResponse.json(
        { error: 'release_name is required.' },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('product_releases')
      .insert({
        version_code,
        release_name,
        release_status: 'draft',
        release_notes,
        feature_flags,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return NextResponse.json(
          { error: `Version ${version_code} already exists.` },
          { status: 409 },
        );
      }
      throw error;
    }

    await logAdminAction({
      actorUserId: user.id,
      action: 'release_created',
      targetType: 'product_release',
      targetId: data.id,
      metadata: { version_code, release_name },
    });

    return NextResponse.json({ release: data }, { status: 201 });
  } catch (error) {
    return handleAdminError(error, '/api/admin/releases');
  }
}
