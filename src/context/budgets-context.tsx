'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { Budget, BudgetWithSpending, CreateBudgetInput, UpdateBudgetInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useTransactions } from '@/context/transactions-context';
import { generateId, getMonthString, calculatePercentage } from '@/lib/utils';

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  createBudget: (input: CreateBudgetInput) => Promise<Budget>;
  updateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetById: (id: string) => Budget | undefined;
  getBudgetByMonth: (month: string) => Budget | undefined;
  getBudgetWithSpending: (month: string) => BudgetWithSpending | undefined;
  getCurrentMonthBudget: () => BudgetWithSpending | undefined;
}

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

const STORAGE_KEY = 'financeflow_budgets';

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { getCategoryTotal } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load budgets from localStorage
  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setIsLoading(false);
      return;
    }

    const loadBudgets = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Budget[];
          // Convert date strings back to Date objects
          const budgetsWithDates = parsed.map((b) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          }));
          setBudgets(budgetsWithDates);
        }
      } catch {
        setBudgets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, [user]);

  const saveToStorage = (b: Budget[], userId: string) => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(b));
  };

  const createBudget = useCallback(
    async (input: CreateBudgetInput): Promise<Budget> => {
      if (!user) throw new Error('User not authenticated');

      // Check if budget already exists for this month
      const existingBudget = budgets.find((b) => b.month === input.month);
      if (existingBudget) {
        throw new Error('A budget already exists for this month');
      }

      const now = new Date();
      const newBudget: Budget = {
        id: generateId(),
        userId: user.id,
        month: input.month,
        totalAmount: input.totalAmount,
        allocations: input.allocations,
        createdAt: now,
        updatedAt: now,
      };

      const updatedBudgets = [...budgets, newBudget];
      setBudgets(updatedBudgets);
      saveToStorage(updatedBudgets, user.id);

      return newBudget;
    },
    [user, budgets]
  );

  const updateBudget = useCallback(
    async (id: string, input: UpdateBudgetInput): Promise<Budget> => {
      if (!user) throw new Error('User not authenticated');

      const budgetIndex = budgets.findIndex((b) => b.id === id);
      if (budgetIndex === -1) throw new Error('Budget not found');

      const updatedBudget: Budget = {
        ...budgets[budgetIndex],
        ...input,
        updatedAt: new Date(),
      };

      const updatedBudgets = [...budgets];
      updatedBudgets[budgetIndex] = updatedBudget;

      setBudgets(updatedBudgets);
      saveToStorage(updatedBudgets, user.id);

      return updatedBudget;
    },
    [user, budgets]
  );

  const deleteBudget = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      const updatedBudgets = budgets.filter((b) => b.id !== id);
      setBudgets(updatedBudgets);
      saveToStorage(updatedBudgets, user.id);
    },
    [user, budgets]
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
        createBudget,
        updateBudget,
        deleteBudget,
        getBudgetById,
        getBudgetByMonth,
        getBudgetWithSpending,
        getCurrentMonthBudget,
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
