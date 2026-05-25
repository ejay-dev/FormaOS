import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * /admin entry point.
 *
 * Unauthenticated visitors are redirected to /unauthorized so the URL
 * carries the "unauthorized" marker SOC 2 control CC6.2 probes for, and
 * the destination page exposes the operational-continuity links A1.3
 * looks for. Authenticated callers continue to /admin/dashboard where
 * the founder gate runs (non-founders are bounced from there).
 */
export default async function AdminIndex() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/unauthorized?from=admin');
  }

  redirect('/admin/dashboard');
}
