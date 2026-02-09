import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import { handleAdminError } from '@/app/api/admin/_helpers';

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { user } = await requireFounderAccess();
    const { userId } = await params;
    const contentType = request.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await request.json().catch(() => ({}))
      : Object.fromEntries(await request.formData());
    const locked = Boolean(body?.locked);

    const admin = createSupabaseAdminClient();
    const banDuration = locked ? '876000h' : 'none';
    await (admin as any).auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    await logAdminAction({
      actorUserId: user.id,
      action: locked ? 'user_lock' : 'user_unlock',
      targetType: 'user',
      targetId: userId,
      metadata: { locked },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/users/[userId]/lock');
  }
}
