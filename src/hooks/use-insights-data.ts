import { useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectCurrentBudget, fetchBudgetWithSpending } from '@/lib/features/budgets/budgetsSlice';
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

    const currentBudget = useAppSelector(selectCurrentBudget);

    const { symbol, formatCurrency } = useCurrency();
    const currentMonth = getMonthString(new Date());

    // Trigger fetch if stale or missing (simple cache policy: 5 minutes)
    useEffect(() => {
        const shouldFetch = status === 'idle' || (lastUpdated && Date.now() - lastUpdated > 5 * 60 * 1000);
        if (shouldFetch && status !== 'loading') {
            dispatch(fetchInsightsData());
            // Also ensure budget is loaded
            dispatch(fetchBudgetWithSpending(currentMonth));
        }
    }, [dispatch, status, lastUpdated, currentMonth]);


    // Derived values
    const currentMonthTotal = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
    // previousMonthTotal is implied by trends if needed? 
    // Actually slice doesn't store previousMonthTotal explicitly but spendingTrends has 6 months history.
    // Index 5 is current month? No, `subMonths(0)` is current.
    // spendingTrends[0] is oldest (5 months ago), [5] is current.
    // Wait, my thunk implementation:
    // for (let i = 5; i >= 0; i--) -> push. 
    // i=5 (5 months ago) -> index 0. i=0 (current) -> index 5.

    // So current is spendingTrends[5].value?

    const monthlyTrendData = spendingTrends;

    // Calculate Month Change (Current vs Previous)
    // Previous is index 4 (i=1).
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
