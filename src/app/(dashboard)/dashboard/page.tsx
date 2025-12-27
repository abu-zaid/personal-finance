'use client';

import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';

import { useCurrency } from '@/hooks/use-currency';

import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { SpendingOverview } from '@/components/dashboard/spending-overview';

// Redux
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectUser } from '@/lib/features/auth/authSlice';
import {
    selectTransactions,
    fetchMonthlyAggregates,
    selectMonthlyAggregates,
    fetchTransactions,
    fetchDailyTransactionStats,
    selectDailyStats,
    selectLastModified
} from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import {
    selectCurrentBudget,
    fetchBudgetWithSpending
} from '@/lib/features/budgets/budgetsSlice';

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const transactions = useAppSelector(selectTransactions);
    const categories = useAppSelector(selectCategories);
    const currentBudget = useAppSelector(selectCurrentBudget);
    const aggregates = useAppSelector(selectMonthlyAggregates);
    const dailyStatsMap = useAppSelector(selectDailyStats);
    const lastModified = useAppSelector(selectLastModified);

    const { symbol } = useCurrency();
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const currentMonth = format(new Date(), 'yyyy-MM');

    // Get totals from Redux
    const monthlyIncome = aggregates.monthlyIncome[currentMonth] || 0;
    const monthlyExpense = aggregates.monthlyExpenses[currentMonth] || 0;

    // Fetch monthly totals and budget
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;

            setIsDashboardLoading(true);
            try {
                // Optimized: fetchBudgetWithSpending already populates monthlyExpenses in Redux
                // so we don't need a separate call for expense aggregates
                await Promise.all([
                    dispatch(fetchBudgetWithSpending(currentMonth)),
                    dispatch(fetchMonthlyAggregates({ month: currentMonth, type: 'income' })),
                    // Removed redundant expense aggregate call - budget fetch handles this
                    dispatch(fetchDailyTransactionStats(currentMonth)),
                    // Also fetch initial transactions
                    dispatch(fetchTransactions({ page: 0, pageSize: 20 })),
                    // Short timeout to prevent layout jumping if data loads too fast (~300ms min)
                    new Promise(resolve => setTimeout(resolve, 300))
                ]);
            } catch (err) {
                console.error('Dashboard Load Error:', err);
            } finally {
                setIsDashboardLoading(false);
            }
        };

        loadDashboardData();
    }, [dispatch, currentMonth, lastModified, user ? user.id : null]);

    // Calculate today's spending
    const todaySpending = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return transactions
            .filter(t =>
                t.type === 'expense' &&
                format(new Date(t.date), 'yyyy-MM-dd') === today
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const dailyAllowance = useMemo(() => {
        if (!currentBudget) return 0;

        const budgetRemaining = currentBudget.totalAmount - monthlyExpense;
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);

        const dailyBudget = budgetRemaining / daysRemaining;

        // Subtract today's spending to show how much MORE can be spent
        return dailyBudget - todaySpending;
    }, [currentBudget, monthlyExpense, todaySpending]);

    // Total balance is income - expenses for current month
    const totalBalance = useMemo(() => {
        return monthlyIncome - monthlyExpense;
    }, [monthlyIncome, monthlyExpense]);

    const expenseData = useMemo(() => {
        const currentMonthStats = dailyStatsMap[currentMonth] || [];
        const categoryMap = new Map<string, { name: string; value: number; color: string; icon: string }>();

        // Helper to process a specific date
        const processDate = (dateStr: string) => {
            const stat = currentMonthStats.find((s: any) => s.date === dateStr);
            if (stat && stat.breakdown) {
                stat.breakdown.forEach((item: any) => {
                    const existing = categoryMap.get(item.id) || {
                        name: item.name,
                        value: 0,
                        color: item.color,
                        icon: item.icon
                    };
                    existing.value += item.value;
                    categoryMap.set(item.id, existing);
                });
            }
        };

        if (selectedDate) {
            // If a specific day is selected (e.g. "Mon"), we need to find which date in the last week matches it
            const today = new Date();
            const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return d;
            });

            const matchingDate = days.find(d => format(d, 'EEE') === selectedDate);
            if (matchingDate) {
                processDate(format(matchingDate, 'yyyy-MM-dd'));
            }
        } else {
            // Weekly: Process last 7 days
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                processDate(format(d, 'yyyy-MM-dd'));
            }
        }

        // Convert to array and sort by value
        const sortedCategories = Array.from(categoryMap.values())
            .sort((a, b) => b.value - a.value);

        // Take top 4 or return empty state if no data
        if (sortedCategories.length === 0) {
            return [{ name: 'No Data', value: 1, color: '#e2e8f0', icon: 'circle-off' }];
        }

        // If customized to top items, accumulate the rest into "Other"
        if (sortedCategories.length <= 4) {
            return sortedCategories;
        }

        const topCategories = sortedCategories.slice(0, 3);
        const otherCategories = sortedCategories.slice(3);
        const otherValue = otherCategories.reduce((sum, cat) => sum + cat.value, 0);

        return [
            ...topCategories,
            {
                name: 'Other',
                value: otherValue,
                color: '#94a3b8',
                icon: 'more-horizontal'
            }
        ];
    }, [dailyStatsMap, currentMonth, selectedDate]);

    const trendData = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d;
        });

        const currentMonthStats = dailyStatsMap[currentMonth] || [];

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayName = format(day, 'EEE');

            // Find stat for this day from Redux
            const stat = currentMonthStats.find((s: any) => s.date === dayStr);

            return {
                date: dayName,
                amount: stat?.amount || 0,
                count: stat?.count || 0,
                topCategory: stat?.topCategory || ''
            };
        });
    }, [dailyStatsMap, currentMonth]);

    const isAuthLoading = useAppSelector(state => state.auth.isLoading);



    // Loading State
    // Show skeleton if:
    // 1. Auth is initializing (isAuthLoading)
    // 2. Dashboard data is loading (isDashboardLoading)
    // 3. User is present (implying we are just waiting for data)
    // If !user AND !isAuthLoading, we render nothing (or let middleware redirect)
    if (isAuthLoading || (user && isDashboardLoading)) {

        return (
            <div className="min-h-screen bg-neutral-50/50 dark:bg-background pb-24 lg:pb-8">
                <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6 lg:space-y-8">
                    <DashboardSkeleton />
                </div>
            </div>
        );
    }

    if (!user) {

        return null; // Prevent rendering if not authenticated
    }



    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-background pb-24 lg:pb-8">
            {/* Main Container - Responsive width */}
            <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6 lg:space-y-8">

                <DashboardHeader user={user} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Stats & Charts */}
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        <DashboardSummary
                            totalBalance={totalBalance}
                            monthlyIncome={monthlyIncome}
                            monthlyExpense={monthlyExpense}
                            todaySpending={todaySpending}
                            dailyAllowance={dailyAllowance}
                            symbol={symbol}
                            hasBudget={!!currentBudget}
                        />

                        <SpendingOverview
                            trendData={trendData}
                            expenseData={expenseData}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                        />
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <RecentTransactions transactions={transactions} categories={categories} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
