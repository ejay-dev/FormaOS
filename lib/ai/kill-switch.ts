/**
 * AI kill switch — minimal env check with no dependencies.
 *
 * v4-031: extracted from sdk-client.ts so non-SDK callers (embeddings,
 * future cron / queue consumers) can gate on the switch without
 * transitively importing the `ai` package, which pulls in
 * `eventsource-parser` and other browser-stream APIs that don't exist
 * in jest's jsdom env and break test suites at import time.
 *
 * Set AI_KILL_SWITCH=true to short-circuit every AI code path without
 * touching OPENAI_API_KEY (which may live in a secret manager that's
 * slow to rotate).
 */
export function isAIKillSwitchEnabled(): boolean {
  return process.env.AI_KILL_SWITCH === 'true';
}
