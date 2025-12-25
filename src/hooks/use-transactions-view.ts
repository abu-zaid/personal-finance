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
    fetchFilteredStats,
    selectTransactions,
    selectTransactionsStatus,
    selectTransactionsError,
    selectFilteredStats,
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
    const filteredStats = useAppSelector(selectFilteredStats);

    // Initial Loading State
    const isLoading = status === 'loading';
    const isInitialLoading = isLoading && transactions.length === 0;

    const currentMonth = format(new Date(), 'yyyy-MM'); // Keep for safety if needed, or remove?
    // Logic for stats:
    const stats = useMemo(() => ({
        income: filteredStats.income,
        expense: filteredStats.expense,
        net: filteredStats.income - filteredStats.expense
    }), [filteredStats]);

    // Local UI State
    const [search, setSearch] = useState(ReduxFilters.search || '');
    const debouncedSearch = useDebounce(search, 500);
    const [sortConfig, setSortConfig] = useState<TransactionSort>({ field: 'date', order: 'desc' });

    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Active Filters Calculation
    const activeFilterCount = [
        ReduxFilters.startDate || ReduxFilters.endDate,
        (ReduxFilters.categoryIds?.length || 0) > 0,
        ReduxFilters.type && ReduxFilters.type !== 'all'
    ].filter(Boolean).length;


    // --- Effects ---

    // 0. Set Default Filters (This Month) on Mount
    useEffect(() => {
        if (!ReduxFilters.startDate && !ReduxFilters.endDate) {
            const now = new Date();
            dispatch(setFilters({
                ...ReduxFilters,
                startDate: startOfMonth(now).toISOString(),
                endDate: endOfMonth(now).toISOString()
            }));
            // Fetch immediately with new filters
            dispatch(fetchTransactions({ page: 0 }));
        }
    }, [dispatch]); // Run once on mount to set defaults

    // 1. Fetch Filtered Stats (Total Income/Expense for current view)
    useEffect(() => {
        dispatch(fetchFilteredStats());
    }, [dispatch, ReduxFilters]);

    // 2. Fetch Initial Transactions (and re-fetch on filter change)
    // We listen to ReduxFilters changes + User + Debounced Search
    useEffect(() => {
        if (!user?.id) return;

        // Sync local search to Redux filter if changed
        // Optimization: Only update Redux if debounced value is different from current store value
        const currentSearch = ReduxFilters.search || '';
        const newSearch = debouncedSearch || '';

        if (newSearch !== currentSearch) {
            dispatch(setFilters({ ...ReduxFilters, search: newSearch }));
            dispatch(fetchTransactions({ page: 0 }));
        }

    }, [debouncedSearch, dispatch, ReduxFilters, user?.id]);

    // 3. Initial Load if empty
    useEffect(() => {
        if (user?.id && transactions.length === 0 && status === 'idle') {
            dispatch(fetchTransactions({ page: 0 }));
        }
    }, [user?.id, dispatch, transactions.length, status]);


    // --- Handlers ---

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            const nextPage = Math.ceil(transactions.length / 20);
            dispatch(fetchTransactions({ page: nextPage, append: true }));
        }
    }, [hasMore, isLoading, transactions.length, dispatch]);

    const handleFilterChange = (updates: any) => {
        const newFilters = { ...ReduxFilters, ...updates };
        dispatch(setFilters(newFilters));
        dispatch(fetchTransactions({ page: 0 }));
    };

    const handleClearFilters = () => {
        setSearch(''); // Clear local search too
        // Reset to Default (This Month) instead of All Time
        const now = new Date();
        dispatch(setFilters({
            startDate: startOfMonth(now).toISOString(),
            endDate: endOfMonth(now).toISOString()
        }));
        setSortConfig({ field: 'date', order: 'desc' });
        dispatch(fetchTransactions({ page: 0 }));
    };

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
            // Refresh totals
            dispatch(fetchFilteredStats());
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
