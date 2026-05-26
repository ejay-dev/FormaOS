import { z } from 'zod';
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
import { validateCsrfOrigin } from '@/lib/security/csrf';
import {
  emailSchema,
  formatZodError,
  validateBody,
} from '@/lib/security/api-validation';

// The submission `data` payload is intentionally a free-form object —
// the form's own schema (stored in org_forms.fields) governs its
// shape and `submitForm` enforces field-level rules via
// FormValidationError. This route only validates the outer envelope:
// data must be an object, respondent fields are bounded strings,
// metadata is a typed record.
const createSubmissionSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional().default({}),
  respondent_email: emailSchema.optional(),
  respondent_name: z.string().trim().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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
        error:
          err instanceof Error ? err.message : 'Failed to list submissions',
      },
      { status: 500 },
    );
  }
}

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
  const validation = await validateBody(request, createSubmissionSchema);
  if (!validation.success) {
    return Response.json(formatZodError(validation.error), { status: 400 });
  }
  const body = validation.data;

  try {
    const submission = await submitForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      {
        data: body.data,
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
          error: 'Validation failed',
          details: err.validationErrors,
        },
        { status: 422 },
      );
    }
    return Response.json(
      { error: err instanceof Error ? err.message : 'Submission failed' },
      { status: 500 },
    );
  }
}
