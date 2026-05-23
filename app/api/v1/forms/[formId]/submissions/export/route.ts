import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import {
  attachmentHeaders,
  formatTabular,
  parseFormat,
} from '@/lib/exports/formatters';
import type { FormField } from '@/lib/forms/types';

export const runtime = 'nodejs';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function stringifySubmissionValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(stringifySubmissionValue).join('; ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function safeFilenamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;
  if (!isUuid(formId)) {
    return jsonWithContext(
      auth.context,
      { error: 'Invalid formId' },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get('format'), 'csv');
  const status = url.searchParams.get('status')?.trim();

  const { data: form, error: formError } = await auth.context.db
    .from('org_forms')
    .select('id, title, fields')
    .eq('id', formId)
    .eq('org_id', auth.context.orgId)
    .maybeSingle();

  if (formError) {
    return jsonWithContext(
      auth.context,
      { error: 'Failed to load form for export' },
      { status: 500 },
    );
  }

  if (!form) {
    return jsonWithContext(
      auth.context,
      { error: 'Form not found' },
      { status: 404 },
    );
  }

  let query = auth.context.db
    .from('org_form_submissions')
    .select(
      'id, respondent_name, respondent_email, status, data, created_at, reviewed_at, review_notes',
    )
    .eq('form_id', formId)
    .eq('org_id', auth.context.orgId)
    .order('created_at', { ascending: false })
    .limit(10_000);

  if (status) query = query.eq('status', status);

  const { data: submissions, error: submissionsError } = await query;
  if (submissionsError) {
    return jsonWithContext(
      auth.context,
      { error: 'Failed to load form submissions for export' },
      { status: 500 },
    );
  }

  const fields = Array.isArray(form.fields)
    ? (form.fields as FormField[])
    : [];
  const fieldColumns = fields.map((field) => ({
    key: `field_${field.id}`,
    label: field.label || field.id,
    id: field.id,
  }));
  const baseHeaders = [
    'submission_id',
    'submitted_at',
    'status',
    'respondent_name',
    'respondent_email',
    'reviewed_at',
    'review_notes',
  ];
  const headers = [...baseHeaders, ...fieldColumns.map((field) => field.label)];

  const rows = (submissions ?? []).map((submission) => {
    const responseData = (submission.data ?? {}) as Record<string, unknown>;
    const row: Record<string, unknown> = {
      submission_id: submission.id,
      submitted_at: submission.created_at,
      status: submission.status,
      respondent_name: submission.respondent_name,
      respondent_email: submission.respondent_email,
      reviewed_at: submission.reviewed_at,
      review_notes: submission.review_notes,
    };

    for (const field of fieldColumns) {
      row[field.label] = stringifySubmissionValue(responseData[field.id]);
    }

    return row;
  });

  const result = formatTabular(
    rows,
    format,
    {
      title: `${form.title} submissions`,
      generatedAt: new Date().toISOString(),
      description:
        'Organization-scoped form submissions exported from FormaOS.',
    },
    headers,
  );

  const today = new Date().toISOString().slice(0, 10);
  const filenameStem = `form_submissions_${safeFilenamePart(form.title || 'form')}_${today}`;

  return new Response(result.body, {
    status: 200,
    headers: attachmentHeaders(filenameStem, result),
  });
}
