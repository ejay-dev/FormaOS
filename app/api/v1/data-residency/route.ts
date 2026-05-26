import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getAvailableRegions,
  getOrgDataRegion,
  setOrgDataRegion,
} from '@/lib/data-residency';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const updateResidencySchema = z.object({
  region: z.enum(['au', 'us', 'eu']),
});

export const runtime = 'nodejs';

// GET — return org's current region + all available regions
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return ctx.response;

  const currentRegion = await getOrgDataRegion(ctx.orgId);
  const availableRegions = getAvailableRegions();

  return NextResponse.json({
    currentRegion,
    availableRegions,
  });
}

// PATCH — update org's data residency region (admin only)
export async function PATCH(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const supabase = await createSupabaseServerClient();
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return ctx.response;

  if (!ctx.role || !['owner', 'admin'].includes(ctx.role)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }

  const validation = await validateBody(request, updateResidencySchema);
  if (!validation.success) {
    return NextResponse.json(formatZodError(validation.error), {
      status: 400,
    });
  }
  const validRegion = validation.data.region;
  const result = await setOrgDataRegion(ctx.orgId, validRegion);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region: validRegion });
}
