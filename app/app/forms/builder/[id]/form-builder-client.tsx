"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createSupabaseClient } from "@/lib/supabase/client";
import { FormField, Form } from "@/lib/forms/types";
import { FIELD_TEMPLATES } from "@/lib/forms/field-templates";
import { Plus, Trash2, GripVertical, Settings, Eye, Save } from "lucide-react";
import { useRouter } from "next/navigation";

type FormBuilderClientProps = {
  formId: string;
};

export default function FormBuilderClient({ formId }: FormBuilderClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, [formId]);

  async function loadForm() {
    try {
      const supabase = createSupabaseClient();
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
        .from("forms")
        .select("*")
        .eq("id", formId)
        .eq("organization_id", membership.organization_id)
        .single();

      if (error) throw error;
      if (data) {
        setForm(data);
        setFields(data.fields || []);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveForm() {
    if (!form || !orgId) return;

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("forms")
        .update({ fields, updated_at: new Date().toISOString() })
        .eq("id", form.id)
        .eq("organization_id", orgId);

      if (error) throw error;
      alert("Form saved successfully!");
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save form");
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
    setFields(fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)));
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
      }))
    );
  }

  if (loading) {
    return <div className="p-6 text-slate-400">Loading...</div>;
  }

  if (!form) {
    return <div className="p-6 text-slate-400">Form not found.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{form.title}</h1>
          <p className="text-gray-400">{form.description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={saveForm}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Form Fields</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 cursor-pointer ${
                              selectedField?.id === field.id ? "ring-2 ring-blue-500" : ""
                            }`}
                            onClick={() => setSelectedField(field)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div {...dragProvided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{field.label}</p>
                                  <p className="text-gray-400 text-sm">{field.type}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteField(field.id);
                                }}
                                className="text-gray-400 hover:text-red-400 transition-colors"
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
              <div className="text-center py-8 text-gray-400">
                No fields added yet. Add fields from the panel on the right.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Field</h3>
            <div className="space-y-2">
              {Object.entries(FIELD_TEMPLATES).map(([type, template]) => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {selectedField && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Field Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ""}
                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
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
                    className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-400">Required field</label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
