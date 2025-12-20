'use client';

import { createContext, useContext, useCallback, useEffect, useState, useRef, ReactNode } from 'react';
import { RecurringTransaction, CreateRecurringInput, UpdateRecurringInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

interface RecurringContextType {
    recurringTransactions: RecurringTransaction[];
    isLoading: boolean;
    error: string | null;
    createRecurring: (input: CreateRecurringInput) => Promise<RecurringTransaction>;
    updateRecurring: (id: string, input: UpdateRecurringInput) => Promise<RecurringTransaction>;
    deleteRecurring: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

const RecurringContext = createContext<RecurringContextType | undefined>(undefined);

export function RecurringProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const hasInitialized = useRef(false);
    const fetchInProgress = useRef(false);

    const fetchRecurring = useCallback(async (force = false) => {
        if (!user || !supabase) {
            setRecurringTransactions([]);
            setIsLoading(false);
            return;
        }

        if (fetchInProgress.current && !force) return;

        try {
            fetchInProgress.current = true;
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('recurring_transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('next_date', { ascending: true });

            if (fetchError) throw fetchError;
            setRecurringTransactions(data || []);
        } catch (err) {
            console.error('Error fetching recurring transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch recurring transactions');
        } finally {
            setIsLoading(false);
            fetchInProgress.current = false;
        }
    }, [user, supabase]);

    useEffect(() => {
        if (isAuthenticated && user && !hasInitialized.current) {
            hasInitialized.current = true;
            fetchRecurring();
        } else if (!isAuthenticated || !user) {
            hasInitialized.current = false;
            setRecurringTransactions([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, user, fetchRecurring]);

    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase
            .channel('recurring-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recurring_transactions',
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        // Refetch to get category relation correctly or handle manually
                        fetchRecurring(true);
                    } else if (payload.eventType === 'DELETE') {
                        setRecurringTransactions((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase, fetchRecurring]);

    const createRecurring = useCallback(
        async (input: CreateRecurringInput): Promise<RecurringTransaction> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            const { data, error: insertError } = await supabase
                .from('recurring_transactions')
                .insert({
                    user_id: user.id,
                    ...input,
                })
                .select('*, category:categories(*)')
                .single();

            if (insertError) throw new Error(insertError.message);

            // Optimistic update
            if (data) {
                setRecurringTransactions(prev => [...prev, data].sort((a, b) =>
                    new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
                ));
            }

            return data;
        },
        [user, supabase]
    );

    const updateRecurring = useCallback(
        async (id: string, input: UpdateRecurringInput): Promise<RecurringTransaction> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            const { data, error: updateError } = await supabase
                .from('recurring_transactions')
                .update(input)
                .eq('id', id)
                .eq('user_id', user.id)
                .select('*, category:categories(*)')
                .single();

            if (updateError) throw new Error(updateError.message);

            // Optimistic update
            if (data) {
                setRecurringTransactions(prev => {
                    const updated = prev.map(r => r.id === id ? data : r);
                    return updated.sort((a, b) =>
                        new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
                    );
                });
            }

            return data;
        },
        [user, supabase]
    );

    const deleteRecurring = useCallback(
        async (id: string): Promise<void> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            // Optimistic update
            setRecurringTransactions(prev => prev.filter(r => r.id !== id));

            const { error: deleteError } = await supabase
                .from('recurring_transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (deleteError) {
                // Revert if failed
                fetchRecurring();
                throw new Error(deleteError.message);
            }
        },
        [user, supabase, fetchRecurring]
    );

    return (
        <RecurringContext.Provider
            value={{
                recurringTransactions,
                isLoading,
                error,
                createRecurring,
                updateRecurring,
                deleteRecurring,
                refetch: fetchRecurring,
            }}
        >
            {children}
        </RecurringContext.Provider>
    );
}

export function useRecurring() {
    const context = useContext(RecurringContext);
    if (context === undefined) {
        throw new Error('useRecurring must be used within a RecurringProvider');
    }
    return context;
}
