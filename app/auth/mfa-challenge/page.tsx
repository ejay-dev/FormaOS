import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateMfaGate } from '@/lib/auth/mfa-gate';
import { logMfaAudit } from '@/lib/auth/mfa-audit';

import { MfaChallengeForm } from './MfaChallengeForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MfaChallengePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect('/auth/signin');
  }

  const state = await evaluateMfaGate(supabase);
  if (!state.required) {
    // No MFA on the account — nothing to challenge for.
    redirect('/app');
  }
  if (state.passed) {
    // Already cleared this session — go to the app.
    redirect('/app');
  }

  // Best-effort audit row so the held session is observable.
  await logMfaAudit({
    userId: userData.user.id,
    event: 'mfa_required',
    method: 'password',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Two-step verification
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the 6-digit code from your authenticator app, or one of your
          backup codes.
        </p>
        <MfaChallengeForm />
      </div>
    </div>
  );
}
