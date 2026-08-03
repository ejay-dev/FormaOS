import Link from 'next/link';
import { Calendar, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskView = 'list' | 'board' | 'calendar';

/**
 * One switcher for all three task views. Labels match the Tasks children in
 * the sidebar so the same view is never called two different things.
 */
const VIEWS: { key: TaskView; label: string; href: string; icon: typeof List }[] =
  [
    { key: 'list', label: 'List', href: '/app/tasks', icon: List },
    { key: 'board', label: 'Board', href: '/app/tasks/board', icon: LayoutGrid },
    {
      key: 'calendar',
      label: 'Calendar',
      href: '/app/tasks/calendar',
      icon: Calendar,
    },
  ];

export function TaskViewSwitcher({ current }: { current: TaskView }) {
  return (
    <nav aria-label="Task views" className="flex items-center gap-2">
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isCurrent = view.key === current;
        const className = cn(
          'inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          isCurrent
            ? 'bg-primary text-[hsl(var(--primary-foreground))]'
            : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
        );

        if (isCurrent) {
          return (
            <span key={view.key} aria-current="page" className={className}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {view.label}
            </span>
          );
        }

        return (
          <Link key={view.key} href={view.href} className={className}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
