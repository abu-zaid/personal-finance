'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Stack, Grid } from '@/components/ui/layout';
import { HeroBalanceCard } from '@/components/dashboard/hero-balance-card';
import { QuickStatsGrid } from '@/components/dashboard/quick-stats-grid';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown';
import { BudgetOverviewCard } from '@/components/dashboard/budget-overview-card';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { useAppDispatch } from '@/lib/hooks';
import { openTransactionModal } from '@/lib/features/transactions/transactionsSlice';
import { useCurrency } from '@/hooks/use-currency';

interface DashboardClientProps {
    data: {
        user: any;
        monthlyIncome: number;
        monthlyExpense: number;
        transactions: any[];
        currentBudget: any;
        allMonthExpenses: any[];
        categories: any[];
    };
}

export function DashboardClient({ data }: DashboardClientProps) {
    const dispatch = useAppDispatch();
    const { symbol } = useCurrency();
    const {
        monthlyIncome,
        monthlyExpense,
        transactions,
        currentBudget,
        allMonthExpenses,
        categories
    } = data;

    const totalBalance = monthlyIncome - monthlyExpense;

    // Calculate daily spending data for chart
    const dailyData = (() => {
        const dailyMap = new Map<string, { amount: number; count: number }>();

        allMonthExpenses.forEach(tx => {
            const dateStr = format(new Date(tx.date), 'yyyy-MM-dd');
            const existing = dailyMap.get(dateStr) || { amount: 0, count: 0 };
            dailyMap.set(dateStr, {
                amount: existing.amount + tx.amount,
                count: existing.count + 1
            });
        });

        const result = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            ...data
        }));

        console.log('Daily Data for Chart:', result);
        console.log('All Month Expenses:', allMonthExpenses);

        return result;
    })();

    // Calculate category breakdown
    const categoryData = (() => {
        const categoryMap = new Map<string, number>();

        allMonthExpenses.forEach(tx => {
            if (tx.category) {
                const existing = categoryMap.get(tx.category.id) || 0;
                categoryMap.set(tx.category.id, existing + tx.amount);
            }
        });

        const totalExpense = monthlyExpense;

        return Array.from(categoryMap.entries())
            .map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    id: categoryId,
                    name: category?.name || 'Unknown',
                    icon: category?.icon || 'circle',
                    color: category?.color || '#gray',
                    amount,
                    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
                };
            })
            .sort((a, b) => b.amount - a.amount);
    })();

    // Calculate budget data
    const budgetData = currentBudget ? (() => {
        const spent = monthlyExpense;
        const total = currentBudget.total_amount;
        const remaining = total - spent;
        const percentage = total > 0 ? (spent / total) * 100 : 0;

        // Calculate daily allowance
        const today = new Date();
        const lastDayOfMonth = endOfMonth(today);
        const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);
        const todayStr = format(today, 'yyyy-MM-dd');
        const todaySpending = allMonthExpenses
            .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === todayStr)
            .reduce((sum, t) => sum + t.amount, 0);
        const dailyBudget = remaining / daysRemaining;
        const dailyAllowance = dailyBudget - todaySpending;

        // Top at-risk categories (would need budget allocations data)
        const topCategories: any[] = [];

        return {
            total,
            spent,
            remaining,
            percentage,
            dailyAllowance,
            topCategories
        };
    })() : undefined;

    // Budget status for quick stats
    const budgetStatus = budgetData ? {
        utilized: budgetData.spent,
        total: budgetData.total,
        percentage: budgetData.percentage
    } : undefined;

    const handleAddIncome = () => {
        dispatch(openTransactionModal());
        // Could pre-set type to 'income' in modal state
    };

    const handleAddExpense = () => {
        dispatch(openTransactionModal());
        // Could pre-set type to 'expense' in modal state
    };

    return (
        <Stack gap={6} className="pb-24 md:pb-6">
            {/* Hero Balance Card */}
            <HeroBalanceCard
                totalBalance={totalBalance}
                monthlyIncome={monthlyIncome}
                monthlyExpense={monthlyExpense}
                symbol={symbol}
                onAddIncome={handleAddIncome}
                onAddExpense={handleAddExpense}
            />

            {/* Quick Stats Grid */}
            <QuickStatsGrid
                monthlyIncome={monthlyIncome}
                monthlyExpense={monthlyExpense}
                netSavings={totalBalance}
                budgetStatus={budgetStatus}
                symbol={symbol}
            />

            {/* Main Content Grid */}
            <Grid cols={1} gap={6} className="md:grid-cols-3">
                {/* Left Column (2/3) */}
                <Stack gap={6} className="md:col-span-2">
                    <SpendingChart
                        dailyData={dailyData}
                        symbol={symbol}
                        days={7}
                    />
                    <CategoryBreakdown
                        categories={categoryData}
                        totalExpense={monthlyExpense}
                        symbol={symbol}
                    />
                </Stack>

                {/* Right Column (1/3) */}
                <Stack gap={6}>
                    <BudgetOverviewCard
                        budgetData={budgetData}
                        symbol={symbol}
                    />
                    <RecentActivityFeed
                        transactions={transactions}
                        symbol={symbol}
                        limit={7}
                    />
                </Stack>
            </Grid>
        </Stack>
    );
}
