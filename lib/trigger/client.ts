import 'server-only';

import { tasks } from '@trigger.dev/sdk';

type TriggerTaskId =
  | 'report-export-job'
  | 'compliance-export-job'
  | 'enterprise-export-job'
  | 'queue-process-batch';

export function isTriggerConfigured(): boolean {
  return Boolean(
    process.env.TRIGGER_SECRET_KEY?.trim() &&
      process.env.TRIGGER_PROJECT_REF?.trim(),
  );
}

function isTriggerExecutionEnabled(): boolean {
  if (!isTriggerConfigured()) {
    return false;
  }

  if (process.env.TRIGGER_DISABLED === '1') {
    return false;
  }

  if (process.env.NODE_ENV !== 'development') {
    return true;
  }

  return process.env.TRIGGER_DEV_ENABLED === '1';
}

export async function triggerTaskIfConfigured(
  id: TriggerTaskId,
  payload: Record<string, unknown>,
  options?: {
    queue?: string;
    idempotencyKey?: string;
    tags?: string[];
  },
): Promise<boolean> {
  if (!isTriggerExecutionEnabled()) {
    return false;
  }

  try {
    await tasks.trigger(id, payload, {
      queue: options?.queue ?? 'exports',
      idempotencyKey: options?.idempotencyKey,
      tags: options?.tags,
    });
    return true;
  } catch (error) {
    console.warn(
      `[trigger.dev] Failed to enqueue ${id}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
