'use client';

import { useState } from 'react';
import {
  X,
  Clock,
  Link2,
  MessageSquare,
  Play,
  Square,
  Plus,
  Trash2,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  priority: string;
  due_date?: string;
  status: string;
}

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  note?: string;
}

interface Dependency {
  id: string;
  depends_on_task_id: string;
  dependency_type: string;
  task_title?: string;
}

interface Props {
  task: Task;
  comments: Comment[];
  timeEntries: TimeEntry[];
  dependencies: Dependency[];
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  onAddComment: (taskId: string, body: string) => void;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export function TaskDetailPanel({
  task,
  comments,
  timeEntries,
  dependencies,
  onClose,
  onUpdate,
  onAddComment,
}: Props) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || '',
  );
  const [newComment, setNewComment] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'time'>(
    'details',
  );

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, description: editDescription });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment);
    setNewComment('');
  };

  const totalMinutes = timeEntries.reduce(
    (s, e) => s + (e.duration_minutes || 0),
    0,
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {task.title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['details', 'comments', 'time'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-xs font-medium capitalize ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'details' && (
          <>
            <div>
              <label
                htmlFor="task-detail-title"
                className="text-xs text-muted-foreground"
              >
                Title
              </label>
              <input
                id="task-detail-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                className="w-full mt-1 px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="task-detail-description"
                className="text-xs text-muted-foreground"
              >
                Description
              </label>
              <textarea
                id="task-detail-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="w-full mt-1 px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="task-detail-status"
                  className="text-xs text-muted-foreground"
                >
                  Status
                </label>
                <select
                  id="task-detail-status"
                  value={task.status}
                  onChange={(e) =>
                    onUpdate(task.id, { status: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-background border border-border rounded text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="task-detail-priority"
                  className="text-xs text-muted-foreground"
                >
                  Priority
                </label>
                <select
                  id="task-detail-priority"
                  value={task.priority}
                  onChange={(e) =>
                    onUpdate(task.id, { priority: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-background border border-border rounded text-foreground"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="task-detail-due-date"
                className="text-xs text-muted-foreground"
              >
                Due Date
              </label>
              <input
                id="task-detail-due-date"
                type="date"
                value={task.due_date ? task.due_date.slice(0, 10) : ''}
                onChange={(e) =>
                  onUpdate(task.id, { due_date: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground"
              />
            </div>

            {/* Dependencies */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Dependencies ({dependencies.length})
                </span>
              </div>
              {dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between py-1 text-xs"
                >
                  <span className="text-foreground">
                    {dep.task_title || dep.depends_on_task_id.slice(0, 8)}
                  </span>
                  <span className="text-muted-foreground">
                    {dep.dependency_type}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'comments' && (
          <>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-2 rounded bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {c.user_id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                aria-label="Add a comment"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
              >
                Send
              </button>
            </div>
          </>
        )}

        {activeTab === 'time' && (
          <>
            <div className="flex items-center justify-between p-3 rounded bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Total Time</p>
                <p className="text-lg font-bold text-foreground">
                  {hours}h {mins}m
                </p>
              </div>
              <button
                onClick={() => setIsTracking(!isTracking)}
                aria-label={
                  isTracking ? 'Stop time tracking' : 'Start time tracking'
                }
                className={`p-2 rounded ${isTracking ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}
              >
                {isTracking ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-border"
                >
                  <span className="text-foreground">
                    {new Date(entry.started_at).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    {entry.duration_minutes || 0}m
                  </span>
                  {entry.note && (
                    <span className="text-muted-foreground truncate max-w-[100px]">
                      {entry.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
