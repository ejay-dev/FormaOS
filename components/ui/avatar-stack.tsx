'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type AvatarTone =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'violet'
  | 'cyan';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, { box: string; text: string }> = {
  xs: { box: 'h-5 w-5', text: 'text-[9px]' },
  sm: { box: 'h-6 w-6', text: 'text-[10px]' },
  md: { box: 'h-8 w-8', text: 'text-xs' },
  lg: { box: 'h-10 w-10', text: 'text-sm' },
};

const toneBg: Record<AvatarTone, string> = {
  blue: 'bg-[hsl(var(--app-primary))]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
};

export interface AvatarProps {
  name: string;
  src?: string | null;
  initials?: string;
  size?: Size;
  tone?: AvatarTone;
  className?: string;
  title?: string;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFromName(name: string): AvatarTone {
  const tones: AvatarTone[] = [
    'blue',
    'emerald',
    'amber',
    'rose',
    'slate',
    'violet',
    'cyan',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i += 1)
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

export function Avatar({
  name,
  src,
  initials,
  size = 'sm',
  tone,
  className,
  title,
}: AvatarProps) {
  const s = sizeMap[size];
  const resolvedTone = tone ?? toneFromName(name);
  const resolvedInitials = initials ?? initialsFrom(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        title={title ?? name}
        className={cn(
          'inline-block rounded-full object-cover ring-2 ring-[hsl(var(--card))]',
          s.box,
          className,
        )}
      />
    );
  }

  return (
    <span
      title={title ?? name}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-[hsl(var(--card))]',
        s.box,
        s.text,
        toneBg[resolvedTone],
        className,
      )}
      aria-label={name}
    >
      {resolvedInitials}
    </span>
  );
}

export interface AvatarStackProps {
  people: AvatarProps[];
  max?: number;
  size?: Size;
  className?: string;
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
  className,
}: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  const s = sizeMap[size];

  return (
    <div className={cn('flex -space-x-1.5', className)}>
      {visible.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} {...p} size={size} />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-[hsl(var(--muted))] font-semibold text-muted-foreground ring-2 ring-[hsl(var(--card))]',
            s.box,
            s.text,
          )}
          title={`+${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export interface OwnerChipProps {
  person: AvatarProps;
  href?: string;
  onClick?: () => void;
  subtle?: boolean;
  className?: string;
}

export function OwnerChip({
  person,
  href,
  onClick,
  subtle,
  className,
}: OwnerChipProps) {
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium transition-colors',
        subtle
          ? 'text-muted-foreground hover:text-foreground'
          : 'border border-border bg-[hsl(var(--card))] text-foreground hover:border-[hsl(var(--app-primary))]/40',
        className,
      )}
    >
      <Avatar
        name={person.name}
        src={person.src}
        initials={person.initials}
        tone={person.tone}
        size="xs"
      />
      <span className="truncate">{person.name}</span>
    </span>
  );

  if (href) return <Link href={href}>{content}</Link>;
  if (onClick)
    return (
      <button type="button" onClick={onClick}>
        {content}
      </button>
    );
  return content;
}
