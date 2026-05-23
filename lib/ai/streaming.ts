import 'server-only';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

export function isAIConfigured(): boolean {
  // v4-027: honour AI_KILL_SWITCH so operators can disable all AI
  // traffic platform-wide without rotating OPENAI_API_KEY.
  if (process.env.AI_KILL_SWITCH === 'true') return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

export function createComplianceStream(options: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onFinish?: (result: {
    text: string;
    usage: { inputTokens: number | undefined; outputTokens: number | undefined };
  }) => void;
}) {
  return streamText({
    model: openai(DEFAULT_MODEL),
    system: options.systemPrompt,
    messages: options.messages,
    temperature: 0.3,
    maxOutputTokens: 2048,
    onFinish: options.onFinish
      ? (event) => {
          options.onFinish!({
            text: event.text,
            usage: {
              inputTokens: event.usage.inputTokens,
              outputTokens: event.usage.outputTokens,
            },
          });
        }
      : undefined,
  });
}
