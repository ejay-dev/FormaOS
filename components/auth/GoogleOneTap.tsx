'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Google Identity Services (GIS) wrapper for signInWithIdToken flow.
 *
 * WHY THIS EXISTS:
 * When using Supabase's signInWithOAuth, the OAuth flow routes through
 * https://<project-ref>.supabase.co/auth/v1/callback. Google's consent
 * screen shows this Supabase URL to the user ("Sign in to bvfnios...supabase.co"),
 * which looks unprofessional and confusing.
 *
 * This component uses Google Identity Services to render a native Google
 * sign-in button. The consent screen shows our app name ("FormaOS") and
 * our domain (app.formaos.com.au), NOT the Supabase project URL.
 *
 * Flow:
 * 1. Google GIS renders a native sign-in button
 * 2. User clicks → Google popup shows FormaOS branding
 * 3. Google returns an ID token (JWT credential)
 * 4. We call supabase.auth.signInWithIdToken() to create the session
 * 5. Parent component redirects to /auth/callback?setup=1 for org setup
 *
 * FALLBACK: If NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set or the GIS script
 * fails to load, the parent component renders the legacy signInWithOAuth
 * button instead.
 *
 * ALTERNATIVE FIX – Supabase Custom Domains (eliminates this component):
 * 1. Enable Custom Domains in Supabase dashboard (requires Pro plan)
 * 2. Set up DNS CNAME: auth.formaos.com.au → <project-ref>.supabase.co
 * 3. Update NEXT_PUBLIC_SUPABASE_URL to https://auth.formaos.com.au
 * 4. Supabase OAuth flow will use auth.formaos.com.au as origin
 * 5. Google consent screen will show formaos.com.au, not supabase.co
 * 6. Remove this component and revert to signInWithOAuth
 */

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            element: HTMLElement,
            config: Record<string, unknown>,
          ) => void;
          prompt: (callback?: (notification: unknown) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  /** Called after signInWithIdToken succeeds. Parent should redirect. */
  onSuccess: () => void;
  /** Called on any error. */
  onError: (message: string) => void;
  /** Button text variant */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Disable interaction */
  disabled?: boolean;
  /** Called when GIS script fails to load — parent should show fallback */
  onFallback?: () => void;
}

export function GoogleOneTap({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled,
  onFallback,
}: GoogleOneTapProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep callbacks fresh without re-triggering effects
  const callbackRef = useRef({ onSuccess, onError });
  useEffect(() => {
    callbackRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  // Load GIS script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setFailed(true);
      onFallback?.();
      return;
    }

    if (window.google?.accounts?.id) {
      setLoaded(true);
      return;
    }

    const existing = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]',
    );
    if (existing) {
      const check = () => {
        if (window.google?.accounts?.id) {
          setLoaded(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => {
      setFailed(true);
      onFallback?.();
    };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize and render button
  useEffect(() => {
    if (
      !loaded ||
      !window.google?.accounts?.id ||
      !buttonRef.current ||
      !GOOGLE_CLIENT_ID
    )
      return;

    const handleCredential = async (response: { credential: string }) => {
      try {
        const supabase = createSupabaseClient();
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });
        if (error) {
          console.error('[GoogleOneTap] signInWithIdToken error:', error);
          callbackRef.current.onError(
            error.message || 'Google sign-in failed.',
          );
          return;
        }
        callbackRef.current.onSuccess();
      } catch (err) {
        console.error('[GoogleOneTap] Unexpected error:', err);
        callbackRef.current.onError('Google sign-in failed. Please try again.');
      }
    };

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: buttonRef.current.offsetWidth || 400,
        logo_alignment: 'left',
      });
    } catch (err) {
      console.error('[GoogleOneTap] Initialization failed:', err);
      setFailed(true);
      onFallback?.();
    }
  }, [loaded, text, onFallback]);

  // If script failed or no client ID, render nothing (parent shows fallback)
  if (failed || !GOOGLE_CLIENT_ID) return null;

  // Loading placeholder while script loads
  if (!loaded) {
    return (
      <div className="w-full h-[44px] rounded-lg bg-white/10 animate-pulse" />
    );
  }

  return (
    <div
      ref={buttonRef}
      className={`w-full min-h-[44px] ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      style={{ colorScheme: 'light' }}
    />
  );
}

/** Check if Google Identity Services is configured */
export function isGoogleOneTapAvailable(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}
