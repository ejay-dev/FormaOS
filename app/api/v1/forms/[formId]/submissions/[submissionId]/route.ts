import { z } from 'zod';
import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { getSubmission, reviewSubmission } from '@/lib/forms/submission-engine';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/forms/[formId]/submissions/[submissionId]');

const reviewSubmissionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().trim().max(5000).optional(),
});

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string; submissionId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const { submissionId } = await params;

  try {
    const submission = await getSubmission(
      auth.context.db,
      submissionId,
      auth.context.orgId,
    );
    return jsonWithContext(auth.context, { data: submission });
  } catch (err) {
    log.warn({ err, submissionId }, 'get submission failed (likely not found)');
    return Response.json({ error: 'Submission not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; submissionId: string }> },
) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { submissionId } = await params;
  const validation = await validateBody(request, reviewSubmissionSchema);
  if (!validation.success) {
    return Response.json(formatZodError(validation.error), { status: 400 });
  }
  const { status, notes } = validation.data;

  try {
    const submission = await reviewSubmission(
      auth.context.db,
      submissionId,
      auth.context.orgId,
      auth.context.userId ?? '',
      status,
      notes,
    );
    return jsonWithContext(auth.context, { data: submission });
  } catch (err) {
    log.error({ err, submissionId }, 'review submission failed');
    return Response.json({ error: 'Review failed' }, { status: 500 });
  }
}
