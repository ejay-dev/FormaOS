'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/stores/app';
import { SaveStatus, useSaveStatus } from '@/components/settings/save-status';

interface EmailPreferences {
  welcome_emails: boolean;
  alert_emails: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
  unsubscribed_all: boolean;
}

type EmailPreferenceRow = {
  id?: string;
  enabled?: boolean | null;
  frequency?: string | null;
  enabled_events?: unknown;
  quiet_hours?: unknown;
};

const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  welcome_emails: true,
  alert_emails: true,
  marketing_emails: false,
  weekly_digest: true,
  unsubscribed_all: false,
};

const EVENT_KEYS = {
  welcome_emails: 'welcome',
  alert_emails: 'compliance_alert',
  marketing_emails: 'product_update',
} as const;

/**
 * Invitations are transactional: a person cannot accept a workspace invite
 * they never received, so the event stays on regardless of the opt-out.
 */
const ALWAYS_SENT_EVENTS = ['invitation'];

function readEnabledEvents(value: unknown) {
  if (Array.isArray(value)) {
    return new Set(
      value.filter((event): event is string => typeof event === 'string'),
    );
  }

  if (value && typeof value === 'object') {
    return new Set(
      Object.entries(value as Record<string, unknown>)
        .filter(([, enabled]) => enabled === true)
        .map(([event]) => event),
    );
  }

  return new Set<string>();
}

function preferencesFromRow(row: EmailPreferenceRow | null): EmailPreferences {
  if (!row) return DEFAULT_EMAIL_PREFERENCES;

  const enabledEvents = readEnabledEvents(row.enabled_events);
  const hasExplicitEvents = enabledEvents.size > 0;

  return {
    welcome_emails: hasExplicitEvents
      ? enabledEvents.has(EVENT_KEYS.welcome_emails)
      : DEFAULT_EMAIL_PREFERENCES.welcome_emails,
    alert_emails: hasExplicitEvents
      ? enabledEvents.has(EVENT_KEYS.alert_emails)
      : DEFAULT_EMAIL_PREFERENCES.alert_emails,
    marketing_emails: hasExplicitEvents
      ? enabledEvents.has(EVENT_KEYS.marketing_emails)
      : DEFAULT_EMAIL_PREFERENCES.marketing_emails,
    weekly_digest: row.frequency === 'weekly_digest',
    unsubscribed_all: row.enabled === false,
  };
}

function rowFromPreferences(preferences: EmailPreferences) {
  const optionalEvents = Object.entries(EVENT_KEYS)
    .filter(
      ([key]) =>
        !preferences.unsubscribed_all &&
        preferences[key as keyof typeof EVENT_KEYS],
    )
    .map(([, event]) => event);

  return {
    enabled: !preferences.unsubscribed_all,
    frequency:
      preferences.weekly_digest && !preferences.unsubscribed_all
        ? 'weekly_digest'
        : 'immediate',
    enabled_events: [...ALWAYS_SENT_EVENTS, ...optionalEvents],
    quiet_hours: {},
    updated_at: new Date().toISOString(),
  };
}

const OPTIONAL_EMAILS: Array<{
  key: keyof Omit<EmailPreferences, 'unsubscribed_all'>;
  label: string;
  description: string;
}> = [
  {
    key: 'alert_emails',
    label: 'Compliance alerts',
    description:
      'Overdue obligations, expiring credentials, and control failures.',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly digest',
    description: 'One summary of the past week across your workspace.',
  },
  {
    key: 'welcome_emails',
    label: 'Getting started',
    description: 'Setup guidance when you join a new workspace.',
  },
  {
    key: 'marketing_emails',
    label: 'Product updates',
    description: 'New features and release notes from FormaOS.',
  },
];

export function EmailPreferencesForm() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = useSaveStatus();

  const supabase = useMemo(() => createSupabaseClient(), []);
  const userId = useAppStore((state) => state.user?.id ?? null);
  const orgId = useAppStore((state) => state.organization?.id ?? null);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      if (!isHydrated) return;
      if (!userId || !orgId) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('email_preferences')
          .select('id, enabled, frequency, enabled_events, quiet_hours')
          .eq('user_id', userId)
          .eq('organization_id', orgId)
          .maybeSingle();

        if (error) {
          console.error('[EmailPreferencesForm] Error fetching:', error.message);
        }

        if (cancelled) return;

        if (data) {
          setPreferenceId((data as EmailPreferenceRow).id ?? null);
          setPreferences(preferencesFromRow(data as EmailPreferenceRow));
        } else {
          setPreferenceId(null);
          setPreferences(DEFAULT_EMAIL_PREFERENCES);
        }
        setLoadFailed(false);
      } catch (error) {
        console.error('[EmailPreferencesForm] Unexpected error:', error);
        if (!cancelled) {
          setPreferences(null);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, orgId, userId, supabase]);

  async function savePreferences() {
    if (!preferences || !userId || !orgId) return;

    setSaving(true);
    save.markSaving();

    try {
      const payload = rowFromPreferences(preferences);
      const query = preferenceId
        ? supabase
            .from('email_preferences')
            .update(payload)
            .eq('id', preferenceId)
            .select('id')
            .single()
        : supabase
            .from('email_preferences')
            .insert({
              user_id: userId,
              organization_id: orgId,
              ...payload,
            })
            .select('id')
            .single();

      const { data, error } = await query;

      if (error) throw error;
      if (data?.id) setPreferenceId(data.id);

      save.markSaved();
    } catch (error: unknown) {
      const detail =
        error instanceof Error && error.message ? error.message : 'Unknown error';
      console.error('[EmailPreferencesForm] Error saving:', detail);
      save.markError('Your email preferences could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading your email preferences…</p>
    );
  }

  if (!preferences || loadFailed) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        Your email preferences are not available right now. Refresh the page, and
        contact support if it keeps happening.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <fieldset className="space-y-5">
        <legend className="sr-only">Emails you receive</legend>
        {OPTIONAL_EMAILS.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={preferences[item.key]}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  [item.key]: event.target.checked,
                })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-0.5 h-4 w-4 rounded border-border text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <span
              className={
                preferences.unsubscribed_all ? 'opacity-50' : undefined
              }
            >
              <span className="block text-sm font-medium text-foreground">
                {item.label}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {item.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-6 border-t border-border pt-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={preferences.unsubscribed_all}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                unsubscribed_all: event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-border text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Turn off all optional email
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Stops every email above. You will still receive security and
              account email — sign-in verification, password resets, and
              workspace invitations you need to accept.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Save changes
        </button>
        <SaveStatus state={save.state} errorMessage={save.errorMessage} />
      </div>
    </div>
  );
}
