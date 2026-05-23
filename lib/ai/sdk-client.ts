import 'server-only';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { observeServerFn } from '@/lib/observability/langfuse';
import { isAIKillSwitchEnabled as killSwitchEnabled } from './kill-switch';

interface GenerateAITextOptions {
  name: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

/**
 * v4-027: AI kill switch. Operators can disable all AI traffic
 * platform-wide by setting AI_KILL_SWITCH=true without touching
 * OPENAI_API_KEY (which is needed for warm restart and may be
 * pulled from a secret manager that's not fast to rotate). When
 * the switch is on, every isAIConfigured / isAISDKConfigured
 * caller returns false and downstream code short-circuits.
 *
 * v4-031: implementation moved to ./kill-switch (a zero-dependency
 * module) so non-SDK callers can import without pulling the `ai`
 * package transitively. This re-export preserves the original
 * public API.
 */
export const isAIKillSwitchEnabled = killSwitchEnabled;

export function isAISDKConfigured(): boolean {
  if (isAIKillSwitchEnabled()) return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateAIText(
  options: GenerateAITextOptions,
): Promise<string | null> {
  if (!isAISDKConfigured()) {
    return null;
  }

  const runObservedGeneration = observeServerFn(
    async () =>
      generateText({
        model: openai(DEFAULT_MODEL),
        system: options.systemPrompt,
        prompt: options.userPrompt,
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
      }),
    {
      name: options.name,
      asType: 'generation',
      captureInput: false,
      captureOutput: false,
    },
  );

  try {
    const result = await runObservedGeneration();
    return result.text.trim() || null;
  } catch (error) {
    console.error(
      `[ai-sdk] ${options.name} failed:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
