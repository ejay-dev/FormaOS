import { SupabaseClient } from '@supabase/supabase-js';

// =========================================================
// FORM → EVIDENCE PIPELINE
// Links form submissions to compliance evidence
// =========================================================

/**
 * Link a form submission to an evidence record, creating the evidence
 * artifact that can be attached to compliance controls.
 */
export async function linkSubmissionToEvidence(
  db: SupabaseClient,
  submissionId: string,
  orgId: string,
  controlId: string,
  createdBy: string,
) {
  // Load submission with form title
  const { data: submission, error: subErr } = await db
    .from('org_form_submissions')
    .select('*, form:org_forms(id, title)')
    .eq('id', submissionId)
    .eq('org_id', orgId)
    .single();

  if (subErr || !submission) throw subErr ?? new Error('Submission not found');

  const formTitle =
    (submission.form as Record<string, unknown>)?.title ?? 'Form Submission';

  // Create evidence record
  const { data: evidence, error: evErr } = await db
    .from('control_evidence')
    .insert({
      organization_id: orgId,
      control_id: controlId,
      title: `${formTitle} — ${submission.respondent_name || submission.respondent_email || 'Response'}`,
      description: `Form submission from ${new Date(submission.created_at).toLocaleDateString()}`,
      type: 'form_submission',
      status: 'pending',
      metadata: {
        form_id: submission.form_id,
        submission_id: submission.id,
        submitted_at: submission.created_at,
        respondent: submission.respondent_name || submission.respondent_email,
      },
      uploaded_by: createdBy,
    })
    .select()
    .single();

  if (evErr) throw evErr;

  // Link submission to evidence
  await db
    .from('org_form_submissions')
    .update({ evidence_id: evidence.id })
    .eq('id', submissionId)
    .eq('org_id', orgId);

  return evidence;
}

/**
 * Auto-map a form submission to evidence based on the form's evidence_mapping settings.
 */
export async function autoMapSubmission(
  db: SupabaseClient,
  formId: string,
  submissionId: string,
  orgId: string,
  createdBy: string,
) {
  const { data: form, error: formErr } = await db
    .from('org_forms')
    .select('settings')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (formErr || !form) return null;

  const settings = form.settings as Record<string, unknown>;
  const mappings = settings?.evidence_mapping as
    | Array<{ control_id: string }>
    | undefined;

  if (!mappings?.length) return null;

  const results = [];
  for (const mapping of mappings) {
    if (!mapping.control_id) continue;
    try {
      const evidence = await linkSubmissionToEvidence(
        db,
        submissionId,
        orgId,
        mapping.control_id,
        createdBy,
      );
      results.push(evidence);
    } catch {
      // Continue with other mappings if one fails
    }
  }

  return results;
}
