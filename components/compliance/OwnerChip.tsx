'use client';

import { AlertTriangle } from 'lucide-react';

interface OwnerChipProps {
  name: string | null | undefined;
  avatarUrl?: string | null;
  /** Optional team/department label */
  team?: string | null;
  /** Size variant */
  size?: 'sm' | 'md';
}

/** Color palette for avatar backgrounds based on name hash */
const AVATAR_COLORS = [
  'bg-cyan-500/20 text-cyan-300',
  'bg-violet-500/20 text-violet-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
  'bg-sky-500/20 text-sky-300',
  'bg-fuchsia-500/20 text-fuchsia-300',
  'bg-teal-500/20 text-teal-300',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Owner chip with avatar + name. Shows red "Unowned" warning if no owner assigned.
 * Used across obligations, incidents, tasks, and other compliance artifacts.
 */
export function OwnerChip({
  name,
  avatarUrl,
  team,
  size = 'sm',
}: OwnerChipProps) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-1.5 text-rose-400">
        <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        <span
          className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        >
          Unowned
        </span>
      </span>
    );
  }

  const initials = getInitials(name);
  const colorClass = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  const avatarSize = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <span className="inline-flex items-center gap-1.5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${avatarSize} rounded-full object-cover ring-1 ring-white/10`}
        />
      ) : (
        <span
          className={`${avatarSize} rounded-full flex items-center justify-center font-bold ${colorClass}`}
        >
          {initials}
        </span>
      )}
      <span
        className={`font-medium text-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {name}
      </span>
      {team && (
        <span className="text-[10px] text-muted-foreground">{team}</span>
      )}
    </span>
  );
}
