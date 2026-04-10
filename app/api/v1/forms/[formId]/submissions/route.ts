import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import {
  listSubmissions,
  submitForm,
  FormValidationError,
} from '@/lib/forms/submission-engine';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['compliance:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const dateFrom = url.searchParams.get('date_from') ?? undefined;
  const dateTo = url.searchParams.get('date_to') ?? undefined;
  const { offset, limit, cursor: _cursorRaw } = getPagination(request);

  try {
    const result = await listSubmissions(
      auth.context.db,
      formId,
      auth.context.orgId,
      {
        status,
        dateFrom,
        dateTo,
        cursor: offset,
        limit,
      },
    );
    return jsonWithContext(
      auth.context,
      paginatedEnvelope(result.data, { offset, limit, total: result.total }),
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
    requiredScopes: ['compliance:read'],
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
        submittedBy: auth.context.userId ?? '',
        metadata: body.metadata,
      },
    );
    return jsonWithContext(auth.context, { data: submission }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof FormValidationError) {
      return Response.json(
        {
          error: {
            message: 'Validation failed',
            details: err.validationErrors,
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
