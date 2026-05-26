import { z } from 'zod';
import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import {
  getForm,
  updateForm,
  archiveForm,
} from '@/lib/forms/form-store';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const updateFormSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with dashes')
      .optional(),
    fields: z.array(z.record(z.string(), z.unknown())).max(200).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'At least one field must be provided',
  );

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

  try {
    const form = await getForm(auth.context.db, formId, auth.context.orgId);
    return jsonWithContext(auth.context, { data: form });
  } catch {
    return Response.json(
      { error: 'Form not found' },
      { status: 404 },
    );
  }
}

export async function PATCH(
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
  const validation = await validateBody(request, updateFormSchema);
  if (!validation.success) {
    return Response.json(formatZodError(validation.error), { status: 400 });
  }

  try {
    const form = await updateForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      validation.data,
    );
    return jsonWithContext(auth.context, { data: form });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to update form' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const form = await archiveForm(auth.context.db, formId, auth.context.orgId);
    return jsonWithContext(auth.context, { data: form });
  } catch {
    return Response.json(
      { error: 'Form not found' },
      { status: 404 },
    );
  }
}
