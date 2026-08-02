/**
 * Tests for lib/offline/sync-manager.ts
 *
 * The offline queue persists user mutations while the device is offline and
 * replays them against the API when connectivity returns. Previously this file
 * only imported `type OfflineAction` (erased at compile time) and asserted the
 * values it had just assigned to an object literal, so queueing, replay,
 * deletion-on-success and retention-on-failure were entirely uncovered.
 *
 * The fake below models enough of IndexedDB for the module's usage: an
 * `open()` request that resolves asynchronously, per-call transactions with an
 * `oncomplete` callback, and request objects whose `onsuccess` fires on a
 * later tick (matching real IDB, where handlers are attached after the call).
 */

const ACTIONS_STORE = 'offline_actions';

type StoreRecord = Record<string, any>;

/** In-memory backing store, keyed by record id. */
let records: Map<string, StoreRecord>;
let openCalls: Array<[string, number]>;

function makeRequest<T>(result: T) {
  const req: any = { result, onsuccess: null, onerror: null };
  // Real IDB fires the handler on a later task, after the caller has had a
  // chance to attach it.
  setTimeout(() => req.onsuccess?.(), 0);
  return req;
}

function makeObjectStore(storeName: string) {
  if (storeName !== ACTIONS_STORE) {
    throw new Error(`unexpected object store: ${storeName}`);
  }
  return {
    put: jest.fn((record: StoreRecord) => {
      records.set(record.id, record);
      return makeRequest(undefined);
    }),
    get: jest.fn((key: string) => makeRequest(records.get(key))),
    getAll: jest.fn(() => makeRequest([...records.values()])),
    delete: jest.fn((key: string) => {
      records.delete(key);
      return makeRequest(undefined);
    }),
    count: jest.fn(() => makeRequest(records.size)),
  };
}

function makeDb() {
  return {
    objectStoreNames: { contains: jest.fn(() => true) },
    createObjectStore: jest.fn(),
    transaction: jest.fn((storeName: string, _mode?: string) => {
      const tx: any = {
        oncomplete: null,
        onerror: null,
        error: null,
        objectStore: jest.fn(() => makeObjectStore(storeName)),
      };
      // The module awaits tx.oncomplete after issuing its writes.
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    }),
  };
}

Object.defineProperty(global, 'indexedDB', {
  value: {
    open: jest.fn((name: string, version: number) => {
      openCalls.push([name, version]);
      return makeRequest(makeDb());
    }),
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn(() => 'uuid-1'),
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'navigator', {
  // No `serviceWorker` key at all — `'serviceWorker' in navigator` must be
  // false so queueOfflineAction does not try to register a background sync.
  value: { onLine: true },
  writable: true,
  configurable: true,
});

import {
  queueOfflineAction,
  processPendingActions,
  getOfflineStatus,
  type OfflineAction,
} from '@/lib/offline/sync-manager';

const fetchMock = jest.fn();

beforeEach(() => {
  records = new Map();
  openCalls = [];
  jest.clearAllMocks();
  let uuidCounter = 0;
  (global.crypto.randomUUID as jest.Mock).mockImplementation(
    () => `uuid-${++uuidCounter}`,
  );
  (global as any).fetch = fetchMock;
  (navigator as any).onLine = true;
});

describe('queueOfflineAction', () => {
  it('persists the action and returns the generated id', async () => {
    const id = await queueOfflineAction({
      url: '/api/v1/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'Write progress note' },
      entityType: 'tasks',
      entityId: 'task-1',
    });

    expect(id).toBe('uuid-1');
    // The queued record must survive with everything needed to replay it.
    const stored = records.get('uuid-1') as OfflineAction;
    expect(stored).toMatchObject({
      id: 'uuid-1',
      url: '/api/v1/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'Write progress note' },
      entityType: 'tasks',
      entityId: 'task-1',
    });
    expect(Date.parse(stored.queuedAt)).not.toBeNaN();
  });

  it('opens the versioned offline database', async () => {
    await queueOfflineAction({ url: '/api/v1/x', method: 'POST', headers: {} });
    expect(openCalls[0]).toEqual(['formaos-offline', 1]);
  });

  it('keeps every queued action rather than overwriting the previous one', async () => {
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });
    await queueOfflineAction({ url: '/api/b', method: 'POST', headers: {} });
    expect([...records.keys()]).toEqual(['uuid-1', 'uuid-2']);
  });
});

describe('processPendingActions', () => {
  it('replays each queued action against its original url/method/body', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await queueOfflineAction({
      url: '/api/v1/tasks',
      method: 'PUT',
      headers: { Authorization: 'Bearer t' },
      body: { title: 'Updated' },
    });

    const result = await processPendingActions();

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/tasks', {
      method: 'PUT',
      headers: { Authorization: 'Bearer t' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    expect(result).toEqual({ succeeded: 1, failed: 0 });
  });

  it('drops a successfully replayed action from the queue', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });

    await processPendingActions();

    // Leaving it behind would replay the same mutation on every sync.
    expect(records.size).toBe(0);
  });

  it('keeps an action queued when the server rejects it', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });

    const result = await processPendingActions();

    expect(result).toEqual({ succeeded: 0, failed: 1 });
    expect(records.has('uuid-1')).toBe(true);
  });

  it('keeps an action queued when the network throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });

    const result = await processPendingActions();

    expect(result).toEqual({ succeeded: 0, failed: 1 });
    expect(records.has('uuid-1')).toBe(true);
  });

  it('does not send a body for a payload-less action', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await queueOfflineAction({ url: '/api/a', method: 'DELETE', headers: {} });

    await processPendingActions();

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it('reports a mixed batch and only removes the successes', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });
    await queueOfflineAction({ url: '/api/b', method: 'POST', headers: {} });

    const result = await processPendingActions();

    expect(result).toEqual({ succeeded: 1, failed: 1 });
    expect([...records.keys()]).toEqual(['uuid-2']);
  });

  it('is a no-op with an empty queue', async () => {
    const result = await processPendingActions();
    expect(result).toEqual({ succeeded: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getOfflineStatus', () => {
  it('reports the pending count and the browser online flag', async () => {
    await queueOfflineAction({ url: '/api/a', method: 'POST', headers: {} });
    await queueOfflineAction({ url: '/api/b', method: 'POST', headers: {} });

    await expect(getOfflineStatus()).resolves.toEqual({
      isOnline: true,
      pendingCount: 2,
    });
  });

  it('reflects navigator.onLine when the device drops offline', async () => {
    (navigator as any).onLine = false;
    await expect(getOfflineStatus()).resolves.toEqual({
      isOnline: false,
      pendingCount: 0,
    });
  });
});
