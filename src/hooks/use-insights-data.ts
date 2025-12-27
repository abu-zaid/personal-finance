import { useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useGetBudgetsQuery, useGetBudgetAllocationsQuery } from '@/lib/features/api/apiSlice';
import { fetchInsightsData, selectInsights } from '@/lib/features/insights/insightsSlice';
import { getMonthString } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

export function useInsightsData() {
    const dispatch = useAppDispatch();
    const {
        spendingTrends,
        categoryBreakdown,
        financialHealth,
        smartInsights,
        status,
        lastUpdated
    } = useAppSelector(selectInsights);

    // Use RTK Query for budgets
    const { data: budgets = [] } = useGetBudgetsQuery();
    const { data: allocations = [] } = useGetBudgetAllocationsQuery();

    const { symbol, formatCurrency } = useCurrency();
    const currentMonth = getMonthString(new Date());

    // Find current budget
    const currentBudget = useMemo(() => {
        const budget = budgets.find(b => b.month === currentMonth);
        if (!budget) return null;

        const budgetAllocations = allocations.filter(a => a.budget_id === budget.id);

        return {
            id: budget.id,
            month: budget.month,
            totalAmount: budget.total_amount,
            allocations: budgetAllocations.map(a => ({
                categoryId: a.category_id,
                amount: a.amount
            }))
        };
    }, [budgets, allocations, currentMonth]);

    // Trigger fetch if stale or missing (simple cache policy: 5 minutes)
    useEffect(() => {
        const shouldFetch = status === 'idle' || (lastUpdated && Date.now() - lastUpdated > 5 * 60 * 1000);
        if (shouldFetch && status !== 'loading') {
            dispatch(fetchInsightsData());
        }
    }, [dispatch, status, lastUpdated]);


    // Derived values
    const currentMonthTotal = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const monthlyTrendData = spendingTrends;

    // Calculate Month Change (Current vs Previous)
    const prevMonthVal = spendingTrends.length >= 2 ? spendingTrends[spendingTrends.length - 2].value : 0;
    const currMonthVal = spendingTrends.length >= 1 ? spendingTrends[spendingTrends.length - 1].value : 0;

    const monthChange = prevMonthVal > 0
        ? ((currMonthVal - prevMonthVal) / prevMonthVal) * 100
        : 0;

    const budgetUsage = currentBudget ? (currentMonthTotal / currentBudget.totalAmount) * 100 : 0;
    const budgetRemaining = currentBudget ? currentBudget.totalAmount - currentMonthTotal : 0;

    // Averages
    const totalHistory = spendingTrends.reduce((sum, m) => sum + m.value, 0);
    const sixMonthAverage = spendingTrends.length > 0 ? totalHistory / spendingTrends.length : 0;

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsed = new Date().getDate();
    const dailyAverage = daysElapsed > 0 ? currentMonthTotal / daysElapsed : 0;
    const projectedTotal = currentMonthTotal + (dailyAverage * (daysInMonth - daysElapsed));

    return {
        // Data
        transactions: [], // Legacy compat, redundant now
        currentMonthTotal,
        monthChange,
        monthlyTrendData,
        categoryBreakdown,
        currentBudget,
        budgetUsage,
        budgetRemaining,

        // Calculated
        dailyAverage,
        projectedTotal,
        sixMonthAverage,

        // Utils
        formatCurrency,
        isLoading: status === 'loading',

        // New Slice Data directly available
        financialHealth,
        smartInsights
    };
}
