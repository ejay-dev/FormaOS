import 'server-only';

/**
 * Trigger.dev was removed in High-16 (PR #22) — the SDK was unwired,
 * project ref defaulted to a literal placeholder, and no Vercel cron
 * dispatched to it. This file used to re-export `tasks.trigger` from
 * `@trigger.dev/sdk`; we keep the function signature here so existing
 * callers (lib/automation/*, lib/export/*, lib/webhooks/*, etc.) keep
 * compiling, but the function is now a no-op that returns `false`.
 *
 * Caller contract: `triggerTaskIfConfigured` returns true when a task
 * was successfully enqueued, false otherwise. Callers already treat
 * `false` as the fall-through-to-inline path, so this stub is
 * behaviour-preserving for the existing call graph.
 *
 * If a future iteration adds a real background queue (pg-boss, BullMQ,
 * Trigger.dev v2, etc.) it should replace this file.
 */

type TriggerTaskId =
  | 'report-export-job'
  | 'compliance-export-job'
  | 'enterprise-export-job'
  | 'queue-process-batch'
  | 'notification-digest'
  | 'webhook-delivery'
  | 'execute-workflow'
  | 'resume-workflow-after-delay'
  | 'resume-workflow-after-approval'
  | 'workflow-timeout-check';

export function isTriggerConfigured(): boolean {
  // Trigger.dev was removed. This always returns false so callers fall
  // through to their inline path. Kept as a function (not a constant)
  // so a future re-introduction can flip the return without changing
  // every call site.
  return false;
}

export async function triggerTaskIfConfigured(
  _id: TriggerTaskId,
  _payload: Record<string, unknown>,
  _options?: {
    queue?: string;
    idempotencyKey?: string | string[];
    tags?: string[];
    delay?: string | Date;
  },
): Promise<boolean> {
  return false;
}
