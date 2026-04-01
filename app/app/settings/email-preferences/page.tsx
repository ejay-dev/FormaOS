'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAppStore } from '@/lib/stores/app';

interface EmailPreferences {
  welcome_emails: boolean;
  invitation_emails: boolean;
  alert_emails: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
  unsubscribed_all: boolean;
}

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = useMemo(() => createSupabaseClient(), []);
  const userId = useAppStore((state) => state.user?.id ?? null);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      if (!isHydrated) return;
      if (!userId) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('email_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('[EmailPreferencesPage] Error fetching:', error.message);
        }

        if (data) {
          if (!cancelled) setPreferences(data as EmailPreferences);
          return;
        }

        const { data: newPrefs, error: insertError } = await supabase
          .from('email_preferences')
          .insert({ user_id: userId })
          .select('*')
          .single();

        if (insertError) {
          console.error('[EmailPreferencesPage] Insert error:', insertError.message);
          if (!cancelled) setPreferences(null);
          return;
        }

        if (!cancelled) setPreferences(newPrefs as EmailPreferences);
      } catch (error) {
        console.error('[EmailPreferencesPage] Unexpected error:', error);
        if (!cancelled) setPreferences(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, userId, supabase]);

  async function savePreferences() {
    if (!preferences || !userId) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('email_preferences')
        .update(preferences)
        .eq('user_id', userId);

      if (error) throw error;

      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('[EmailPreferencesPage] Error saving:', error.message);
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading preferences...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6">
        <div className="text-rose-300 font-medium">Failed to load email preferences. Please check your database connection.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Email Preferences</h1>
      <p className="text-muted-foreground mb-6">
        Manage which emails you receive from FormaOS
      </p>

      <div className="bg-white/5 rounded-lg border border-white/10 p-6 space-y-6 shadow-sm">
        <div className="pb-6 border-b border-white/10">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.unsubscribed_all}
              onChange={(e) =>
                setPreferences({ ...preferences, unsubscribed_all: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-semibold text-rose-300 group-hover:text-rose-200">Unsubscribe from all emails</div>
              <div className="text-sm text-muted-foreground mt-1">
                You will not receive any emails from FormaOS (including critical account notifications)
              </div>
            </div>
          </label>
        </div>

        <div className={`space-y-6 transition-opacity duration-200 ${preferences.unsubscribed_all ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.welcome_emails}
              onChange={(e) =>
                setPreferences({ ...preferences, welcome_emails: e.target.checked })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground/90">Welcome emails</div>
              <div className="text-sm text-muted-foreground mt-1">
                Receive welcome emails when you join FormaOS
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.invitation_emails}
              onChange={(e) =>
                setPreferences({ ...preferences, invitation_emails: e.target.checked })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground/90">Team invitations</div>
              <div className="text-sm text-muted-foreground mt-1">
                Receive emails when you're invited to join an organization
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.alert_emails}
              onChange={(e) =>
                setPreferences({ ...preferences, alert_emails: e.target.checked })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground/90">Alerts and notifications</div>
              <div className="text-sm text-muted-foreground mt-1">
                Receive important alerts about your compliance activities
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.weekly_digest}
              onChange={(e) =>
                setPreferences({ ...preferences, weekly_digest: e.target.checked })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground/90">Weekly digest</div>
              <div className="text-sm text-muted-foreground mt-1">
                Receive a weekly summary of your organization's activities
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={preferences.marketing_emails}
              onChange={(e) =>
                setPreferences({ ...preferences, marketing_emails: e.target.checked })
              }
              disabled={preferences.unsubscribed_all}
              className="mt-1 h-4 w-4 rounded border-white/10 text-foreground focus:ring-sky-500/20"
            />
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground/90">Marketing and product updates</div>
              <div className="text-sm text-muted-foreground mt-1">
                Receive news about new features, tips, and FormaOS updates
              </div>
            </div>
          </label>
        </div>

        <div className="pt-6 border-t border-white/10 flex items-center gap-4">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-glass-strong text-foreground rounded-lg font-medium hover:bg-white/20 disabled:bg-glass-strong transition-all active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          {message && (
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              message.includes('success')
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-400/30'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
