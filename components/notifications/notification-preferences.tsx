'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Loader2, MoonStar, Send, TestTube2 } from 'lucide-react';
import Button from '@/components/ui/button';
import {
  EVENT_CATEGORY_MAP,
  EVENT_LABELS,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CHANNELS,
  type NotificationCategory,
  type NotificationChannelType,
  type NotificationDigestFrequency,
  type NotificationEventType,
} from '@/lib/notifications/types';

type PreferenceRow = {
  channel: NotificationChannelType;
  event_type: NotificationEventType;
  enabled: boolean;
  digest_frequency: NotificationDigestFrequency;
  quiet_hours?: Record<string, unknown>;
};

type ChannelConfig = {
  channel_type: NotificationChannelType;
  verified: boolean;
};

const CHANNEL_LABELS: Record<NotificationChannelType, string> = {
  in_app: 'In-app',
  email: 'Email',
  slack: 'Slack',
  teams: 'Teams',
};

const DIGEST_OPTIONS: NotificationDigestFrequency[] = [
  'instant',
  'hourly',
  'daily',
  'weekly',
  'never',
];

export function NotificationPreferences({ orgId }: { orgId: string }) {
  const [preferences, setPreferences] = useState<PreferenceRow[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '18:00',
    end: '08:00',
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Adelaide',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [prefsResponse, channelsResponse] = await Promise.all([
          fetch(`/api/notifications/preferences?orgId=${encodeURIComponent(orgId)}`, {
            cache: 'no-store',
          }),
          fetch(`/api/notifications/channels?orgId=${encodeURIComponent(orgId)}`, {
            cache: 'no-store',
          }),
        ]);

        const prefsPayload = (await prefsResponse.json()) as {
          preferences: PreferenceRow[];
        };
        const channelsPayload = (await channelsResponse.json()) as {
          channels: Array<ChannelConfig & { config?: Record<string, unknown> }>;
        };

        if (cancelled) return;

        setPreferences(prefsPayload.preferences ?? []);
        setChannels(
          (channelsPayload.channels ?? []).map((channel) => ({
            channel_type: channel.channel_type,
            verified: channel.verified,
          })),
        );

        const firstQuietHours = prefsPayload.preferences.find(
          (item) => item.quiet_hours && Object.keys(item.quiet_hours).length > 0,
        )?.quiet_hours as Record<string, unknown> | undefined;

        if (firstQuietHours) {
          const start =
            typeof firstQuietHours.start === 'string'
              ? firstQuietHours.start
              : '18:00';
          const end =
            typeof firstQuietHours.end === 'string'
              ? firstQuietHours.end
              : '08:00';
          const timezone =
            typeof firstQuietHours.timezone === 'string'
              ? firstQuietHours.timezone
              : Intl.DateTimeFormat().resolvedOptions().timeZone ||
                'Australia/Adelaide';

          setQuietHours((current) => ({
            enabled:
              firstQuietHours.enabled === true ||
              firstQuietHours.enabled === 'true' ||
              current.enabled,
            start: start || current.start,
            end: end || current.end,
            timezone: timezone || current.timezone,
          }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const grouped = useMemo(() => {
    const map = new Map<NotificationCategory, NotificationEventType[]>();

    for (const preference of preferences) {
      const category = EVENT_CATEGORY_MAP[preference.event_type];
      const existing = map.get(category) ?? [];
      if (!existing.includes(preference.event_type)) {
        existing.push(preference.event_type);
      }
      map.set(category, existing);
    }

    return Array.from(map.entries());
  }, [preferences]);

  function updateCell(
    eventType: NotificationEventType,
    channel: NotificationChannelType,
    enabled: boolean,
  ) {
    setPreferences((current) =>
      current.map((preference) =>
        preference.event_type === eventType && preference.channel === channel
          ? { ...preference, enabled }
          : preference,
      ),
    );
  }

  function updateCategoryDigest(
    category: NotificationCategory,
    digestFrequency: NotificationDigestFrequency,
  ) {
    setPreferences((current) =>
      current.map((preference) =>
        preference.channel === 'email' &&
        EVENT_CATEGORY_MAP[preference.event_type] === category
          ? { ...preference, digest_frequency: digestFrequency }
          : preference,
      ),
    );
  }

  async function savePreferences() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          quietHours,
          preferences: preferences.map((preference) => ({
            channel: preference.channel,
            eventType: preference.event_type,
            enabled: preference.enabled,
            digestFrequency: preference.digest_frequency,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setMessage('Preferences saved');
    } catch {
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(channelType: NotificationChannelType) {
    setMessage(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          eventType: 'system.release',
          priority: channelType === 'in_app' ? 'normal' : 'high',
        }),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      setMessage(`Test notification queued for current ${CHANNEL_LABELS[channelType]} routing`);
    } catch {
      setMessage(`Unable to send ${CHANNEL_LABELS[channelType]} test`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-3xl border border-glass-border bg-white/[0.04] px-5 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notification preferences
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-glass-border bg-white/[0.04] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Delivery Matrix
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure which events reach which channels. Critical alerts bypass
              digests automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_CHANNELS.map((channel) => {
              const connected = channels.find(
                (value) => value.channel_type === channel,
              );

              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => void sendTest(channel)}
                  className="rounded-full border border-glass-border bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/90 transition hover:border-sky-400/30 hover:bg-sky-500/10"
                >
                  <TestTube2 className="mr-2 inline h-3.5 w-3.5" />
                  Test {CHANNEL_LABELS[channel]}
                  {connected?.verified ? ' • verified' : ''}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60">
                  Event
                </th>
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <th
                    key={channel}
                    className="px-4 py-2 text-center text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60"
                  >
                    {CHANNEL_LABELS[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([category, eventTypes]) => (
                <Fragment key={category}>
                  <tr key={`${category}-header`}>
                    <td
                      colSpan={NOTIFICATION_CHANNELS.length + 1}
                      className="pt-6 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground"
                    >
                      {NOTIFICATION_CATEGORY_LABELS[category]}
                    </td>
                  </tr>

                  {eventTypes.map((eventType) => (
                    <tr key={eventType} className="rounded-2xl bg-white/[0.03]">
                      <td className="rounded-l-2xl border border-glass-border px-4 py-4 text-sm font-medium text-foreground/90">
                        {EVENT_LABELS[eventType]}
                      </td>

                      {NOTIFICATION_CHANNELS.map((channel) => {
                        const preference = preferences.find(
                          (item) =>
                            item.event_type === eventType &&
                            item.channel === channel,
                        );

                        return (
                          <td
                            key={`${eventType}-${channel}`}
                            className="border-y border-glass-border px-4 py-4 text-center last:rounded-r-2xl last:border-r"
                          >
                            <label className="inline-flex cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                checked={preference?.enabled ?? false}
                                onChange={(event) =>
                                  updateCell(
                                    eventType,
                                    channel,
                                    event.target.checked,
                                  )
                                }
                                aria-label={`${eventType} via ${channel}`}
                                className="h-4 w-4 rounded border-glass-border bg-slate-900 text-sky-400 focus:ring-sky-500/30"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr key={`${category}-digest`}>
                    <td
                      colSpan={NOTIFICATION_CHANNELS.length + 1}
                      className="pb-4 pt-2"
                    >
                      <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground/90">
                            {NOTIFICATION_CATEGORY_LABELS[category]} email digest
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground/60">
                            Choose how non-critical email delivery behaves for this category.
                          </p>
                        </div>

                        <select
                          value={
                            preferences.find(
                              (item) =>
                                item.channel === 'email' &&
                                EVENT_CATEGORY_MAP[item.event_type] === category,
                            )?.digest_frequency ?? 'daily'
                          }
                          onChange={(event) =>
                            updateCategoryDigest(
                              category,
                              event.target.value as NotificationDigestFrequency,
                            )
                          }
                          className="rounded-xl border border-glass-border bg-slate-950/70 px-3 py-2 text-sm text-foreground/90"
                        >
                          {DIGEST_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-glass-border bg-white/[0.04] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <MoonStar className="mt-1 h-5 w-5 text-sky-300" />
          <div>
            <h3 className="text-lg font-black tracking-tight text-foreground">
              Quiet Hours
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Defer non-critical email delivery during protected hours.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <label className="rounded-2xl border border-glass-border bg-white/[0.03] px-4 py-3 text-sm text-foreground/90">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60">
              Enabled
            </div>
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(event) =>
                setQuietHours((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-glass-border bg-slate-900 text-sky-400 focus:ring-sky-500/30"
            />
          </label>

          <label className="rounded-2xl border border-glass-border bg-white/[0.03] px-4 py-3 text-sm text-foreground/90">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60">
              Start
            </div>
            <input
              type="time"
              value={quietHours.start}
              onChange={(event) =>
                setQuietHours((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-glass-border bg-slate-950/70 px-3 py-2 text-sm text-foreground/90"
            />
          </label>

          <label className="rounded-2xl border border-glass-border bg-white/[0.03] px-4 py-3 text-sm text-foreground/90">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60">
              End
            </div>
            <input
              type="time"
              value={quietHours.end}
              onChange={(event) =>
                setQuietHours((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-glass-border bg-slate-950/70 px-3 py-2 text-sm text-foreground/90"
            />
          </label>

          <label className="rounded-2xl border border-glass-border bg-white/[0.03] px-4 py-3 text-sm text-foreground/90">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground/60">
              Timezone
            </div>
            <input
              value={quietHours.timezone}
              onChange={(event) =>
                setQuietHours((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-glass-border bg-slate-950/70 px-3 py-2 text-sm text-foreground/90"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6 text-sm text-muted-foreground">{message}</div>
        <Button
          variant="ghost"
          onClick={savePreferences}
          disabled={saving}
          className="rounded-full border border-glass-border bg-sky-500/15 px-5 py-3 text-sm font-bold text-sky-100"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
