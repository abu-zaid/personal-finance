'use client';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { useGetTransactionsQuery, useGetCategoriesQuery } from '@/lib/features/api/apiSlice';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useAuth } from '@/context/auth-context';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactionsQuery();
    const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

    if (!user) {
        redirect('/login');
    }

    const isLoading = transactionsLoading || categoriesLoading;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // Calculate current month data
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

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

    const dashboardData = {
        user,
        monthlyIncome,
        monthlyExpense,
        transactions: transactions.slice(0, 10), // Recent 10
        currentBudget: null, // TODO: Fetch from RTK Query when needed
        allMonthExpenses,
        categories,
    };

    return <DashboardClient data={dashboardData} />;
}
