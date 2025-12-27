'use client';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { useGetTransactionsQuery, useGetCategoriesQuery, useGetBudgetsQuery, useGetBudgetAllocationsQuery } from '@/lib/features/api/apiSlice';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useAuth } from '@/context/auth-context';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactionsQuery();
    const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
    const { data: budgets = [], isLoading: budgetsLoading } = useGetBudgetsQuery();
    const { data: allocations = [], isLoading: allocationsLoading } = useGetBudgetAllocationsQuery();

    if (!user) {
        redirect('/login');
    }

    const isLoading = transactionsLoading || categoriesLoading || budgetsLoading || allocationsLoading;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // Calculate current month data
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    const currentMonthStr = format(today, 'yyyy-MM');

    const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
    });

    const monthlyIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const allMonthExpenses = monthTransactions.filter(t => t.type === 'expense');

    // Find current month's budget
    const currentBudget = budgets.find(b => b.month === currentMonthStr);

    const dashboardData = {
        user,
        monthlyIncome,
        monthlyExpense,
        transactions: transactions.slice(0, 10), // Recent 10
        currentBudget: currentBudget || null,
        allMonthExpenses,
        categories,
    };

    return <DashboardClient data={dashboardData} />;
}
