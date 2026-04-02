'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Cloud, Loader2 } from 'lucide-react';
import {
  getOfflineStatus,
  processPendingActions,
} from '@/lib/offline/sync-manager';

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await getOfflineStatus();
        setOnline(status.isOnline);
        setPendingCount(status.pendingCount);
      } catch {
        setOnline(navigator.onLine);
      }
    };

    check();

    const handleOnline = () => {
      setOnline(true);
      setDismissed(false);
      check();
    };
    const handleOffline = () => {
      setOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(check, 30_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processPendingActions();
      const status = await getOfflineStatus();
      setPendingCount(status.pendingCount);
    } finally {
      setSyncing(false);
    }
  };

  // Nothing to show
  if (online && pendingCount === 0) return null;
  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 rounded-lg border p-3 shadow-lg ${
        online
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800'
      }`}
      data-testid="offline-indicator"
    >
      <div className="flex items-center gap-3">
        {online ? (
          <Cloud className="h-5 w-5 text-blue-500 shrink-0" />
        ) : (
          <WifiOff className="h-5 w-5 text-yellow-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {online ? 'Back online' : "You're working offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {online
              ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} ready to sync.`
              : 'Changes will sync when connected.'}
            {!online && pendingCount > 0 && ` (${pendingCount} pending)`}
          </p>
        </div>
        {online && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
