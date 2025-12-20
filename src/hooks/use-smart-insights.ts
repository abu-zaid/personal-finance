import { useMemo } from 'react';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useBudgets } from '@/context/budgets-context';
import { getMonthString } from '@/lib/utils';
import { subMonths, isSameDay, startOfDay, subDays } from 'date-fns';

interface SmartInsight {
    type: 'opportunity' | 'warning' | 'achievement' | 'tip';
    title: string;
    message: string;
    action?: string;
    impact?: string; // e.g., "Save $150/mo"
}

export function useSmartInsights(): SmartInsight[] {
    const { transactions, getMonthlyExpenses } = useTransactions();
    const { categories } = useCategories();
    const { getBudgetByMonth } = useBudgets();

    const currentMonth = getMonthString(new Date());
    const previousMonth = getMonthString(subMonths(new Date(), 1));

    return useMemo(() => {
        const insights: SmartInsight[] = [];
        const currentExpenses = getMonthlyExpenses(currentMonth);
        const previousExpenses = getMonthlyExpenses(previousMonth);
        const budget = getBudgetByMonth(currentMonth);

        // Current month transactions
        const currentMonthTxns = transactions.filter(
            t => getMonthString(new Date(t.date)) === currentMonth && t.type === 'expense'
        );

        // 1. Budget Projection
        if (budget && budget.totalAmount > 0) {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const daysElapsed = new Date().getDate();
            const daysRemaining = daysInMonth - daysElapsed;

            if (daysElapsed > 0) {
                const dailyAverage = currentExpenses / daysElapsed;
                const projectedTotal = currentExpenses + (dailyAverage * daysRemaining);
                const projectedOverage = projectedTotal - budget.totalAmount;

                if (projectedOverage > 0) {
                    insights.push({
                        type: 'warning',
                        title: 'Budget Alert',
                        message: `At current pace, you'll exceed budget by ${Math.round(projectedOverage)}`,
                        action: 'Reduce daily spending',
                        impact: `Need to spend <${Math.round((budget.totalAmount - currentExpenses) / daysRemaining)}/day`,
                    });
                }
            }
        }

        // 2. Category Optimization
        const categorySpending = categories.map(cat => {
            const amount = currentMonthTxns
                .filter(t => t.categoryId === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { category: cat, amount };
        }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

        if (categorySpending.length > 0 && currentExpenses > 0) {
            const topCategory = categorySpending[0];
            const percentage = (topCategory.amount / currentExpenses) * 100;

            if (percentage > 30) {
                const savingsOpportunity = topCategory.amount * 0.2; // 20% reduction
                insights.push({
                    type: 'opportunity',
                    title: 'Savings Opportunity',
                    message: `${topCategory.category.name} is ${percentage.toFixed(0)}% of spending`,
                    action: 'Reduce by 20%',
                    impact: `Save $${Math.round(savingsOpportunity)}/mo`,
                });
            }
        }

        // 3. Spending Trend
        if (previousExpenses > 0) {
            const changePercent = ((currentExpenses - previousExpenses) / previousExpenses) * 100;

            if (changePercent > 15) {
                insights.push({
                    type: 'warning',
                    title: 'Spending Spike',
                    message: `Up ${changePercent.toFixed(0)}% from last month`,
                    action: 'Review recent transactions',
                });
            } else if (changePercent < -10) {
                insights.push({
                    type: 'achievement',
                    title: 'Great Progress!',
                    message: `Spending down ${Math.abs(changePercent).toFixed(0)}% from last month`,
                });
            }
        }

        // 4. Unusual Transactions (Anomaly Detection)
        if (currentMonthTxns.length > 5) {
            const amounts = currentMonthTxns.map(t => t.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);

            const anomalies = currentMonthTxns.filter(t => t.amount > mean + (2 * stdDev));

            if (anomalies.length > 0 && anomalies.length < 3) {
                const anomaly = anomalies[0];
                insights.push({
                    type: 'warning',
                    title: 'Unusual Charge',
                    message: `$${anomaly.amount} in ${anomaly.category?.name || 'Unknown'}`,
                    action: 'Verify transaction',
                });
            }
        }

        // 5. Streak/Habit Insights
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = startOfDay(subDays(new Date(), i));
            return transactions.filter(t => isSameDay(new Date(t.date), date) && t.type === 'expense');
        });

        const daysWithSpending = last7Days.filter(day => day.length > 0).length;

        if (daysWithSpending === 7) {
            insights.push({
                type: 'tip',
                title: 'Daily Spending',
                message: 'You spent money every day this week',
                action: 'Try a no-spend day',
                impact: 'Build better habits',
            });
        }

        // Return top 3 most important insights
        const priorityOrder = { warning: 0, opportunity: 1, achievement: 2, tip: 3 };
        return insights
            .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
            .slice(0, 3);
    }, [transactions, categories, getMonthlyExpenses, getBudgetByMonth, currentMonth, previousMonth]);
}
