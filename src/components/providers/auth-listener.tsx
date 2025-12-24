'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import { setUser, fetchUserPreferences } from '@/lib/features/auth/authSlice';
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

    useEffect(() => {
        if (!supabase) return;

        // Initial session check
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                dispatch(setUser(mapSupabaseUserToSerializable(session.user)));
                dispatch(fetchUserPreferences(session.user.id));
                dispatch(fetchCategories());
                dispatch(fetchTransactions({ page: 0 }));
            } else {
                dispatch(setUser(null));
            }
        };

        initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                dispatch(setUser(mapSupabaseUserToSerializable(session.user)));
                // Only fetch if explicitly signed in or token refreshed, but initAuth covers page load
                // We'll re-fetch preferences to be safe
                dispatch(fetchUserPreferences(session.user.id));
                // Fetch data if just signed in
                if (event === 'SIGNED_IN') {
                    dispatch(fetchCategories());
                    dispatch(fetchTransactions({ page: 0 }));
                }
            } else {
                dispatch(setUser(null));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [dispatch, supabase]);

    return null; // This component doesn't render anything
}
