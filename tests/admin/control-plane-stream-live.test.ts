/** @jest-environment node */

jest.mock('@/app/app/admin/access', () => ({
  requireFounderAccess: jest.fn(),
}));

jest.mock('@/lib/control-plane/server', () => ({
  getAdminControlPlaneSnapshot: jest.fn(),
  readAdminStreamVersion: jest.fn(),
  resolveControlPlaneEnvironment: jest.fn(() => 'production'),
}));

import { GET } from '@/app/api/admin/control-plane/stream/route';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  getAdminControlPlaneSnapshot,
  readAdminStreamVersion,
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

describe('/api/admin/control-plane/stream live updates', () => {
  const requireFounderAccessMock = requireFounderAccess as jest.Mock;
  const getAdminSnapshotMock = getAdminControlPlaneSnapshot as jest.Mock;
  const readAdminStreamVersionMock = readAdminStreamVersion as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pushes an updated snapshot within ~1.2s after stream version changes', async () => {
    requireFounderAccessMock.mockResolvedValue({
      user: { id: 'founder-1', email: 'founder@example.com' },
    });

    let versionCall = 0;
    readAdminStreamVersionMock.mockImplementation(async () => {
      versionCall += 1;
      return versionCall === 1 ? 'v1' : 'v2';
    });

    let snapshotCall = 0;
    getAdminSnapshotMock.mockImplementation(async () => {
      snapshotCall += 1;
      return {
        environment: 'production',
        runtimeVersion: String(snapshotCall),
        featureFlags: [],
        marketingConfig: [],
        systemSettings: [],
        integrations: [],
        jobs: [],
        audit: [],
        health: {
          databaseLatencyMs: 5,
          apiHealthy: true,
          queue: {
            queued: 0,
            running: 0,
            failed: 0,
            succeededLast24h: 0,
          },
        },
      };
    });

    const abortController = new AbortController();
    const response = await GET(
      new Request('http://localhost/api/admin/control-plane/stream', {
        signal: abortController.signal,
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.body).toBeTruthy();

    const reader = createEventReader(response.body!);

    try {
      const first = await reader.readNextDataEvent(2_000);
      expect(first.runtimeVersion).toBe('1');

      const t0 = Date.now();
      const second = await reader.readNextDataEvent(3_000);
      const elapsedMs = Date.now() - t0;

      expect(second.runtimeVersion).toBe('2');
      expect(elapsedMs).toBeLessThanOrEqual(2_000);
    } finally {
      abortController.abort();
    }
  });
});
