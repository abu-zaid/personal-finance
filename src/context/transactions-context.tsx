'use client';

import { createContext, useContext, useCallback, useEffect, useState, useMemo, useRef, ReactNode } from 'react';
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
import { toast } from 'sonner';

interface TransactionsContextType {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  error: string | null;
  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  // CRUD operations
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  // Helpers
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

const PAGE_SIZE = 50;

// Map database row to Transaction type
function mapDbToTransaction(row: {
  id: string;
  user_id: string;
  amount: number;
  type?: string;
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
    type: (row.type as 'expense' | 'income') || 'expense',
    categoryId: row.category_id,
    date: new Date(row.date),
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Generate a temporary ID for optimistic updates
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { categoriesMap } = useCategories();
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const currentPage = useRef(0);
  
  // Track pending operations for undo
  const pendingDeletes = useRef<Map<string, Transaction>>(new Map());
  
  const supabase = createClient();

  // Fetch transactions count
  const fetchCount = useCallback(async () => {
    if (!user || !supabase) return 0;
    
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    return count || 0;
  }, [user, supabase]);

  // Fetch transactions from Supabase with pagination
  const fetchTransactions = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!user || !supabase) {
      setRawTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
      }

      const mappedTransactions = (data || []).map(mapDbToTransaction);
      
      if (append) {
        setRawTransactions((prev) => [...prev, ...mappedTransactions]);
      } else {
        setRawTransactions(mappedTransactions);
        // Fetch total count on initial load
        const count = await fetchCount();
        setTotalCount(count);
      }
      
      setHasMore(mappedTransactions.length === PAGE_SIZE);
      currentPage.current = page;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      if (!append) {
        setRawTransactions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, fetchCount]);

  // Load more transactions
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchTransactions(currentPage.current + 1, true);
  }, [fetchTransactions, hasMore, isLoading]);

  // Load transactions when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions(0, false);
    } else {
      setRawTransactions([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchTransactions]);

  // Subscribe to realtime changes (but don't refetch - let optimistic updates handle it)
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
        (payload) => {
          // Handle realtime updates for external changes
          if (payload.eventType === 'INSERT') {
            const newTx = mapDbToTransaction(payload.new as Parameters<typeof mapDbToTransaction>[0]);
            // Only add if not already present (avoid duplicates from optimistic updates)
            setRawTransactions((prev) => {
              if (prev.some(t => t.id === newTx.id)) return prev;
              return [newTx, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTx = mapDbToTransaction(payload.new as Parameters<typeof mapDbToTransaction>[0]);
            setRawTransactions((prev) => 
              prev.map(t => t.id === updatedTx.id ? updatedTx : t)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setRawTransactions((prev) => prev.filter(t => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Enrich transactions with category data - use Map for O(1) lookups
  const transactions: TransactionWithCategory[] = useMemo(() => {
    return rawTransactions.map((t) => {
      const category = categoriesMap.get(t.categoryId);
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
  }, [rawTransactions, categoriesMap]);

  // Create transaction with optimistic update
  const createTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      // Create optimistic transaction
      const tempId = generateTempId();
      const optimisticTransaction: Transaction = {
        id: tempId,
        userId: user.id,
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        date: input.date,
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add optimistically
      setRawTransactions((prev) => [optimisticTransaction, ...prev]);
      setTotalCount((prev) => prev + 1);

      try {
        // Use local date format to avoid timezone issues
        const localDate = `${input.date.getFullYear()}-${String(input.date.getMonth() + 1).padStart(2, '0')}-${String(input.date.getDate()).padStart(2, '0')}`;
        const localTime = `${String(input.date.getHours()).padStart(2, '0')}:${String(input.date.getMinutes()).padStart(2, '0')}:00`;
        const dateTimeString = `${localDate}T${localTime}`;
        
        const { data, error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount: input.amount,
            type: input.type,
            category_id: input.categoryId,
            date: dateTimeString,
            notes: input.notes || null,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        const newTransaction = mapDbToTransaction(data);
        
        // Replace optimistic transaction with real one
        setRawTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? newTransaction : t))
        );
        
        return newTransaction;
      } catch (err) {
        // Rollback optimistic update
        setRawTransactions((prev) => prev.filter((t) => t.id !== tempId));
        setTotalCount((prev) => prev - 1);
        throw err;
      }
    },
    [user, supabase]
  );

  // Update transaction with optimistic update
  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput): Promise<Transaction> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      // Find existing transaction
      const existingTransaction = rawTransactions.find((t) => t.id === id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      // Create optimistic update
      const optimisticTransaction: Transaction = {
        ...existingTransaction,
        amount: input.amount ?? existingTransaction.amount,
        type: input.type ?? existingTransaction.type,
        categoryId: input.categoryId ?? existingTransaction.categoryId,
        date: input.date ?? existingTransaction.date,
        notes: input.notes !== undefined ? input.notes : existingTransaction.notes,
        updatedAt: new Date(),
      };

      // Apply optimistically
      setRawTransactions((prev) =>
        prev.map((t) => (t.id === id ? optimisticTransaction : t))
      );

      try {
        const updateData: Record<string, unknown> = {};
        if (input.amount !== undefined) updateData.amount = input.amount;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
        if (input.date !== undefined) {
          // Use local date format to avoid timezone issues
          const d = input.date;
          const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const localTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
          updateData.date = `${localDate}T${localTime}`;
        }
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
      } catch (err) {
        // Rollback optimistic update
        setRawTransactions((prev) =>
          prev.map((t) => (t.id === id ? existingTransaction : t))
        );
        throw err;
      }
    },
    [user, supabase, rawTransactions]
  );

  // Delete transaction with undo support
  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      // Find and store the transaction for potential undo
      const transactionToDelete = rawTransactions.find((t) => t.id === id);
      if (!transactionToDelete) {
        throw new Error('Transaction not found');
      }

      // Store for undo
      pendingDeletes.current.set(id, transactionToDelete);

      // Optimistically remove
      setRawTransactions((prev) => prev.filter((t) => t.id !== id));
      setTotalCount((prev) => prev - 1);

      // Show toast with undo option
      const undoDelete = async () => {
        const deletedTransaction = pendingDeletes.current.get(id);
        if (!deletedTransaction) return;

        // Re-add to UI immediately
        setRawTransactions((prev) => {
          // Insert in correct position based on date
          const newList = [...prev, deletedTransaction];
          return newList.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        setTotalCount((prev) => prev + 1);
        pendingDeletes.current.delete(id);

        // Re-insert in database
        try {
          await supabase
            .from('transactions')
            .insert({
              id: deletedTransaction.id,
              user_id: deletedTransaction.userId,
              amount: deletedTransaction.amount,
              category_id: deletedTransaction.categoryId,
              date: deletedTransaction.date.toISOString().split('T')[0],
              notes: deletedTransaction.notes || null,
            });
          toast.success('Transaction restored');
        } catch {
          // If restore fails, remove from UI again
          setRawTransactions((prev) => prev.filter((t) => t.id !== id));
          setTotalCount((prev) => prev - 1);
          toast.error('Failed to restore transaction');
        }
      };

      toast.success('Transaction deleted', {
        action: {
          label: 'Undo',
          onClick: undoDelete,
        },
        duration: 5000,
      });

      // Perform actual delete
      try {
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Clear from pending deletes after successful delete
        // Keep it for a bit in case user wants to undo
        setTimeout(() => {
          pendingDeletes.current.delete(id);
        }, 6000);
      } catch (err) {
        // Rollback optimistic delete
        setRawTransactions((prev) => {
          const newList = [...prev, transactionToDelete];
          return newList.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        setTotalCount((prev) => prev + 1);
        pendingDeletes.current.delete(id);
        throw err;
      }
    },
    [user, supabase, rawTransactions]
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

  const refetch = useCallback(async () => {
    currentPage.current = 0;
    await fetchTransactions(0, false);
  }, [fetchTransactions]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        hasMore,
        loadMore,
        totalCount,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
        getFilteredTransactions,
        getTransactionsByMonth,
        getMonthlyTotal,
        getCategoryTotal,
        refetch,
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
