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
    const admin = createSupabaseAdminClient();
    const { data } = await (admin as any).auth.admin.getUserById(userId);
    const email = data?.user?.email;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 },
      );
    }

    await (admin as any).auth.admin.generateLink({
      type: 'signup',
      email,
    });

    await logAdminAction({
      actorUserId: user.id,
      action: 'user_resend_confirmation',
      targetType: 'user',
      targetId: userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(
      error,
      '/api/admin/users/[userId]/resend-confirmation',
    );
  }
}
