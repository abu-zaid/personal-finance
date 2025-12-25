'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, getMonth, getYear } from 'date-fns';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useAuth } from '@/context/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import {
    fetchBudgetWithSpending,
    createBudget,
    updateBudget,
    selectCurrentBudget,
    selectBudgetsStatus
} from '@/lib/features/budgets/budgetsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { BudgetAllocation } from '@/types';
import { getMonthString } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function useBudgetsView() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const categories = useAppSelector(selectCategories);
    const currentBudget = useAppSelector(selectCurrentBudget);
    const status = useAppSelector(selectBudgetsStatus);
    const { formatCurrency, symbol } = useCurrency();

    // -- State --
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dialogOpen, setDialogOpen] = useState(false);

    // Derived Month String
    const currentMonth = useMemo(() => getMonthString(selectedDate), [selectedDate]);
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return getMonth(selectedDate) === getMonth(now) && getYear(selectedDate) === getYear(now);
    }, [selectedDate]);

    // -- Effects --
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchBudgetWithSpending(currentMonth));
        }
    }, [dispatch, currentMonth, user?.id]);

    // -- Computed Stats --
    const isLoading = status === 'loading';
    const totalMonthSpent = currentBudget?.totalSpent || 0;
    const overallRemaining = currentBudget ? currentBudget.totalAmount - totalMonthSpent : 0;
    const overallPercentage = currentBudget?.totalAmount
        ? (totalMonthSpent / currentBudget.totalAmount) * 100
        : 0;

    // Budget Allocations with Category Info
    const allocationsWithSpending = useMemo(() => {
        if (!currentBudget) return [];

        return currentBudget.allocations.map(allocation => {
            const category = categories.find(c => c.id === allocation.categoryId);
            return {
                ...allocation,
                category,
                percentage: allocation.amount > 0 ? (allocation.spent / allocation.amount) * 100 : 0
            };
        }).sort((a, b) => b.percentage - a.percentage);
    }, [currentBudget, categories]);

    const categoriesOverBudget = allocationsWithSpending.filter(a => a.percentage >= 100).length;
    const categoriesOnTrack = allocationsWithSpending.filter(a => a.percentage < 75).length;

    const budgetStatus = useMemo(() => {
        if (!currentBudget) return null;
        if (overallPercentage >= 100) return { label: 'Over Budget', color: 'destructive' as const, icon: AlertTriangle };
        if (overallPercentage >= 80) return { label: 'Almost There', color: 'warning' as const, icon: AlertTriangle };
        return { label: 'On Track', color: 'success' as const, icon: CheckCircle2 };
    }, [currentBudget, overallPercentage]);

    // -- Actions --
    const handlePrevMonth = useCallback(() => setSelectedDate(prev => subMonths(prev, 1)), []);
    const handleNextMonth = useCallback(() => setSelectedDate(prev => addMonths(prev, 1)), []);

    const handleSaveBudget = async (totalBudget: number, allocations: Record<string, number>) => {
        if (totalBudget <= 0) {
            toast.error('Please enter a total budget amount');
            return;
        }

        try {
            const budgetAllocations: BudgetAllocation[] = Object.entries(allocations)
                .filter(([, amount]) => amount > 0)
                .map(([categoryId, amount]) => ({ categoryId, amount }));

            // Optimistic update logic handled in Slice (partially)
            if (currentBudget) {
                await dispatch(updateBudget({
                    id: currentBudget.id,
                    input: {
                        totalAmount: totalBudget,
                        allocations: budgetAllocations,
                    }
                })).unwrap();
                toast.success('Budget updated');
            } else {
                await dispatch(createBudget({
                    month: currentMonth,
                    totalAmount: totalBudget,
                    allocations: budgetAllocations,
                })).unwrap();
                toast.success('Budget created');
            }

            setDialogOpen(false);
            // Re-fetch to ensure spending triggers update if needed (although slice handles optimistic)
            dispatch(fetchBudgetWithSpending(currentMonth));
        } catch (error) {
            console.error(error);
            toast.error('Failed to save budget');
            throw error; // Let component handle loading state if needed
        }
    };

    return {
        // Data
        currentBudget,
        categories,
        allocationsWithSpending,
        status,
        isLoading,
        currentMonth,
        isCurrentMonth,
        selectedDate,
        symbol,
        formatCurrency,

        // Stats
        totalMonthSpent,
        overallRemaining,
        overallPercentage,
        categoriesOverBudget,
        categoriesOnTrack,
        budgetStatus,

        // UI State
        dialogOpen,
        setDialogOpen,

        // Handlers
        handlePrevMonth,
        handleNextMonth,
        handleSaveBudget
    };
}
