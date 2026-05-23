'use client';

// Audit Sprint 7c (2026-05-24): migrated from ad-hoc `fixed inset-0` modal
// with cyan/indigo gradient header + rounded-[2rem] surface to the shared
// Dialog primitive. Gains focus trap, ESC, aria-modal, scroll lock. Cyan
// gradient stripped per the stored enterprise-aesthetic preference.

import { useState } from 'react';
import { addTrainingRecord } from '@/app/app/actions/registers';
import { GraduationCap, Loader2, CheckCircle2 } from 'lucide-react';
import { useComplianceAction } from '@/components/compliance-system';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const certificationSchema = z.object({
  userId: z.string().min(1, 'Please select a staff member'),
  title: z
    .string()
    .min(1, 'Certification title is required')
    .max(300, 'Title must be under 300 characters'),
  completionDate: z.string().min(1, 'Completion date is required'),
  expiryDate: z.string().optional(),
});

export function AddCertificationModal({
  isOpen,
  onClose,
  members,
}: {
  isOpen: boolean;
  onClose: () => void;
  members: { user_id: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const { evidenceAdded, reportError } = useComplianceAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const parsed = certificationSchema.safeParse({
      userId,
      title,
      completionDate,
      expiryDate: expiryDate || undefined,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    try {
      await addTrainingRecord({
        userId,
        trainingTitle: title,
        completionDate,
        expiryDate: expiryDate || undefined,
      });

      evidenceAdded(title);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: unknown) {
      reportError({
        title: 'Certification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-slate-400" />
            Record certification
          </DialogTitle>
          <DialogDescription>
            Add a training record to the staff register.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-100">Record logged</p>
              <p className="text-sm text-slate-400">
                Staff register has been updated.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError ? (
              <div className="rounded-md border border-red-700/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {validationError}
              </div>
            ) : null}

            <label className="block text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Personnel
              </span>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Select staff member</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    Member ID: {m.user_id.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Certification title
              </span>
              <input
                required
                placeholder="e.g. NDIS Worker Screening Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Completion
                </span>
                <input
                  required
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Expiry (optional)
                </span>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify & log record'
                )}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
