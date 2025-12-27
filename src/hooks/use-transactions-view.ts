'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useAuth } from '@/context/auth-context';
import { useDebounce } from './use-debounce';
import {
    setFilters
} from '@/lib/features/transactions/transactionsSlice';
import { useGetTransactionsQuery, useDeleteTransactionMutation, useGetCategoriesQuery } from '@/lib/features/api/apiSlice';
import { TransactionSort, TransactionWithCategory, TransactionFilters } from '@/types';

export function useTransactionsView() {
    const dispatch = useAppDispatch();
    const { user } = useAuth(); // kept for potential user-check logic if needed

    // API Query
    const { data: rawTransactions = [], isLoading: isQueryLoading } = useGetTransactionsQuery();
    const { data: rawCategories = [] } = useGetCategoriesQuery();
    const [deleteTransaction] = useDeleteTransactionMutation();

    // Redux Selectors (Filters & Categories still useful from Redux or local state)
    const ReduxFilters = useAppSelector((state) => state.transactions.filters);

    // Initial Loading State
    const isInitialLoading = isQueryLoading && rawTransactions.length === 0;

    // Join Transactions with Categories
    const allTransactions: TransactionWithCategory[] = useMemo(() => {
        return rawTransactions.map(t => {
            const category = rawCategories.find(c => c.id === t.category_id) || {
                id: 'unknown',
                name: 'Unknown',
                icon: 'help-circle',
                color: '#cccccc',
                type: 'expense' as const,
                user_id: 'unknown'
            };

            return {
                id: t.id,
                userId: t.user_id,
                amount: t.amount,
                type: t.type,
                date: new Date(t.date),
                notes: t.notes || undefined,
                categoryId: t.category_id,
                category: {
                    id: category.id,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                },
                createdAt: new Date(t.created_at || new Date()),
                updatedAt: new Date(t.updated_at || new Date()),
            } as TransactionWithCategory;
        });
    }, [rawTransactions, rawCategories]);

    // Map Categories to Domain Type
    const categories = useMemo(() => {
        return rawCategories.map(c => ({
            id: c.id,
            userId: c.user_id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            isDefault: c.is_default,
            order: c.sort_order,
            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
            updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
        }));
    }, [rawCategories]);


    // Local UI State
    const [search, setSearch] = useState(ReduxFilters.search || '');
    const debouncedSearch = useDebounce(search, 500);
    const [sortConfig, setSortConfig] = useState<TransactionSort>({ field: 'date', order: 'desc' });
    const [page, setPage] = useState(1); // Client-side pagination
    const ITEMS_PER_PAGE = 20;

    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Active Filters Calculation
    const activeFilterCount = useMemo(() => {
        return [
            ReduxFilters.startDate || ReduxFilters.endDate,
            (ReduxFilters.categoryIds?.length || 0) > 0,
            ReduxFilters.type && ReduxFilters.type !== 'all'
        ].filter(Boolean).length;
    }, [ReduxFilters]);

    // --- Data Processing (Client-Side) ---

    // 1. Filter
    const filteredTransactions = useMemo(() => {
        let result = [...allTransactions];
        const searchTerm = (debouncedSearch || '').toLowerCase();

        // Date Filter
        if (ReduxFilters.startDate && ReduxFilters.endDate) {
            result = result.filter(t => isWithinInterval(t.date, { // t.date is now Date
                start: new Date(ReduxFilters.startDate!),
                end: new Date(ReduxFilters.endDate!)
            }));
        }

        // Type Filter
        if (ReduxFilters.type && ReduxFilters.type !== 'all') {
            result = result.filter(t => t.type === ReduxFilters.type);
        }

        // Category Filter
        if (ReduxFilters.categoryIds && ReduxFilters.categoryIds.length > 0) {
            result = result.filter(t => ReduxFilters.categoryIds?.includes(t.categoryId));
        }

        // Search Filter
        if (searchTerm) {
            result = result.filter(t =>
                (t.notes && t.notes.toLowerCase().includes(searchTerm)) ||
                (t.category?.name && t.category.name.toLowerCase().includes(searchTerm))
            );
        }

        return result;
    }, [allTransactions, ReduxFilters, debouncedSearch]);

    // 2. Sort
    const sortedTransactions = useMemo(() => {
        const sorted = [...filteredTransactions];
        sorted.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.field) {
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
            return sortConfig.order === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }, [filteredTransactions, sortConfig]);

    // 3. Stats Calculation (from filtered data)
    const stats = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        return {
            income,
            expense,
            net: income - expense
        };
    }, [filteredTransactions]);

    // 4. Pagination
    const paginatedTransactions = useMemo(() => {
        return sortedTransactions.slice(0, page * ITEMS_PER_PAGE);
    }, [sortedTransactions, page]);

    const hasMore = paginatedTransactions.length < sortedTransactions.length;

    // 5. Group By Date
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, TransactionWithCategory[]> = {};
        paginatedTransactions.forEach(t => {
            const dateKey = format(t.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(t);
        });
        return groups;
    }, [paginatedTransactions]);

    // --- Handlers ---

    const handleLoadMore = useCallback(() => {
        if (hasMore) {
            setPage(p => p + 1);
        }
    }, [hasMore]);

    const handleFilterChange = useCallback((updates: Partial<TransactionFilters>) => {
        // Ensure strictly string | undefined for Redux compatibility
        const safeUpdates: any = { ...updates };
        if (updates.startDate instanceof Date) safeUpdates.startDate = updates.startDate.toISOString();
        if (updates.endDate instanceof Date) safeUpdates.endDate = updates.endDate.toISOString();

        const newFilters = { ...ReduxFilters, ...safeUpdates };
        dispatch(setFilters(newFilters));
        setPage(1);
    }, [ReduxFilters, dispatch]);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        const now = new Date();
        dispatch(setFilters({
            startDate: startOfMonth(now).toISOString(),
            endDate: endOfMonth(now).toISOString(),
            type: 'all',
            categoryIds: []
        }));
        setSortConfig({ field: 'date', order: 'desc' });
        setPage(1);
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
            await Promise.all(ids.map(id => deleteTransaction(id).unwrap()));
            toast.success(`Deleted ${ids.length} transactions`);
        } catch (err) {
            toast.error("Some transactions failed to delete");
            console.error(err);
        }
    };

    // Explicit Delete Handler
    const handleDelete = async (id: string) => {
        try {
            await deleteTransaction(id).unwrap();
            toast.success("Transaction deleted");
        } catch (err) {
            toast.error("Failed to delete transaction");
        }
    };

    return {
        // Data
        transactions: paginatedTransactions,
        groupedTransactions,
        stats,
        categories,
        isLoading: isQueryLoading,
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
        setSearch: (s: string) => { setSearch(s); dispatch(setFilters({ ...ReduxFilters, search: s })); },
        setSortConfig,
        setIsBatchMode,
        setSelectedIds,

        // Handlers
        onLoadMore: handleLoadMore,
        onFilterChange: handleFilterChange,
        onClearFilters: handleClearFilters,
        onToggleSelection: handleToggleSelection,
        onBatchDelete: handleBatchDelete,
        onDelete: handleDelete
    };
}
