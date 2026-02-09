import { redirect } from 'next/navigation';
import { AdminShell } from '@/app/admin/components/admin-shell';
import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isFounder } from '@/lib/utils/founder';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | undefined;

  try {
    const result = await requireFounderAccess();
    userEmail = result.user.email ?? undefined;
    console.log('[admin/layout] ✅ Founder access granted', {
      email: result.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[admin/layout] ❌ Admin access denied:', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Double-check with middleware-level founder check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const isUserFounder = isFounder(user.email, user.id);
      console.log('[admin/layout] 🔍 Double-check founder status:', {
        email: user.email,
        isFounder: isUserFounder,
        FOUNDER_EMAILS: process.env.FOUNDER_EMAILS,
      });

      if (isUserFounder) {
        // If founder check passes here but failed in requireFounderAccess,
        // log this discrepancy
        console.error(
          '[admin/layout] ⚠️  DISCREPANCY: Founder detected but access denied',
        );
      }
    }

    // Redirect based on error type
    if (errorMessage === 'Forbidden') {
      redirect('/pricing');
    }
    redirect('/auth/signin');
  }

  return <AdminShell email={userEmail}>{children}</AdminShell>;
}
