'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { Budget, BudgetAllocation, BudgetWithSpending, CreateBudgetInput, UpdateBudgetInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useTransactions } from '@/context/transactions-context';
import { createClient } from '@/lib/supabase/client';
import { getMonthString, calculatePercentage } from '@/lib/utils';

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  createBudget: (input: CreateBudgetInput) => Promise<Budget>;
  updateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetById: (id: string) => Budget | undefined;
  getBudgetByMonth: (month: string) => Budget | undefined;
  getBudgetWithSpending: (month: string) => BudgetWithSpending | undefined;
  getCurrentMonthBudget: () => BudgetWithSpending | undefined;
  refetch: () => Promise<void>;
}

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

// Map database rows to Budget type
interface BudgetRow {
  id: string;
  user_id: string;
  month: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface AllocationRow {
  id: string;
  budget_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

function mapDbToBudget(
  budgetRow: BudgetRow,
  allocations: AllocationRow[]
): Budget {
  return {
    id: budgetRow.id,
    userId: budgetRow.user_id,
    month: budgetRow.month,
    totalAmount: Number(budgetRow.total_amount),
    allocations: allocations.map((a) => ({
      categoryId: a.category_id,
      amount: Number(a.amount),
    })),
    createdAt: new Date(budgetRow.created_at),
    updatedAt: new Date(budgetRow.updated_at),
  };
}

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { getCategoryTotal } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch budgets from Supabase
  const fetchBudgets = useCallback(async () => {
    if (!user || !supabase) {
      setBudgets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });

      if (budgetsError) {
        throw budgetsError;
      }

      if (!budgetsData || budgetsData.length === 0) {
        setBudgets([]);
        setIsLoading(false);
        return;
      }

      // Fetch all allocations for these budgets
      const budgetIds = budgetsData.map((b) => b.id);
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('budget_allocations')
        .select('*')
        .in('budget_id', budgetIds);

      if (allocationsError) {
        throw allocationsError;
      }

      // Map to Budget type
      const mappedBudgets = budgetsData.map((budgetRow) => {
        const budgetAllocations = (allocationsData || []).filter(
          (a) => a.budget_id === budgetRow.id
        );
        return mapDbToBudget(budgetRow, budgetAllocations);
      });

      setBudgets(mappedBudgets);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Load budgets when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBudgets();
    } else {
      setBudgets([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchBudgets]);

  // Subscribe to realtime changes - handle budget changes incrementally
  useEffect(() => {
    if (!user || !supabase) return;

    const budgetsChannel = supabase
      .channel('budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setBudgets((prev) => prev.filter(b => b.id !== deletedId));
          } else {
            // For INSERT/UPDATE, refetch to get allocations
            fetchBudgets();
          }
        }
      )
      .subscribe();

    // For allocations, we need to refetch since they're linked to budgets
    // But debounce to avoid multiple rapid refetches
    let allocationsTimeout: NodeJS.Timeout | null = null;
    const allocationsChannel = supabase
      .channel('allocations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_allocations',
        },
        () => {
          // Debounce allocation changes
          if (allocationsTimeout) clearTimeout(allocationsTimeout);
          allocationsTimeout = setTimeout(() => {
            fetchBudgets();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (allocationsTimeout) clearTimeout(allocationsTimeout);
      supabase.removeChannel(budgetsChannel);
      supabase.removeChannel(allocationsChannel);
    };
  }, [user, supabase, fetchBudgets]);

  const createBudget = useCallback(
    async (input: CreateBudgetInput): Promise<Budget> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      // Check if budget already exists for this month
      const existingBudget = budgets.find((b) => b.month === input.month);
      if (existingBudget) {
        throw new Error('A budget already exists for this month');
      }

      // Create budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          month: input.month,
          total_amount: input.totalAmount,
        })
        .select()
        .single();

      if (budgetError) {
        throw new Error(budgetError.message);
      }

      // Create allocations
      if (input.allocations.length > 0) {
        const allocationsToInsert = input.allocations.map((a) => ({
          budget_id: budgetData.id,
          category_id: a.categoryId,
          amount: a.amount,
        }));

        const { error: allocationsError } = await supabase
          .from('budget_allocations')
          .insert(allocationsToInsert);

        if (allocationsError) {
          // Rollback budget creation
          await supabase.from('budgets').delete().eq('id', budgetData.id);
          throw new Error(allocationsError.message);
        }
      }

      const newBudget: Budget = {
        id: budgetData.id,
        userId: budgetData.user_id,
        month: budgetData.month,
        totalAmount: Number(budgetData.total_amount),
        allocations: input.allocations,
        createdAt: new Date(budgetData.created_at),
        updatedAt: new Date(budgetData.updated_at),
      };

      setBudgets((prev) => [newBudget, ...prev]);
      return newBudget;
    },
    [user, supabase, budgets]
  );

  const updateBudget = useCallback(
    async (id: string, input: UpdateBudgetInput): Promise<Budget> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const existingBudget = budgets.find((b) => b.id === id);
      if (!existingBudget) throw new Error('Budget not found');

      // Update budget if totalAmount changed
      if (input.totalAmount !== undefined) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ total_amount: input.totalAmount })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // Update allocations if provided
      if (input.allocations !== undefined) {
        // Delete existing allocations
        await supabase
          .from('budget_allocations')
          .delete()
          .eq('budget_id', id);

        // Insert new allocations
        if (input.allocations.length > 0) {
          const allocationsToInsert = input.allocations.map((a) => ({
            budget_id: id,
            category_id: a.categoryId,
            amount: a.amount,
          }));

          const { error: allocationsError } = await supabase
            .from('budget_allocations')
            .insert(allocationsToInsert);

          if (allocationsError) {
            throw new Error(allocationsError.message);
          }
        }
      }

      const updatedBudget: Budget = {
        ...existingBudget,
        totalAmount: input.totalAmount ?? existingBudget.totalAmount,
        allocations: input.allocations ?? existingBudget.allocations,
        updatedAt: new Date(),
      };

      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? updatedBudget : b))
      );
      return updatedBudget;
    },
    [user, supabase, budgets]
  );

  const deleteBudget = useCallback(
    async (id: string): Promise<void> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      // Allocations will be deleted automatically due to CASCADE
      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setBudgets((prev) => prev.filter((b) => b.id !== id));
    },
    [user, supabase]
  );

  const getBudgetById = useCallback(
    (id: string): Budget | undefined => {
      return budgets.find((b) => b.id === id);
    },
    [budgets]
  );

  const getBudgetByMonth = useCallback(
    (month: string): Budget | undefined => {
      return budgets.find((b) => b.month === month);
    },
    [budgets]
  );

  const getBudgetWithSpending = useCallback(
    (month: string): BudgetWithSpending | undefined => {
      const budget = getBudgetByMonth(month);
      if (!budget) return undefined;

      const allocationsWithSpending = budget.allocations.map((allocation) => {
        const spent = getCategoryTotal(allocation.categoryId, month);
        const remaining = allocation.amount - spent;
        const percentageUsed = calculatePercentage(spent, allocation.amount);

        return {
          ...allocation,
          spent,
          remaining,
          percentageUsed,
          isOverBudget: spent > allocation.amount,
        };
      });

      const totalSpent = allocationsWithSpending.reduce((sum, a) => sum + a.spent, 0);
      const totalRemaining = budget.totalAmount - totalSpent;

      return {
        ...budget,
        allocations: allocationsWithSpending,
        totalSpent,
        totalRemaining,
      };
    },
    [getBudgetByMonth, getCategoryTotal]
  );

  const getCurrentMonthBudget = useCallback((): BudgetWithSpending | undefined => {
    const currentMonth = getMonthString(new Date());
    return getBudgetWithSpending(currentMonth);
  }, [getBudgetWithSpending]);

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        isLoading,
        error,
        createBudget,
        updateBudget,
        deleteBudget,
        getBudgetById,
        getBudgetByMonth,
        getBudgetWithSpending,
        getCurrentMonthBudget,
        refetch: fetchBudgets,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetsProvider');
  }
  return context;
}
