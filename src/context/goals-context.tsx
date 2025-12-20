'use client';

import { createContext, useContext, useCallback, useEffect, useState, useRef, ReactNode } from 'react';
import { Goal, CreateGoalInput, UpdateGoalInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

interface GoalsContextType {
    goals: Goal[];
    isLoading: boolean;
    error: string | null;
    createGoal: (input: CreateGoalInput) => Promise<Goal>;
    updateGoal: (id: string, input: UpdateGoalInput) => Promise<Goal>;
    deleteGoal: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const hasInitialized = useRef(false);
    const fetchInProgress = useRef(false);

    const fetchGoals = useCallback(async (force = false) => {
        if (!user || !supabase) {
            setGoals([]);
            setIsLoading(false);
            return;
        }

        if (fetchInProgress.current && !force) return;

        try {
            fetchInProgress.current = true;
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setGoals(data || []);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch goals');
        } finally {
            setIsLoading(false);
            fetchInProgress.current = false;
        }
    }, [user, supabase]);

    useEffect(() => {
        if (isAuthenticated && user && !hasInitialized.current) {
            hasInitialized.current = true;
            fetchGoals();
        } else if (!isAuthenticated || !user) {
            hasInitialized.current = false;
            setGoals([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, user, fetchGoals]);

    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase
            .channel('goals-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'goals',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setGoals((prev) => [payload.new as Goal, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setGoals((prev) =>
                            prev.map((g) => (g.id === (payload.new as Goal).id ? (payload.new as Goal) : g))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setGoals((prev) => prev.filter((g) => g.id !== (payload.old as { id: string }).id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const createGoal = useCallback(
        async (input: CreateGoalInput): Promise<Goal> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            const { data, error: insertError } = await supabase
                .from('goals')
                .insert({
                    user_id: user.id,
                    ...input,
                })
                .select()
                .single();

            if (insertError) throw new Error(insertError.message);

            // Optimistic update
            if (data) {
                setGoals(prev => [data, ...prev]);
            }

            return data;
        },
        [user, supabase]
    );

    const updateGoal = useCallback(
        async (id: string, input: UpdateGoalInput): Promise<Goal> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            const { data, error: updateError } = await supabase
                .from('goals')
                .update(input)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (updateError) throw new Error(updateError.message);

            // Optimistic update
            if (data) {
                setGoals(prev => prev.map(g => g.id === id ? data : g));
            }

            return data;
        },
        [user, supabase]
    );

    const deleteGoal = useCallback(
        async (id: string): Promise<void> => {
            if (!user || !supabase) throw new Error('User not authenticated');

            // Optimistic update
            setGoals(prev => prev.filter(g => g.id !== id));

            const { error: deleteError } = await supabase
                .from('goals')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (deleteError) {
                // Revert if failed (fetch from server to be safe)
                fetchGoals();
                throw new Error(deleteError.message);
            }
        },
        [user, supabase, fetchGoals]
    );

    return (
        <GoalsContext.Provider
            value={{
                goals,
                isLoading,
                error,
                createGoal,
                updateGoal,
                deleteGoal,
                refetch: fetchGoals,
            }}
        >
            {children}
        </GoalsContext.Provider>
    );
}

export function useGoals() {
    const context = useContext(GoalsContext);
    if (context === undefined) {
        throw new Error('useGoals must be used within a GoalsProvider');
    }
    return context;
}
