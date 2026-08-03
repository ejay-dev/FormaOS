'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toaster';
import {
  claimAttestation,
  reviewAttestation,
} from '@/app/app/actions/compliance-attestations';
import type {
  AttestationRow,
  ControlNeedingAttestation,
} from '@/lib/compliance/attestations';

// Audit Sprint 6c (2026-05-23): client-side surface for the three
// attestation buckets. Built on the Sprint 4c primitives (Dialog,
// AlertDialog, Toaster).
//
// Buckets:
//   - awaiting: latestAttestation === null OR status === 'rejected'
//   - inReview: status === 'claimed'   (someone else needs to approve)
//   - reviewed: status === 'reviewed'  (done)

type Bucket = 'awaiting' | 'inReview' | 'reviewed';

function bucketOf(c: ControlNeedingAttestation): Bucket {
  if (!c.latestAttestation) return 'awaiting';
  if (c.latestAttestation.status === 'claimed') return 'inReview';
  if (c.latestAttestation.status === 'reviewed') return 'reviewed';
  return 'awaiting'; // rejected → back to awaiting
}

export interface EvidenceOption {
  id: string;
  label: string;
  uploadedAt: string | null;
}

interface Props {
  currentUserId: string;
  controls: ControlNeedingAttestation[];
  evidenceOptions: EvidenceOption[];
}

export function AttestationsClient({
  currentUserId,
  controls,
  evidenceOptions,
}: Props) {
  const [tab, setTab] = useState<Bucket>('awaiting');

  const grouped = useMemo(() => {
    const out: Record<Bucket, ControlNeedingAttestation[]> = {
      awaiting: [],
      inReview: [],
      reviewed: [],
    };
    for (const c of controls) out[bucketOf(c)].push(c);
    return out;
  }, [controls]);

  const [claimTarget, setClaimTarget] =
    useState<ControlNeedingAttestation | null>(null);
  const [reviewTarget, setReviewTarget] =
    useState<ControlNeedingAttestation | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AttestationRow | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manual attestations</h1>
          <p className="page-description">
            Controls whose evaluator requires a human sign-off. Attach
            evidence, someone else reviews, the chain records both halves.
          </p>
        </div>
      </div>

      <div className="page-content space-y-4">
      <nav className="flex border-b border-border">
        {(
          [
            ['awaiting', 'Awaiting attestation', grouped.awaiting.length],
            ['inReview', 'Awaiting review', grouped.inReview.length],
            ['reviewed', 'Reviewed', grouped.reviewed.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}{' '}
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
              {count}
            </span>
          </button>
        ))}
      </nav>

      <div className="space-y-3">
        {grouped[tab].length === 0 ? (
          <EmptyState bucket={tab} />
        ) : (
          grouped[tab].map((c) => (
            <ControlCard
              key={`${c.frameworkId}|${c.controlKey}`}
              control={c}
              currentUserId={currentUserId}
              onClaim={() => setClaimTarget(c)}
              onReview={() => setReviewTarget(c)}
            />
          ))
        )}
      </div>

      {claimTarget ? (
        <ClaimDialog
          control={claimTarget}
          evidenceOptions={evidenceOptions}
          onClose={() => setClaimTarget(null)}
        />
      ) : null}

      {reviewTarget?.latestAttestation ? (
        <ReviewDialog
          control={reviewTarget}
          attestation={reviewTarget.latestAttestation}
          currentUserId={currentUserId}
          evidenceOptions={evidenceOptions}
          onClose={() => setReviewTarget(null)}
          onReject={() => {
            const att = reviewTarget.latestAttestation;
            setReviewTarget(null);
            if (att) setRejectTarget(att);
          }}
        />
      ) : null}

      {rejectTarget ? (
        <RejectDialog
          attestation={rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      ) : null}
      </div>
    </div>
  );
}

function EmptyState({ bucket }: { bucket: Bucket }) {
  const copy = {
    awaiting: {
      icon: ClipboardCheck,
      title: 'Nothing waiting on a claim',
      body: 'Every control that needs a manual attestation has been claimed or reviewed.',
    },
    inReview: {
      icon: Clock,
      title: 'No attestations awaiting review',
      body: 'When a teammate claims a control, it will appear here for someone else to approve.',
    },
    reviewed: {
      icon: CheckCircle2,
      title: 'Nothing reviewed yet',
      body: 'Once a reviewer approves a claim, it lands here as a complete attestation.',
    },
  }[bucket];
  const Icon = copy.icon;
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium text-card-foreground">{copy.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy.body}</p>
    </div>
  );
}

function ControlCard({
  control,
  currentUserId,
  onClaim,
  onReview,
}: {
  control: ControlNeedingAttestation;
  currentUserId: string;
  onClaim: () => void;
  onReview: () => void;
}) {
  const att = control.latestAttestation;
  const showReview = att?.status === 'claimed' && att.claimedBy !== currentUserId;
  const showClaim = !att || att.status === 'rejected';
  const isOwnClaim = att?.status === 'claimed' && att.claimedBy === currentUserId;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {control.frameworkName ?? 'Framework'}
            </span>
            <span className="text-sm font-medium text-foreground">
              {control.controlKey}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{control.message}</p>
          {att ? (
            <AttestationStatusLine attestation={att} />
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {showClaim ? (
            <button
              onClick={onClaim}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Claim attestation
            </button>
          ) : null}
          {showReview ? (
            <button
              onClick={onReview}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Review
            </button>
          ) : null}
          {isOwnClaim ? (
            <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
              Awaiting another reviewer
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AttestationStatusLine({ attestation }: { attestation: AttestationRow }) {
  if (attestation.status === 'claimed') {
    return (
      <p className="text-xs text-muted-foreground">
        Claimed {new Date(attestation.claimedAt).toLocaleDateString()}.
        Awaiting review.
      </p>
    );
  }
  if (attestation.status === 'reviewed') {
    return (
      <p className="text-xs text-success">
        Reviewed {new Date(attestation.reviewedAt ?? '').toLocaleDateString()}.
      </p>
    );
  }
  if (attestation.status === 'rejected') {
    return (
      <p className="text-xs text-warning">
        Rejected: {attestation.rejectedReason ?? 'no reason given'}. Re-claim
        with updated evidence.
      </p>
    );
  }
  return null;
}

function ClaimDialog({
  control,
  evidenceOptions,
  onClose,
}: {
  control: ControlNeedingAttestation;
  evidenceOptions: EvidenceOption[];
  onClose: () => void;
}) {
  const [evidenceId, setEvidenceId] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, start] = useTransition();
  const valid = evidenceId.trim().length > 0;

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool = query
      ? evidenceOptions.filter((option) =>
          option.label.toLowerCase().includes(query),
        )
      : evidenceOptions;
    return pool.slice(0, 12);
  }, [evidenceOptions, search]);

  function submit() {
    if (!valid) return;
    start(async () => {
      const result = await claimAttestation({
        frameworkId: control.frameworkId,
        controlKey: control.controlKey,
        evidenceId: evidenceId.trim(),
        notes: notes.trim() || undefined,
      });
      if ('success' in result && result.success) {
        toast.success(`Claimed attestation for ${control.controlKey}.`);
        onClose();
      } else {
        toast.error(
          'error' in result ? result.error : 'Failed to claim attestation.',
        );
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim attestation: {control.controlKey}</DialogTitle>
          <DialogDescription>
            {control.message}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="attestation-evidence-search"
              className="block text-sm text-muted-foreground"
            >
              Evidence from the vault
            </label>
            {evidenceOptions.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                Your vault is empty. Upload the supporting document first, then
                come back to claim this control.
              </p>
            ) : (
              <>
                <input
                  id="attestation-evidence-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by artifact name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <ul className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                  {matches.length === 0 ? (
                    <li className="px-2 py-3 text-xs text-muted-foreground">
                      Nothing in the vault matches that name.
                    </li>
                  ) : (
                    matches.map((option) => {
                      const selected = option.id === evidenceId;
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => setEvidenceId(option.id)}
                            aria-pressed={selected}
                            className={`flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left text-sm transition-colors ${
                              selected
                                ? 'bg-primary/10 text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <span className="min-w-0 truncate">
                              {option.label}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {option.uploadedAt
                                ? new Date(
                                    option.uploadedAt,
                                  ).toLocaleDateString()
                                : ''}
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {valid
                    ? 'Selected. The reviewer sees this artifact by name.'
                    : 'Pick the artifact that proves this control.'}
                </p>
              </>
            )}
          </div>
          <label className="block text-sm">
            <span className="text-muted-foreground">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Anything the reviewer needs to know."
            />
          </label>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || pending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Claiming…' : 'Claim'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  control,
  attestation,
  currentUserId,
  evidenceOptions,
  onClose,
  onReject,
}: {
  control: ControlNeedingAttestation;
  attestation: AttestationRow;
  currentUserId: string;
  evidenceOptions: EvidenceOption[];
  onClose: () => void;
  onReject: () => void;
}) {
  const [pending, start] = useTransition();
  const isOwn = attestation.claimedBy === currentUserId;
  const evidenceLabel =
    evidenceOptions.find((option) => option.id === attestation.evidenceId)
      ?.label ?? 'Artifact no longer in the vault';

  function approve() {
    start(async () => {
      const result = await reviewAttestation({
        attestationId: attestation.id,
        decision: 'approve',
      });
      if ('success' in result && result.success) {
        toast.success(`Approved attestation for ${control.controlKey}.`);
        onClose();
      } else {
        toast.error(
          'error' in result ? result.error : 'Failed to approve attestation.',
        );
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review attestation: {control.controlKey}</DialogTitle>
          <DialogDescription>{control.message}</DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Evidence</dt>
            <dd className="text-foreground">{evidenceLabel}</dd>
          </div>
          {attestation.notes ? (
            <div>
              <dt className="text-xs text-muted-foreground">Claimer notes</dt>
              <dd className="whitespace-pre-wrap text-foreground">
                {attestation.notes}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-muted-foreground">Claimed</dt>
            <dd className="text-foreground">
              {new Date(attestation.claimedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
        {isOwn ? (
          <p className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
            <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
            You claimed this attestation — a different user must review it
            (separation of duties).
          </p>
        ) : null}
        <DialogFooter>
          <button
            onClick={onReject}
            disabled={pending || isOwn}
            className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
          >
            Close
          </button>
          <button
            onClick={approve}
            disabled={pending || isOwn}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'Approving…' : 'Approve'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  attestation,
  onClose,
}: {
  attestation: AttestationRow;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const valid = reason.trim().length > 0;

  function submit() {
    if (!valid) return;
    start(async () => {
      const result = await reviewAttestation({
        attestationId: attestation.id,
        decision: 'reject',
        rejectedReason: reason.trim(),
      });
      if ('success' in result && result.success) {
        toast.success('Attestation rejected.');
        onClose();
      } else {
        toast.error(
          'error' in result ? result.error : 'Failed to reject attestation.',
        );
      }
    });
  }

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject this attestation?</AlertDialogTitle>
          <AlertDialogDescription>
            The claimer will need to re-attest with updated evidence. Provide a
            short reason so they know what to fix.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Why is this attestation insufficient?"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={submit} disabled={!valid || pending}>
            {pending ? 'Rejecting…' : 'Reject attestation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
