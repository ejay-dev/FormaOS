import 'server-only';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
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
  const serviceName = process.env.OTEL_SERVICE_NAME?.trim() || 'formaos';
  const serviceVersion =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.GIT_COMMIT_SHA?.slice(0, 12) ||
    'local';

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

  process.env.OTEL_SERVICE_NAME = serviceName;

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment.name':
        process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    }),
    spanProcessors,
  });
  provider.register();

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation(),
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-winston': {
          enabled: false,
        },
      }),
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
