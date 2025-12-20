import { useMemo } from 'react';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useBudgets } from '@/context/budgets-context';
import { useCurrency } from '@/hooks/use-currency';
import { getMonthString } from '@/lib/utils';
import { subMonths } from 'date-fns';

interface SmartInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  message: string;
  action?: string;
  impact?: string;
}

export function useSmartInsights(): SmartInsight[] {
  const { transactions, getMonthlyExpenses } = useTransactions();
  const { categories } = useCategories();
  const { getBudgetByMonth } = useBudgets();
  const { formatCurrency } = useCurrency();

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  return useMemo(() => {
    const insights: SmartInsight[] = [];
    const currentExpenses = getMonthlyExpenses(currentMonth);
    const previousExpenses = getMonthlyExpenses(previousMonth);
    const budget = getBudgetByMonth(currentMonth);

    const currentMonthTxns = transactions.filter(
      t => getMonthString(new Date(t.date)) === currentMonth && t.type === 'expense'
    );

    if (budget && budget.totalAmount > 0) {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysElapsed = new Date().getDate();
      const daysRemaining = daysInMonth - daysElapsed;
      
      if (daysElapsed > 0 && daysRemaining > 0) {
        const dailyAverage = currentExpenses / daysElapsed;
        const projectedTotal = currentExpenses + (dailyAverage * daysRemaining);
        const projectedOverage = projectedTotal - budget.totalAmount;

        if (projectedOverage > 0) {
          insights.push({
            type: 'warning',
            title: 'Budget Alert',
            message: `Projected to exceed budget by ${formatCurrency(Math.round(projectedOverage))}`,
            impact: `Reduce to ${formatCurrency(Math.round((budget.totalAmount - currentExpenses) / daysRemaining))}/day`,
          });
        }
      }
    }

    const categorySpending = categories.map(cat => {
      const amount = currentMonthTxns
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, amount };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    if (categorySpending.length > 0 && currentExpenses > 0 && budget && budget.totalAmount > 0) {
      const topCategory = categorySpending[0];
      const percentage = (topCategory.amount / currentExpenses) * 100;
      const recommendedBudget = budget.totalAmount * 0.25;
      
      if (percentage > 30) {
        const savingsOpportunity = topCategory.amount * 0.2;
        const targetAmount = topCategory.amount * 0.8;
        insights.push({
          type: 'opportunity',
          title: 'Savings Opportunity',
          message: `${topCategory.category.name} is ${percentage.toFixed(0)}% of spending`,
          action: `Target ${formatCurrency(Math.round(targetAmount))} (20% less)`,
          impact: `Save ${formatCurrency(Math.round(savingsOpportunity))}/mo`,
        });
      } else if (topCategory.amount > recommendedBudget) {
        insights.push({
          type: 'tip',
          title: 'Budget Allocation',
          message: `${topCategory.category.name}: ${formatCurrency(Math.round(topCategory.amount))}`,
          action: `Recommended: ${formatCurrency(Math.round(recommendedBudget))} (25% of budget)`,
        });
      }
    }

    if (previousExpenses > 0) {
      const changePercent = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      
      if (changePercent > 15) {
        insights.push({
          type: 'warning',
          title: 'Spending Spike',
          message: `Up ${changePercent.toFixed(0)}% from last month`,
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'achievement',
          title: 'Great Progress!',
          message: `Spending down ${Math.abs(changePercent).toFixed(0)}% from last month`,
        });
      }
    }

    const priorityOrder = { warning: 0, opportunity: 1, achievement: 2, tip: 3 };
    return insights
      .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
      .slice(0, 3);
  }, [transactions, categories, getMonthlyExpenses, getBudgetByMonth, formatCurrency, currentMonth, previousMonth]);
}
