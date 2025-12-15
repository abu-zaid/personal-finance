'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, UserPreferences } from '@/types';
import { generateId } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'financeflow_auth';
const USERS_KEY = 'financeflow_users';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string; // In real app, this would be hashed on server
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

const defaultPreferences: UserPreferences = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
  firstDayOfWeek: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored) as User;
          // Convert date strings back to Date objects
          userData.createdAt = new Date(userData.createdAt);
          userData.updatedAt = new Date(userData.updatedAt);
          setUser(userData);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Get all users from storage
  const getStoredUsers = useCallback((): StoredUser[] => {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save users to storage
  const saveStoredUsers = useCallback((users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const users = getStoredUsers();
      const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!existingUser) {
        return { success: false, error: 'No account found with this email' };
      }

      if (existingUser.password !== password) {
        return { success: false, error: 'Incorrect password' };
      }

      const userData: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        preferences: existingUser.preferences,
        createdAt: new Date(existingUser.createdAt),
        updatedAt: new Date(existingUser.updatedAt),
      };

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      return { success: true };
    },
    [getStoredUsers]
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const users = getStoredUsers();
      const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }

      const now = new Date();
      const newStoredUser: StoredUser = {
        id: generateId(),
        email,
        name,
        password, // In real app, hash this
        preferences: defaultPreferences,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      users.push(newStoredUser);
      saveStoredUsers(users);

      const userData: User = {
        id: newStoredUser.id,
        email: newStoredUser.email,
        name: newStoredUser.name,
        preferences: newStoredUser.preferences,
        createdAt: now,
        updatedAt: now,
      };

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      return { success: true };
    },
    [getStoredUsers, saveStoredUsers]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      if (!user) return;

      const updatedUser: User = {
        ...user,
        preferences: { ...user.preferences, ...preferences },
        updatedAt: new Date(),
      };

      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

      // Also update in users storage
      const users = getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          preferences: updatedUser.preferences,
          updatedAt: updatedUser.updatedAt.toISOString(),
        };
        saveStoredUsers(users);
      }
    },
    [user, getStoredUsers, saveStoredUsers]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updatePreferences,
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
