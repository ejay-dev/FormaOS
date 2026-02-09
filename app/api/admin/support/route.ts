import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { parsePageParams } from '@/app/api/admin/_utils';
import { handleAdminError } from '@/app/api/admin/_helpers';

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') ?? '').trim();
    const { page, limit, from, to } = parsePageParams(url.searchParams);

    let query = admin
      .from('support_requests')
      .select('id, org_id, email, name, subject, message, status, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count } = await query;

    return NextResponse.json({
      page,
      pageSize: limit,
      total: count ?? (data ?? []).length,
      data: data ?? [],
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/support');
  }
}
