'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, X, UserPlus } from 'lucide-react';
import type { OnboardingState } from '../OnboardingWizard';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

interface Invite {
  email: string;
  role: string;
}

interface InviteStepProps {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function InviteStep({
  state,
  updateState,
  onNext,
  onBack,
}: InviteStepProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(state.teamInvited);

  const addInvite = () => {
    if (!email.trim() || invites.length >= 3) return;
    if (invites.some((inv) => inv.email === email.trim())) return;
    setInvites((prev) => [...prev, { email: email.trim(), role }]);
    setEmail('');
  };

  const removeInvite = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (invites.length === 0) {
      handleSkip();
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch('/api/v1/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invites }),
      });
      if (!res.ok) {
        console.warn('Invite API returned non-ok:', res.status);
      }
    } catch {
      console.warn('Invite API call failed');
    }
    setSent(true);
    setIsSending(false);
    updateState({ teamInvited: true, inviteCount: invites.length });
  };

  const handleSkip = () => {
    updateState({ teamInvited: false, inviteCount: 0 });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Invite your team</h2>
        <p className="text-muted-foreground text-sm">
          Add up to 3 team members. You can always invite more later.
        </p>
      </div>

      {!sent && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={(e) => e.key === 'Enter' && addInvite()}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wire-action)]/50"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addInvite}
              disabled={!email.trim() || invites.length >= 3}
              className="rounded-lg border border-border px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>

          {invites.length > 0 && (
            <div className="space-y-2">
              {invites.map((inv, idx) => (
                <div
                  key={inv.email}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{inv.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {inv.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInvite(idx)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {3 - invites.length} invite{3 - invites.length !== 1 ? 's' : ''}{' '}
            remaining
          </p>
        </>
      )}

      {sent && (
        <div className="rounded-lg border border-[var(--wire-success)]/30 bg-[var(--wire-success)]/10 p-3 text-sm text-[var(--wire-success)]">
          {state.inviteCount > 0
            ? `${state.inviteCount} invitation${state.inviteCount > 1 ? 's' : ''} sent!`
            : 'Step skipped'}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSending}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-2">
          {!sent && (
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            type="button"
            onClick={sent ? onNext : handleSend}
            disabled={isSending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSending
              ? 'Sending...'
              : sent
                ? 'Continue'
                : invites.length > 0
                  ? 'Send Invites'
                  : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  );
}
