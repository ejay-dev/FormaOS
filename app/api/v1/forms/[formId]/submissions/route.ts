import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import {
  listSubmissions,
  submitForm,
  getSubmissionAnalytics,
  reviewSubmission,
} from '@/lib/forms/submission-engine';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const dateFrom = url.searchParams.get('date_from') ?? undefined;
  const dateTo = url.searchParams.get('date_to') ?? undefined;
  const { cursor, limit } = getPagination(url.searchParams);

  try {
    const result = await listSubmissions(
      auth.context.db,
      formId,
      auth.context.orgId,
      {
        status,
        dateFrom,
        dateTo,
        cursor,
        limit,
      },
    );

    logV1Access(auth.context, 'forms.submissions.list', { formId });
    return jsonWithContext(
      paginatedEnvelope(result.data, result.total, result.hasMore, cursor),
      auth.context,
    );
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to list submissions',
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;
  const body = await request.json();

  try {
    const submission = await submitForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      {
        data: body.data ?? {},
        respondentEmail: body.respondent_email,
        respondentName: body.respondent_name,
        submittedBy: auth.context.userId,
        metadata: body.metadata,
      },
    );

    logV1Access(auth.context, 'forms.submissions.create', {
      formId,
      submissionId: submission.id,
    });
    return jsonWithContext({ data: submission }, auth.context, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && 'validationErrors' in err) {
      return Response.json(
        {
          error: {
            message: 'Validation failed',
            details: (err as any).validationErrors,
          },
        },
        { status: 422 },
      );
    }
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Submission failed',
        },
      },
      { status: 500 },
    );
  }
}
