import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';

export const dynamic = 'force-dynamic';

type WorkspaceRecoveryPageProps = {
  searchParams?: Promise<{
    from?: string;
  }>;
};

export default async function WorkspaceRecoveryPage({
  searchParams,
}: WorkspaceRecoveryPageProps) {
  const resolvedSearchParams = await searchParams;
  const source = resolvedSearchParams?.from ?? 'workspace-recovery';

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const recovery = await recoverUserWorkspace({
    userId: user.id,
    userEmail: user.email ?? null,
    source: `workspace-recovery:${source}`,
  });

  redirect(recovery.nextPath);
}

