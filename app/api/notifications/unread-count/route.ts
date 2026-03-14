import { NextResponse } from 'next/server';
import { requireNotificationContext } from '@/lib/notifications/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await requireNotificationContext(searchParams.get('orgId'));

    const { count, error } = await context.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', context.orgId)
      .eq('user_id', context.user.id)
      .is('read_at', null)
      .is('archived_at', null);

    if (error) {
      throw error;
    }

    return NextResponse.json({ unreadCount: count ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load unread count' },
      { status: 500 },
    );
  }
}
