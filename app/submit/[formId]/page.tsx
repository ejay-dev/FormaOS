import { notFound, redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateSubmission } from '@/lib/forms/submission-engine';
import type { FormField } from '@/lib/forms/types';
import { SubmitButton } from '@/components/ui/submit-button';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Server Action — handles the public POST submission
// ---------------------------------------------------------------------------
async function handleSubmit(formId: string, orgId: string, formData: FormData) {
  'use server';
  const admin = createSupabaseAdminClient();

  const { data: form } = await admin
    .from('org_forms')
    .select('fields, settings, status')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (!form || form.status !== 'published') {
    redirect(`/submit/${formId}?error=unavailable`);
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
      redirect(`/submit/${formId}?error=max_submissions`);
    }
  }

  // Build submission data from form fields
  const fields = form.fields as FormField[];
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = formData.get(`field_${field.id}`);
    data[field.id] = raw !== null ? String(raw) : '';
  }

  // Validate
  const errors = validateSubmission(fields, data);
  if (errors.length > 0) {
    const msg = errors.map((e) => e.message).join(', ');
    redirect(`/submit/${formId}?error=${encodeURIComponent(msg)}`);
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
    redirect(`/submit/${formId}?error=server_error`);
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
  searchParams?: Promise<{ success?: string; error?: string }>;
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

  const submitAction = handleSubmit.bind(null, form.id, form.org_id);
  const fields = form.fields as FormField[];
  // Single idempotency token per page render. Refresh = new token; double-
  // click on the rendered button = same token, so the partial unique index
  // on (form_id, submission_uuid) collapses both POSTs to one row.
  const submissionUuid = randomUUID();

  if (qp.success === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Submission received
          </h1>
          <p className="text-muted-foreground">
            Thank you for completing {form.title}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        {qp.error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {decodeURIComponent(qp.error)}
          </div>
        )}

        <form action={submitAction} className="space-y-5">
          <input type="hidden" name="_submission_uuid" value={submissionUuid} />
          {fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label
                htmlFor={`field_${field.id}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
                {field.validation?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </label>
              {field.helpText && (
                <p className="text-xs text-muted-foreground">
                  {field.helpText}
                </p>
              )}
              {field.type === 'textarea' ? (
                <textarea
                  id={`field_${field.id}`}
                  name={`field_${field.id}`}
                  rows={4}
                  required={Boolean(field.validation?.required)}
                  placeholder={field.placeholder ?? ''}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <input
                  id={`field_${field.id}`}
                  name={`field_${field.id}`}
                  type={
                    field.type === 'date'
                      ? 'date'
                      : field.type === 'number'
                        ? 'number'
                        : field.type === 'email'
                          ? 'email'
                          : 'text'
                  }
                  required={Boolean(field.validation?.required)}
                  placeholder={field.placeholder ?? ''}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          ))}

          <div className="space-y-1">
            <label
              htmlFor="respondent_email"
              className="block text-sm font-medium text-foreground"
            >
              Your email (optional)
            </label>
            <input
              id="respondent_email"
              name="respondent_email"
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <SubmitButton size="md" loadingText="Submitting…" className="rounded-md">
            Submit
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
