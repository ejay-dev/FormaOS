import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getSubmission, reviewSubmission } from '@/lib/forms/submission-engine';

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
    logV1Access(auth.context, 'forms.submissions.get', { submissionId });
    return jsonWithContext({ data: submission }, auth.context);
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Submission not found',
        },
      },
      { status: 404 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; submissionId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { submissionId } = await params;
  const body = await request.json();

  if (!body.status || !['approved', 'rejected'].includes(body.status)) {
    return Response.json(
      { error: { message: 'status must be "approved" or "rejected"' } },
      { status: 400 },
    );
  }

  try {
    const submission = await reviewSubmission(
      auth.context.db,
      submissionId,
      auth.context.orgId,
      auth.context.userId,
      body.status,
      body.notes,
    );

    logV1Access(auth.context, 'forms.submissions.review', {
      submissionId,
      status: body.status,
    });
    return jsonWithContext({ data: submission }, auth.context);
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Review failed',
        },
      },
      { status: 500 },
    );
  }
}
