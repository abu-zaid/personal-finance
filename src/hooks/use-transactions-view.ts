'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useAuth } from '@/context/auth-context';
import { useDebounce } from './use-debounce';
import {
    fetchTransactions,
    deleteTransaction,
    selectTransactions,
    selectTransactionsStatus,
    selectTransactionsError,
    setFilters
} from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { TransactionSort, TransactionWithCategory } from '@/types';

export function useTransactionsView() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();

    // Redux Selectors
    const transactions = useAppSelector(selectTransactions);
    const status = useAppSelector(selectTransactionsStatus);
    const error = useAppSelector(selectTransactionsError);
    const categories = useAppSelector(selectCategories);
    const { hasMore, filters: ReduxFilters, totalCount } = useAppSelector((state) => state.transactions);

    // Initial Loading State
    const isLoading = status === 'loading';
    const isInitialLoading = isLoading && transactions.length === 0;

    // Calculate stats from existing transaction data instead of separate API call
    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            net: income - expense
        };
    }, [transactions]);

    // Local UI State
    const [search, setSearch] = useState(ReduxFilters.search || '');
    const debouncedSearch = useDebounce(search, 500);
    const [sortConfig, setSortConfig] = useState<TransactionSort>({ field: 'date', order: 'desc' });

    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Active Filters Calculation (memoized)
    const activeFilterCount = useMemo(() => {
        return [
            ReduxFilters.startDate || ReduxFilters.endDate,
            (ReduxFilters.categoryIds?.length || 0) > 0,
            ReduxFilters.type && ReduxFilters.type !== 'all'
        ].filter(Boolean).length;
    }, [ReduxFilters]);


    // --- Effects ---

    // Consolidated initialization effect
    useEffect(() => {
        if (!user?.id) return;

        // Set default filters if not set
        if (!ReduxFilters.startDate && !ReduxFilters.endDate) {
            const now = new Date();
            dispatch(setFilters({
                ...ReduxFilters,
                startDate: startOfMonth(now).toISOString(),
                endDate: endOfMonth(now).toISOString()
            }));
        }

        // Fetch only if we don't have data
        if (transactions.length === 0 && status === 'idle') {
            dispatch(fetchTransactions({ page: 0 }));
        }
    }, [user?.id, dispatch]); // Only run on mount or user change

    // Handle search changes
    useEffect(() => {
        const currentSearch = ReduxFilters.search || '';
        const newSearch = debouncedSearch || '';

        if (newSearch !== currentSearch) {
            dispatch(setFilters({ ...ReduxFilters, search: newSearch }));
        }
    }, [debouncedSearch, dispatch, ReduxFilters]);

    // Fetch transactions when filters change
    useEffect(() => {
        if (!user?.id) return;
        if (transactions.length === 0 && status === 'idle') return; // Skip if initial load

        dispatch(fetchTransactions({ page: 0 }));
    }, [ReduxFilters, dispatch, user?.id]);


    // --- Handlers ---

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            const nextPage = Math.ceil(transactions.length / 20);
            dispatch(fetchTransactions({ page: nextPage, append: true }));
        }
    }, [hasMore, isLoading, transactions.length, dispatch]);

    const handleFilterChange = useCallback((updates: any) => {
        const newFilters = { ...ReduxFilters, ...updates };
        dispatch(setFilters(newFilters));
        // fetchTransactions will be triggered by the filter change effect
        // No need to call it here to avoid duplicate calls
    }, [ReduxFilters, dispatch]);

    const handleClearFilters = useCallback(() => {
        setSearch(''); // Clear local search too
        // Reset to Default (This Month) instead of All Time
        const now = new Date();
        dispatch(setFilters({
            startDate: startOfMonth(now).toISOString(),
            endDate: endOfMonth(now).toISOString()
        }));
        setSortConfig({ field: 'date', order: 'desc' });
        // fetchTransactions will be triggered by the filter change effect
    }, [dispatch]);

    const handleToggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const handleBatchDelete = async () => {
        const ids = Array.from(selectedIds);
        setSelectedIds(new Set());
        setIsBatchMode(false);

        try {
            await Promise.all(ids.map(id => dispatch(deleteTransaction(id)).unwrap()));
            toast.success(`Deleted ${ids.length} transactions`);
            // Stats will be recalculated automatically from updated transactions
            // No need to call fetchFilteredStats
        } catch (err) {
            toast.error("Some transactions failed to delete");
        }
    };


    // --- Computing Views ---

    // 1. Client-side Sort
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Ensure consistent sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.field) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'category':
                    comparison = a.category.name.localeCompare(b.category.name);
                    break;
            }
            return sortConfig.order === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [transactions, sortConfig]);

    // 2. Group By Date
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, TransactionWithCategory[]> = {};
        filteredTransactions.forEach(t => {
            const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(t);
        });
        return groups;
    }, [filteredTransactions]);


    return {
        // Data
        transactions: filteredTransactions,
        groupedTransactions,
        stats,
        categories,
        isLoading,
        isInitialLoading,
        hasMore,

        // State
        search,
        filters: ReduxFilters,
        sortConfig,
        activeFilterCount,
        isBatchMode,
        selectedIds,

        // Actions
        setSearch,
        setSortConfig,
        setIsBatchMode,
        setSelectedIds,

        // Handlers
        onLoadMore: handleLoadMore,
        onFilterChange: handleFilterChange,
        onClearFilters: handleClearFilters,
        onToggleSelection: handleToggleSelection,
        onBatchDelete: handleBatchDelete
    };
}
