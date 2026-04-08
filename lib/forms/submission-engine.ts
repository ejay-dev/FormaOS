import { SupabaseClient } from '@supabase/supabase-js';
import type { FormField, ConditionalLogic, FieldValidation } from './types';

interface ValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

export class FormValidationError extends Error {
  validationErrors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'FormValidationError';
    this.validationErrors = errors;
  }
}

// =========================================================
// FORM SUBMISSION ENGINE
// Validation, conditional logic, submission handling
// =========================================================

interface SubmissionInput {
  data: Record<string, unknown>;
  respondentEmail?: string;
  respondentName?: string;
  submittedBy?: string;
  metadata?: Record<string, unknown>;
}

interface SubmissionListOptions {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: number;
  limit?: number;
}

// ---- Conditional logic evaluation ----

export function evaluateCondition(
  condition: ConditionalLogic,
  data: Record<string, unknown>,
): boolean {
  const fieldValue = String(data[condition.fieldId] ?? '');
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === targetValue;
    case 'notEquals':
      return fieldValue !== targetValue;
    case 'contains':
      return fieldValue.includes(targetValue);
    case 'greaterThan':
      return Number(fieldValue) > Number(targetValue);
    case 'lessThan':
      return Number(fieldValue) < Number(targetValue);
    default:
      return true;
  }
}

export function isFieldVisible(
  field: FormField,
  data: Record<string, unknown>,
): boolean {
  if (!field.conditionalLogic?.length) return true;

  for (const logic of field.conditionalLogic) {
    const conditionMet = evaluateCondition(logic, data);
    if (logic.action === 'show' && !conditionMet) return false;
    if (logic.action === 'hide' && conditionMet) return false;
  }

  return true;
}

// ---- Validation ----

function validateField(
  field: FormField,
  value: unknown,
  validation: FieldValidation | undefined,
): string | null {
  const strValue = value == null ? '' : String(value);
  const isEmpty = strValue.trim() === '';

  if (validation?.required && isEmpty) {
    return validation.customMessage ?? `${field.label} is required`;
  }

  if (isEmpty) return null; // Skip remaining checks for empty optional fields

  if (validation?.minLength && strValue.length < validation.minLength) {
    return `${field.label} must be at least ${validation.minLength} characters`;
  }

  if (validation?.maxLength && strValue.length > validation.maxLength) {
    return `${field.label} must be at most ${validation.maxLength} characters`;
  }

  if (field.type === 'number') {
    const num = Number(strValue);
    if (isNaN(num)) return `${field.label} must be a number`;
    if (validation?.min != null && num < validation.min)
      return `${field.label} must be at least ${validation.min}`;
    if (validation?.max != null && num > validation.max)
      return `${field.label} must be at most ${validation.max}`;
  }

  if (field.type === 'email' && !isEmpty) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue))
      return `${field.label} must be a valid email`;
  }

  if (validation?.pattern) {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(strValue)) {
        return validation.customMessage ?? `${field.label} format is invalid`;
      }
    } catch {
      // Invalid regex pattern — skip
    }
  }

  return null;
}

export function validateSubmission(
  fields: FormField[],
  data: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    // Skip hidden fields
    if (!isFieldVisible(field, data)) continue;

    const error = validateField(field, data[field.id], field.validation);
    if (error) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: error,
      });
    }
  }

  return errors;
}

// ---- Form Submission CRUD ----

export async function submitForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
  input: SubmissionInput,
) {
  // Load form definition to validate
  const { data: form, error: formErr } = await db
    .from('org_forms')
    .select('fields, settings, status')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (formErr || !form) throw formErr ?? new Error('Form not found');
  if (form.status !== 'published')
    throw new Error('Form is not accepting submissions');

  const settings = form.settings as Record<string, unknown>;
  const maxSubs = settings?.max_submissions as number | undefined;

  if (maxSubs) {
    const { count } = await db
      .from('org_form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', formId);
    if ((count ?? 0) >= maxSubs)
      throw new Error('Form has reached maximum submissions');
  }

  // Validate
  const fields = form.fields as FormField[];
  const errors = validateSubmission(fields, input.data);
  if (errors.length > 0) {
    throw new FormValidationError(errors);
  }

  // Insert submission
  const { data: submission, error: insertErr } = await db
    .from('org_form_submissions')
    .insert({
      form_id: formId,
      org_id: orgId,
      submitted_by: input.submittedBy ?? null,
      respondent_email: input.respondentEmail ?? null,
      respondent_name: input.respondentName ?? null,
      data: input.data,
      metadata: input.metadata ?? {},
      status: 'submitted',
    })
    .select()
    .single();

  if (insertErr) throw insertErr;
  return submission;
}

export async function getSubmission(
  db: SupabaseClient,
  submissionId: string,
  orgId: string,
) {
  const { data, error } = await db
    .from('org_form_submissions')
    .select('*, form:org_forms(id, title, fields)')
    .eq('id', submissionId)
    .eq('org_id', orgId)
    .single();

  if (error) throw error;
  return data;
}

export async function listSubmissions(
  db: SupabaseClient,
  formId: string,
  orgId: string,
  options: SubmissionListOptions = {},
) {
  const limit = Math.min(options.limit ?? 25, 100);
  const offset = options.cursor ?? 0;

  let query = db
    .from('org_form_submissions')
    .select('*', { count: 'exact' })
    .eq('form_id', formId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) query = query.eq('status', options.status);
  if (options.dateFrom) query = query.gte('created_at', options.dateFrom);
  if (options.dateTo) query = query.lte('created_at', options.dateTo);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    total: count ?? 0,
    hasMore: offset + (data?.length ?? 0) < (count ?? 0),
  };
}

export async function reviewSubmission(
  db: SupabaseClient,
  submissionId: string,
  orgId: string,
  reviewerId: string,
  status: 'approved' | 'rejected',
  notes?: string,
) {
  const { data, error } = await db
    .from('org_form_submissions')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', submissionId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubmissionAnalytics(
  db: SupabaseClient,
  formId: string,
  orgId: string,
) {
  const { data: submissions, error } = await db
    .from('org_form_submissions')
    .select('status, created_at, metadata')
    .eq('form_id', formId)
    .eq('org_id', orgId);

  if (error) throw error;

  const byStatus: Record<string, number> = {};
  let totalDurationMs = 0;
  let durationCount = 0;

  for (const sub of submissions ?? []) {
    byStatus[sub.status] = (byStatus[sub.status] ?? 0) + 1;
    const duration = (sub.metadata as Record<string, unknown>)
      ?.submission_duration_ms;
    if (typeof duration === 'number') {
      totalDurationMs += duration;
      durationCount++;
    }
  }

  return {
    total: submissions?.length ?? 0,
    byStatus,
    averageCompletionTimeMs:
      durationCount > 0 ? Math.round(totalDurationMs / durationCount) : null,
  };
}
