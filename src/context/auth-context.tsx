'use client';

import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { User, UserPreferences } from '@/types';
import {
  selectUser,
  selectIsAuthenticated,
  selectPreferencesLoaded,
  updatePreferences as updatePreferencesThunk,
  updateProfile as updateProfileThunk,
  logout as logoutThunk,
  selectAuth
} from '@/lib/features/auth/authSlice';
import { createClient } from '@/lib/supabase/client';
import { registerServiceWorker } from '@/app/register-sw';

interface AuthContextType {
  user: User | null;
  // supabaseUser: SupabaseUser | null; // Removed as it's redundant and unused externally
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  preferencesLoaded: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  // Read state from Redux (Single Source of Truth)
  // AuthListener handles the actual fetching and updating of this state.
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const preferencesLoaded = useAppSelector(selectPreferencesLoaded);
  const { isLoading, isConfigured } = useAppSelector(selectAuth);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to sign in with Google' };
    }
  }, []);

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  const updatePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      await dispatch(updatePreferencesThunk(preferences));
    },
    [dispatch]
  );

  const updateProfile = useCallback(
    async (name: string) => {
      await dispatch(updateProfileThunk(name));
    },
    [dispatch]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isConfigured,
        preferencesLoaded,
        signInWithGoogle,
        logout,
        updatePreferences,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
