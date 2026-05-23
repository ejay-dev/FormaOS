import { redirect } from 'next/navigation';
import { AdminShell } from '@/app/admin/components/admin-shell';
import { requireAdminAccess } from '@/app/app/admin/access';
import { ComplianceSystemProvider } from '@/components/compliance-system/provider';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { SecurityTrackingBootstrap } from '@/components/security/SecurityTrackingBootstrap';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateMfaGate, MFA_CHALLENGE_PATH } from '@/lib/auth/mfa-gate';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | undefined;

  try {
    const result = await requireAdminAccess();
    userEmail = result.user.email ?? undefined;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[admin/layout] Access denied:', errorMessage);

    if (errorMessage === 'Forbidden') {
      redirect('/app');
    }
    redirect('/auth/signin');
  }

  // Audit 2026-05-23: /admin was reachable password-only because the MFA
  // gate that /app enforces (app/app/layout.tsx:106-123) wasn't present
  // here. A founder/admin with MFA enabled could land on /admin after a
  // password-only sign-in. Mirror the /app gate: fail closed on error,
  // so we hold the user at the challenge rather than admit them when
  // we can't determine state.
  let mfaShouldChallenge = false;
  try {
    const supabaseForMfa = await createSupabaseServerClient();
    const mfaState = await evaluateMfaGate(supabaseForMfa);
    mfaShouldChallenge = mfaState.required && !mfaState.passed;
  } catch (error) {
    console.error('[admin/layout] MFA gate evaluation failed:', error);
    mfaShouldChallenge = true;
  }
  if (mfaShouldChallenge) {
    redirect(MFA_CHALLENGE_PATH);
  }

  return (
    <ComplianceSystemProvider>
      <AdminShell email={userEmail}>
        <SecurityTrackingBootstrap />
        {children}
        <CommandPalette />
      </AdminShell>
    </ComplianceSystemProvider>
  );
}
