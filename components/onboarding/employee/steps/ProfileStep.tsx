'use client';

import { ArrowLeft, User, Phone, Loader2, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

interface ProfileStepProps {
  displayName: string;
  phone: string;
  errorCode: string | null;
  saveProfileAction: (formData: FormData) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}

export function ProfileStep({
  displayName,
  phone,
  errorCode,
  saveProfileAction,
  onBack,
  onSkip,
}: ProfileStepProps) {
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await saveProfileAction(formData);
    } finally {
      setPending(false);
    }
  }

  const nameError = errorCode === 'name_required';
  const saveError = errorCode === 'save_failed';

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
          <User className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Almost there
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 leading-tight">
          Set up your profile.
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your name appears in progress notes, task assignments, and audit logs.
          Phone is optional — it helps your coordinator reach you directly.
        </p>
      </div>

      {/* Error banner */}
      {saveError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Something went wrong saving your profile. Please try again.
        </div>
      )}

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Display name */}
        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Display name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={displayName}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="Your full name"
              className={[
                'w-full rounded-xl border bg-surface-1 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600',
                'outline-none transition-all duration-150',
                'focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15',
                nameError
                  ? 'border-red-500/60 focus:border-red-500/60'
                  : 'border-edge-2 hover:border-slate-600',
              ].join(' ')}
            />
          </div>
          {nameError && (
            <p className="text-xs text-red-400">
              Please enter your display name.
            </p>
          )}
        </div>

        {/* Phone — optional */}
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Phone
            <span className="text-[9px] font-medium normal-case tracking-normal text-slate-600">
              Optional
            </span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={phone}
              maxLength={20}
              autoComplete="tel"
              placeholder="Mobile or work number"
              className="w-full rounded-xl border border-edge-2 bg-surface-1 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-150 hover:border-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={pending}
            className="flex items-center gap-2 rounded-2xl border border-edge-2 bg-surface-1 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={pending}
            className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Save &amp; continue
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Skip link */}
      <button
        type="button"
        onClick={onSkip}
        disabled={pending}
        className="text-xs text-slate-500 underline-offset-2 hover:text-slate-400 hover:underline disabled:opacity-50 mx-auto block"
      >
        Skip this step
      </button>
    </div>
  );
}
