import { useMemo } from 'react';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import { getMonthString } from '@/lib/utils';
import { subMonths } from 'date-fns';

interface FinancialHealthScore {
    overall: number; // 0-100
    savingsRate: number; // 0-100
    budgetAdherence: number; // 0-100
    spendingTrend: number; // 0-100
    consistency: number; // 0-100
    recommendations: string[];
    status: 'excellent' | 'good' | 'fair' | 'poor';
}

export function useFinancialHealth(): FinancialHealthScore {
    const { getMonthlyIncome, getMonthlyExpenses } = useTransactions();
    const { getBudgetByMonth } = useBudgets();

    const currentMonth = getMonthString(new Date());
    const previousMonth = getMonthString(subMonths(new Date(), 1));

    return useMemo(() => {
        const income = getMonthlyIncome(currentMonth);
        const expenses = getMonthlyExpenses(currentMonth);
        const previousExpenses = getMonthlyExpenses(previousMonth);
        const budget = getBudgetByMonth(currentMonth);

        // 1. Savings Rate Score (0-100)
        const savingsAmount = income - expenses;
        const savingsRatePercent = income > 0 ? (savingsAmount / income) * 100 : 0;
        const savingsRateScore = Math.min(Math.max(savingsRatePercent * 2, 0), 100); // 50% savings = 100 score

        // 2. Budget Adherence Score (0-100)
        let budgetAdherenceScore = 50; // Default if no budget
        if (budget && budget.totalAmount > 0) {
            const budgetUsage = (expenses / budget.totalAmount) * 100;
            if (budgetUsage <= 80) {
                budgetAdherenceScore = 100;
            } else if (budgetUsage <= 100) {
                budgetAdherenceScore = 100 - ((budgetUsage - 80) * 2.5); // Linear decrease from 100 to 50
            } else {
                budgetAdherenceScore = Math.max(50 - ((budgetUsage - 100) * 2), 0); // Decrease below 50
            }
        }

        // 3. Spending Trend Score (0-100)
        let spendingTrendScore = 50;
        if (previousExpenses > 0) {
            const changePercent = ((expenses - previousExpenses) / previousExpenses) * 100;
            if (changePercent <= -10) {
                spendingTrendScore = 100; // Spending decreased by 10%+
            } else if (changePercent <= 0) {
                spendingTrendScore = 100 - Math.abs(changePercent) * 5; // Linear from 100 to 50
            } else if (changePercent <= 10) {
                spendingTrendScore = 50 - (changePercent * 2.5); // Linear from 50 to 25
            } else {
                spendingTrendScore = Math.max(25 - ((changePercent - 10) * 1.25), 0);
            }
        }

        // 4. Consistency Score (based on income stability)
        const consistencyScore = income > 0 ? 75 : 50; // Simplified - could track income variance

        // Overall Score (weighted average)
        const overall = Math.round(
            savingsRateScore * 0.35 +
            budgetAdherenceScore * 0.30 +
            spendingTrendScore * 0.25 +
            consistencyScore * 0.10
        );

        // Generate recommendations
        const recommendations: string[] = [];
        if (savingsRateScore < 40) {
            recommendations.push('Increase savings rate to at least 20% of income');
        }
        if (budgetAdherenceScore < 50) {
            recommendations.push('Review budget - you\'re overspending significantly');
        }
        if (spendingTrendScore < 40) {
            recommendations.push('Spending is trending up - identify areas to cut back');
        }
        if (overall >= 80 && recommendations.length === 0) {
            recommendations.push('Great job! Keep up the excellent financial habits');
        }

        // Determine status
        let status: 'excellent' | 'good' | 'fair' | 'poor';
        if (overall >= 80) status = 'excellent';
        else if (overall >= 60) status = 'good';
        else if (overall >= 40) status = 'fair';
        else status = 'poor';

        return {
            overall,
            savingsRate: Math.round(savingsRateScore),
            budgetAdherence: Math.round(budgetAdherenceScore),
            spendingTrend: Math.round(spendingTrendScore),
            consistency: Math.round(consistencyScore),
            recommendations,
            status,
        };
    }, [getMonthlyIncome, getMonthlyExpenses, getBudgetByMonth, currentMonth, previousMonth]);
}
