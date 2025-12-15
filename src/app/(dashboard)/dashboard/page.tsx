'use client';

import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import {
  SummaryCards,
  BudgetOverview,
  RecentTransactions,
  SpendingByCategory,
} from '@/components/features/dashboard';
import { getMonthString } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { transactions, getMonthlyTotal } = useTransactions();
  const { budgets } = useBudgets();

  const currentMonth = getMonthString(new Date());

  // Calculate spending by category for current month
  const currentMonthTransactions = transactions.filter((t) => {
    const transactionMonth = getMonthString(new Date(t.date));
    return transactionMonth === currentMonth;
  });

  const spendingByCategory = categories.map((category) => {
    const categoryTransactions = currentMonthTransactions.filter(
      (t) => t.categoryId === category.id
    );
    const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { categoryId: category.id, amount };
  });

  // Filter for display (only categories with spending)
  const spendingByCategoryFiltered = spendingByCategory.filter((item) => item.amount > 0);

  // Calculate current month budgets
  const currentMonthBudget = budgets.find((b) => b.month === currentMonth);

  // Calculate total budget and remaining
  const totalBudget = currentMonthBudget?.totalAmount ?? 0;
  const totalSpent = getMonthlyTotal(currentMonth);
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);
  const budgetUsagePercent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  // Loading state available if needed: transactionsLoading, budgetsLoading

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your finances this month.
          </p>
        </div>

        {/* Summary Cards */}
        <StaggerContainer>
          <StaggerItem>
            <SummaryCards
              totalSpent={totalSpent}
              budgetRemaining={budgetRemaining}
              totalBudget={totalBudget}
              transactionCount={currentMonthTransactions.length}
              budgetUsagePercent={budgetUsagePercent}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget Overview */}
          <StaggerItem>
            <BudgetOverview
              budget={currentMonthBudget}
              categories={categories}
              spendingByCategory={spendingByCategory}
            />
          </StaggerItem>

          {/* Spending by Category */}
          <StaggerItem>
            <SpendingByCategory
              spending={spendingByCategoryFiltered}
              categories={categories}
              totalSpent={totalSpent}
            />
          </StaggerItem>
        </div>

        {/* Recent Transactions */}
        <StaggerItem>
          <RecentTransactions
            transactions={currentMonthTransactions}
            categories={categories}
            limit={5}
          />
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
