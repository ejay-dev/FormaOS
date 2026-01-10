'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase/client';
import { FormField, Form } from '@/lib/forms/types';
import { FIELD_TEMPLATES } from '@/lib/forms/field-templates';
import { Plus, Trash2, GripVertical, Settings, Eye, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default function FormBuilderPage({ params }: PageProps) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, [params.id]);

  async function loadForm() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) {
        router.push("/auth/signin");
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("org_members")
        .select("organization_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (membershipError || !membership?.organization_id) {
        throw new Error("Organization context missing");
      }

      setOrgId(membership.organization_id);

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', membership.organization_id)
        .single();

      if (error) throw error;
      if (data) {
        setForm(data);
        setFields(data.fields || []);
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveForm() {
    if (!form || !orgId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('forms')
        .update({ fields, updated_at: new Date().toISOString() })
        .eq('id', form.id)
        .eq('organization_id', orgId);

      if (error) throw error;
      alert('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      setSaving(false);
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
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    setFields(fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f)));
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  }

  function deleteField(fieldId: string) {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedFields = items.map((field, index) => ({
      ...field,
      order: index,
    }));

    setFields(reorderedFields);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-pulse">Loading form builder...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6">
        <div className="text-red-600">Form not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{form.title}</h1>
          <p className="text-sm text-neutral-600">Form Builder</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/app/forms/${form.id}/preview`)}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-neutral-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={saveForm}
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette */}
        <div className="w-64 border-r bg-neutral-50 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Add Fields</h2>
          <div className="space-y-2">
            {Object.entries(FIELD_TEMPLATES).map(([type, template]) => (
              <button
                key={type}
                onClick={() => addField(type)}
                className="w-full px-4 py-3 bg-white border rounded-lg hover:border-black hover:shadow-sm transition text-left flex items-center gap-3"
              >
                <Plus className="w-4 h-4" />
                <div>
                  <div className="font-medium text-sm">{template.label}</div>
                  <div className="text-xs text-neutral-500 capitalize">{type}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-2">{form.title}</h2>
            {form.description && (
              <p className="text-neutral-600 mb-6">{form.description}</p>
            )}

            {fields.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p>No fields yet. Add fields from the left sidebar to get started.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-lg p-4 bg-white ${
                                selectedField?.id === field.id
                                  ? 'border-black shadow-md'
                                  : 'border-neutral-200'
                              }`}
                              onClick={() => setSelectedField(field)}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-2 cursor-grab text-neutral-400 hover:text-neutral-600"
                                >
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <label className="block font-medium mb-2">
                                    {field.label}
                                    {field.validation?.required && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </label>
                                  {field.helpText && (
                                    <p className="text-sm text-neutral-600 mb-2">
                                      {field.helpText}
                                    </p>
                                  )}
                                  {renderFieldPreview(field)}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteField(field.id);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-5 h-5" />
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
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedField && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Field Settings
              </h2>
              <button
                onClick={() => setSelectedField(null)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) =>
                    updateField(selectedField.id, { label: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Placeholder</label>
                <input
                  type="text"
                  value={selectedField.placeholder || ''}
                  onChange={(e) =>
                    updateField(selectedField.id, { placeholder: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Help Text</label>
                <textarea
                  value={selectedField.helpText || ''}
                  onChange={(e) =>
                    updateField(selectedField.id, { helpText: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Validation</h3>
                
                <label className="flex items-center gap-2 mb-3">
                  <input
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
                  />
                  <span className="text-sm">Required field</span>
                </label>

                {['text', 'textarea'].includes(selectedField.type) && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Min Length
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.minLength || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              minLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.maxLength || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              maxLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {selectedField.type === 'number' && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.min || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              min: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.max || ''}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              max: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>

              {['select', 'radio'].includes(selectedField.type) && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Options</h3>
                  {selectedField.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[index] = { ...option, label: e.target.value };
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="Label"
                      />
                      <button
                        onClick={() => {
                          const newOptions = selectedField.options?.filter(
                            (_, i) => i !== index
                          );
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [
                        ...(selectedField.options || []),
                        { label: 'New Option', value: `option-${Date.now()}` },
                      ];
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderFieldPreview(field: FormField) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <input
          type={field.type}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
          disabled
        />
      );
    case 'textarea':
      return (
        <textarea
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
          rows={3}
          disabled
        />
      );
    case 'select':
      return (
        <select className="w-full px-3 py-2 border rounded-lg bg-neutral-50" disabled>
          <option>Select an option...</option>
          {field.options?.map((opt) => (
            <option key={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input type="radio" name={field.id} disabled />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span>{field.placeholder || 'Checkbox option'}</span>
        </label>
      );
    case 'date':
      return (
        <input
          type="date"
          className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
          disabled
        />
      );
    default:
      return null;
  }
}
