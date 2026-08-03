'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/ui/submit-button';
import type { FormField } from '@/lib/forms/types';

/**
 * Public form — the surface a participant or family member sees when they open
 * a shared link. It runs the server action through useActionState so a failed
 * validation re-renders in place: every answer the respondent typed stays in
 * the DOM and each message lands under the question it belongs to.
 */

export interface PublicFormState {
  /** Whole-form problem: rate limit, closed form, save failure. */
  formError?: string;
  /** Keyed by FormField.id. */
  fieldErrors?: Record<string, string>;
  /** Keyed by input name, echoed back so a re-render can restore answers. */
  values?: Record<string, string>;
}

export const INITIAL_PUBLIC_FORM_STATE: PublicFormState = {};

type PublicFormAction = (
  state: PublicFormState,
  formData: FormData,
) => Promise<PublicFormState>;

// 16px is the smallest font iOS Safari will focus without zooming the whole
// page, and 44px is the smallest reliable touch target. Most respondents open
// this form from a link on a phone, so both are floors rather than preferences.
const CONTROL_BASE =
  'w-full min-h-[44px] rounded-md bg-background px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function controlClass(invalid: boolean) {
  return `${CONTROL_BASE} ${invalid ? 'border border-destructive' : 'border border-input'}`;
}

function RequiredMark({ required }: { required: boolean }) {
  if (!required) return null;
  return (
    <span className="ml-1 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function PublicForm({
  fields,
  action,
  submitButtonText,
  submissionUuid,
}: {
  fields: FormField[];
  action: PublicFormAction;
  submitButtonText: string;
  submissionUuid: string;
}) {
  const [state, formAction] = useActionState(action, INITIAL_PUBLIC_FORM_STATE);

  const ordered = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const valueFor = (name: string) => state.values?.[name] ?? '';

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="_submission_uuid" value={submissionUuid} />

      {/* Honeypot field — visually hidden, off-screen, no label,
          tabindex=-1, autocomplete off. Real users never fill this. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label htmlFor="hp-company">
          Company (leave blank)
          <input
            id="hp-company"
            name="_company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      {state.formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.formError}
        </div>
      )}

      {ordered.map((field) => {
        const name = `field_${field.id}`;
        const message = state.fieldErrors?.[field.id];
        const errorId = `${name}-error`;
        const helpId = `${name}-help`;
        const describedBy =
          [field.helpText ? helpId : null, message ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined;
        const required = Boolean(field.validation?.required);
        const invalid = Boolean(message);

        const help = field.helpText ? (
          <p id={helpId} className="text-sm text-muted-foreground">
            {field.helpText}
          </p>
        ) : null;

        // File answers cannot be accepted here: the form builder does not offer
        // a file question, and the public endpoint has no attachment store. If
        // one arrives through the API the question is shown but left unanswered
        // rather than silently dropped.
        if (field.type === 'file') {
          return (
            <div key={field.id} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {field.label}
              </p>
              {help}
              <p className="text-sm text-muted-foreground">
                File uploads are not available on this form.
              </p>
            </div>
          );
        }

        if (field.type === 'radio') {
          return (
            <fieldset
              key={field.id}
              className="space-y-1.5"
              aria-describedby={describedBy}
            >
              <legend className="text-sm font-medium text-foreground">
                {field.label}
                <RequiredMark required={required} />
              </legend>
              {help}
              <div className="space-y-1">
                {(field.options ?? []).map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-[44px] cursor-pointer items-center gap-3 text-base sm:text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name={name}
                      value={option.value}
                      required={required}
                      defaultChecked={valueFor(name) === option.value}
                      className="h-5 w-5 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <FieldError id={errorId} message={message} />
            </fieldset>
          );
        }

        if (field.type === 'checkbox') {
          return (
            <div key={field.id} className="space-y-1.5">
              <label
                htmlFor={name}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 text-base sm:text-sm font-medium text-foreground"
              >
                <input
                  id={name}
                  name={name}
                  type="checkbox"
                  value="yes"
                  required={required}
                  defaultChecked={valueFor(name) === 'yes'}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  className="h-5 w-5 accent-primary"
                />
                <span>
                  {field.label}
                  <RequiredMark required={required} />
                </span>
              </label>
              {help}
              <FieldError id={errorId} message={message} />
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-1.5">
            <label
              htmlFor={name}
              className="block text-sm font-medium text-foreground"
            >
              {field.label}
              <RequiredMark required={required} />
            </label>
            {help}
            {field.type === 'textarea' ? (
              <textarea
                id={name}
                name={name}
                rows={4}
                required={required}
                placeholder={field.placeholder ?? ''}
                defaultValue={valueFor(name)}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={`${controlClass(invalid)} resize-y`}
              />
            ) : field.type === 'select' ? (
              <select
                id={name}
                name={name}
                required={required}
                defaultValue={valueFor(name)}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={controlClass(invalid)}
              >
                <option value="">{field.placeholder || 'Choose one'}</option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={name}
                name={name}
                type={
                  field.type === 'date'
                    ? 'date'
                    : field.type === 'number'
                      ? 'number'
                      : field.type === 'email'
                        ? 'email'
                        : 'text'
                }
                inputMode={
                  field.type === 'number'
                    ? 'decimal'
                    : field.type === 'email'
                      ? 'email'
                      : undefined
                }
                min={field.validation?.min}
                max={field.validation?.max}
                required={required}
                placeholder={field.placeholder ?? ''}
                defaultValue={valueFor(name)}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={controlClass(invalid)}
              />
            )}
            <FieldError id={errorId} message={message} />
          </div>
        );
      })}

      <div className="space-y-1.5">
        <label
          htmlFor="respondent_email"
          className="block text-sm font-medium text-foreground"
        >
          Your email (optional)
        </label>
        <p className="text-sm text-muted-foreground">
          Only needed if someone may have to follow up with you.
        </p>
        <input
          id="respondent_email"
          name="respondent_email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={valueFor('respondent_email')}
          className={controlClass(false)}
        />
      </div>

      <SubmitButton size="md" loadingText="Sending…" className="rounded-md">
        {submitButtonText}
      </SubmitButton>
    </form>
  );
}
