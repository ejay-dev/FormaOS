'use client';

import { useState } from 'react';
import { Plus, Loader2, ClipboardList } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { createRegisterEntry } from '@/app/app/registers/actions';
import { NDIS_REGISTER_TYPES } from '@/lib/compliance/ndis/register-types';

interface CreateRegisterEntrySheetProps {
  onCreated?: () => void;
}

/**
 * Sheet to create a typed register entry on org_registers. The type
 * dropdown surfaces the 10 NDIS-aware values plus a free-form "other"
 * option so customers can adopt the NDIS taxonomy at their pace without
 * losing existing workflows.
 */
export function CreateRegisterEntrySheet({
  onCreated,
}: CreateRegisterEntrySheetProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeValue, setTypeValue] = useState<string>(
    NDIS_REGISTER_TYPES[0]?.value ?? '',
  );

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      // If the user picked "other", the free-form input feeds the type.
      if (typeValue === 'other') {
        const custom = String(formData.get('custom_type') ?? '').trim();
        if (!custom) {
          throw new Error('Enter a custom register type.');
        }
        formData.set('type', custom);
      } else {
        formData.set('type', typeValue);
      }

      const result = await createRegisterEntry(formData);
      if (result && 'error' in result) {
        throw new Error(result.error || 'Failed to create register.');
      }
      setOpen(false);
      onCreated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
          data-testid="create-register-entry-btn"
        >
          <Plus className="h-3.5 w-3.5" />
          New register entry
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-md">
        <form action={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              New register entry
            </SheetTitle>
            <SheetDescription>
              Tag your governance log with a typed register so the right NDIS
              predicates pick it up. Pick &quot;Other&quot; to use a custom type.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5">
            {error && (
              <div className="p-3 rounded-md border border-red-400/30 bg-red-400/10 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Register name <span className="text-red-500">*</span>
              </label>
              <input
                id="register-name"
                name="name"
                required
                maxLength={200}
                placeholder="e.g. Q1 2026 conflict-of-interest register"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-type"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Register type <span className="text-red-500">*</span>
              </label>
              <select
                id="register-type"
                value={typeValue}
                onChange={(e) => setTypeValue(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="register-type-select"
              >
                {NDIS_REGISTER_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value="other">Other (custom)</option>
              </select>
              {typeValue === 'other' && (
                <input
                  name="custom_type"
                  required
                  maxLength={100}
                  placeholder="custom_type_slug"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-code"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Code (optional)
              </label>
              <input
                id="register-code"
                name="code"
                maxLength={64}
                placeholder="Auto-derived from name if blank"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-category"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Category (optional)
              </label>
              <input
                id="register-category"
                name="category"
                maxLength={100}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-risk"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Risk level
              </label>
              <select
                id="register-risk"
                name="risk_level"
                defaultValue="low"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-description"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Description (optional)
              </label>
              <textarea
                id="register-description"
                name="description"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <SheetFooter className="border-t border-border pt-4 mt-auto">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Create register entry'
              )}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
