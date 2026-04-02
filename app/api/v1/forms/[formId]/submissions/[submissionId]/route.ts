import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { getSubmission, reviewSubmission } from '@/lib/forms/submission-engine';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string; submissionId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['compliance:read'],
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
    requiredScopes: ['compliance:read'],
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
      auth.context.userId ?? '',
      body.status,
      body.notes,
    );
    return jsonWithContext(auth.context, { data: submission });
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
