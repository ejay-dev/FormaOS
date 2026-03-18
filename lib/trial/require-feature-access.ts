import { redirect } from 'next/navigation';
import { validateModuleAccess } from '@/lib/system-state/server';
import type { ModuleId } from '@/lib/system-state/types';

/**
 * =========================================================
 * Server-side feature access guard
 * =========================================================
 * Complements the client-side <FeatureGate> by enforcing
 * module access on the server. Use in Server Components
 * or route handlers to prevent direct-URL bypass.
 *
 * Usage in a Server Component / page:
 *   await requireFeatureAccess('reports');
 *
 * Redirects to /app/billing with upgrade context if locked.
 * Throws (via redirect) — never returns a falsy value.
 */
export async function requireFeatureAccess(
  moduleId: ModuleId,
  opts?: { redirectTo?: string },
): Promise<void> {
  const result = await validateModuleAccess(moduleId);

  if (!result.allowed) {
    const target =
      opts?.redirectTo ?? `/app/billing?locked=${encodeURIComponent(moduleId)}`;
    redirect(target);
  }
}
