'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { updateMemberRole } from '@/app/app/actions/team';

type RoleOption = 'owner' | 'admin' | 'member' | 'viewer';

const ROLE_OPTIONS: RoleOption[] = ['owner', 'admin', 'member', 'viewer'];

const ROLE_LABEL: Record<RoleOption, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_PILL_CLASS: Record<RoleOption, string> = {
  owner: 'status-pill status-pill-amber',
  admin: 'status-pill status-pill-blue',
  member: 'status-pill status-pill-blue',
  viewer: 'status-pill status-pill-blue',
};

function normalize(value: string | null | undefined): RoleOption {
  const v = String(value ?? '').toLowerCase();
  if (v === 'owner' || v === 'admin' || v === 'member' || v === 'viewer') {
    return v;
  }
  return 'member';
}

export function RoleCell({
  targetUserId,
  currentRole,
  isActorOwner,
  isSelf,
  editable,
}: {
  targetUserId: string;
  currentRole: string | null;
  // Owner-involving transitions (target is owner OR new role is owner)
  // require the actor to be an owner. Non-owners get a read-only pill in
  // those cases — the dropdown is suppressed at the option level too.
  isActorOwner: boolean;
  isSelf: boolean;
  // Falls back to a static pill when the actor lacks MANAGE_USERS.
  editable: boolean;
}) {
  const normalized = normalize(currentRole);
  const [role, setRole] = useState<RoleOption>(normalized);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Reconcile local state if a server revalidation changes the prop.
  useEffect(() => {
    setRole(normalize(currentRole));
  }, [currentRole]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!editable) {
    return (
      <span className={ROLE_PILL_CLASS[role]}>{ROLE_LABEL[role]}</span>
    );
  }

  function handleChoose(next: RoleOption) {
    setOpen(false);
    setError(null);

    if (next === role) return;

    const ownerInvolved = role === 'owner' || next === 'owner';
    if (ownerInvolved) {
      const verb = next === 'owner' ? 'promote to owner' : 'demote from owner';
      const ok = window.confirm(
        `Are you sure you want to ${verb}? Owner is the highest role and these changes are not casual. The org's audit log will record the change.`,
      );
      if (!ok) return;
    }

    // Optimistic update, rolled back if the server action returns an error.
    const previous = role;
    setRole(next);

    startTransition(async () => {
      try {
        const result = await updateMemberRole(targetUserId, next);
        if (!result.success) {
          setRole(previous);
          setError(result.error);
        }
      } catch (err) {
        setRole(previous);
        setError(
          err instanceof Error ? err.message : 'Failed to update role.',
        );
      }
    });
  }

  // Owner-involving options are hidden from non-owner actors so a misclick
  // doesn't trigger an error message — defense in depth alongside the
  // server-side check.
  const visibleOptions = ROLE_OPTIONS.filter((opt) => {
    if (!isActorOwner) {
      if (role === 'owner') return false; // can't edit owners at all
      if (opt === 'owner') return false; // can't promote to owner
    }
    return true;
  });

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change role for member. Current role: ${ROLE_LABEL[role]}.`}
        className={`${ROLE_PILL_CLASS[role]} inline-flex items-center gap-1 cursor-pointer disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full`}
      >
        <span>{ROLE_LABEL[role]}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-card-foreground/10"
        >
          {visibleOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              role="menuitemradio"
              aria-checked={opt === role}
              onClick={() => handleChoose(opt)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                opt === role ? 'font-semibold text-foreground' : 'text-foreground/85'
              }`}
            >
              <span>{ROLE_LABEL[opt]}</span>
              {opt === role && (
                <span className="text-xs text-muted-foreground">current</span>
              )}
            </button>
          ))}
          {isSelf && (
            <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Self
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="absolute left-0 top-full mt-1 whitespace-nowrap rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
