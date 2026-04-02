'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';

interface Visit {
  id: string;
  participant_name: string;
  worker_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  visit_type: string;
  status: string;
  location?: string;
}

const VISIT_TYPE_COLORS: Record<string, string> = {
  personal_care:
    'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300',
  community_access:
    'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300',
  therapy:
    'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300',
  group_activity:
    'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300',
  default:
    'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
};

const STATUS_DOTS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-gray-500',
};

type ViewMode = 'month' | 'week' | 'day';

export function VisitCalendar({ visits }: { visits: Visit[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Pad start
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Pad end to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const visitsByDate = useMemo(() => {
    const map: Record<string, Visit[]> = {};
    for (const v of visits) {
      const key = v.scheduled_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return map;
  }, [visits]);

  const navigate = (direction: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + direction);
    else if (viewMode === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const today = new Date().toISOString().slice(0, 10);
  const monthLabel = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-border p-1.5 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="rounded-md border border-border p-1.5 hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
          >
            Today
          </button>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm capitalize ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="border-b border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map(({ date, isCurrentMonth }, i) => {
              const key = date.toISOString().slice(0, 10);
              const dayVisits = visitsByDate[key] ?? [];
              const isToday = key === today;
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-border p-1 ${
                    !isCurrentMonth ? 'bg-muted/30' : ''
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? 'bg-primary text-primary-foreground font-bold'
                        : isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayVisits.slice(0, 3).map((v) => (
                      <VisitChip key={v.id} visit={v} compact />
                    ))}
                    {dayVisits.length > 3 && (
                      <span className="block text-xs text-muted-foreground pl-1">
                        +{dayVisits.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => {
              const key = d.toISOString().slice(0, 10);
              const dayVisits = visitsByDate[key] ?? [];
              const isToday = key === today;
              return (
                <div
                  key={key}
                  className="border-r border-border last:border-r-0"
                >
                  <div
                    className={`border-b border-border px-2 py-2 text-center ${isToday ? 'bg-primary/10' : ''}`}
                  >
                    <div className="text-xs text-muted-foreground">
                      {d.toLocaleDateString('default', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="min-h-[300px] p-1 space-y-1">
                    {dayVisits.map((v) => (
                      <VisitChip key={v.id} visit={v} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">
              {currentDate.toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {(visitsByDate[currentDate.toISOString().slice(0, 10)] ?? []).map(
              (v) => (
                <div key={v.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${STATUS_DOTS[v.status] ?? STATUS_DOTS.scheduled}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{v.participant_name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {v.start_time} – {v.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {v.worker_name}
                      </span>
                      {v.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {v.location}
                        </span>
                      )}
                    </div>
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize border">
                      {v.visit_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`mt-1 rounded-full px-2 py-0.5 text-xs capitalize ${
                      v.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : v.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {v.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ),
            )}
            {(visitsByDate[currentDate.toISOString().slice(0, 10)] ?? [])
              .length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No visits scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VisitChip({ visit, compact }: { visit: Visit; compact?: boolean }) {
  const color =
    VISIT_TYPE_COLORS[visit.visit_type] ?? VISIT_TYPE_COLORS.default;
  return (
    <div className={`rounded border px-1.5 py-0.5 text-xs truncate ${color}`}>
      {compact ? (
        <span>
          {visit.start_time} {visit.participant_name}
        </span>
      ) : (
        <div>
          <div className="font-medium truncate">{visit.participant_name}</div>
          <div className="text-[10px] opacity-80">
            {visit.start_time}–{visit.end_time} · {visit.worker_name}
          </div>
        </div>
      )}
    </div>
  );
}
