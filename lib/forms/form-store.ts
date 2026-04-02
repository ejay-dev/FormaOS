import { SupabaseClient } from '@supabase/supabase-js';

// =========================================================
// FORM STORE - CRUD operations for org_forms
// =========================================================

export interface FormCreateInput {
  title: string;
  description?: string;
  slug: string;
  fields?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
}

export interface FormUpdateInput {
  title?: string;
  description?: string;
  slug?: string;
  fields?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
}

export interface FormListOptions {
  status?: 'draft' | 'published' | 'archived';
  search?: string;
  cursor?: number;
  limit?: number;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function createForm(
  db: SupabaseClient,
  orgId: string,
  createdBy: string,
  input: FormCreateInput,
) {
  const slug = input.slug || generateSlug(input.title);

  const { data, error } = await db
    .from('org_forms')
    .insert({
      org_id: orgId,
      title: input.title,
      description: input.description ?? null,
      slug,
      fields: input.fields ?? [],
      settings: input.settings ?? {
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission.',
        allowMultipleSubmissions: false,
        showProgressBar: false,
        requireAuthentication: true,
        notifyOnSubmission: true,
      },
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
  updates: FormUpdateInput,
) {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined)
    payload.description = updates.description;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.fields !== undefined) {
    payload.fields = updates.fields;
    // Bump version when fields change
    const { data: current } = await db
      .from('org_forms')
      .select('version')
      .eq('id', formId)
      .eq('org_id', orgId)
      .single();
    if (current) payload.version = (current.version ?? 0) + 1;
  }
  if (updates.settings !== undefined) payload.settings = updates.settings;

  const { data, error } = await db
    .from('org_forms')
    .update(payload)
    .eq('id', formId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
) {
  const { data, error } = await db
    .from('org_forms')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', formId)
    .eq('org_id', orgId)
    .eq('status', 'draft')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
) {
  const { data, error } = await db
    .from('org_forms')
    .update({ status: 'archived' })
    .eq('id', formId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
  createdBy: string,
) {
  const { data: original, error: fetchErr } = await db
    .from('org_forms')
    .select('*')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (fetchErr || !original) throw fetchErr ?? new Error('Form not found');

  const newSlug = `${original.slug}-copy-${Date.now()}`;
  return createForm(db, orgId, createdBy, {
    title: `${original.title} (Copy)`,
    description: original.description,
    slug: newSlug,
    fields: original.fields,
    settings: original.settings,
  });
}

export async function getForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
) {
  const { data, error } = await db
    .from('org_forms')
    .select('*')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (error) throw error;
  return data;
}

export async function getFormBySlug(
  db: SupabaseClient,
  slug: string,
  orgId: string,
) {
  const { data, error } = await db
    .from('org_forms')
    .select('*')
    .eq('slug', slug)
    .eq('org_id', orgId)
    .single();

  if (error) throw error;
  return data;
}

export async function listForms(
  db: SupabaseClient,
  orgId: string,
  options: FormListOptions = {},
) {
  const limit = Math.min(options.limit ?? 25, 100);
  const offset = options.cursor ?? 0;

  let query = db
    .from('org_forms')
    .select('*, submission_count:org_form_submissions(count)', {
      count: 'exact',
    })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    total: count ?? 0,
    hasMore: offset + (data?.length ?? 0) < (count ?? 0),
  };
}

export async function deleteForm(
  db: SupabaseClient,
  formId: string,
  orgId: string,
) {
  const { error } = await db
    .from('org_forms')
    .delete()
    .eq('id', formId)
    .eq('org_id', orgId);

  if (error) throw error;
}
