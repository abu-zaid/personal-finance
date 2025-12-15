'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserPreferences } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PREFERENCES_KEY = 'financeflow_preferences';

const defaultPreferences: UserPreferences = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
  firstDayOfWeek: 0,
};

function getStoredPreferences(userId: string): UserPreferences {
  try {
    const stored = localStorage.getItem(`${PREFERENCES_KEY}_${userId}`);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(userId: string, preferences: UserPreferences) {
  localStorage.setItem(`${PREFERENCES_KEY}_${userId}`, JSON.stringify(preferences));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const isConfigured = supabase !== null;

  // Convert Supabase user to our User type
  const mapSupabaseUser = useCallback((supaUser: SupabaseUser): User => {
    const preferences = getStoredPreferences(supaUser.id);
    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
      avatarUrl: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
      preferences,
      createdAt: new Date(supaUser.created_at),
      updatedAt: new Date(supaUser.updated_at || supaUser.created_at),
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          setUser(mapSupabaseUser(session.user));
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          setUser(mapSupabaseUser(session.user));
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, mapSupabaseUser]);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
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
    } catch (error) {
      return { success: false, error: 'Failed to sign in with Google' };
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
  }, [supabase]);

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      if (!user) return;

      const updatedPreferences = { ...user.preferences, ...preferences };
      const updatedUser: User = {
        ...user,
        preferences: updatedPreferences,
        updatedAt: new Date(),
      };

      setUser(updatedUser);
      savePreferences(user.id, updatedPreferences);
    },
    [user]
  );

  const updateProfile = useCallback(
    (name: string) => {
      if (!user) return;

      const updatedUser: User = {
        ...user,
        name,
        updatedAt: new Date(),
      };

      setUser(updatedUser);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        isAuthenticated: !!user,
        isConfigured,
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
