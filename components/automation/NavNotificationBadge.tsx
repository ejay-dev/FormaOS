/**
 * Navigation Notification Badge
 * Shows unread automation alert count in top navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getAutomationHistory } from '@/app/app/actions/automation';

export function NavNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const history = await getAutomationHistory(20);

      // Count recent critical/high priority events (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentAlerts = history.filter((event) => {
        const eventDate = new Date(event.executedAt);
        const isCritical = ['control_failed', 'risk_score_change'].includes(
          event.trigger
        );
        const isHigh = ['control_incomplete', 'task_overdue'].includes(event.trigger);

        return eventDate > oneDayAgo && (isCritical || isHigh);
      });

      setUnreadCount(recentAlerts.length);
      setHasAlerts(recentAlerts.length > 0);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  }

  return (
    <button
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5 text-gray-700" />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}

      {/* Pulse Indicator for Active Alerts */}
      {hasAlerts && (
        <span className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      )}
    </button>
  );
}
