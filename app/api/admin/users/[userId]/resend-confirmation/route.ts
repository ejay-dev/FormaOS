import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { sendAuthEmail } from '@/lib/email/send-auth-email';

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
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

    const appBase = (
      process.env.NEXT_PUBLIC_APP_URL || 'https://app.formaos.com.au'
    ).replace(/\/$/, '');
    const { data: linkData, error: linkError } = await (admin as any).auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${appBase}/auth/callback`,
      },
    });

    if (linkError) {
      throw new Error(linkError.message || 'failed_to_generate_link');
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      throw new Error('missing_action_link');
    }

    const emailResult = await sendAuthEmail({
      to: email,
      template: 'magic-link',
      actionLink,
    });
    if (!emailResult.success) {
      throw new Error(emailResult.error || 'failed_to_send_email');
    }

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
