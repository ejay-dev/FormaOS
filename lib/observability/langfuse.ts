import 'server-only';

import { observe, type ObserveOptions } from '@langfuse/tracing';
import { LangfuseSpanProcessor } from '@langfuse/otel';

export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  environment?: string;
}

export function getLangfuseConfig(): LangfuseConfig | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();

  if (!publicKey || !secretKey) {
    return null;
  }

  return {
    publicKey,
    secretKey,
    baseUrl: process.env.LANGFUSE_BASE_URL?.trim() || undefined,
    environment: process.env.LANGFUSE_TRACING_ENVIRONMENT?.trim() || undefined,
  };
}

export function isLangfuseConfigured(): boolean {
  return getLangfuseConfig() !== null;
}

export function createLangfuseSpanProcessor(): LangfuseSpanProcessor | null {
  const config = getLangfuseConfig();
  if (!config) return null;

  return new LangfuseSpanProcessor({
    publicKey: config.publicKey,
    secretKey: config.secretKey,
    baseUrl: config.baseUrl,
    environment: config.environment,
    exportMode: 'immediate',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic wrapper requires broad function signature for langfuse observe()
export function observeServerFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: ObserveOptions,
): T {
  return observe(fn, {
    captureInput: false,
    captureOutput: false,
    ...options,
  });
}
