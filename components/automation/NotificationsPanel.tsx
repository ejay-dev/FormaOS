/**
 * Real-Time Notifications Panel
 * Shows recent automation alerts and compliance notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react';
import { getAutomationHistory } from '@/app/app/actions/automation';

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const history = await getAutomationHistory(10);

      // Transform automation history into notifications
      const notifs: Notification[] = history.map((event) => ({
        id: event.id,
        type: event.status === 'success' ? 'success' : 'alert',
        title: getTriggerTitle(event.trigger),
        message: getTriggerMessage(event.trigger, event.actionsExecuted),
        timestamp: event.executedAt,
        read: false,
        priority: getTriggerPriority(event.trigger),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const notification = notifications.find((n) => n.id === id);
      return notification && !notification.read ? prev - 1 : prev;
    });
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">All caught up!</p>
          <p className="text-xs text-gray-500 mt-1">
            No new notifications at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onDismiss={dismissNotification}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({
  notification,
  onRead,
  onDismiss,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);

  return (
    <div
      className={`group relative p-4 rounded-lg border transition-all ${
        notification.read
          ? 'bg-white border-gray-200'
          : 'bg-blue-50 border-blue-200'
      } hover:shadow-md`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      {/* Priority Indicator */}
      {!notification.read && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${priorityColor}`}
        ></div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            notification.type === 'alert'
              ? 'bg-red-100'
              : notification.type === 'warning'
                ? 'bg-yellow-100'
                : notification.type === 'success'
                  ? 'bg-green-100'
                  : 'bg-blue-100'
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              notification.type === 'alert'
                ? 'text-red-600'
                : notification.type === 'warning'
                  ? 'text-yellow-600'
                  : notification.type === 'success'
                    ? 'text-green-600'
                    : 'text-blue-600'
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={`text-sm font-semibold ${
                notification.read ? 'text-gray-700' : 'text-gray-900'
              }`}
            >
              {notification.title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(notification.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'alert':
      return AlertCircle;
    case 'warning':
      return Shield;
    case 'success':
      return CheckCircle2;
    default:
      return Bell;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
}

function getTriggerTitle(trigger: string): string {
  const titles: Record<string, string> = {
    evidence_expiry: 'Evidence Renewal Required',
    policy_review_due: 'Policy Review Scheduled',
    control_failed: 'Control Failure Detected',
    control_incomplete: 'Control Action Required',
    task_overdue: 'Task Overdue',
    risk_score_change: 'Compliance Risk Changed',
    certification_expiring: 'Certification Renewal Due',
    org_onboarding: 'Welcome to FormaOS',
  };
  return titles[trigger] || 'Automation Event';
}

function getTriggerMessage(trigger: string, actionsExecuted: number): string {
  const messages: Record<string, string> = {
    evidence_expiry: `Created ${actionsExecuted} renewal task${actionsExecuted > 1 ? 's' : ''} and notified compliance team`,
    policy_review_due: `Generated ${actionsExecuted} review task${actionsExecuted > 1 ? 's' : ''} for policy updates`,
    control_failed: `Escalated to admins and created ${actionsExecuted} remediation task${actionsExecuted > 1 ? 's' : ''}`,
    control_incomplete: `Created ${actionsExecuted} completion task${actionsExecuted > 1 ? 's' : ''} for at-risk controls`,
    task_overdue: `Sent ${actionsExecuted} escalation notification${actionsExecuted > 1 ? 's' : ''} to task owners`,
    risk_score_change: `Notified leadership of compliance risk increase`,
    certification_expiring: `Created ${actionsExecuted} renewal task${actionsExecuted > 1 ? 's' : ''} and alerted compliance officers`,
    org_onboarding: 'Your automation system is now active and monitoring compliance',
  };
  return messages[trigger] || `Automation workflow executed ${actionsExecuted} actions`;
}

function getTriggerPriority(trigger: string): 'critical' | 'high' | 'medium' | 'low' {
  const priorities: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    control_failed: 'critical',
    risk_score_change: 'critical',
    control_incomplete: 'high',
    task_overdue: 'high',
    evidence_expiry: 'medium',
    policy_review_due: 'medium',
    certification_expiring: 'medium',
    org_onboarding: 'low',
  };
  return priorities[trigger] || 'low';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
