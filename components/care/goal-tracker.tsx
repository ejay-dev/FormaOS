'use client';

import { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Goal {
  id: string;
  goal_text: string;
  category: string;
  target_date: string | null;
  status: string;
  progress_percentage: number;
  measurement_method: string | null;
  baseline_value: string | null;
  target_value: string | null;
  current_value: string | null;
}

interface ProgressEntry {
  id: string;
  value: string;
  notes: string | null;
  recorded_at: string;
}

const CATEGORIES = [
  'daily_living',
  'social',
  'health',
  'employment',
  'education',
  'community',
  'independence',
  'safety',
] as const;

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  achieved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  partially_achieved:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  discontinued: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const progressBarColors: Record<string, string> = {
  not_started: 'bg-gray-300 dark:bg-gray-600',
  in_progress: 'bg-blue-500',
  achieved: 'bg-green-500',
  partially_achieved: 'bg-yellow-500',
  discontinued: 'bg-red-400',
};

export function GoalTracker({
  goals,
  carePlanId,
  orgId,
}: {
  goals: Goal[];
  carePlanId: string;
  orgId: string;
}) {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_text: '',
    category: 'independence',
    target_date: '',
    measurement_method: '',
    baseline_value: '',
    target_value: '',
  });

  const handleAddGoal = async () => {
    if (!newGoal.goal_text.trim()) return;
    try {
      await fetch(`/api/v1/care-plans/${carePlanId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newGoal, org_id: orgId }),
      });
      setShowAddForm(false);
      setNewGoal({
        goal_text: '',
        category: 'independence',
        target_date: '',
        measurement_method: '',
        baseline_value: '',
        target_value: '',
      });
      window.location.reload();
    } catch {}
  };

  const achievedCount = goals.filter((g) => g.status === 'achieved').length;
  const inProgressCount = goals.filter(
    (g) => g.status === 'in_progress',
  ).length;
  const avgProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + g.progress_percentage, 0) /
            goals.length,
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Goals"
          value={goals.length}
          sub={`${achievedCount} achieved`}
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          sub="active goals"
        />
        <StatCard
          label="Avg Progress"
          value={`${avgProgress}%`}
          sub="across all goals"
        />
      </div>

      {/* Goal List */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> Goals
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add Goal
          </button>
        </div>

        {showAddForm && (
          <div className="border-b border-border bg-muted/50 p-4 space-y-3">
            <input
              type="text"
              placeholder="Goal description..."
              value={newGoal.goal_text}
              onChange={(e) =>
                setNewGoal({ ...newGoal, goal_text: e.target.value })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={newGoal.category}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, category: e.target.value })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newGoal.target_date}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, target_date: e.target.value })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Target value"
                value={newGoal.target_value}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, target_value: e.target.value })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Save Goal
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {goals.map((goal) => (
            <div key={goal.id}>
              <button
                onClick={() =>
                  setExpandedGoal(expandedGoal === goal.id ? null : goal.id)
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
              >
                {expandedGoal === goal.id ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {goal.goal_text}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {goal.category.replace(/_/g, ' ')}
                    {goal.target_date &&
                      ` · Due ${new Date(goal.target_date).toLocaleDateString()}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[goal.status]}`}
                >
                  {goal.status.replace(/_/g, ' ')}
                </span>
                <div className="w-20">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressBarColors[goal.status]}`}
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-muted-foreground">
                    {goal.progress_percentage}%
                  </p>
                </div>
              </button>

              {expandedGoal === goal.id && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 pl-11">
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    {goal.measurement_method && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Measurement
                        </span>
                        <p>{goal.measurement_method}</p>
                      </div>
                    )}
                    {goal.baseline_value && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Baseline
                        </span>
                        <p>{goal.baseline_value}</p>
                      </div>
                    )}
                    {goal.target_value && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Target
                        </span>
                        <p>{goal.target_value}</p>
                      </div>
                    )}
                    {goal.current_value && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Current
                        </span>
                        <p className="flex items-center gap-1">
                          {goal.current_value}
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {goals.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No goals added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
