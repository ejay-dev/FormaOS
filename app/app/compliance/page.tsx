import { Suspense } from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck } from 'lucide-react';
import { ObligationsTable } from '@/components/compliance/ObligationsTable';
import { CompliancePageHero } from '@/components/compliance/CompliancePageHero';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getCurrentOrgId } from '@/lib/frameworks/org-frameworks';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * First-load density gate: a brand-new org has no obligations, so the full
 * register chrome (4-metric hero, quick-link cards, filter bar, empty table,
 * pagination) renders as a wall of zero states. Only show it once at least
 * one obligation exists. Fail open — any resolution/query error renders the
 * full register, never a false "set up" state for a populated org.
 */
async function hasObligations(): Promise<boolean> {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from('org_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    if (error) return true;
    return (count ?? 0) > 0;
  } catch {
    return true;
  }
}

export default async function ComplianceIndexPage() {
  const populated = await hasObligations();

  if (!populated) {
    return (
      <div className="flex h-full flex-col">
        <section className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-border bg-surface-1 p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold text-foreground">
            Set up your obligations register
          </h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Install a compliance framework and FormaOS generates the
            obligations, owners and due dates it tracks here.
          </p>
          <Link
            href="/app/compliance/frameworks"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:min-h-0"
          >
            <Layers className="h-4 w-4" />
            Browse frameworks
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CompliancePageHero />

      <div className="flex-1 overflow-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ObligationsTable />
        </Suspense>
      </div>
    </div>
  );
}
