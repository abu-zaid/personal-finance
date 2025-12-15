'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
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
import { generateId, getMonthString } from '@/lib/utils';

interface TransactionsContextType {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
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
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

const STORAGE_KEY = 'financeflow_transactions';

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { getCategoryById } = useCategories();
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from localStorage
  useEffect(() => {
    if (!user) {
      setRawTransactions([]);
      setIsLoading(false);
      return;
    }

    const loadTransactions = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Transaction[];
          // Convert date strings back to Date objects
          const transactionsWithDates = parsed.map((t) => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          }));
          setRawTransactions(transactionsWithDates);
        }
      } catch {
        setRawTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Enrich transactions with category data
  const transactions: TransactionWithCategory[] = rawTransactions.map((t) => {
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
            color: 'slate',
          },
    };
  });

  const saveToStorage = (trans: Transaction[], userId: string) => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(trans));
  };

  const createTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction> => {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const newTransaction: Transaction = {
        id: generateId(),
        userId: user.id,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };

      const updatedTransactions = [...rawTransactions, newTransaction];
      setRawTransactions(updatedTransactions);
      saveToStorage(updatedTransactions, user.id);

      return newTransaction;
    },
    [user, rawTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput): Promise<Transaction> => {
      if (!user) throw new Error('User not authenticated');

      const transactionIndex = rawTransactions.findIndex((t) => t.id === id);
      if (transactionIndex === -1) throw new Error('Transaction not found');

      const updatedTransaction: Transaction = {
        ...rawTransactions[transactionIndex],
        ...input,
        updatedAt: new Date(),
      };

      const updatedTransactions = [...rawTransactions];
      updatedTransactions[transactionIndex] = updatedTransaction;

      setRawTransactions(updatedTransactions);
      saveToStorage(updatedTransactions, user.id);

      return updatedTransaction;
    },
    [user, rawTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      const updatedTransactions = rawTransactions.filter((t) => t.id !== id);
      setRawTransactions(updatedTransactions);
      saveToStorage(updatedTransactions, user.id);
    },
    [user, rawTransactions]
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
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
        getFilteredTransactions,
        getTransactionsByMonth,
        getMonthlyTotal,
        getCategoryTotal,
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
