'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RuntimeSnapshot } from '@/lib/control-plane/types';

type StreamStatus = 'connecting' | 'connected' | 'disconnected';

type RuntimeContextValue = {
  snapshot: RuntimeSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  streamStatus: StreamStatus;
  streamConnected: boolean;
  lastStreamEventAt: string | null;
  lastHeartbeatAt: string | null;
};

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

async function fetchRuntimeSnapshot(signal?: AbortSignal) {
  const response = await fetch('/api/runtime/control-plane', {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Runtime request failed (${response.status})`);
  }

  return (await response.json()) as RuntimeSnapshot;
}

function nextBackoffMs(previous: number) {
  const jitter = Math.floor(Math.random() * 500);
  const candidate = Math.min(30_000, Math.max(1_000, previous * 2));
  return candidate + jitter;
}

export function ControlPlaneRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting');
  const [lastStreamEventAt, setLastStreamEventAt] = useState<string | null>(null);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef<number>(1_000);
  const mountedRef = useRef(true);

  const closeSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchRuntimeSnapshot();
      if (!mountedRef.current) return;
      setSnapshot(next);
      setLastStreamEventAt(new Date().toISOString());
      setError(null);
    } catch (fetchError) {
      if (!mountedRef.current) return;
      const message =
        fetchError instanceof Error ? fetchError.message : 'Runtime unavailable';
      setError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const connectStream = useCallback(() => {
    if (!mountedRef.current) return;

    setStreamStatus('connecting');
    clearReconnectTimer();
    closeSource();

    const source = new EventSource('/api/runtime/control-plane/stream');
    eventSourceRef.current = source;

    source.onopen = () => {
      if (!mountedRef.current) return;
      reconnectDelayRef.current = 1_000;
      setStreamStatus('connected');
      setError(null);
      setLastHeartbeatAt(new Date().toISOString());
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RuntimeSnapshot;
        if (!mountedRef.current) return;
        setSnapshot(payload);
        setLastStreamEventAt(payload.lastUpdateAt ?? new Date().toISOString());
        setError(null);
        setLoading(false);
      } catch {
        // Ignore malformed payloads; subsequent events will reconcile state.
      }
    };

    source.addEventListener('ping', (event: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      try {
        const payload = JSON.parse(event.data) as { ts?: string };
        setLastHeartbeatAt(payload.ts ?? new Date().toISOString());
      } catch {
        setLastHeartbeatAt(new Date().toISOString());
      }
    });

    source.onerror = () => {
      if (!mountedRef.current) return;

      setStreamStatus('disconnected');
      setError('Live runtime stream disconnected. Reconnecting...');
      closeSource();

      const nextDelay = reconnectDelayRef.current;
      reconnectDelayRef.current = nextBackoffMs(nextDelay);

      reconnectTimeoutRef.current = setTimeout(() => {
        connectStream();
      }, nextDelay);
    };
  }, [clearReconnectTimer, closeSource]);

  useEffect(() => {
    mountedRef.current = true;

    connectStream();
    void refresh();

    const handleBeforeUnload = () => {
      clearReconnectTimer();
      closeSource();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearReconnectTimer();
      closeSource();
    };
  }, [clearReconnectTimer, closeSource, connectStream, refresh]);

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      refresh,
      streamStatus,
      streamConnected: streamStatus === 'connected',
      lastStreamEventAt,
      lastHeartbeatAt,
    }),
    [
      snapshot,
      loading,
      error,
      refresh,
      streamStatus,
      lastStreamEventAt,
      lastHeartbeatAt,
    ],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

/** Returned when called outside ControlPlaneRuntimeProvider (e.g. marketing pages). */
const STATIC_FALLBACK: RuntimeContextValue = {
  snapshot: null,
  loading: false,
  error: null,
  refresh: async () => {},
  streamStatus: 'disconnected',
  streamConnected: false,
  lastStreamEventAt: null,
  lastHeartbeatAt: null,
};

/**
 * Returns live runtime data inside ControlPlaneRuntimeProvider (authenticated app shell),
 * or a static null-snapshot fallback on marketing pages where no provider is mounted.
 * Marketing components already handle null snapshots via DEFAULT_RUNTIME_MARKETING.
 */
export function useControlPlaneRuntime() {
  return useContext(RuntimeContext) ?? STATIC_FALLBACK;
}

export function useRuntimeFeatureFlag(flagKey: string) {
  const { snapshot } = useControlPlaneRuntime();
  return (
    snapshot?.featureFlags[flagKey] ?? {
      enabled: false,
      variant: null,
      reason: 'not-configured',
      scopeType: 'none',
    }
  );
}
