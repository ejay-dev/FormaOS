import 'server-only';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { createLangfuseSpanProcessor } from '@/lib/observability/langfuse';

let sdkStartPromise: Promise<boolean> | null = null;

function parseOtelHeaders(
  raw: string | undefined,
): Record<string, string> | undefined {
  if (!raw) return undefined;

  const headers = raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex <= 0) return acc;

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

  return Object.keys(headers).length > 0 ? headers : undefined;
}

async function startOpenTelemetry(): Promise<boolean> {
  const spanProcessors = [];

  const langfuseProcessor = createLangfuseSpanProcessor();
  if (langfuseProcessor) {
    spanProcessors.push(langfuseProcessor);
  }

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (otlpEndpoint) {
    spanProcessors.push(
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: otlpEndpoint,
          headers: parseOtelHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        }),
      ),
    );
  }

  if (spanProcessors.length === 0) {
    return false;
  }

  if (process.env.OTEL_DEBUG === '1') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = 'formaos';
  }

  const provider = new NodeTracerProvider({
    spanProcessors,
  });
  provider.register();

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation(),
    ],
  });

  process.once('SIGTERM', () => {
    void provider.shutdown();
  });
  process.once('SIGINT', () => {
    void provider.shutdown();
  });

  return true;
}

export async function registerOpenTelemetry(): Promise<boolean> {
  if (sdkStartPromise) {
    return sdkStartPromise;
  }

  sdkStartPromise = startOpenTelemetry().catch((error) => {
    sdkStartPromise = null;
    console.warn(
      '[observability] OpenTelemetry bootstrap failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return false;
  });

  return sdkStartPromise;
}
