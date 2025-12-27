'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, addMonths, subMonths, getMonth, getYear } from 'date-fns';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import {
    useGetBudgetsQuery,
    useGetBudgetAllocationsQuery,
    useGetTransactionsQuery,
    useGetCategoriesQuery,
    useAddBudgetMutation,
    useUpdateBudgetMutation
} from '@/lib/features/api/apiSlice';
import { getMonthString } from '@/lib/utils';
import { BudgetWithSpending } from '@/types';

export function useBudgetsView() {
    const { user } = useAuth();
    const { formatCurrency, symbol } = useCurrency();

    // -- State --
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dialogOpen, setDialogOpen] = useState(false);

    // Derived Month String
    const currentMonthStr = useMemo(() => getMonthString(selectedDate), [selectedDate]);
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return getMonth(selectedDate) === getMonth(now) && getYear(selectedDate) === getYear(now);
    }, [selectedDate]);

    // -- API Queries --
    const { data: budgets = [], isLoading: isLoadingBudgets } = useGetBudgetsQuery();
    const { data: allocations = [], isLoading: isLoadingAllocations } = useGetBudgetAllocationsQuery();
    const { data: transactions = [], isLoading: isLoadingTransactions } = useGetTransactionsQuery();
    const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();

    const [addBudget] = useAddBudgetMutation();
    const [updateBudget] = useUpdateBudgetMutation();

    const isLoading = isLoadingBudgets || isLoadingAllocations || isLoadingTransactions || isLoadingCategories;

    // -- Data JOIN & Processing --

    // 1. Find Budget for Selected Month
    const currentBudgetRaw = useMemo(() => {
        return budgets.find(b => b.month === currentMonthStr) || null;
    }, [budgets, currentMonthStr]);

    // 2. Spending Calculations
    const { totalMonthSpent, allocationsWithSpending } = useMemo(() => {
        if (!currentBudgetRaw) return { totalMonthSpent: 0, allocationsWithSpending: [] };

        // Filter transactions for this month
        const monthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            // Simple string prefix check for YYYY-MM match on ISO date
            // or safer date-fns check
            return getMonthString(d) === currentMonthStr && t.type === 'expense';
        });

        // Calculate total spent
        const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Calculate spending per category
        const spendingByCategory: Record<string, number> = {};
        monthTransactions.forEach(t => {
            if (t.category_id) {
                spendingByCategory[t.category_id] = (spendingByCategory[t.category_id] || 0) + t.amount;
            }
        });

        // Join Allocations with Category & Spending
        const budgetAllocations = allocations.filter(a => a.budget_id === currentBudgetRaw.id);

        const joinedAllocations = budgetAllocations.map(alloc => {
            const category = categories.find(c => c.id === alloc.category_id);
            const spent = spendingByCategory[alloc.category_id] || 0;
            const remaining = alloc.amount - spent;
            const percentageUsed = alloc.amount > 0 ? (spent / alloc.amount) * 100 : 0;

            return {
                id: alloc.id,
                categoryId: alloc.category_id,
                amount: alloc.amount,
                spent,
                remaining,
                percentage: percentageUsed,
                percentageUsed,
                isOverBudget: spent > alloc.amount,
                category: category ? {
                    id: category.id,
                    name: category.name,
                    icon: category.icon,
                    color: category.color
                } : undefined
            };
        }).sort((a, b) => b.percentage - a.percentage);

        return {
            totalMonthSpent: totalSpent,
            allocationsWithSpending: joinedAllocations
        };
    }, [currentBudgetRaw, allocations, transactions, categories, currentMonthStr]);


    // Data for UI
    const currentBudget: BudgetWithSpending | null = currentBudgetRaw ? {
        id: currentBudgetRaw.id,
        userId: currentBudgetRaw.user_id,
        month: currentBudgetRaw.month,
        totalAmount: currentBudgetRaw.total_amount,
        totalSpent: totalMonthSpent,
        totalRemaining: currentBudgetRaw.total_amount - totalMonthSpent,
        allocations: allocationsWithSpending,
        createdAt: new Date(currentBudgetRaw.created_at || Date.now()),
        updatedAt: new Date(currentBudgetRaw.updated_at || Date.now())
    } : null;

    // -- Computed Stats --
    const overallRemaining = currentBudget ? currentBudget.totalAmount - totalMonthSpent : 0;
    const overallPercentage = currentBudget?.totalAmount
        ? (totalMonthSpent / currentBudget.totalAmount) * 100
        : 0;

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

    const handleSaveBudget = async (totalBudget: number, allocationsMap: Record<string, number>) => {
        if (totalBudget <= 0) {
            toast.error('Please enter a total budget amount');
            return;
        }
        if (!user) return;

        try {
            // Prepare Allocations Array
            const allocationsList = Object.entries(allocationsMap)
                .filter(([, amount]) => amount > 0)
                .map(([categoryId, amount]) => ({
                    category_id: categoryId,
                    amount,
                    user_id: user.id
                }));

            if (currentBudgetRaw) {
                await updateBudget({
                    id: currentBudgetRaw.id,
                    budget: { total_amount: totalBudget },
                    allocations: allocationsList
                }).unwrap();
                toast.success('Budget updated');
            } else {
                await addBudget({
                    budget: {
                        month: currentMonthStr,
                        total_amount: totalBudget,
                        user_id: user.id
                    },
                    allocations: allocationsList
                }).unwrap();
                toast.success('Budget created');
            }
            setDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save budget');
        }
    };

    return {
        // Data
        currentBudget,
        // Map raw categories to simple format if needed for dialog
        categories: categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            isDefault: c.is_default
        })),
        allocationsWithSpending,
        status: isLoading ? 'loading' : 'succeeded',
        isLoading,
        currentMonth: currentMonthStr,
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
