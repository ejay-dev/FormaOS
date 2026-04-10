/**
 * @jest-environment jsdom
 */

/* ------------------------------------------------------------------ */
/*  Tests for lib/realtime.ts                                         */
/*  Covers: useRealtimeTable, usePresence, useActivityFeed,           */
/*          useNotifications, broadcastToRoom, logActivity,           */
/*          sendNotification                                          */
/* ------------------------------------------------------------------ */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Supabase channel / query mocks --------------------------------

const _mockSubscribe = jest.fn().mockReturnThis();
const mockUntrack = jest.fn();
const mockTrack = jest.fn().mockResolvedValue(undefined);
const mockPresenceState = jest.fn(() => ({}));
const mockSend = jest.fn().mockResolvedValue(undefined);

let presenceCallbacks: Record<string, Function> = {};
let postgresCallback: Function | null = null;
let _subscribeCallback: Function | null = null;

const mockChannel = {
  on: jest.fn(function (this: any, type: string, opts: any, cb: Function) {
    if (type === 'postgres_changes') {
      postgresCallback = cb;
    }
    if (type === 'presence') {
      presenceCallbacks[opts.event] = cb;
    }
    return this;
  }),
  subscribe: jest.fn(function (cb?: Function) {
    _subscribeCallback = cb ?? null;
    if (cb) cb('SUBSCRIBED');
    return mockChannel;
  }),
  untrack: mockUntrack,
  presenceState: mockPresenceState,
  track: mockTrack,
  send: mockSend,
};

const buildChain = (result: {
  data: any;
  error: any;
  count?: number | null;
}) => {
  const c: any = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'lt',
    'gte',
    'lte',
    'order',
    'limit',
    'range',
    'match',
    'is',
  ];
  methods.forEach((m) => {
    c[m] = jest.fn(() => c);
  });
  c.single = jest.fn(() => Promise.resolve(result));
  c.maybeSingle = jest.fn(() => Promise.resolve(result));
  // Make chain thenable (for awaiting without .single())
  c.then = (resolve: Function, reject: Function) =>
    Promise.resolve(result).then(resolve as any, reject as any);
  return c;
};

let selectChain = buildChain({ data: [], error: null });
const _insertChain = buildChain({ data: null, error: null });
const updateChain = buildChain({ data: null, error: null });

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => selectChain),
  insert: jest.fn(() => {
    const c = buildChain({ data: null, error: null });
    c.then = (resolve: Function, reject: Function) =>
      Promise.resolve({ data: null, error: null }).then(
        resolve as any,
        reject as any,
      );
    return c;
  }),
  update: jest.fn(() => updateChain),
}));

const mockRemoveChannel = jest.fn();
const mockChannelFn = jest.fn(() => mockChannel);

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(() => ({
    from: mockFrom,
    channel: mockChannelFn,
    removeChannel: mockRemoveChannel,
  })),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Now import the module under test
import {
  useRealtimeTable,
  usePresence,
  useActivityFeed,
  useNotifications,
  broadcastToRoom,
  logActivity,
  sendNotification,
} from '@/lib/realtime';

// ---- Helpers -------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  presenceCallbacks = {};
  postgresCallback = null;
  _subscribeCallback = null;
  selectChain = buildChain({ data: [], error: null });
});

// ---- useRealtimeTable -----------------------------------------------

describe('useRealtimeTable', () => {
  it('returns loading=true initially then false after fetch', async () => {
    selectChain = buildChain({ data: [{ id: '1' }], error: null });
    const { result } = renderHook(() => useRealtimeTable('test_table'));
    // Loading should eventually become false
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: '1' }]);
  });

  it('applies filter when provided', async () => {
    selectChain = buildChain({ data: [], error: null });
    renderHook(() =>
      useRealtimeTable('test_table', { column: 'org_id', value: 'org1' }),
    );
    await waitFor(() => {
      expect(selectChain.eq).toHaveBeenCalledWith('org_id', 'org1');
    });
  });

  it('handles fetch error gracefully', async () => {
    selectChain = buildChain({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('handles INSERT event and calls onEvent', async () => {
    selectChain = buildChain({ data: [], error: null });
    const onEvent = jest.fn();
    const { result } = renderHook(() =>
      useRealtimeTable('test_table', undefined, onEvent),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      postgresCallback?.({
        eventType: 'INSERT',
        table: 'test_table',
        new: { id: '2', name: 'new' },
        old: {},
      });
    });

    expect(result.current.data).toEqual([{ id: '2', name: 'new' }]);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INSERT', table: 'test_table' }),
    );
  });

  it('handles UPDATE event', async () => {
    selectChain = buildChain({ data: [{ id: '1', name: 'old' }], error: null });
    const { result } = renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      postgresCallback?.({
        eventType: 'UPDATE',
        table: 'test_table',
        new: { id: '1', name: 'updated' },
        old: { id: '1', name: 'old' },
      });
    });

    expect(result.current.data).toEqual([{ id: '1', name: 'updated' }]);
  });

  it('handles DELETE event', async () => {
    selectChain = buildChain({
      data: [{ id: '1' }, { id: '2' }],
      error: null,
    });
    const { result } = renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      postgresCallback?.({
        eventType: 'DELETE',
        table: 'test_table',
        new: {},
        old: { id: '1' },
      });
    });

    expect(result.current.data).toEqual([{ id: '2' }]);
  });

  it('unsubscribes on unmount', async () => {
    selectChain = buildChain({ data: [], error: null });
    const { unmount } = renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => {});
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('builds channel name without filter', async () => {
    selectChain = buildChain({ data: [], error: null });
    renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => {});
    expect(mockChannelFn).toHaveBeenCalledWith('test_table');
  });

  it('builds channel name with filter', async () => {
    selectChain = buildChain({ data: [], error: null });
    renderHook(() =>
      useRealtimeTable('test_table', { column: 'org_id', value: 'org1' }),
    );
    await waitFor(() => {});
    expect(mockChannelFn).toHaveBeenCalledWith('test_table:org_id=eq.org1');
  });

  it('skips onEvent if not provided', async () => {
    selectChain = buildChain({ data: [], error: null });
    const { result } = renderHook(() => useRealtimeTable('test_table'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should not throw
    act(() => {
      postgresCallback?.({
        eventType: 'INSERT',
        table: 'test_table',
        new: { id: '3' },
        old: {},
      });
    });
    expect(result.current.data).toHaveLength(1);
  });
});

// ---- usePresence ----------------------------------------------------

describe('usePresence', () => {
  it('tracks presence on SUBSCRIBED', async () => {
    renderHook(() => usePresence('room1', { id: 'u1', email: 'a@b.com' }));
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          user_email: 'a@b.com',
          page: 'room1',
        }),
      );
    });
  });

  it('updates presence state on sync', async () => {
    mockPresenceState.mockReturnValue({ u1: { user_id: 'u1' } });
    const { result } = renderHook(() =>
      usePresence('room1', { id: 'u1', email: 'a@b.com' }),
    );
    await waitFor(() => {});

    act(() => {
      presenceCallbacks['sync']?.();
    });

    expect(result.current.onlineUsers).toBeDefined();
  });

  it('handles join event in development', async () => {
    const origEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    renderHook(() => usePresence('room1', { id: 'u1', email: 'a@b.com' }));
    await waitFor(() => {});

    act(() => {
      presenceCallbacks['join']?.({ key: 'u1', newPresences: [] });
    });

    const { healthLogger } = require('@/lib/observability/structured-logger');
    expect(healthLogger.info).toHaveBeenCalledWith(
      'realtime_presence_joined',
      expect.any(Object),
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: origEnv,
      configurable: true,
    });
  });

  it('handles leave event in development', async () => {
    const origEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    renderHook(() => usePresence('room1', { id: 'u1', email: 'a@b.com' }));
    await waitFor(() => {});

    act(() => {
      presenceCallbacks['leave']?.({ key: 'u1', leftPresences: [] });
    });

    const { healthLogger } = require('@/lib/observability/structured-logger');
    expect(healthLogger.info).toHaveBeenCalledWith(
      'realtime_presence_left',
      expect.any(Object),
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: origEnv,
      configurable: true,
    });
  });

  it('does not log join/leave in production', async () => {
    const origEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    renderHook(() => usePresence('room1', { id: 'u1', email: 'a@b.com' }));
    await waitFor(() => {});

    act(() => {
      presenceCallbacks['join']?.({ key: 'u1', newPresences: [] });
      presenceCallbacks['leave']?.({ key: 'u2', leftPresences: [] });
    });

    const { healthLogger } = require('@/lib/observability/structured-logger');
    expect(healthLogger.info).not.toHaveBeenCalledWith(
      'realtime_presence_joined',
      expect.any(Object),
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: origEnv,
      configurable: true,
    });
  });

  it('untracks and removes channel on unmount', async () => {
    const { unmount } = renderHook(() =>
      usePresence('room1', { id: 'u1', email: 'a@b.com' }),
    );
    await waitFor(() => {});
    unmount();
    expect(mockUntrack).toHaveBeenCalled();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('does not track when status is not SUBSCRIBED', async () => {
    mockChannel.subscribe.mockImplementationOnce((cb: any) => {
      if (cb) cb('CLOSED');
      return mockChannel;
    });

    renderHook(() => usePresence('room2', { id: 'u2', email: 'b@c.com' }));
    await waitFor(() => {});
    // track should not have been called for CLOSED status
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

// ---- useActivityFeed ------------------------------------------------

describe('useActivityFeed', () => {
  it('returns activities from useRealtimeTable', async () => {
    selectChain = buildChain({
      data: [{ id: 'a1', action: 'create' }],
      error: null,
    });
    const { result } = renderHook(() => useActivityFeed('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual([{ id: 'a1', action: 'create' }]);
  });
});

// ---- useNotifications -----------------------------------------------

describe('useNotifications', () => {
  it('returns notifications and unread count', async () => {
    selectChain = buildChain({
      data: [
        { id: 'n1', read: false, type: 'info' },
        { id: 'n2', read: true, type: 'info' },
      ],
      error: null,
    });
    const { result } = renderHook(() => useNotifications('user1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('increments unread count on INSERT event with new notification', async () => {
    selectChain = buildChain({ data: [], error: null });
    const { result } = renderHook(() => useNotifications('user1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Simulate INSERT
    act(() => {
      postgresCallback?.({
        eventType: 'INSERT',
        table: 'notifications',
        new: { id: 'n3', read: false, type: 'info' },
        old: {},
      });
    });

    // The hook's own INSERT handler increments unreadCount
    expect(result.current.unreadCount).toBe(1);
  });

  it('logs in development on INSERT', async () => {
    const origEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    selectChain = buildChain({ data: [], error: null });
    renderHook(() => useNotifications('user1'));
    await waitFor(() => {});

    act(() => {
      postgresCallback?.({
        eventType: 'INSERT',
        table: 'notifications',
        new: { id: 'n4', type: 'info' },
        old: {},
      });
    });

    const { healthLogger } = require('@/lib/observability/structured-logger');
    expect(healthLogger.info).toHaveBeenCalledWith(
      'realtime_notification_received',
      expect.any(Object),
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: origEnv,
      configurable: true,
    });
  });

  it('markAsRead calls supabase update', async () => {
    selectChain = buildChain({ data: [], error: null });
    const { result } = renderHook(() => useNotifications('user1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });

  it('markAllAsRead calls supabase update', async () => {
    selectChain = buildChain({ data: [], error: null });
    const { result } = renderHook(() => useNotifications('user1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });
});

// ---- broadcastToRoom ------------------------------------------------

describe('broadcastToRoom', () => {
  it('sends broadcast message', async () => {
    await broadcastToRoom('room1', 'test_event', { data: 'hello' });
    expect(mockSend).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'test_event',
      payload: { data: 'hello' },
    });
  });
});

// ---- logActivity ----------------------------------------------------

describe('logActivity', () => {
  it('inserts activity log', async () => {
    await logActivity('org1', 'u1', 'a@b.com', 'create', 'policy', 'p1', {
      extra: true,
    });
    expect(mockFrom).toHaveBeenCalledWith('activity_logs');
  });

  it('logs error on failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFrom.mockReturnValueOnce({
      insert: jest.fn(() => {
        const c: any = {};
        c.then = (res: Function, rej: Function) =>
          Promise.resolve({ data: null, error: { message: 'fail' } }).then(
            res as any,
            rej as any,
          );
        return c;
      }),
    } as any);

    await logActivity('org1', 'u1', 'a@b.com', 'create', 'policy', 'p1');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log activity:',
      expect.any(Object),
    );
    consoleSpy.mockRestore();
  });
});

// ---- sendNotification ------------------------------------------------

describe('sendNotification', () => {
  it('inserts notification with defaults', async () => {
    await sendNotification('u1', 'Hello', 'World');
    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });

  it('inserts notification with custom type and action_url', async () => {
    await sendNotification('u1', 'Alert', 'Oops', 'error', '/fix');
    expect(mockFrom).toHaveBeenCalledWith('notifications');
  });

  it('logs error on failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFrom.mockReturnValueOnce({
      insert: jest.fn(() => {
        const c: any = {};
        c.then = (res: Function, rej: Function) =>
          Promise.resolve({ data: null, error: { message: 'fail' } }).then(
            res as any,
            rej as any,
          );
        return c;
      }),
    } as any);

    await sendNotification('u1', 'Hello', 'World');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to send notification:',
      expect.any(Object),
    );
    consoleSpy.mockRestore();
  });
});
