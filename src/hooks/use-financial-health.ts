import { useMemo } from 'react';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import { getMonthString } from '@/lib/utils';
import { subMonths } from 'date-fns';

interface FinancialHealthScore {
  overall: number;
  savingsRate: number;
  budgetAdherence: number;
  spendingTrend: number;
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

    const savingsAmount = income - expenses;
    const savingsRatePercent = income > 0 ? (savingsAmount / income) * 100 : 0;
    const savingsRateScore = Math.min(Math.max(savingsRatePercent * 2, 0), 100);

    let budgetAdherenceScore = 50;
    if (budget && budget.totalAmount > 0) {
      const budgetUsage = (expenses / budget.totalAmount) * 100;
      if (budgetUsage <= 80) {
        budgetAdherenceScore = 100;
      } else if (budgetUsage <= 100) {
        budgetAdherenceScore = 100 - ((budgetUsage - 80) * 2.5);
      } else {
        budgetAdherenceScore = Math.max(50 - ((budgetUsage - 100) * 2), 0);
      }
    }

    let spendingTrendScore = 50;
    if (previousExpenses > 0) {
      const changePercent = ((expenses - previousExpenses) / previousExpenses) * 100;
      if (changePercent <= -10) {
        spendingTrendScore = 100;
      } else if (changePercent <= 0) {
        spendingTrendScore = 100 - Math.abs(changePercent) * 5;
      } else if (changePercent <= 10) {
        spendingTrendScore = 50 - (changePercent * 2.5);
      } else {
        spendingTrendScore = Math.max(25 - ((changePercent - 10) * 1.25), 0);
      }
    }

    const overall = Math.round(
      savingsRateScore * 0.4 +
      budgetAdherenceScore * 0.35 +
      spendingTrendScore * 0.25
    );

    const recommendations: string[] = [];
    if (savingsRateScore < 40) {
      recommendations.push('Try to save at least 20% of your income');
    }
    if (budgetAdherenceScore < 50) {
      recommendations.push('Review your budget - spending is too high');
    }
    if (spendingTrendScore < 40) {
      recommendations.push('Spending is increasing - find areas to cut');
    }

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
      recommendations,
      status,
    };
  }, [getMonthlyIncome, getMonthlyExpenses, getBudgetByMonth, currentMonth, previousMonth]);
}
