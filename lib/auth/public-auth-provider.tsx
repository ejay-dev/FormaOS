'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';

/**
 * =========================================================
 * PUBLIC AUTH PROVIDER
 * =========================================================
 *
 * This provider is a lightweight version of the auth context
 * that is safe to use on public pages. It provides basic
 * authentication state without requiring full system state.
 *
 * It's designed to be used on marketing pages where we need
 * to know if a user is logged in, but don't need access to
 * the full system state.
 */

interface PublicAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
}

const PublicAuthContext = createContext<PublicAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  userEmail: null,
});

export function usePublicAuth() {
  return useContext(PublicAuthContext);
}

interface PublicAuthProviderProps {
  children: ReactNode;
}

export function PublicAuthProvider({ children }: PublicAuthProviderProps) {
  const [authState, setAuthState] = useState<PublicAuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    userEmail: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[PublicAuthProvider] Error getting session:', error);
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            userId: null,
            userEmail: null,
          });
          return;
        }

        const session = data?.session;

        setAuthState({
          isAuthenticated: !!session,
          isLoading: false,
          userId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
        });
      } catch (error) {
        console.error('[PublicAuthProvider] Error checking auth:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userId: null,
          userEmail: null,
        });
      }
    };

    checkAuth();

    // Set up auth state change listener
    const supabase = createSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setAuthState({
          isAuthenticated: !!session,
          isLoading: false,
          userId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
        });
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PublicAuthContext.Provider value={authState}>
      {children}
    </PublicAuthContext.Provider>
  );
}
