'use client';

// Audit Sprint 7c (2026-05-24): migrated from ad-hoc `fixed inset-0` modal
// with cyan/indigo gradient header + rounded-[2rem] surface to the shared
// Dialog primitive. Gains focus trap, ESC, aria-modal, scroll lock. Cyan
// gradient stripped per the stored enterprise-aesthetic preference.

import { useEffect, useState } from 'react';
import { addTrainingRecord } from '@/app/app/actions/registers';
import { GraduationCap, Loader2, CheckCircle2 } from 'lucide-react';
import { useComplianceAction } from '@/components/compliance-system';
import {
  getOrgMemberIdentities,
  type MemberIdentityMap,
} from '@/lib/team/member-identity';
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
  /** `name` is optional: when the caller has not resolved it, the modal looks it up. */
  members: { user_id: string; name?: string | null }[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [identities, setIdentities] = useState<MemberIdentityMap>({});

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const { evidenceAdded, reportError } = useComplianceAction();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getOrgMemberIdentities()
      .then((map) => {
        if (!cancelled) setIdentities(map);
      })
      .catch(() => {
        // Names are a display nicety; the picker still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function memberLabel(member: { user_id: string; name?: string | null }) {
    return (
      member.name?.trim() ||
      identities[member.user_id]?.name ||
      'Unnamed member'
    );
  }

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
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Record certification
          </DialogTitle>
          <DialogDescription>
            Add a training record to the staff register.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <div>
              <p className="font-semibold text-foreground">Record logged</p>
              <p className="text-sm text-muted-foreground">
                The staff register has been updated.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {validationError}
              </div>
            ) : null}

            <label className="block text-sm">
              <span className="block text-sm font-medium text-foreground">
                Staff member
              </span>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
              >
                <option value="">Select staff member</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {memberLabel(m)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="block text-sm font-medium text-foreground">
                Certification title
              </span>
              <input
                required
                placeholder="e.g. NDIS Worker Screening Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="block text-sm font-medium text-foreground">
                  Completed on
                </span>
                <input
                  required
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-sm font-medium text-foreground">
                  Expires on (optional)
                </span>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                />
              </label>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save record'
                )}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
