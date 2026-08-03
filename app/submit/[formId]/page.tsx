import { notFound, redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateSubmission } from '@/lib/forms/submission-engine';
import type { FormField } from '@/lib/forms/types';
import { PublicForm, type PublicFormState } from '@/components/forms/public-form';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

// File answers have no attachment store on this public endpoint, so they are
// never collected or validated. The builder does not offer a file question
// either — the two have to stay in step or a form becomes unsubmittable.
function answerableFields(fields: FormField[]) {
  return fields.filter((field) => field.type !== 'file');
}

// Echo back every visible answer so a re-render restores what the respondent
// typed. Underscore-prefixed inputs are internal (honeypot, idempotency token).
function collectValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('_')) continue;
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

// ---------------------------------------------------------------------------
// Server Action — handles the public POST submission
// ---------------------------------------------------------------------------
async function handleSubmit(
  formId: string,
  orgId: string,
  _state: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  'use server';

  // Honeypot — a hidden field bots routinely fill. Real users never see it,
  // so any non-empty value is treated as spam: silently 'succeed' so the
  // bot can't probe whether the field exists, but persist nothing.
  const honeypot = (formData.get('_company') as string | null) ?? '';
  if (honeypot.trim()) {
    redirect(`/submit/${formId}?success=true`);
  }

  const values = collectValues(formData);

  // Per-client rate limit. 10 submissions per 5 min per IP-derived
  // identifier — enough for legitimate "submit, fix typo, resubmit" but
  // tight enough to defang scripted spam. Combined with the per-form
  // submission_uuid the partial UNIQUE INDEX deduplicates double-clicks.
  const identifier = await getClientIdentifier();
  const rl = await checkRateLimit(
    {
      windowMs: 5 * 60 * 1000,
      maxRequests: 10,
      keyPrefix: 'rl:public-form',
    },
    `${formId}:${identifier}`,
  );
  if (!rl.success) {
    return {
      values,
      formError:
        'Too many attempts from this device. Wait a few minutes and try again.',
    };
  }

  const admin = createSupabaseAdminClient();

  const { data: form } = await admin
    .from('org_forms')
    .select('fields, settings, status')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (!form || form.status !== 'published') {
    return {
      values,
      formError: 'This form is no longer accepting responses.',
    };
  }

  const settings = (form.settings ?? {}) as Record<string, unknown>;
  const requiresAuth = Boolean(
    settings.requires_auth ?? settings.requireAuthentication,
  );

  if (requiresAuth) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/signin?next=/submit/${formId}`);
    }
  }

  // Max submissions check
  const maxSubs = settings?.max_submissions as number | undefined;
  if (maxSubs) {
    const { count } = await admin
      .from('org_form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', formId);
    if ((count ?? 0) >= maxSubs) {
      return {
        values,
        formError: 'This form has reached its response limit.',
      };
    }
  }

  // Build submission data from form fields
  const fields = answerableFields(form.fields as FormField[]);
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = formData.get(`field_${field.id}`);
    data[field.id] = raw !== null ? String(raw) : '';
  }

  // Validate
  const errors = validateSubmission(fields, data);
  if (errors.length > 0) {
    const fieldErrors: Record<string, string> = {};
    for (const error of errors) fieldErrors[error.fieldId] = error.message;
    return { values, fieldErrors };
  }

  const respondentEmail = (formData.get('respondent_email') as string) ?? null;
  const respondentName = (formData.get('respondent_name') as string) ?? null;

  // Idempotency token issued when the page rendered. A double-click sends
  // the same UUID with both POSTs; a refresh gets a new UUID. The DB
  // backstop is a partial UNIQUE INDEX on (form_id, submission_uuid).
  const submissionUuidRaw = (formData.get('_submission_uuid') as string | null) ?? '';
  const submissionUuid =
    /^[0-9a-fA-F-]{32,36}$/.test(submissionUuidRaw)
      ? submissionUuidRaw
      : null;

  // Get authenticated user id if available
  let submittedBy: string | null = null;
  if (requiresAuth) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    submittedBy = user?.id ?? null;
  }

  const { error } = await admin.from('org_form_submissions').insert({
    form_id: formId,
    org_id: orgId,
    submitted_by: submittedBy,
    respondent_email: respondentEmail,
    respondent_name: respondentName,
    data,
    metadata: {
      source: 'public_form',
      user_agent: null,
      submission_uuid: submissionUuid,
    },
    status: 'submitted',
    submission_uuid: submissionUuid,
  } as Record<string, unknown>);

  // Postgres unique-violation = duplicate-submit collision; treat as success
  // so the user lands on the success page without seeing a confusing error.
  // 23505 is the SQLSTATE for unique_violation; PostgREST surfaces it on the
  // error code field when the partial unique index fires.
  const isDuplicate =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '23505';

  if (error && !isDuplicate) {
    return {
      values,
      formError: 'Your answers could not be sent just now. Please try again.',
    };
  }

  redirect(`/submit/${formId}?success=true`);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams?: Promise<{ success?: string }>;
}) {
  const { formId } = await params;
  const qp = (await searchParams) ?? {};
  const admin = createSupabaseAdminClient();

  // Load form by ID — allow public (unauthenticated) reads via admin client.
  const { data: form } = await admin
    .from('org_forms')
    .select('id, org_id, title, description, fields, settings, status')
    .eq('id', formId)
    .single();

  if (!form || form.status !== 'published') {
    return notFound();
  }

  const settings = (form.settings ?? {}) as Record<string, unknown>;
  const requiresAuth = Boolean(
    settings.requires_auth ?? settings.requireAuthentication,
  );

  if (requiresAuth) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/signin?next=/submit/${formId}`);
    }
  }

  // Respondents arrive from a link with no other context, so the form says
  // plainly who is collecting the answers.
  const { data: organisation } = await admin
    .from('organizations')
    .select('name')
    .eq('id', form.org_id)
    .maybeSingle();
  const orgName = (organisation?.name as string | undefined)?.trim() || null;

  const submitAction = handleSubmit.bind(null, form.id, form.org_id);
  const fields = form.fields as FormField[];
  const submitButtonText =
    typeof settings.submitButtonText === 'string' &&
    settings.submitButtonText.trim()
      ? settings.submitButtonText.trim()
      : 'Submit';
  const successMessage =
    typeof settings.successMessage === 'string' && settings.successMessage.trim()
      ? settings.successMessage.trim()
      : `Thank you for completing ${form.title}.`;
  // Single idempotency token per page render. Refresh = new token; double-
  // click on the rendered button = same token, so the partial unique index
  // on (form_id, submission_uuid) collapses both POSTs to one row.
  const submissionUuid = randomUUID();

  if (qp.success === 'true') {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Submission received
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-base text-muted-foreground">
              {form.description}
            </p>
          )}
          {orgName && (
            <p className="text-sm text-muted-foreground">
              Your answers go to {orgName}.
            </p>
          )}
        </div>

        <PublicForm
          fields={fields}
          action={submitAction}
          submitButtonText={submitButtonText}
          submissionUuid={submissionUuid}
        />
      </div>
    </div>
  );
}
