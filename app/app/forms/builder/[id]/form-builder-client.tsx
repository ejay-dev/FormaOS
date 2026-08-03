'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createSupabaseClient } from '@/lib/supabase/client';
import { FormField, FieldOption, Form } from '@/lib/forms/types';
import { FIELD_TEMPLATES } from '@/lib/forms/field-templates';
import { FormRenderer } from '@/components/forms/form-renderer';
import {
  StatusBadge,
  documentStatus,
} from '@/components/compliance/StatusBadge';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Save,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useComplianceAction } from '@/components/compliance-system';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * =========================================================
 * FORM BUILDER CLIENT
 * Node Type: Control (teal) - Forms for data collection
 * =========================================================
 */

type FormBuilderClientProps = {
  formId: string;
};

const DEFAULT_SUBMIT_LABEL = 'Submit';

/**
 * Stored option values are what a submission records, so an option keeps its
 * existing value for as long as its label is unchanged; only new lines get a
 * freshly derived value.
 */
function parseOptions(text: string, existing: FieldOption[] = []): FieldOption[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => {
      const match = existing.find((option) => option.label === label);
      if (match) return match;
      const value = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return { label, value: value || label };
    });
}

export default function FormBuilderClient({ formId }: FormBuilderClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { nodeUpdated, reportError } = useComplianceAction();

  // Publishing goes through /api/v1/forms/[formId]/publish, which grants
  // forms:write to owners and admins only. The control is hidden for other
  // roles rather than letting them press a button that returns 403.
  const canPublish = role === 'owner' || role === 'admin';
  const busy = saving || publishing;

  useEffect(() => {
    loadForm();
  }, [formId]);

  async function loadForm() {
    setLoadError(null);
    try {
      const supabase = createSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (membershipError || !membership?.organization_id) {
        throw new Error('Organization context missing');
      }

      setOrgId(membership.organization_id);
      setRole(membership.role ?? null);

      const { data, error } = await supabase
        .from('org_forms')
        .select('*')
        .eq('id', formId)
        .eq('org_id', membership.organization_id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const settings = (data.settings ?? {}) as Record<string, unknown>;
        setForm(data);
        setFields(data.fields || []);
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setSubmitButtonText(
          typeof settings.submitButtonText === 'string'
            ? settings.submitButtonText
            : '',
        );
        setSuccessMessage(
          typeof settings.successMessage === 'string'
            ? settings.successMessage
            : '',
        );
      } else {
        setLoadError('Form not found or you do not have access to it.');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to load form data.';
      setLoadError(message);
      reportError({ title: 'Form load failed', message });
    } finally {
      setLoading(false);
    }
  }

  async function saveForm(): Promise<boolean> {
    if (!form || !orgId) return false;

    setSaving(true);
    setStatusError(null);
    try {
      const supabase = createSupabaseClient();
      const nextTitle = title.trim() || 'Untitled form';
      const nextDescription = description.trim();
      // Merge rather than replace: settings also carries access and limit keys
      // that this panel does not edit.
      const nextSettings = {
        ...((form.settings ?? {}) as unknown as Record<string, unknown>),
        submitButtonText: submitButtonText.trim() || DEFAULT_SUBMIT_LABEL,
        successMessage: successMessage.trim() || null,
      };

      const { error } = await supabase
        .from('org_forms')
        .update({
          title: nextTitle,
          description: nextDescription || null,
          fields,
          settings: nextSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', form.id)
        .eq('org_id', orgId);

      if (error) throw error;

      setForm((current) =>
        current
          ? {
              ...current,
              title: nextTitle,
              description: nextDescription,
              settings: nextSettings as unknown as Form['settings'],
            }
          : current,
      );
      setTitle(nextTitle);
      setShowSaveSuccess(true);
      nodeUpdated('control', nextTitle);

      setTimeout(() => setShowSaveSuccess(false), 2000);
      return true;
    } catch (error: any) {
      console.error('Error saving form:', error);
      setStatusError(error?.message || 'The form could not be saved.');
      reportError({
        title: 'Save failed',
        message: error.message || 'Unknown error',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publishForm() {
    if (!form) return;
    setStatusError(null);
    setPublishing(true);
    try {
      // Save first so the published version is the one on screen.
      const saved = await saveForm();
      if (!saved) return;

      const response = await fetch(`/api/v1/forms/${form.id}/publish`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'The form could not be published.');
      }

      setForm((current) =>
        current ? { ...current, status: 'published' } : current,
      );
      router.refresh();
    } catch (error: any) {
      console.error('Error publishing form:', error);
      setStatusError(error?.message || 'The form could not be published.');
      reportError({
        title: 'Publish failed',
        message: error?.message || 'Unknown error',
      });
    } finally {
      setPublishing(false);
    }
  }

  async function returnToDraft() {
    if (!form || !orgId) return;
    setStatusError(null);
    setPublishing(true);
    try {
      // Routed through the API for the same reason publish is: a direct client
      // write only has to satisfy the org_forms_update RLS policy, which admits
      // ANY org member (viewer and staff included), so a non-admin could take a
      // live form offline even though the same UI refuses to let them publish
      // one. /api/v1/forms/[formId]/unpublish requires the forms:write scope,
      // which sessionHasScopes grants to owner/admin only.
      const response = await fetch(`/api/v1/forms/${form.id}/unpublish`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'The form could not be unpublished.');
      }

      setForm((current) =>
        current ? { ...current, status: 'draft' } : current,
      );
      router.refresh();
    } catch (error: any) {
      console.error('Error unpublishing form:', error);
      setStatusError(error?.message || 'The form could not be moved to draft.');
      reportError({
        title: 'Unpublish failed',
        message: error?.message || 'Unknown error',
      });
    } finally {
      setPublishing(false);
    }
  }

  function addField(type: string) {
    const template = FIELD_TEMPLATES[type];
    if (!template) return;

    const newField: FormField = {
      ...template,
      id: `field-${Date.now()}`,
      order: fields.length,
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
    setPreviewing(false);
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    setFields(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    );
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  }

  function deleteField(fieldId: string) {
    setFields(fields.filter((field) => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const reordered = Array.from(fields);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setFields(
      reordered.map((field, index) => ({
        ...field,
        order: index,
      })),
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="space-y-3 rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-foreground">
          <h1 className="text-xl font-semibold">Unable to load form builder</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setLoading(true);
                void loadForm();
              }}
              className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/app')}
              className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return <div className="p-6 text-muted-foreground">Form not found.</div>;
  }

  const isPublished = form.status === 'published';
  const secondaryButtonClass =
    'flex min-h-[44px] md:min-h-0 items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 space-y-3">
        <h1 className="sr-only">{title.trim() || 'Untitled form'}</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="form-title" className="sr-only">
              Form title
            </label>
            <input
              id="form-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled form"
              className="page-title -ml-2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-foreground placeholder:text-muted-foreground hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label htmlFor="form-description" className="sr-only">
              Form description
            </label>
            <input
              id="form-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this form collects"
              className="-ml-2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-muted-foreground placeholder:text-muted-foreground hover:border-border focus:border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge {...documentStatus(form.status)} size="md" />
            <button
              onClick={() => setPreviewing((current) => !current)}
              className={secondaryButtonClass}
              aria-pressed={previewing}
            >
              <Eye className="h-4 w-4" />
              {previewing ? 'Back to editing' : 'Preview'}
            </button>
            <button
              onClick={() => void saveForm()}
              disabled={busy}
              className={secondaryButtonClass}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            {canPublish ? (
              isPublished ? (
                <button
                  onClick={() => void returnToDraft()}
                  disabled={busy}
                  className={secondaryButtonClass}
                >
                  {publishing ? 'Working...' : 'Unpublish'}
                </button>
              ) : (
                <button
                  onClick={() =>
                    form.status === 'archived'
                      ? void returnToDraft()
                      : void publishForm()
                  }
                  disabled={
                    busy || (form.status !== 'archived' && fields.length === 0)
                  }
                  className="flex min-h-[44px] md:min-h-0 items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {form.status === 'archived'
                    ? publishing
                      ? 'Working...'
                      : 'Move back to draft'
                    : publishing
                      ? 'Publishing...'
                      : 'Publish'}
                </button>
              )
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {isPublished ? (
            <>
              <a
                href={`/submit/${form.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground underline underline-offset-4"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open the form respondents see
              </a>
              <Link
                href={`/app/forms/${form.id}/submissions`}
                className="text-foreground underline underline-offset-4"
              >
                View submissions
              </Link>
            </>
          ) : (
            <span>
              {form.status === 'archived'
                ? 'This form is archived. Move it back to draft to publish it again.'
                : !canPublish
                  ? 'Drafts are not reachable by respondents. An owner or admin can publish this form.'
                  : fields.length === 0
                    ? 'Add at least one field, then publish to share the link.'
                    : 'Drafts are not reachable by respondents. Publish to share the link.'}
            </span>
          )}
          {showSaveSuccess && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-success"
            >
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>

        {statusError && (
          <p role="alert" className="text-sm text-destructive">
            {statusError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {previewing ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground">Preview</h2>
              <p className="mt-1 mb-6 text-sm text-muted-foreground">
                This is how the form reads to a respondent. Nothing typed here
                is recorded.
              </p>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add a field to see the form.
                </p>
              ) : (
                <FormRenderer
                  fields={[...fields].sort(
                    (a, b) => (a.order ?? 0) - (b.order ?? 0),
                  )}
                  onSubmit={async () => {}}
                  submitLabel={submitButtonText.trim() || DEFAULT_SUBMIT_LABEL}
                  disabled
                />
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Form fields
              </h2>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {fields.map((field, index) => (
                        <Draggable
                          key={field.id}
                          draggableId={field.id}
                          index={index}
                        >
                          {(dragProvided) => (
                            <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  (e.currentTarget as HTMLElement).click();
                                }
                              }}
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`bg-muted border border-border rounded-lg p-4 cursor-pointer ${
                                selectedField?.id === field.id
                                  ? 'ring-2 ring-ring'
                                  : ''
                              }`}
                              onClick={() => setSelectedField(field)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div {...dragProvided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-foreground font-medium">
                                      {field.label}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                      {field.type}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteField(field.id);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fields added yet. Add fields from the panel on the right.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add field</h3>
            <div className="space-y-2">
              {Object.entries(FIELD_TEMPLATES).map(([type, template]) => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="h-4 w-4" />
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {selectedField && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Field settings
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="field-6"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Label
                  </label>
                  <input
                    id="field-6"
                    type="text"
                    value={selectedField.label}
                    onChange={(e) =>
                      updateField(selectedField.id, { label: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-5"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Placeholder
                  </label>
                  <input
                    id="field-5"
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        placeholder: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {(selectedField.type === 'select' ||
                  selectedField.type === 'radio') && (
                  <div>
                    <label
                      htmlFor="field-options"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      Choices
                    </label>
                    <textarea
                      id="field-options"
                      key={selectedField.id}
                      rows={4}
                      defaultValue={(selectedField.options ?? [])
                        .map((option) => option.label)
                        .join('\n')}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          options: parseOptions(
                            e.target.value,
                            selectedField.options,
                          ),
                        })
                      }
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      One choice per line.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="field-4"
                    type="checkbox"
                    checked={selectedField.validation?.required || false}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        validation: {
                          ...selectedField.validation,
                          required: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-border bg-muted text-primary focus:ring-ring"
                  />
                  <label htmlFor="field-4" className="text-sm text-muted-foreground">
                    Required field
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Wording respondents see
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="form-submit-label"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Submit button text
                </label>
                <input
                  id="form-submit-label"
                  type="text"
                  value={submitButtonText}
                  onChange={(e) => setSubmitButtonText(e.target.value)}
                  placeholder={DEFAULT_SUBMIT_LABEL}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label
                  htmlFor="form-success-message"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Message after submitting
                </label>
                <textarea
                  id="form-success-message"
                  rows={3}
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  placeholder={`Thank you for completing ${title.trim() || 'this form'}.`}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
