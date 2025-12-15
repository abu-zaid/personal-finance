'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserPreferences, Currency, DateFormat, Theme } from '@/types';

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
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
  firstDayOfWeek: 0,
};

// Map database row to UserPreferences
function mapDbToPreferences(row: {
  currency: string;
  date_format: string;
  theme: string;
  first_day_of_week: number;
} | null): UserPreferences {
  if (!row) return defaultPreferences;
  return {
    currency: row.currency as Currency,
    dateFormat: row.date_format as DateFormat,
    theme: row.theme as Theme,
    firstDayOfWeek: row.first_day_of_week as 0 | 1,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const isConfigured = supabase !== null;

  // Fetch user preferences from Supabase
  const fetchPreferences = useCallback(async (userId: string): Promise<UserPreferences> => {
    if (!supabase) return defaultPreferences;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, they'll be created by the database trigger
        console.log('No preferences found, using defaults');
        return defaultPreferences;
      }

      return mapDbToPreferences(data);
    } catch {
      return defaultPreferences;
    }
  }, [supabase]);

  // Convert Supabase user to our User type
  const mapSupabaseUser = useCallback(async (supaUser: SupabaseUser): Promise<User> => {
    const preferences = await fetchPreferences(supaUser.id);
    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
      avatarUrl: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
      preferences,
      createdAt: new Date(supaUser.created_at),
      updatedAt: new Date(supaUser.updated_at || supaUser.created_at),
    };
  }, [fetchPreferences]);

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
          const mappedUser = await mapSupabaseUser(session.user);
          setUser(mappedUser);
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
          const mappedUser = await mapSupabaseUser(session.user);
          setUser(mappedUser);
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
    } catch {
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
    async (preferences: Partial<UserPreferences>) => {
      if (!user || !supabase) return;

      const updatedPreferences = { ...user.preferences, ...preferences };

      // Update in database
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            currency: updatedPreferences.currency,
            date_format: updatedPreferences.dateFormat,
            theme: updatedPreferences.theme,
            first_day_of_week: updatedPreferences.firstDayOfWeek,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Error updating preferences:', error);
          return;
        }

        // Update local state
        const updatedUser: User = {
          ...user,
          preferences: updatedPreferences,
          updatedAt: new Date(),
        };
        setUser(updatedUser);
      } catch (err) {
        console.error('Error updating preferences:', err);
      }
    },
    [user, supabase]
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
