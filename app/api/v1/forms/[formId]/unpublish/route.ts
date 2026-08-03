import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { unpublishForm } from '@/lib/forms/form-store';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/forms/[formId]/unpublish');

export const runtime = 'nodejs';

/**
 * Unpublish is a privileged transition and must be guarded exactly like
 * publish. It previously ran as a direct client-side Supabase write from the
 * form builder, which only had to satisfy the org_forms_update RLS policy —
 * `org_id in (select organization_id from org_members where user_id = auth.uid())`,
 * i.e. ANY member including viewer and staff. So a non-admin could take a live
 * form offline and break the respondent link, even though the same UI correctly
 * refused to let them publish one. The button was hidden for them; that was
 * UI-only.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const form = await unpublishForm(auth.context.db, formId, auth.context.orgId);
    return jsonWithContext(auth.context, { data: form });
  } catch (err) {
    log.error({ err, formId }, 'unpublish form failed');
    return Response.json({ error: 'Failed to unpublish form' }, { status: 500 });
  }
}
