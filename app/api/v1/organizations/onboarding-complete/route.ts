import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/organizations/onboarding-complete');

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const supabase = await createSupabaseServerClient();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;

    // Only owners and admins can complete onboarding
    if (ctx.role !== 'owner' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { orgId } = ctx;

    const { error } = await admin
      .from('organizations')
      .update({ onboarding_completed: true })
      .eq('id', orgId);

    if (error) {
      log.error({ err: error }, 'Failed to update onboarding_completed:');
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 },
      );
    }

    // Provision controls for all frameworks the org selected during onboarding.
    // This seeds org_control_evaluations so the compliance score starts at 0%
    // (real baseline) rather than showing blank/missing data.
    const { data: orgFrameworks } = await admin
      .from('org_frameworks')
      .select('framework_slug')
      .eq('organization_id', orgId);

    if (orgFrameworks && orgFrameworks.length > 0) {
      for (const { framework_slug } of orgFrameworks) {
        provisionFrameworkControls(orgId, framework_slug as string, {
          force: true,
        }).catch((err) => {
          log.warn(
            { err, framework_slug },
            '[onboarding-complete] Failed to provision controls',
          );
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, 'Onboarding complete error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
