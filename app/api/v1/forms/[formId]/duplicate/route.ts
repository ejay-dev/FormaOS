import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { duplicateForm } from '@/lib/forms/form-store';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/forms/[formId]/duplicate');

export const runtime = 'nodejs';

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
    const form = await duplicateForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      auth.context.userId ?? '',
    );
    return jsonWithContext(auth.context, { data: form }, { status: 201 });
  } catch (err) {
    log.error({ err, formId }, 'duplicate form failed');
    return Response.json({ error: 'Failed to duplicate form' }, { status: 500 });
  }
}
