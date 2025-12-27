'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import { setUser, fetchUserPreferences, initializeAuth } from '@/lib/features/auth/authSlice';
import { fetchCategories } from '@/lib/features/categories/categoriesSlice';
import { fetchTransactions } from '@/lib/features/transactions/transactionsSlice';

import { UserPreferences } from '@/types';

const defaultPreferences: UserPreferences = {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'system',
    firstDayOfWeek: 0,
};

// Helper to match the slice expectation
const mapSupabaseUserToSerializable = (supaUser: any) => {
    return {
        id: supaUser.id,
        email: supaUser.email || '',
        name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
        avatarUrl: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
        preferences: defaultPreferences, // Will be updated by fetchUserPreferences
        createdAt: supaUser.created_at,
        updatedAt: supaUser.updated_at || supaUser.created_at,
    };
};

export default function AuthListener() {
    const dispatch = useAppDispatch();
    const supabase = createClient();
    // We need to check if we are already in demo mode to prevent overwrites
    // But we can't easily access store state inside the callback without a ref or repeated selectors.
    // However, initializeAuth returns the state.

    useEffect(() => {
        if (!supabase) {
            console.error('Supabase client failed to initialize');
            dispatch(setUser(null));
            return;
        }

        let mounted = true;

        const init = async () => {
            try {
                // Use the centralized initialization logic
                const result = await dispatch(initializeAuth()).unwrap();

                if (mounted && result.user) {
                    // Fetch data for both Real and Demo users
                    // Demo mode slices will handle serving mock data
                    dispatch(fetchCategories());
                    dispatch(fetchTransactions({ page: 0 }));
                    // Add other initial fetches here if needed (budgets, etc)
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                if (mounted) dispatch(setUser(null)); // Fallback
            }
        };

        init();

        // Listen for Supabase auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Check if we are in demo mode via cookie to avoid race conditions with Redux state
            const isDemo = document.cookie.includes('demo_mode=true');

            if (session?.user) {
                // Real user logged in - this supersedes Demo mode
                dispatch(setUser(mapSupabaseUserToSerializable(session.user)));
                await dispatch(fetchUserPreferences(session.user.id)).unwrap(); // Ensure prefs loaded

                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    dispatch(fetchCategories());
                    dispatch(fetchTransactions({ page: 0 }));
                }
            } else if (!isDemo) {
                // Only clear user if NOT in demo mode
                // If isDemo is true, we ignore Supabase's "no user" state
                dispatch(setUser(null));
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [dispatch, supabase]);

    return null;
}
