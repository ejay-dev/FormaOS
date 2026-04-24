import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'New Form | FormaOS' };
export const dynamic = 'force-dynamic';

export default async function NewFormPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();
  const orgId = state.organization.id;
  const now = Date.now();
  const slug = `form-${now.toString(36)}`;

  const { data, error } = await db
    .from('org_forms')
    .insert({
      org_id: orgId,
      title: 'Untitled form',
      description: null,
      slug,
      status: 'draft',
      fields: [],
      settings: {},
      created_by: state.user.id,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    const msg = error?.message ?? 'Unable to create form';
    redirect(`/app/forms?error=${encodeURIComponent(msg)}`);
  }

  redirect(`/app/forms/builder/${data.id}`);
}
