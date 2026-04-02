/**
 * Form Renderer Component
 * Renders form fields from JSON definition with validation
 * Used by public submission pages and in-app form rendering
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  FormField,
  FieldValidation,
  ConditionalLogic,
} from '@/lib/forms/types';

// ---- Conditional logic evaluation (client-side mirror) ----

function evaluateCondition(
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

function isFieldVisible(
  field: FormField,
  data: Record<string, unknown>,
): boolean {
  if (!field.conditionalLogic?.length) return true;
  for (const logic of field.conditionalLogic) {
    const met = evaluateCondition(logic, data);
    if (logic.action === 'show' && !met) return false;
    if (logic.action === 'hide' && met) return false;
  }
  return true;
}

// ---- Field Components ----

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
}) {
  const baseClass =
    'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors';
  const errorClass = error ? 'border-red-500' : 'border-input';

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className={`${baseClass} ${errorClass} min-h-[100px] resize-y`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.validation?.required}
        />
      );

    case 'select':
      return (
        <select
          className={`${baseClass} ${errorClass}`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          required={field.validation?.required}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-primary h-4 w-4 rounded"
          />
          {field.placeholder || 'Yes'}
        </label>
      );

    case 'date':
      return (
        <input
          type="date"
          className={`${baseClass} ${errorClass}`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          required={field.validation?.required}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          className={`${baseClass} ${errorClass}`}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) =>
            onChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
          required={field.validation?.required}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          className={`${baseClass} ${errorClass}`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.validation?.required}
        />
      );

    case 'file':
      return (
        <input
          type="file"
          className={`${baseClass} ${errorClass}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file.name);
          }}
          required={field.validation?.required}
        />
      );

    default:
      return (
        <input
          type="text"
          className={`${baseClass} ${errorClass}`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.validation?.required}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
        />
      );
  }
}

// ---- Main Form Renderer ----

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function FormRenderer({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  disabled = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = useCallback(
    (field: FormField, value: unknown): string | null => {
      const strValue = value == null ? '' : String(value);
      const isEmpty = strValue.trim() === '';
      const v = field.validation;

      if (v?.required && isEmpty)
        return v.customMessage ?? `${field.label} is required`;
      if (isEmpty) return null;
      if (v?.minLength && strValue.length < v.minLength)
        return `Must be at least ${v.minLength} characters`;
      if (v?.maxLength && strValue.length > v.maxLength)
        return `Must be at most ${v.maxLength} characters`;
      if (field.type === 'number') {
        const num = Number(strValue);
        if (isNaN(num)) return 'Must be a number';
        if (v?.min != null && num < v.min) return `Must be at least ${v.min}`;
        if (v?.max != null && num > v.max) return `Must be at most ${v.max}`;
      }
      if (field.type === 'email' && !isEmpty) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue))
          return 'Must be a valid email';
      }
      if (v?.pattern) {
        try {
          if (!new RegExp(v.pattern).test(strValue))
            return v.customMessage ?? 'Invalid format';
        } catch {
          /* skip invalid regex */
        }
      }
      return null;
    },
    [],
  );

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || disabled) return;

    // Validate all visible fields
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (!isFieldVisible(field, formData)) continue;
      const error = validateField(field, formData[field.id]);
      if (error) newErrors[field.id] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error && 'validationErrors' in err) {
        const serverErrors = (err as any).validationErrors as Array<{
          fieldId: string;
          message: string;
        }>;
        const map: Record<string, string> = {};
        for (const e of serverErrors) map[e.fieldId] = e.message;
        setErrors(map);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Thank you!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your submission has been received.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => {
        if (!isFieldVisible(field, formData)) return null;
        const error = errors[field.id] ?? null;

        return (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-sm font-medium">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-400 ml-1">*</span>
              )}
            </label>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            <FieldInput
              field={field}
              value={formData[field.id]}
              error={error}
              onChange={(val) => handleChange(field.id, val)}
            />
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={submitting || disabled}
        className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
}
