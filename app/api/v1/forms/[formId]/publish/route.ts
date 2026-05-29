import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { publishForm } from '@/lib/forms/form-store';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/forms/[formId]/publish');

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
    const form = await publishForm(auth.context.db, formId, auth.context.orgId);
    return jsonWithContext(auth.context, { data: form });
  } catch (err) {
    log.error({ err, formId }, 'publish form failed');
    return Response.json({ error: 'Failed to publish form' }, { status: 500 });
  }
}
