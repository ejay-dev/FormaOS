/** @jest-environment node */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: null },
      })),
    },
  })),
}));

jest.mock('@/lib/control-plane/server', () => ({
  getRuntimeSnapshot: jest.fn(),
  readRuntimeStreamVersion: jest.fn(),
  resolveControlPlaneEnvironment: jest.fn(() => 'production'),
}));

import { GET } from '@/app/api/runtime/control-plane/stream/route';
import {
  getRuntimeSnapshot,
  readRuntimeStreamVersion,
} from '@/lib/control-plane/server';

function createEventReader(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const readNextDataEvent = async (timeoutMs = 4_000) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const remaining = Math.max(1, deadline - Date.now());
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const chunk = (await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Timed out waiting for SSE data')),
            remaining,
          );
        }),
      ])) as ReadableStreamReadResult<Uint8Array>;
      if (timeoutId) clearTimeout(timeoutId);

      if (chunk.done) {
        throw new Error('Stream closed before receiving data event');
      }

      buffer += decoder.decode(chunk.value, { stream: true });

      let boundaryIndex = buffer.indexOf('\n\n');
      while (boundaryIndex >= 0) {
        const rawEvent = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);
        boundaryIndex = buffer.indexOf('\n\n');

        const dataLine = rawEvent
          .split('\n')
          .find((line) => line.startsWith('data: '));

        if (dataLine) {
          return JSON.parse(dataLine.slice(6));
        }
      }
    }

    throw new Error('Timed out waiting for SSE data');
  };

  return { readNextDataEvent };
}

describe('/api/runtime/control-plane/stream live updates', () => {
  const getRuntimeSnapshotMock = getRuntimeSnapshot as jest.Mock;
  const readRuntimeStreamVersionMock = readRuntimeStreamVersion as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pushes updated runtime snapshot within ~1.2s after version changes', async () => {
    let versionCall = 0;
    readRuntimeStreamVersionMock.mockImplementation(async () => {
      versionCall += 1;
      const version = versionCall === 1 ? 'v1' : 'v2';
      return {
        runtimeVersion: version,
        streamVersion: version,
        lastChangedAt: new Date().toISOString(),
      };
    });

    let snapshotCall = 0;
    getRuntimeSnapshotMock.mockImplementation(async () => {
      snapshotCall += 1;
      return {
        version: String(snapshotCall),
        streamVersion: `v${snapshotCall}`,
        lastUpdateAt: new Date().toISOString(),
        evaluationMode: 'global',
        environment: 'production',
        ops: {
          maintenanceMode: false,
          readOnlyMode: false,
          emergencyLockdown: false,
          rateLimitMultiplier: 1,
        },
        marketing: {
          hero: {
            badgeText: 'badge',
            headlinePrimary: 'headline',
            headlineAccent: 'accent',
            subheadline: 'subheadline',
            primaryCtaLabel: 'Start',
            primaryCtaHref: '/start',
            secondaryCtaLabel: 'Demo',
            secondaryCtaHref: '/demo',
          },
          runtime: {
            expensiveEffectsEnabled: true,
            activeShowcaseModule: 'interactive_demo',
            showcaseModules: { interactive_demo: true },
            sectionVisibility: { cta: true },
            themeVariant: 'default',
            backgroundVariant: 'aurora',
          },
        },
        featureFlags: {},
      };
    });

    const abortController = new AbortController();
    const response = await GET(
      new Request('http://localhost/api/runtime/control-plane/stream', {
        signal: abortController.signal,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.body).toBeTruthy();

    const reader = createEventReader(response.body!);

    try {
      const first = await reader.readNextDataEvent(2_000);
      expect(first.version).toBe('1');

      const t0 = Date.now();
      const second = await reader.readNextDataEvent(3_000);
      const elapsedMs = Date.now() - t0;

      expect(second.version).toBe('2');
      expect(elapsedMs).toBeLessThanOrEqual(2_000);
    } finally {
      abortController.abort();
    }
  });
});
