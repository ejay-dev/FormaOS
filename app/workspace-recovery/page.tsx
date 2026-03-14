import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import { fetchSystemState } from '@/lib/system-state/server';

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

  if (recovery.nextPath === '/app') {
    const systemState = await fetchSystemState({
      id: user.id,
      email: user.email ?? null,
      user_metadata: user.user_metadata ?? {},
    });

    if (!systemState) {
      const message = encodeURIComponent(
        'We could not restore your workspace automatically. Please sign in again or contact support.',
      );
      redirect(`/auth/signin?error=workspace_recovery_failed&message=${message}`);
    }
  }

  redirect(recovery.nextPath);
}
