'use client';

import { createContext, useContext, useCallback, useEffect, useState, useMemo, ReactNode } from 'react';
import {
  Transaction,
  TransactionWithCategory,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSort,
} from '@/types';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { createClient } from '@/lib/supabase/client';
import { getMonthString } from '@/lib/utils';

interface TransactionsContextType {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  error: string | null;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => TransactionWithCategory | undefined;
  getFilteredTransactions: (
    filters?: TransactionFilters,
    sort?: TransactionSort
  ) => TransactionWithCategory[];
  getTransactionsByMonth: (month: string) => TransactionWithCategory[];
  getMonthlyTotal: (month: string) => number;
  getCategoryTotal: (categoryId: string, month?: string) => number;
  refetch: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

// Map database row to Transaction type
function mapDbToTransaction(row: {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    categoryId: row.category_id,
    date: new Date(row.date),
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { getCategoryById } = useCategories();
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!user || !supabase) {
      setRawTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedTransactions = (data || []).map(mapDbToTransaction);
      setRawTransactions(mappedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setRawTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Load transactions when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    } else {
      setRawTransactions([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchTransactions]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchTransactions]);

  // Enrich transactions with category data
  const transactions: TransactionWithCategory[] = useMemo(() => {
    return rawTransactions.map((t) => {
      const category = getCategoryById(t.categoryId);
      return {
        ...t,
        category: category
          ? {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
            }
          : {
              id: t.categoryId,
              name: 'Unknown',
              icon: 'more-horizontal',
              color: '#6b7280',
            },
      };
    });
  }, [rawTransactions, getCategoryById]);

  const createTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: input.amount,
          category_id: input.categoryId,
          date: input.date.toISOString().split('T')[0],
          notes: input.notes || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      const newTransaction = mapDbToTransaction(data);
      setRawTransactions((prev) => [newTransaction, ...prev]);
      return newTransaction;
    },
    [user, supabase]
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput): Promise<Transaction> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {};
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
      if (input.date !== undefined) updateData.date = input.date.toISOString().split('T')[0];
      if (input.notes !== undefined) updateData.notes = input.notes || null;

      const { data, error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedTransaction = mapDbToTransaction(data);
      setRawTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTransaction : t))
      );
      return updatedTransaction;
    },
    [user, supabase]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setRawTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [user, supabase]
  );

  const getTransactionById = useCallback(
    (id: string): TransactionWithCategory | undefined => {
      return transactions.find((t) => t.id === id);
    },
    [transactions]
  );

  const getFilteredTransactions = useCallback(
    (filters?: TransactionFilters, sort?: TransactionSort): TransactionWithCategory[] => {
      let filtered = [...transactions];

      if (filters) {
        if (filters.startDate) {
          filtered = filtered.filter((t) => t.date >= filters.startDate!);
        }
        if (filters.endDate) {
          filtered = filtered.filter((t) => t.date <= filters.endDate!);
        }
        if (filters.categoryId) {
          filtered = filtered.filter((t) => t.categoryId === filters.categoryId);
        }
        if (filters.minAmount !== undefined) {
          filtered = filtered.filter((t) => t.amount >= filters.minAmount!);
        }
        if (filters.maxAmount !== undefined) {
          filtered = filtered.filter((t) => t.amount <= filters.maxAmount!);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.notes?.toLowerCase().includes(searchLower) ||
              t.category.name.toLowerCase().includes(searchLower)
          );
        }
      }

      // Sort
      const sortField = sort?.field || 'date';
      const sortOrder = sort?.order || 'desc';

      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = a.date.getTime() - b.date.getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'category':
            comparison = a.category.name.localeCompare(b.category.name);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      return filtered;
    },
    [transactions]
  );

  const getTransactionsByMonth = useCallback(
    (month: string): TransactionWithCategory[] => {
      return transactions.filter((t) => getMonthString(t.date) === month);
    },
    [transactions]
  );

  const getMonthlyTotal = useCallback(
    (month: string): number => {
      return getTransactionsByMonth(month).reduce((sum, t) => sum + t.amount, 0);
    },
    [getTransactionsByMonth]
  );

  const getCategoryTotal = useCallback(
    (categoryId: string, month?: string): number => {
      let filtered = transactions.filter((t) => t.categoryId === categoryId);
      if (month) {
        filtered = filtered.filter((t) => getMonthString(t.date) === month);
      }
      return filtered.reduce((sum, t) => sum + t.amount, 0);
    },
    [transactions]
  );

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
        getFilteredTransactions,
        getTransactionsByMonth,
        getMonthlyTotal,
        getCategoryTotal,
        refetch: fetchTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
