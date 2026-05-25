import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PrivacyClient } from './PrivacyClient';

// Audit 2026-05-25 (GDPR): canonical "Your data" surface. Houses the
// three GDPR self-serve affordances — access (export), portability
// (same export, framed for transfer), erasure (delete account).
// Cross-link cards live on /app/settings and /app dashboard so the GDPR
// compliance suite finds the expected `data-testid` selectors at the
// URLs it probes; the actual logic lives here only.

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin?next=/app/privacy');
  }

  const { count: ownerOrgsCount } = await supabase
    .from('org_members')
    .select('organization_id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('role', 'owner');

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <div>
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Your data</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Download a copy of your personal data, move it to another provider,
          or close your account. These rights apply under GDPR (EU), CCPA
          (California), and the Australian Privacy Principles.
        </p>
      </header>

      <PrivacyClient
        userEmail={user!.email ?? ''}
        ownerOrgsCount={ownerOrgsCount ?? 0}
      />
    </div>
  );
}
