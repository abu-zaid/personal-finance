import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectTransactions, selectMonthlyAggregates } from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { selectCurrentBudget } from '@/lib/features/budgets/budgetsSlice';
import { useCurrency } from '@/hooks/use-currency';
import { getMonthString } from '@/lib/utils';
import { subMonths, isSameDay } from 'date-fns';

interface SmartInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  message: string;
  action?: string;
  impact?: string;
}

export function useSmartInsights(): SmartInsight[] {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectTransactions);
  const categories = useAppSelector(selectCategories);
  const currentBudget = useAppSelector(selectCurrentBudget);
  const aggregates = useAppSelector(selectMonthlyAggregates);
  const { formatCurrency } = useCurrency();

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  // Get totals from Redux store (populated by useInsightsData or other hooks)
  const currentExpenses = aggregates.monthlyExpenses[currentMonth] || 0;
  const previousExpenses = aggregates.monthlyExpenses[previousMonth] || 0;

  return useMemo(() => {
    const insights: SmartInsight[] = [];
    const budget = currentBudget;

    const currentMonthTxns = transactions.filter(
      t => getMonthString(new Date(t.date)) === currentMonth && t.type === 'expense'
    );


    // Budget projection warning
    if (budget && budget.totalAmount > 0) {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysElapsed = new Date().getDate();
      const daysRemaining = daysInMonth - daysElapsed;

      if (daysElapsed > 0 && daysRemaining > 0) {
        const dailyAverage = currentExpenses / daysElapsed;
        const projectedTotal = currentExpenses + (dailyAverage * daysRemaining);
        const projectedOverage = projectedTotal - budget.totalAmount;

        if (projectedOverage > 0) {
          const recommendedDaily = (budget.totalAmount - currentExpenses) / daysRemaining;
          insights.push({
            type: 'warning',
            title: 'Budget Alert',
            message: `Projected to exceed budget by ${formatCurrency(Math.round(projectedOverage))}`,
            action: `Reduce to ${formatCurrency(Math.round(recommendedDaily))}/day`,
            impact: `${daysRemaining} days left`,
          });
        } else {
          const budgetUsagePercent = (currentExpenses / budget.totalAmount) * 100;
          if (budgetUsagePercent > 80 && budgetUsagePercent < 100) {
            insights.push({
              type: 'tip',
              title: 'Budget Watch',
              message: `You've used ${budgetUsagePercent.toFixed(0)}% of your budget`,
              action: `${formatCurrency(budget.totalAmount - currentExpenses)} remaining`,
            });
          }
        }
      }
    }

    // Spending anomaly detection (unusually high spending days)
    const dailySpending = new Map<string, number>();
    currentMonthTxns.forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + t.amount);
    });

    const dailyAmounts = Array.from(dailySpending.values());
    if (dailyAmounts.length > 3) {
      const avgDaily = dailyAmounts.reduce((sum, amt) => sum + amt, 0) / dailyAmounts.length;
      const maxDaily = Math.max(...dailyAmounts);

      if (maxDaily > avgDaily * 2.5) {
        insights.push({
          type: 'warning',
          title: 'Spending Spike',
          message: `Detected unusually high spending of ${formatCurrency(Math.round(maxDaily))} in one day`,
          action: 'Review recent transactions',
        });
      }
    }

    // Category analysis
    const categorySpending = categories.map(cat => {
      const amount = currentMonthTxns
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const prevAmount = transactions
        .filter(t => t.categoryId === cat.id &&
          getMonthString(new Date(t.date)) === previousMonth &&
          t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return { category: cat, amount, prevAmount };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    // Top category spending opportunity
    if (categorySpending.length > 0 && currentExpenses > 0) {
      const topCategory = categorySpending[0];
      const percentage = (topCategory.amount / currentExpenses) * 100;

      if (percentage > 35) {
        const savingsOpportunity = topCategory.amount * 0.15;
        insights.push({
          type: 'opportunity',
          title: 'Savings Opportunity',
          message: `${topCategory.category.name} is ${percentage.toFixed(0)}% of spending`,
          action: `Reduce by 15%`,
          impact: `Save ${formatCurrency(Math.round(savingsOpportunity))}/mo`,
        });
      }
    }

    // Category budget alerts
    if (budget) {
      budget.allocations.forEach((cb: { categoryId: string; amount: number }) => {
        const category = categories.find(c => c.id === cb.categoryId);
        if (!category) return;

        const spent = currentMonthTxns
          .filter(t => t.categoryId === cb.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        const usage = cb.amount > 0 ? (spent / cb.amount) * 100 : 0;

        if (usage >= 100) {
          insights.push({
            type: 'warning',
            title: 'Category Over Budget',
            message: `${category.name} exceeded by ${formatCurrency(Math.round(spent - cb.amount))}`,
            action: 'Review spending',
          });
        } else if (usage >= 90) {
          insights.push({
            type: 'tip',
            title: 'Category Alert',
            message: `${category.name} at ${usage.toFixed(0)}% of budget`,
            action: `${formatCurrency(Math.round(cb.amount - spent))} left`,
          });
        }
      });
    }

    // Positive reinforcement - categories with decreased spending
    const decreasedCategories = categorySpending.filter(c =>
      c.prevAmount > 0 && c.amount < c.prevAmount * 0.85
    );

    if (decreasedCategories.length > 0) {
      const best = decreasedCategories[0];
      const saved = best.prevAmount - best.amount;
      insights.push({
        type: 'achievement',
        title: 'Great Progress!',
        message: `${best.category.name} spending down ${formatCurrency(Math.round(saved))}`,
        impact: `${(((best.prevAmount - best.amount) / best.prevAmount) * 100).toFixed(0)}% reduction`,
      });
    }

    // Month-over-month comparison
    if (previousExpenses > 0) {
      const changePercent = ((currentExpenses - previousExpenses) / previousExpenses) * 100;

      if (changePercent > 20) {
        insights.push({
          type: 'warning',
          title: 'Spending Surge',
          message: `Up ${changePercent.toFixed(0)}% from last month`,
          action: `+${formatCurrency(Math.round(currentExpenses - previousExpenses))}`,
        });
      } else if (changePercent < -15) {
        insights.push({
          type: 'achievement',
          title: 'Excellent Control!',
          message: `Spending down ${Math.abs(changePercent).toFixed(0)}% from last month`,
          impact: `Saved ${formatCurrency(Math.round(previousExpenses - currentExpenses))}`,
        });
      }
    }

    // Consistent spending pattern (positive)
    if (categorySpending.length >= 3 && currentExpenses > 0) {
      const topThreePercentage = categorySpending
        .slice(0, 3)
        .reduce((sum, c) => sum + c.amount, 0) / currentExpenses * 100;

      if (topThreePercentage < 75) {
        insights.push({
          type: 'achievement',
          title: 'Balanced Spending',
          message: 'Your spending is well-distributed across categories',
          impact: 'Good financial diversity',
        });
      }
    }

    // No spending days (if applicable)
    const daysWithSpending = new Set(
      currentMonthTxns.map(t => new Date(t.date).toDateString())
    ).size;

    const daysElapsed = new Date().getDate();
    const noSpendingDays = daysElapsed - daysWithSpending;

    if (noSpendingDays >= 5 && daysElapsed >= 10) {
      insights.push({
        type: 'achievement',
        title: 'Mindful Spending',
        message: `${noSpendingDays} no-spend days this month`,
        impact: 'Keep it up!',
      });
    }

    // Priority ordering and limit
    const priorityOrder = { warning: 0, opportunity: 1, achievement: 2, tip: 3 };
    return insights
      .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
      .slice(0, 4); // Show top 4 insights
  }, [transactions, categories, currentExpenses, previousExpenses, currentBudget, formatCurrency, currentMonth, previousMonth]);
}
