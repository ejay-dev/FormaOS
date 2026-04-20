'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  FileCheck,
  HeartPulse,
  BadgeCheck,
  Stethoscope,
  ClipboardList,
  ShieldAlert,
  Search,
  Upload,
  ListChecks,
  UserPlus,
  FileDown,
  type LucideIcon,
} from 'lucide-react';

interface Tile {
  label: string;
  href: string;
  icon: LucideIcon;
}

const SHARED_TILES: Tile[] = [
  { label: 'Report an incident', href: '/app/incidents/new', icon: AlertTriangle },
  { label: 'Log evidence', href: '/app/evidence', icon: FileCheck },
];

const INDUSTRY_TILES: Record<string, Tile[]> = {
  aged_care: [
    ...SHARED_TILES,
    { label: 'Update a care plan', href: '/app/care-plans', icon: HeartPulse },
    { label: 'Renew a credential', href: '/app/staff-compliance', icon: BadgeCheck },
  ],
  childcare: [
    ...SHARED_TILES,
    { label: 'Update a care plan', href: '/app/care-plans', icon: HeartPulse },
    { label: 'Renew a credential', href: '/app/staff-compliance', icon: BadgeCheck },
  ],
  healthcare: [
    ...SHARED_TILES,
    { label: 'Log a clinical incident', href: '/app/incidents/new', icon: Stethoscope },
    { label: 'Handover brief', href: '/app/reports/custom', icon: ClipboardList },
  ],
  financial_services: [
    ...SHARED_TILES,
    { label: 'Report a breach', href: '/app/registers', icon: ShieldAlert },
    { label: 'Run AML check', href: '/app/compliance', icon: Search },
  ],
};

const UNIVERSAL_TILES: Tile[] = [
  { label: 'Upload evidence', href: '/app/evidence', icon: Upload },
  { label: 'Add a task', href: '/app/tasks', icon: ListChecks },
  { label: 'Invite a teammate', href: '/app/settings/team', icon: UserPlus },
  { label: 'Export audit log', href: '/app/reports/custom', icon: FileDown },
];

export function QuickActionTiles({
  industry,
}: {
  industry?: string | null;
}) {
  const tiles =
    (industry && INDUSTRY_TILES[industry]) || UNIVERSAL_TILES;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
      {tiles.map((tile) => (
        <Link
          key={tile.href + tile.label}
          href={tile.href}
          className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-3 py-4 text-center transition-colors hover:border-[var(--wire-action)]/40 hover:bg-surface-1"
        >
          <tile.icon className="h-5 w-5 text-muted-foreground group-hover:text-[var(--wire-action)] transition-colors" />
          <span className="text-xs font-medium leading-tight">
            {tile.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
